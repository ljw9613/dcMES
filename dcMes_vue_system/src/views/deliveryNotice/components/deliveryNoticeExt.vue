<template>
  <div class="requisition-bill-ext">
    <el-form :model="formData" ref="formRef" label-width="120px" :rules="rules">
      <!-- 基本信息卡片 -->
      <el-card class="box-card" shadow="hover">
        <div slot="header" class="card-header">
          <span>生产订单信息</span>
        </div>

        <!-- 只读信息 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="申请单号">
              <el-input v-model="orderData.FBillNo" disabled></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 可编辑信息 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生产订单号" prop="productionOrderId">
              <zr-select v-model="formData.productionOrderId" collection="k3_PRD_MO"
                :search-fields="['FBillNo', 'FMaterialName']" label-key="FBillNo" sub-key="FBillNo" :multiple="false"
                placeholder="请输入生产单号/物料名称搜索" clearable style="width: 100%" @select="handleOrderSelect">
                <template #option="{ item }">
                  <div class="select-option">
                    <div class="option-main">
                      <span class="option-label">{{ item.FBillNo }}</span>

                      <div class="option-sub">
                        <small>物料: {{ item.FMaterialName }} | 规格: {{ item.FSpecification || '无'
                          }} |
                          数量: {{ item.FQty }}{{ item.FUnitId_FName }}</small>
                      </div>
                      <el-tag size="mini" type="info" class="option-tag">
                        {{ item.FWorkShopID_FName || '未设置车间' }}
                        {{ item.FPrdOrgId_FName || '未设置组织' }}
                      </el-tag>
                    </div>
                  </div>
                </template>
              </zr-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 添加物料信息展示 -->
        <el-row :gutter="20" v-if="formData.productionOrderId">
          <el-col :span="12">
            <el-form-item label="物料名称">
              <el-input v-model="formData.FMaterialName" disabled></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规格型号">
              <el-input v-model="formData.FSpecification" disabled></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="订单数量">
              <el-input v-model="formData.FQty" disabled>
                <template #append>{{ formData.FUnitId_FName }}</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生产车间">
              <el-input v-model="formData.FWorkShopID_FName" disabled></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生产组织">
              <el-input v-model="formData.FPrdOrgId_FName" disabled></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计划开工日期">
              <el-input v-model="formData.FPlanStartDate" disabled></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计划完工日期">
              <el-input v-model="formData.FPlanFinishDate" disabled></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 在生产订单信息卡片后添加新的物流信息卡片 -->
      <el-card class="box-card" shadow="hover">
        <div slot="header" class="card-header">
          <span>物流信息</span>
        </div>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户地址" prop="FCustomerAddress">
              <el-input v-model="formData.FCustomerAddress" placeholder="请输入客户地址"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系人" prop="FContactPerson">
              <el-input v-model="formData.FContactPerson" placeholder="请输入联系人"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="FContactPhone">
              <el-input v-model="formData.FContactPhone" placeholder="请输入联系电话"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发货时间" prop="FDeliveryDate">
              <el-date-picker
                v-model="formData.FDeliveryDate"
                type="datetime"
                placeholder="选择发货时间"
                style="width: 100%">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="物流方式" prop="FLogisticsMethod">
              <el-select v-model="formData.FLogisticsMethod" placeholder="请选择物流方式" style="width: 100%">
                <el-option label="海运" value="sea"></el-option>
                <el-option label="空运" value="air"></el-option>
                <el-option label="陆运" value="land"></el-option>
                <el-option label="铁路" value="rail"></el-option>
                <el-option label="多式联运" value="multimodal"></el-option>
                <el-option label="自提" value="self"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>
    </el-form>

    <!-- 操作按钮 -->
    <div class="operation-footer">
      <el-button @click="$emit('close')">取 消</el-button>
      <el-button type="primary" @click="handleSubmit">确 定</el-button>
    </div>
  </div>
</template>

<script>
import { getData, addData, updateData } from '@/api/data'

export default {
  name: 'RequisitionBillExt',
  props: {
    orderData: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      formData: {
        FDeliveryNoticeId: '',
        FBillNo: '',
        productionOrderId: '',
        productionOrderNo: '',
        FMaterialId: '',
        FMaterialName: '',
        FSpecification: '',
        FQty: '',
        FUnitId_FName: '',
        FWorkShopID_FName: '',
        FPrdOrgId_FName: '',
        FPlanStartDate: '',
        FPlanFinishDate: '',
        FCustomerAddress: '',
        FContactPerson: '',
        FContactPhone: '',
        FDeliveryDate: '',
        FLogisticsMethod: ''
      },
      rules: {
        productionOrderId: [
          { required: true, message: '请选择关联生产订单', trigger: 'change' }
        ],
        FCustomerAddress: [
          { required: true, message: '请输入客户地址', trigger: 'blur' }
        ],
        FContactPerson: [
          { required: true, message: '请输入联系人', trigger: 'blur' }
        ],
        FContactPhone: [
          { required: true, message: '请输入联系电话', trigger: 'blur' }
        ],
        FDeliveryDate: [
          { required: true, message: '请选择发货时间', trigger: 'change' }
        ],
        FLogisticsMethod: [
          { required: true, message: '请选择物流方式', trigger: 'change' }
        ]
      },
      loading: false,
      productionOrders: [],
      extId: null
    }
  },
  methods: {
    // 处理订单选择
    handleOrderSelect(option) {
      console.log(option, 'option')
      if (option) {
        this.formData.productionOrderNo = option.FBillNo
        this.formData.FMaterialId = option.FMaterialId
        this.formData.FMaterialName = option.FMaterialName
        this.formData.FSpecification = option.FSpecification
        this.formData.FQty = option.FQty
        this.formData.FUnitId_FName = option.FUnitId_FName
        this.formData.FWorkShopID_FName = option.FWorkShopID_FName
        this.formData.FPrdOrgId_FName = option.FPrdOrgId_FName
        this.formData.FPlanStartDate = option.FPlanStartDate
        this.formData.FPlanFinishDate = option.FPlanFinishDate
      } else {
        this.formData.productionOrderNo = ''
        this.formData.FMaterialId = ''
        this.formData.FMaterialName = ''
        this.formData.FSpecification = ''
        this.formData.FQty = ''
        this.formData.FUnitId_FName = ''
        this.formData.FWorkShopID_FName = ''
        this.formData.FPrdOrgId_FName = ''
        this.formData.FPlanStartDate = ''
        this.formData.FPlanFinishDate = ''
      }
    },

    // 提交表单
    async handleSubmit() {
      try {
        await this.$refs.formRef.validate()

        let saveResult
        // 确保 formData 中包含 FDeliveryNoticeId
        const saveData = {
          ...this.formData,
          FDeliveryNoticeId: this.orderData._id,
          FBillNo: this.orderData.FBillNo
        }
        console.log(saveData, 'saveData')

        if (this.extId) {
          // 更新现有数据
          saveResult = await updateData('k3_SAL_DeliveryNoticeExt', {
            query: { _id: this.extId },
            update: saveData
          })
        } else {
          // 新增数据
          saveResult = await addData('k3_SAL_DeliveryNoticeExt',
            saveData
          )
        }

        if (saveResult.code === 200) {
          this.$message.success('保存成功')
          this.$emit('close')
          this.$emit('refresh')
        } else {
          this.$message.error(saveResult.msg || '保存失败')
        }
      } catch (error) {
        console.error('保存失败:', error)
        this.$message.error('保存失败: ' + error.message)
      }
    },

    // 获取拓展数据
    async fetchExtData() {
      try {
        console.log('设置基本信息')
        // 设置基本信息
        this.formData.FDeliveryNoticeId = this.orderData._id
        this.formData.FBillNo = this.orderData.FBillNo

        // 获取拓展数据
        const req = {
          query: {
            FDeliveryNoticeId: this.orderData._id
          }
        }
        const res = await getData('k3_SAL_DeliveryNoticeExt', req)
        if (res.code === 200 && res.data.length > 0) {
          const extData = res.data[0]
          this.extId = extData._id
          // 确保所有物流相关字段都被正确赋值
          Object.assign(this.formData, {
            productionOrderId: extData.productionOrderId,
            productionOrderNo: extData.productionOrderNo,
            FMaterialId: extData.FMaterialId,
            FMaterialName: extData.FMaterialName,
            FSpecification: extData.FSpecification,
            FQty: extData.FQty,
            FUnitId_FName: extData.FUnitId_FName,
            FWorkShopID_FName: extData.FWorkShopID_FName,
            FPrdOrgId_FName: extData.FPrdOrgId_FName,
            FPlanStartDate: extData.FPlanStartDate,
            FPlanFinishDate: extData.FPlanFinishDate,
            // 物流相关字段
            FCustomerAddress: extData.FCustomerAddress || '',
            FContactPerson: extData.FContactPerson || '',
            FContactPhone: extData.FContactPhone || '',
            FDeliveryDate: extData.FDeliveryDate || '',
            FLogisticsMethod: extData.FLogisticsMethod || ''
          })
          // 如果有生产订单ID，获取生产订单信息
          if (extData.productionOrderId) {
            const orderRes = await getData('k3_PRD_MO', {
              query: { _id: extData.productionOrderId }
            })
            if (orderRes.code === 200 && orderRes.data.length > 0) {
              this.productionOrders = orderRes.data
            }
          }
        }
      } catch (error) {
        console.error('初始化数据失败:', error)
        this.$message.error('初始化数据失败')
      }
    }
  },
  created() {
    this.fetchExtData()
  }
}
</script>

<style lang="scss" scoped>
.requisition-bill-ext {
  padding: 20px;

  .box-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .operation-footer {
    display: flex;
    justify-content: center;
    margin-top: 20px;
    gap: 20px;
  }
}

.select-option {
  padding: 5px 0;

  .option-main {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .option-label {
      font-weight: bold;
      color: #303133;
    }

    .option-tag {
      font-size: 12px;
    }
  }

  .option-sub {
    margin-top: 4px;
    color: #909399;
    font-size: 12px;

    small {
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}
</style>