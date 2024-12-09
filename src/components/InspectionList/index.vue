<template>
  <el-table 
    :data="processedInspections" 
    border
    :header-cell-style="{
      background: '#f5f7fa',
      color: '#606266',
      fontWeight: 'bold',
      textAlign: 'center'
    }"
    :cell-style="{ textAlign: 'center' }">
    <!-- 新增物料信息列 -->
    <el-table-column label="物料信息" min-width="200">
      <template slot-scope="scope">
        <div>编码：{{ scope.row.materialCode }}</div>
        <div>名称：{{ scope.row.materialName }}</div>
        <div>规格：{{ scope.row.materialSpec }}</div>
      </template>
    </el-table-column>
    <!-- 新增物料条码列 -->
    <el-table-column label="物料条码" prop="barcode" min-width="150">
      <template slot-scope="scope">
        {{ scope.row.barcode || '-' }}
      </template>
    </el-table-column>
    <el-table-column label="检测项目" prop="inspectionItem"></el-table-column>
    <el-table-column label="检测标准" prop="standard"></el-table-column>
    <el-table-column label="检测结果" prop="result"></el-table-column>
    <el-table-column label="检测时间" prop="inspectionTime">
      <template slot-scope="scope">
        {{ formatDate(scope.row.inspectionTime) }}
      </template>
    </el-table-column>
    <el-table-column label="检测人员" prop="inspector"></el-table-column>
  </el-table>
</template>

<script>
export default {
  name: 'InspectionList',
  props: {
    inspections: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    processedInspections() {
      // 过滤并处理检测数据
      return this.inspections
        .filter(node => {
          // 确保节点包含检测信息
          return node.inspectionItem && 
                 (node.nodeType === 'MATERIAL' || node.nodeType === 'PROCESS_STEP');
        })
        .map(node => ({
          // 保留原有检测信息
          inspectionItem: node.inspectionItem,
          standard: node.standard,
          result: node.result,
          inspectionTime: node.inspectionTime,
          inspector: node.inspector,
          // 添加物料信息
          materialCode: node.materialCode || node.processCode || '-',
          materialName: node.materialName || node.processName || '-',
          materialSpec: node.materialSpec || '-',
          barcode: node.barcode || '-'
        }))
        .sort((a, b) => {
          // 按检测时间降序排序
          return new Date(b.inspectionTime || 0) - new Date(a.inspectionTime || 0);
        });
    }
  },
  methods: {
    formatDate(date) {
      if (!date) return '暂无数据';
      return new Date(date).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
  }
}
</script>

<style lang="scss" scoped>
.el-table {
  margin-top: 10px;
  
  :deep(th) {
    background: #f5f7fa;
  }
  
  :deep(.el-table__row) {
    transition: all 0.3s;
    
    &:hover {
      background-color: #f5f7fa;
    }
  }
}
</style> 