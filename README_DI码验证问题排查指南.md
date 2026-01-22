# DI码验证问题排查指南

## 问题描述
扫描条码时提示："该DI编码对应的物料与当前工序不匹配"

## 错误产生位置
- **前端文件**: `dcMes_vue_system/src/views/scanBarCode/index.vue`
- **方法**: `validateDICode` (第1194-1248行)
- **后端文件**: `dcMes_server/routes/materialProcessFlowService.js`

## 排查步骤

### 1. 检查 productDiNum 表数据

#### 检查DI码是否存在
```javascript
// 在 MongoDB 中执行以下查询
db.productdinums.find({ diNum: "你扫描的DI码" })
```

**需要确认**：
- ✅ 是否存在对应的DI码记录
- ✅ `productId` 字段是否有值（不能为空）
- ✅ `diNum` 字段值是否正确

#### 常见问题：
- ❌ DI码未在系统中录入
- ❌ DI码格式不正确（多余空格、大小写问题）
- ❌ productId 字段为空或无效

### 2. 检查物料关联关系

#### 查询DI码关联的物料信息
```javascript
db.productdinums.aggregate([
  { $match: { diNum: "你扫描的DI码" } },
  {
    $lookup: {
      from: "k3_bd_materials",
      localField: "productId",
      foreignField: "_id",
      as: "productInfo"
    }
  }
])
```

**需要确认**：
- ✅ productId 能否正确关联到 k3_BD_MATERIAL 表
- ✅ 关联的物料是否有 FNumber（物料编码）
- ✅ FNumber 是否与当前工序的物料编码匹配

### 3. 检查当前工序的物料配置

#### 获取当前工序的物料列表
在前端控制台执行：
```javascript
console.log('主物料编码:', this.mainMaterialCode)
console.log('子物料列表:', this.processMaterials.map(m => ({
  materialCode: m.materialCode,
  materialName: m.materialName
})))
```

**需要确认**：
- ✅ 主物料编码是否正确
- ✅ 子物料配置是否完整
- ✅ 物料编码格式是否一致（检查空格、特殊字符）

### 4. 检查条码规则配置

#### 查看DI提取规则
```javascript
db.barcoderules.find({
  "extractionConfigs.target": "DI"
})
```

**需要确认**：
- ✅ 是否配置了DI提取规则
- ✅ 提取规则是否正确（substring、regex等）
- ✅ 提取出的DI码是否正确

#### 前端调试提取结果
在 `validateBarcode` 方法中添加调试代码（第1318行附近）：
```javascript
case "DI":
  console.log('提取的DI码:', extractValue)  // 添加这行
  // ... 现有代码
```

### 5. 检查条码规则与物料的关联

#### 查询条码规则关联的物料
```javascript
db.productbarcoderules.find({
  barcodeRule: ObjectId("条码规则ID")
})
```

**需要确认**：
- ✅ 条码规则是否关联了正确的物料
- ✅ 关联的物料ID是否与DI码表中的物料ID一致

## 常见错误场景

### 场景1: DI码未录入系统
**现象**: productDiNum 表查不到记录
**解决**: 在系统中录入DI码与物料的对应关系

### 场景2: 物料编码不匹配
**现象**: DI码能查到，但物料编码与工序物料不一致
**解决**: 
1. 检查 productDiNum 表中的 productId 是否关联了正确的物料
2. 检查工序配置中的物料是否正确

### 场景3: 物料编码格式问题
**现象**: 编码看起来一样但无法匹配
**解决**: 
```javascript
// 检查编码中是否有空格、特殊字符
console.log('DI物料编码:', JSON.stringify(possibleMaterialCodes))
console.log('工序物料编码:', JSON.stringify(allMaterialCodes))
```

### 场景4: 条码规则配置错误
**现象**: 提取的DI码不正确
**解决**: 
1. 检查条码规则中的 extractionConfigs
2. 验证 substring 的 start 和 end 参数
3. 测试 regex 正则表达式

### 场景5: productId 为空
**现象**: productDiNum 表有记录，但 productId 字段为空
**解决**: 更新 productDiNum 表，填写正确的 productId

## 调试代码示例

在 `validateDICode` 方法中添加详细日志（第1194行附近）：

```javascript
async validateDICode(diCode, productIds) {
  try {
    console.log('=== 开始验证DI码 ===')
    console.log('DI码:', diCode)
    console.log('查询的物料IDs:', productIds)
    
    const response = await getData("productDiNum", {
      query: {
        diNum: diCode,
        productId: { $in: productIds },
      },
      populate: JSON.stringify([
        { path: "productId", model: "k3_BD_MATERIAL" },
      ]),
    });

    console.log('查询结果数量:', response.data.length)
    console.log('查询结果详情:', response.data)

    if (response.data.length === 0) {
      console.log('❌ 未找到匹配的DI码记录')
      this.$message.error("该DI编码对应的物料与当前工序不匹配");
      return { isValid: false };
    }

    const possibleMaterialCodes = response.data
      .filter((item) => item.productId && item.productId.FNumber)
      .map((item) => item.productId.FNumber);

    console.log('DI码对应的物料编码:', possibleMaterialCodes)

    if (possibleMaterialCodes.length === 0) {
      console.log('❌ DI码未关联有效物料')
      this.$message.error("该DI编码未关联有效物料");
      return { isValid: false };
    }

    const allMaterialCodes = [
      this.mainMaterialCode,
      ...this.processMaterials.map((m) => m.materialCode),
    ];

    console.log('当前工序的物料编码:', allMaterialCodes)

    const matchedMaterialCode = possibleMaterialCodes.find((code) =>
      allMaterialCodes.includes(code)
    );

    console.log('匹配结果:', matchedMaterialCode)

    if (!matchedMaterialCode) {
      console.log('❌ 物料编码不匹配')
      this.$message.error("该DI编码对应的物料与当前工序不匹配");
      return { isValid: false };
    }

    console.log('✅ DI码验证通过')
    console.log('=== DI码验证结束 ===')

    return {
      isValid: true,
      materialCode: matchedMaterialCode,
    };
  } catch (error) {
    console.error("DI码验证失败:", error);
    this.$message.error("DI码验证失败");
    return { isValid: false };
  }
}
```

## SQL查询示例

### 查询DI码配置情况
```javascript
// 查询所有DI码配置
db.productdinums.find({}).limit(10)

// 查询特定物料的DI码
db.productdinums.find({ 
  productId: ObjectId("物料ID") 
})

// 查询DI码与物料的完整信息
db.productdinums.aggregate([
  {
    $lookup: {
      from: "k3_bd_materials",
      localField: "productId",
      foreignField: "_id",
      as: "material"
    }
  },
  { $unwind: "$material" },
  {
    $project: {
      diNum: 1,
      productId: 1,
      materialCode: "$material.FNumber",
      materialName: "$material.FName"
    }
  }
])
```

## 解决方案

### 方案1: 录入DI码数据
如果DI码未录入系统，需要在管理后台添加：
1. 进入"物料DI编码管理"页面
2. 添加新的DI码记录
3. 关联正确的物料

### 方案2: 修正物料关联
如果DI码已存在但关联错误：
```javascript
db.productdinums.updateOne(
  { diNum: "DI码" },
  { $set: { productId: ObjectId("正确的物料ID") } }
)
```

### 方案3: 调整工序物料配置
如果工序物料配置错误：
1. 进入"工序管理"页面
2. 找到对应的工序
3. 检查并修正"工序物料"配置

### 方案4: 优化条码规则
如果DI提取规则有问题：
1. 进入"条码规则管理"页面
2. 检查DI提取配置
3. 测试提取结果是否正确

## 预防措施

1. **数据完整性检查**
   - 定期检查 productDiNum 表的数据完整性
   - 确保所有记录都有有效的 productId

2. **物料编码规范**
   - 统一物料编码格式
   - 避免前后空格
   - 统一大小写规则

3. **条码规则测试**
   - 新建条码规则后进行充分测试
   - 验证DI提取的准确性

4. **工序配置验证**
   - 配置工序物料时，验证物料编码的正确性
   - 确保DI码对应的物料在工序物料列表中

## 联系支持

如果以上步骤都无法解决问题，请提供以下信息：
- 扫描的完整条码
- 提取出的DI码
- 当前工序ID
- 工序配置的物料列表
- productDiNum 表的查询结果

















