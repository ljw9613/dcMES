const apiLogger = require("../middleware/apiLogger");

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
          console.log(typeof (queryData), 'queryData')
        }
        if (queryData.query) {
          if (typeof (queryData.query) == 'string') {
            findData = JSON.parse(queryData.query);
          } else {
            findData = (queryData.query);
          }
        }
        if (req.select) {
          selectData = JSON.parse(req.select);
        }
        var model = schemaModel.find(findData, selectData);

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
          var countnum = await schemaModel.find(findData).count();
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
