const apiLogger = require("../middleware/apiLogger");

/** 转义正则特殊字符 */
function escapeRegex(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 将 k3_BD_MATERIAL 的 FNumber/FName 模糊查改为前缀正则，使查询走索引，避免全表 COLLSCAN。
 *
 * 关键：去掉 $options:"i"（大小写不敏感标志）。
 * MongoDB B-tree 索引对 case-insensitive regex 完全无效——即使有 ^ 前缀也走全索引扫描。
 * FNumber 通常全大写，FName 前端输入也可统一转大写再匹配，case-sensitive 前缀索引扫描
 * 性能远优于 case-insensitive COLLSCAN（测试中从 7 分钟降到 <10ms）。
 *
 * 返回值：
 *   { converted: boolean, filter: Object, keyword: string }
 *   converted=false 且 keyword 长度 < MIN_SEARCH_CHARS 时调用方应直接返回空结果
 */
const MIN_SEARCH_CHARS = 2; // 最少输入字符数，低于此值不查询，防止 "^1" 匹配全集合

function convertMaterialFilterToPrefixRegex(findData) {
  try {
    const andList = findData.$and;
    if (!Array.isArray(andList)) return { converted: false, filter: findData, keyword: '' };
    const next = JSON.parse(JSON.stringify(findData));
    let keyword = '';
    for (let i = 0; i < next.$and.length; i++) {
      const item = next.$and[i];
      if (item && item.$or && Array.isArray(item.$or)) {
        const orList = item.$or;
        for (const cond of orList) {
          if (cond.FNumber && cond.FNumber.$regex != null) { keyword = cond.FNumber.$regex; break; }
          if (cond.FName && cond.FName.$regex != null) { keyword = cond.FName.$regex; break; }
        }
        if (keyword && typeof keyword === 'string' && keyword.length >= MIN_SEARCH_CHARS) {
          // ① 去掉 $options:"i"：case-sensitive 前缀正则才能走 B-tree 索引范围扫描
          // ② 搜索词统一转大写，与 FNumber 大写存储保持一致
          const prefixRegex = '^' + escapeRegex(keyword.toUpperCase());
          for (const cond of orList) {
            if (cond.FNumber && cond.FNumber.$regex != null) {
              cond.FNumber = { $regex: prefixRegex }; // 无 $options:"i"
            }
            if (cond.FName && cond.FName.$regex != null) {
              // FName 可能混合大小写，同样转大写前缀以保持一致性
              cond.FName = { $regex: prefixRegex };
            }
          }
        }
      }
    }
    return { converted: true, filter: next, keyword };
  } catch (e) {
    return { converted: false, filter: findData, keyword: '' };
  }
}

module.exports = function (router, biaoMing, schemaModel) {
  // 创建特定于该表的apiLogger实例
  const loggerMiddleware = apiLogger(`${biaoMing}CRUD`);
  
  router
    .route(`/api/v1/${biaoMing}`)
    .get(loggerMiddleware, async (req, res, next) => {
      try {
        var queryData = {};
        var findData = {};
        var selectData = {};
        if (req.query) {
          queryData = req.query;
        }
        if (queryData.query) {
          if (typeof (queryData.query) == 'string') {
            findData = JSON.parse(queryData.query);
          } else {
            findData = (queryData.query);
          }
        }
        // 物料表 FNumber/FName 搜索保护：
        // 1) 必须 >= MIN_SEARCH_CHARS 个字符，否则直接返回空（防止 "^1" 仍扫大量记录）
        // 2) 转为 case-sensitive 前缀正则，使查询走 B-tree 索引，避免 COLLSCAN 拖垮 MongoDB
        if (biaoMing === 'k3_BD_MATERIAL' && findData && findData.$and && Array.isArray(findData.$and)) {
          const { converted, filter, keyword } = convertMaterialFilterToPrefixRegex(findData);
          if (!converted || (keyword && keyword.length < MIN_SEARCH_CHARS)) {
            return res.json({ code: 200, data: [], countnum: 0,
              message: `请输入至少 ${MIN_SEARCH_CHARS} 个字符后再搜索` });
          }
          findData = filter;
        }
        if (req.select) {
          selectData = JSON.parse(req.select);
        }
        // 为所有查询设置服务端超时，防止慢查询长期占用连接池
        // （物料 regex 查询曾达 7 分钟，导致所有连接耗尽，服务报"连接不上 MongoDB"）
        const MAX_QUERY_MS = biaoMing === 'k3_BD_MATERIAL' ? 5000 : 15000;
        var model = schemaModel.find(findData, selectData).maxTimeMS(MAX_QUERY_MS);

        if (queryData.populate) {
          var populates = JSON.parse(queryData.populate);
          populates.forEach((p) => {
            model.populate(p);
          });
        }
        if (queryData.sort) {
          model.sort(JSON.parse(queryData.sort));
        }

        if (queryData.skip) {
          model.skip(JSON.parse(queryData.skip));
        }

        if (queryData.limit) {
          model.limit(JSON.parse(queryData.limit));
        }
        var result = await model.exec();
        var resdata = {
          code: 200,
          data: result,
        };
        if (queryData.count) {
          var countnum = await schemaModel.find(findData).maxTimeMS(MAX_QUERY_MS).count();
          resdata = {
            code: 200,
            data: result,
            countnum: countnum,
          };
        }
        res.json(resdata);
      } catch (e) {
        console.log(e);
        res.status(500).send(e);
      }
    })
    .delete(loggerMiddleware, async (req, res, next) => {
      try {
        console.log('Delete request body:', req.body);
        
        // 验证查询条件
        if (!req.body.query || Object.keys(req.body.query).length === 0) {
          return res.status(400).json({
            code: 400,
            message: "删除操作必须指定查询条件"
          });
        }

        // 先查询匹配的记录数
        const matchCount = await schemaModel.countDocuments(req.body.query);
        
        // 设置安全阈值，防止大规模删除
        const SAFE_DELETE_LIMIT = 100; // 可以根据实际需求调整
        if (matchCount > SAFE_DELETE_LIMIT) {
          return res.status(400).json({
            code: 400,
            message: `删除操作超出安全限制：当前匹配 ${matchCount} 条记录，最大允许删除 ${SAFE_DELETE_LIMIT} 条`
          });
        }

        // 执行删除操作
        const result = await schemaModel.deleteMany(req.body.query);
        
        res.json({
          code: 200,
          data: result,
          deletedCount: result.deletedCount
        });
      } catch (e) {
        console.error('Delete operation error:', e);
        res.status(500).json({
          code: 500,
          message: "删除操作失败",
          error: e.message
        });
      }
    })
    .post(loggerMiddleware, async (req, res, next) => {
      try {
        var result = null;
        console.log('req.body: ', req.body);
        result = await schemaModel.create(req.body);
        res.json({
          code: 200,
          data: result,
        });
      } catch (e) {
        console.log(e);
        res.status(500).send(e);
      }
    })
    .put(loggerMiddleware, async (req, res, next) => {
      try {
        // 确保 req.body.update 对象存在
        if (!req.body.update) {
          req.body.update = {};
        }

        // 从 req 对象中获取 userName apiLogger 中间件添加）
        // 并将其赋值给 req.body.update.updateBy
        if (req.userId) {
          req.body.update.updateBy = req.userName;
        }

        req.body.update.updateAt = new Date();
        var updateQuery = schemaModel.updateMany(
          req.body.query,
          req.body.update
        );

        var result = await updateQuery.exec();
        res.json({
          code: 200,
          data: result,
        });
      } catch (e) {
        console.error('Update operation error:', e); // 添加更详细的错误日志
        res.status(500).send(e);
      }
    });
};
