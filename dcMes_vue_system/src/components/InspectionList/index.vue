<template>
    <el-table 
      :data="inspections" 
      border
      :header-cell-style="{
        background: '#f5f7fa',
        color: '#606266',
        fontWeight: 'bold',
        textAlign: 'center'
      }"
      :cell-style="{ textAlign: 'center' }">
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