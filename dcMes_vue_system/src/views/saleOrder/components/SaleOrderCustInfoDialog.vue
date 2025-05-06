<template>
  <el-dialog :title="title" :visible.sync="dialogVisible" width="1000px" @close="handleClose">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" size="small" @click="handleAdd">新增客户订单信息</el-button>
    </div>

    <!-- 表格 -->
    <el-table v-loading="loading" :data="tableData" border size="small" style="width: 100%; margin-top: 10px;">
      <el-table-column prop="FCustCode" label="客户编码" min-width="120"></el-table-column>
      <el-table-column prop="FCustName" label="客户名称" min-width="150"></el-table-column>
      <el-table-column prop="FCustPO" label="客户PO号" min-width="120"></el-table-column>
      <el-table-column prop="FCustPOLineNo" label="客户PO行号" min-width="100"></el-table-column>
      <el-table-column prop="FSapId" label="SAP ID" min-width="120"></el-table-column>
      <el-table-column prop="FPurchaseOrderNo" label="采购订单号（客户）" min-width="150"></el-table-column>
      <el-table-column prop="FCustMaterialName" label="客户物料名称" min-width="120"></el-table-column>
      <el-table-column prop="FCustMaterialNameEn" label="客户物料名称（英文）" min-width="120"></el-table-column>
      <el-table-column prop="FStatus" label="状态" width="100">
        <template slot-scope="scope">
          <el-tag :type="scope.row.FStatus === 'ENABLE' ? 'success' : 'info'">
            {{ scope.row.FStatus === 'ENABLE' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="FRemark" label="备注" min-width="150"></el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template slot-scope="scope">
          <el-button type="text" size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button type="text" size="small" @click="handleDelete(scope.row)" style="color: #F56C6C;">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 编辑弹窗 -->
    <el-dialog :title="editTitle" :visible.sync="editDialogVisible" width="650px" append-to-body
      @close="handleEditClose">
      <el-form ref="editForm" :model="formData" :rules="rules" label-width="120px" size="small">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户PO号" prop="FCustPO">
              <el-input v-model="formData.FCustPO" clearable @blur="handleInputBlur('FCustPO')"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户PO行号" prop="FCustPOLineNo">
              <el-input v-model="formData.FCustPOLineNo" clearable @blur="handleInputBlur('FCustPOLineNo')"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="SAP ID" prop="FSapId">
              <el-input v-model="formData.FSapId" clearable @blur="handleInputBlur('FSapId')"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="采购订单号（客户）" prop="FPurchaseOrderNo">
              <el-input v-model="formData.FPurchaseOrderNo" clearable @blur="handleInputBlur('FPurchaseOrderNo')"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户物料名称" prop="FCustMaterialName">
              <el-input v-model="formData.FCustMaterialName" clearable @blur="handleInputBlur('FCustMaterialName')"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户物料名称（英文）" prop="FCustMaterialNameEn">
              <el-input v-model="formData.FCustMaterialNameEn" clearable @blur="handleInputBlur('FCustMaterialNameEn')"></el-input>
            </el-form-item>
          </el-col>

        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态" prop="FStatus">
              <el-select v-model="formData.FStatus" style="width: 100%">
                <el-option label="启用" value="ENABLE"></el-option>
                <el-option label="禁用" value="DISABLE"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注" prop="FRemark">
          <el-input type="textarea" v-model="formData.FRemark" :rows="3" placeholder="请输入备注信息" @blur="handleInputBlur('FRemark')"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleEditClose">取 消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确 定</el-button>
      </div>
    </el-dialog>
  </el-dialog>
</template>

<script>
import { getData, addData, updateData, removeData } from '@/api/data'
import { query } from 'quill';

export default {
  name: 'SaleOrderCustInfoDialog',
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
  data() {
    return {
      loading: false,
      submitLoading: false,
      editDialogVisible: false,
      isEdit: false,
      tableData: [],
      formData: this.getInitialFormData(),
      rules: {
        FCustPO: [
          { required: true, message: '请输入客户PO号', trigger: 'blur' }
        ],
        FCustPOLineNo: [
          { required: true, message: '请输入客户PO行号', trigger: 'blur' }
        ],
        FSapId: [
          { required: true, message: '请输入SAP ID', trigger: 'blur' }
        ],
        FPurchaseOrderNo: [
          { required: true, message: '请输入采购订单号', trigger: 'blur' }
        ],
        FCustMaterialName: [
          { required: false, message: '请输入客户物料名称', trigger: 'blur' }
        ],
        FCustMaterialNameEn: [
          { required: false, message: '请输入客户物料名称（英文）', trigger: 'blur' }
        ]
      }
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
    title() {
      return '客户订单信息管理'
    },
    editTitle() {
      return this.isEdit ? '编辑客户订单信息' : '新增客户订单信息'
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.fetchData()
      }
    }
  },
  methods: {
    getInitialFormData() {
      return {
        FSaleOrderId: '',
        FBillNo: '',
        FCustId: '',
        FCustCode: '',
        FCustName: '',
        FCustPO: '',
        FCustPOLineNo: '',
        FSapId: '',
        FPurchaseOrderNo: '',
        FStatus: 'ENABLE',
        FRemark: ''
      }
    },
    // 获取表格数据
    async fetchData() {
      this.loading = true
      try {
        const result = await getData('k3_SAL_SaleOrder_CustInfo', {
          query: { FSaleOrderId: this.saleOrderId }
        })
        if (result.code === 200) {
          this.tableData = result.data
        }
      } catch (error) {
        console.error('获取客户信息失败:', error)
        this.$message.error('获取客户信息失败')
      } finally {
        this.loading = false
      }
    },

    // 新增按钮
    handleAdd() {
      this.isEdit = false
      this.formData = {
        ...this.getInitialFormData(),
        FSaleOrderId: this.saleOrderId,
        FBillNo: this.saleOrderData.FBillNo || '',
        FCustId: this.saleOrderData.FCustId || '',
        FCustCode: this.saleOrderData.FCustId_FNumber || '',
        FCustName: this.saleOrderData.FCustId_FName || ''
      }
      this.editDialogVisible = true
    },

    // 编辑按钮
    handleEdit(row) {
      this.isEdit = true
      this.formData = { ...row }
      this.editDialogVisible = true
    },

    // 删除按钮
    handleDelete(row) {
      this.$confirm('确认删除该条客户订单信息?', '提示', {
        type: 'warning'
      }).then(async () => {
        try {
          const result = await removeData('k3_SAL_SaleOrder_CustInfo',
            {
              query: {
                _id: row._id
              }
            })
          if (result.code === 200) {
            this.$message.success('删除成功')
            this.fetchData()
          }
        } catch (error) {
          console.error('删除失败:', error)
          this.$message.error('删除失败')
        }
      }).catch(() => { })
    },

    // 提交表单
    handleSubmit() {
      this.$refs.editForm.validate(async valid => {
        if (!valid) return

        this.submitLoading = true
        try {
          const params = { ...this.formData }
          
          // 处理所有字符串字段，去除前后空格
          Object.keys(params).forEach(key => {
            if (typeof params[key] === 'string') {
              params[key] = params[key].trim()
            }
          })
          
          params.FModifyTime = new Date()

          let result
          if (this.isEdit) {
            result = await updateData(
              'k3_SAL_SaleOrder_CustInfo',
              {
                query: {
                  _id: this.formData._id
                },
                update: params
              }
            )
          } else {
            result = await addData('k3_SAL_SaleOrder_CustInfo', params)
          }

          if (result.code === 200) {
            this.$message.success('保存成功')
            this.fetchData()
            this.handleEditClose()
          } else {
            this.$message.error(result.msg || '保存失败')
          }
        } catch (error) {
          console.error('保存失败:', error)
          this.$message.error('保存失败')
        } finally {
          this.submitLoading = false
        }
      })
    },

    // 关闭编辑弹窗
    handleEditClose() {
      if (this.$refs.editForm) {
        this.$refs.editForm.resetFields()
      }
      this.editDialogVisible = false
    },

    // 关闭主弹窗
    handleClose() {
      this.tableData = []
      this.dialogVisible = false
    },

    handleInputBlur(field) {
      if (this.formData[field]) {
        this.formData[field] = this.formData[field].trim()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.toolbar {
  margin-bottom: 10px;
}

.el-dialog {
  .el-form {
    padding: 20px;
  }
}
</style>