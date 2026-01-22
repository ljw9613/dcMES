# 批次物料缓存清理开关功能实现

## 功能描述
在扫码批量处理页面（scanBarCodeBatchNew）的批次物料扫描区域右侧，新增了一个开关控件，用于控制批次物料缓存的清理策略。

## 功能特性
- **开关位置**: 位于"批次物料缓存已启用"标签的右侧
- **默认状态**: 关闭（保留批次物料缓存）
- **功能效果**:
  - 关闭时：批次物料缓存按原有逻辑处理（仅在达到用量限制时清除）
  - 开启时：每次提交后都会清理批次物料缓存
- **状态保存**: 开关状态会保存到本地存储，刷新页面后自动恢复

## 实现细节

### 1. UI组件修改
在 `dcMes_vue_system/src/views/scanBarCodeBatchNew/index.vue` 中：

#### 添加的HTML结构
```html
<div class="batch-cache-controls">
  <el-tooltip content="批次物料扫描后会自动缓存，组托完成不会清除缓存，更换工单时才会清除" placement="top">
    <el-tag type="info" size="small">{{ $t("scanBarCodeBatchNew.scanning.batchCacheEnabled") }}</el-tag>
  </el-tooltip>
  <el-switch
    v-model="clearBatchCacheOnSubmit"
    :active-text="$t('scanBarCodeBatchNew.scanning.clearCacheOnSubmit')"
    :inactive-text="$t('scanBarCodeBatchNew.scanning.keepCacheOnSubmit')"
    class="batch-cache-switch"
    size="mini"
    @change="handleClearBatchCacheChange"
  >
  </el-switch>
</div>
```

#### 新增数据属性
```javascript
data() {
  return {
    // ... 其他数据
    clearBatchCacheOnSubmit: false, // 清理批次物料缓存开关状态
  }
}
```

#### 新增计算属性（本地存储支持）
```javascript
computed: {
  // ... 其他计算属性
  clearBatchCacheOnSubmitSetting: {
    get() {
      return localStorage.getItem("clearBatchCacheOnSubmit") === "true";
    },
    set(value) {
      localStorage.setItem("clearBatchCacheOnSubmit", value);
    },
  },
}
```

### 2. 业务逻辑修改

#### 开关状态变化处理方法
```javascript
handleClearBatchCacheChange(value) {
  this.clearBatchCacheOnSubmitSetting = value;
  this.$message.success(
    value 
      ? "已开启批次物料缓存清理，提交后将清空批次物料缓存" 
      : "已关闭批次物料缓存清理，提交后将保留批次物料缓存"
  );
}
```

#### 提交处理逻辑修改
在托盘提交处理逻辑中，批次物料缓存清理条件从：
```javascript
if (material.batchQuantity && newUsage >= material.batchQuantity && material.batchQuantity > 0) {
  // 清理缓存
}
```

修改为：
```javascript
const shouldClearByQuantity = material.batchQuantity &&
  newUsage >= material.batchQuantity &&
  material.batchQuantity > 0;
const shouldClearBySwitch = this.clearBatchCacheOnSubmit;

if (shouldClearByQuantity || shouldClearBySwitch) {
  // 清理缓存
}
```

### 3. 样式修改
添加了针对开关控件的CSS样式：
```css
.batch-cache-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.batch-cache-switch {
  margin-left: 10px;
}

.batch-cache-switch >>> .el-switch__label {
  color: #606266;
  font-size: 12px;
  white-space: nowrap;
}

.batch-cache-switch >>> .el-switch__label.is-active {
  color: #409eff;
}
```

### 4. 国际化文本
在三个语言文件中添加了相应的文本键：

#### 中文 (zh-CN.js)
```javascript
scanning: {
  clearCacheOnSubmit: "清除",
  keepCacheOnSubmit: "保留",
}
```

#### 英文 (en-US.js)
```javascript
scanning: {
  clearCacheOnSubmit: "Clear",
  keepCacheOnSubmit: "Keep",
}
```

#### 越南文 (vi-VN.js)
```javascript
scanning: {
  clearCacheOnSubmit: "Xóa",
  keepCacheOnSubmit: "Giữ",
}
```

### 5. 初始化逻辑
在 `created()` 生命周期中添加开关状态的初始化：
```javascript
async created() {
  // ... 其他初始化代码
  
  // 从本地存储中恢复清理批次物料缓存开关状态
  this.clearBatchCacheOnSubmit = this.clearBatchCacheOnSubmitSetting;
}
```

## 使用说明
1. 用户进入扫码批量处理页面
2. 在批次物料扫描区域可以看到新增的开关
3. 开关默认为关闭状态（保留批次物料缓存）
4. 用户可以点击开关来切换批次物料缓存清理策略
5. 开关状态会自动保存，刷新页面后保持用户设置

## 影响分析
- **向后兼容**: 该功能不影响现有的批次物料缓存逻辑，默认状态下行为保持不变
- **用户体验**: 提供了更灵活的批次物料缓存管理选项
- **性能影响**: 最小，仅在提交时增加一个布尔值判断
