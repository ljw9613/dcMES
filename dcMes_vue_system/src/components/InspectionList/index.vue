<template>
  <el-table :data="inspections" border :header-cell-style="{
    background: '#f5f7fa',
    color: '#606266',
    fontWeight: 'bold',
    textAlign: 'center'
  }" :cell-style="{ textAlign: 'center' }">
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
import { getData } from '@/api/data';
export default {
  name: 'InspectionList',
  props: {
    inspections: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      barcodeList: [] // 存储条形码数组
    }
  },
  watch: {
    inspections: {
      async handler(newVal) {
        if (newVal && newVal.length > 0) {
          let dataForm = newVal
          //主物料条码
          let mainBarcode = dataForm.barcode
          let processNodes = dataForm.processNodes
          let mainMaterial = {
            barcode: mainBarcode,
            inspectionItem: '主物料',
            inspectionTime: null,
            inspector: null,
            materialCode: dataForm.materialCode,
            materialId: dataForm.materialId,
            materialName: dataForm.materialName,
            materialSpec: dataForm.materialSpec
          }
          let inspectionList = [mainMaterial]
          processNodes.forEach(item => {
            inspectionList.push({
              barcode: item.barcode,
              inspectionItem: item.inspectionItem,
              inspectionTime: item.inspectionTime,
              inspector: item.inspector,
              materialCode: item.materialCode,
              materialId: item.materialId,
              materialName: item.materialName,
              materialSpec: item.materialSpec
            })
          })
          // 提取所有的条形码到数组中
          this.barcodeList = processNodes.map(item => item.barcode).filter(barcode => barcode !== '' && barcode !== null && barcode !== undefined)
          console.log(this.barcodeList)
          let res = await getData('InspectionLastData', {
            query: {
              scanCode: { $in: [mainBarcode, ...this.barcodeList] }
            }
          })
          console.log('检测信息', res)
        }
      },
      immediate: true // 组件创建时立即执行一次
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