<template>
  <el-dialog 
    :title="dialogTitle" 
    :visible.sync="dialogVisible" 
    width="80%" 
    :before-close="handleClose"
    append-to-body>
    <!-- 销售订单基础信息卡片 -->
    <el-card class="box-card mb-20">
      <div slot="header" class="clearfix">
        <span>销售订单基础信息</span>
      </div>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="info-item">
            <label>订单编号：</label>
            <span>{{ saleOrderData.FBillNo || '-' }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-item">
            <label>客户名称：</label>
            <span>{{ saleOrderData.FCustId_FName || '-' }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-item">
            <label>销售部门：</label>
            <span>{{ saleOrderData.FSaleDeptId_FName || '-' }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-item">
            <label>销售员：</label>
            <span>{{ saleOrderData.FSalerId_FName || '-' }}</span>
          </div>
        </el-col>
      </el-row>
      <el-row :gutter="20" class="mt-10">
        <el-col :span="6">
          <div class="info-item">
            <label>单据状态：</label>
            <el-tag :type="getStatusType(saleOrderData.FDocumentStatus)">
              {{ getStatusText(saleOrderData.FDocumentStatus) }}
            </el-tag>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-item">
            <label>业务状态：</label>
            <el-tag :type="saleOrderData.FCloseStatus === 'A' ? 'success' : 'danger'">
              {{ saleOrderData.FCloseStatus === 'A' ? '未关闭' : '已关闭' }}
            </el-tag>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-item">
            <label>创建日期：</label>
            <span>{{ formatDate(saleOrderData.FCreateDate) }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-item">
            <label>修改日期：</label>
            <span>{{ formatDate(saleOrderData.FModifyDate) }}</span>
          </div>
        </el-col>
      </el-row>
      <el-row :gutter="20" class="mt-10">
        <el-col :span="6">
          <div class="info-item">
            <label>物料编码：</label>
            <el-tooltip :content="saleOrderData.FMaterialId_FNumber" placement="top">
              <span>{{ saleOrderData.FMaterialId_FNumber || '-' }}</span>
            </el-tooltip>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-item">
            <label>物料名称：</label>
            <el-tooltip :content="saleOrderData.FMaterialModel" placement="top">
              <span>{{ saleOrderData.FMaterialName || '-' }}</span>
            </el-tooltip>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-item">
            <label>规格型号：</label>
            <span>{{ saleOrderData.FMaterialModel || '-' }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-item">
            <label>物料属性：</label>
            <el-tag size="mini" :type="getMaterialPropertyTagType(saleOrderData.FDocumentStatus)">
              {{ getMaterialPropertyText(saleOrderData.FDocumentStatus) }}
            </el-tag>
          </div>
        </el-col>
      </el-row>
      <el-row :gutter="20" class="mt-10">
        <el-col :span="6">
          <div class="info-item">
            <label>销售数量：</label>
            <span>{{ saleOrderData.FQty || '0' }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-item">
            <label>单位：</label>
            <span>{{ saleOrderData.FUnitID_FName || '-' }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-item">
            <label>客户PO：</label>
            <span>{{ saleOrderData.F_TFQJ_khpo || '-' }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-item">
            <label>PO行号：</label>
            <span>{{ saleOrderData.F_TFQJ_Text1 || '-' }}</span>
          </div>
        </el-col>
      </el-row>
      <el-row :gutter="20" class="mt-10">
        <el-col :span="6">
          <div class="info-item">
            <label>越南不调拨：</label>
            <el-tag size="mini" :type="saleOrderData.FCancelStatus === 'B' ? 'danger' : 'success'">
              {{ saleOrderData.FCancelStatus === 'B' ? '是' : '否' }}
            </el-tag>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 拓展信息组件 -->
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>拓展信息</span>
      </div>
      <sale-order-ext 
        v-if="dialogVisible"
        :sale-order-id="saleOrderId"
        @saved="handleSaved"
        @cancel="handleCancel">
      </sale-order-ext>
    </el-card>
  </el-dialog>
</template>

<script>
import SaleOrderExt from './SaleOrderExt.vue'

export default {
  name: 'SaleOrderExtDialog',
  components: {
    SaleOrderExt
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    saleOrderId: {
      type: String,
      default: ''
    },
    saleOrderData: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    },
    dialogTitle() {
      return '销售订单信息'
    }
  },
  methods: {
    handleClose() {
      this.$emit('update:visible', false)
    },
    handleSaved() {
      this.$message.success('保存成功')
      this.$emit('saved')
      this.handleClose()
    },
    handleCancel() {
      this.handleClose()
    },
    // 获取状态标签类型
    getStatusType(status) {
      const statusMap = {
        'A': 'info',
        'B': 'warning',
        'C': 'success',
        'D': 'danger'
      }
      return statusMap[status] || 'info'
    },
    // 获取状态显示文本
    getStatusText(status) {
      const statusMap = {
        'A': '草稿',
        'B': '审核中',
        'C': '已审核',
        'D': '重新审核'
      }
      return statusMap[status] || status
    },
    // 格式化日期
    formatDate(date) {
      if (!date) return '-'
      return new Date(date).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    // 获取物料属性标签类型
    getMaterialPropertyTagType(status) {
      // 这里需要根据实际业务逻辑补充具体的判断条件
      return 'info'
    },
    // 获取物料属性文本
    getMaterialPropertyText(status) {
      // 这里需要根据实际业务逻辑补充具体的映射关系
      return status || '-'
    }
  }
}
</script>

<style lang="scss" scoped>
.mb-20 {
  margin-bottom: 20px;
}

.mt-10 {
  margin-top: 10px;
}

.info-item {
  display: flex;
  align-items: center;
  min-height: 32px;
  
  label {
    width: 80px;
    color: #606266;
    font-size: 14px;
  }
  
  span {
    flex: 1;
    color: #303133;
  }
}

.box-card {
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
}
</style> 