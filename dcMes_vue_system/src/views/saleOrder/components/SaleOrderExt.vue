<template>
    <div class="sale-order-ext">
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px" size="small">
        <!-- 产品详细信息 -->
        <el-card class="box-card" shadow="hover">
          <div slot="header">
            <span>产品详细信息</span>
          </div>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="销售国家地区" prop="FSaleCountry">
                <el-input v-model="formData.FSaleCountry"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="铭牌" prop="FMinSpec">
                <el-input v-model="formData.FMinSpec"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="铭牌图片">
                <zr-upload
                  v-model="formData.FMinSpecImage"
                  :upload-url="'/api/v1/uploadMesFile'"
                  :business-type="'saleOrder'"
                  :category="'minSpec'"
                  :business-id="saleOrderId"
                  upload-type="image"
                  :file-types="['jpg', 'jpeg', 'png']"
                  :max-size="5"
                  tip="支持 jpg、png 格式，大小不超过 5MB"
                  @success="handleMinSpecImageSuccess"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="电压功率" prop="FVoltageRatio">
                <el-input v-model="formData.FVoltageRatio"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="锂电池规格" prop="FBatterySpec">
                <el-input v-model="formData.FBatterySpec"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>
  
        <!-- 印刷和包装信息 -->
        <el-card class="box-card" shadow="hover">
          <div slot="header">
            <span>印刷和包装信息</span>
          </div>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="印刷位置" prop="FPrintPosition">
                <el-input v-model="formData.FPrintPosition"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="印刷颜色" prop="FPrintColor">
                <el-input v-model="formData.FPrintColor"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="备损件" prop="FAccessories">
                <el-input v-model="formData.FAccessories"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="说明书" prop="FManual">
                <el-input v-model="formData.FManual"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="自封袋" prop="FSelfSeal">
                <el-input v-model="formData.FSelfSeal"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>
  
        <!-- 认证和标识信息 -->
        <el-card class="box-card" shadow="hover">
          <div slot="header">
            <span>认证和标识信息</span>
          </div>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="认证要求" prop="FCertification">
                <el-input v-model="formData.FCertification"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="产品颜色" prop="FProductColor">
                <el-input v-model="formData.FProductColor"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="彩盒标贴" prop="FColorLabel">
                <el-input v-model="formData.FColorLabel"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="商标" prop="FTrademark">
                <el-input v-model="formData.FTrademark"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="彩盒标贴图片">
                <zr-upload
                  v-model="formData.FColorLabelImage"
                  :upload-url="'/api/v1/uploadMesFile'"
                  :business-type="'saleOrder'"
                  :category="'colorLabel'"
                  :business-id="saleOrderId"
                  upload-type="image"
                  :file-types="['jpg', 'jpeg', 'png']"
                  :max-size="5"
                  tip="支持 jpg、png 格式，大小不超过 5MB"
                  @success="handleColorLabelImageSuccess"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="UDI" prop="FUDI">
                <el-input v-model="formData.FUDI"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="序列号规则" prop="FUDISerialNoRule">
                <el-input v-model="formData.FUDISerialNoRule"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="形制" prop="FUDIType">
                <el-input v-model="formData.FUDIType"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>
  
        <!-- 包装要求 -->
        <el-card class="box-card" shadow="hover">
          <div slot="header">
            <span>包装要求</span>
          </div>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="PE袋要求" prop="FPEBagReq">
                <el-input v-model="formData.FPEBagReq"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="托盘标贴" prop="FBoxLabel">
                <el-input v-model="formData.FBoxLabel"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="托盘标贴图片">
                <zr-upload
                  v-model="formData.FBoxLabelImage"
                  :upload-url="'/api/v1/uploadMesFile'"
                  :business-type="'saleOrder'"
                  :category="'boxLabel'"
                  :business-id="saleOrderId"
                  upload-type="image"
                  :file-types="['jpg', 'jpeg', 'png']"
                  :max-size="5"
                  tip="支持 jpg、png 格式，大小不超过 5MB"
                  @success="handleBoxLabelImageSuccess"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="托盘标贴及包装方式" prop="FBoxLabelPackage">
                <el-input type="textarea" v-model="formData.FBoxLabelPackage"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="其他要求" prop="FOtherReq">
                <el-input type="textarea" v-model="formData.FOtherReq"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="装箱数量" prop="FBoxNum">
                <el-input v-model="formData.FBoxNum"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="托盘箱数量" prop="FPalletBoxNum">
                <el-input v-model="formData.FPalletBoxNum"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="中箱尺寸" prop="FBoxSize">
                <el-input v-model="formData.FBoxSize"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="毛重(箱)" prop="FGrossWeight">
                <el-input v-model="formData.FGrossWeight"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="净重(箱)" prop="FNetWeight">
                <el-input v-model="formData.FNetWeight"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>
  
        <!-- 按钮操作区 -->
        <div class="form-footer">
          <el-button type="primary" @click="submitForm">保存</el-button>
          <el-button @click="resetForm">重置</el-button>
        </div>
      </el-form>
    </div>
  </template>
  
  <script>
  import { getData, addData, updateData } from '@/api/data'
  import ZrUpload from '@/components/ZrUpload'
  
  export default {
    name: 'SaleOrderExt',
    components: {
      ZrUpload
    },
    props: {
      saleOrderId: {
        type: String,
        required: true
      }
    },
    data() {
      return {
        formData: {
          FSaleOrderId: '',
          FSaleCountry: '',
          FMinSpec: '',
          FMinSpecImage: '',
          FVoltageRatio: '',
          FBatterySpec: '',
          FPrintPosition: '',
          FPrintColor: '',
          FAccessories: '',
          FManual: '',
          FSelfSeal: '',
          FCertification: '',
          FProductColor: '',
          FColorLabel: '',
          FColorLabelImage: '',
          FTrademark: '',
          FUDI: '',
          FUDISerialNoRule: '',
          FUDIType: '',
          FPEBagReq: '',
          FBoxLabel: '',
          FBoxLabelImage: '',
          FBoxLabelPackage: '',
          FOtherReq: '',
          FBoxNum: '',
          FPalletBoxNum: '',
          FBoxSize: '',
          FGrossWeight: '',
          FNetWeight: ''
        },
        rules: {
          FSaleCountry: [{ required: true, message: '请输入销售国家地区', trigger: 'blur' }],
          FMinSpec: [{ required: true, message: '请输入铭牌', trigger: 'blur' }],
          FVoltageRatio: [{ required: true, message: '请输入电压功率', trigger: 'blur' }],
          FBatterySpec: [{ required: true, message: '请输入锂电池规格', trigger: 'blur' }],
          FPrintPosition: [{ required: true, message: '请输入印刷位置', trigger: 'blur' }],
          FPrintColor: [{ required: true, message: '请输入印刷颜色', trigger: 'blur' }],
          FManual: [{ required: true, message: '请输入说明书要求', trigger: 'blur' }],
          FSelfSeal: [{ required: true, message: '请输入自封袋要求', trigger: 'blur' }],
          FCertification: [{ required: true, message: '请输入认证要求', trigger: 'blur' }],
          FProductColor: [{ required: true, message: '请输入产品颜色', trigger: 'blur' }],
          FColorLabel: [{ required: true, message: '请输入彩盒标贴要求', trigger: 'blur' }],
          FTrademark: [{ required: true, message: '请输入商标要求', trigger: 'blur' }],
          FUDI: [{ required: true, message: '请输入UDI', trigger: 'blur' }],
          FUDISerialNoRule: [{ required: true, message: '请输入序列号规则', trigger: 'blur' }],
          FUDIType: [{ required: true, message: '请输入形制', trigger: 'blur' }],
          FPEBagReq: [{ required: true, message: '请输入PE袋要求', trigger: 'blur' }],
          FBoxLabel: [{ required: true, message: '请输入托盘标贴要求', trigger: 'blur' }],
          FBoxLabelPackage: [{ required: true, message: '请输入托盘标贴及包装方式', trigger: 'blur' }]
        },
        minSpecImageList: [],
        colorLabelImageList: [],
        boxLabelImageList: []
      }
    },
    created() {
      this.formData.FSaleOrderId = this.saleOrderId
      this.getExtData()
    },
    methods: {
      // 获取拓展数据
      async getExtData() {
        try {
          const result = await getData('k3_SAL_SaleOrderExt', {
            query: { FSaleOrderId: this.saleOrderId }
          })
          if (result.code === 200 && result.data.length > 0) {
            this.formData = { ...this.formData, ...result.data[0] }
            // 设置图片列表
            if (this.formData.FMinSpecImage) {
              this.minSpecImageList = [{ url: this.formData.FMinSpecImage }]
            }
            if (this.formData.FColorLabelImage) {
              this.colorLabelImageList = [{ url: this.formData.FColorLabelImage }]
            }
            if (this.formData.FBoxLabelImage) {
              this.boxLabelImageList = [{ url: this.formData.FBoxLabelImage }]
            }
          }
        } catch (error) {
          console.error('获取拓展数据失败:', error)
          this.$message.error('获取拓展数据失败')
        }
      },
  
      // 提交表单
      submitForm() {
        this.$refs.formRef.validate(async (valid) => {
          if (valid) {
            try {
              if (this.formData._id) {
                // 更新
                await updateData('k3_SAL_SaleOrderExt',{query:{FSaleOrderId:this.saleOrderId},update:{...this.formData}})
                this.$message.success('更新成功')
              } else {
                // 新增
                await addData('k3_SAL_SaleOrderExt', this.formData)
                this.$message.success('保存成功')
              }
              this.getExtData() // 刷新数据
            } catch (error) {
              console.error('保存失败:', error)
              this.$message.error('保存失败')
            }
          }
        })
      },
  
      // 重置表单
      resetForm() {
        this.$refs.formRef.resetFields()
        this.getExtData()
      },
  
      // 更新图片上传回调方法
      handleMinSpecImageSuccess(data) {
        this.formData.FMinSpecImage =  process.env.VUE_APP_UPLOADS + data.url
      },
  
      handleColorLabelImageSuccess(data) {
        this.formData.FColorLabelImage = process.env.VUE_APP_UPLOADS + data.url
      },
  
      handleBoxLabelImageSuccess(data) {
        this.formData.FBoxLabelImage = process.env.VUE_APP_UPLOADS + data.url
      }
    }
  }
  </script>
  
  <style lang="scss" scoped>
  .sale-order-ext {
    padding: 20px;
  
    .box-card {
      margin-bottom: 20px;
    }
  
    .form-footer {
      margin-top: 20px;
      text-align: center;
    }
  
    .el-card__header {
      padding: 10px 20px;
      font-weight: bold;
    }
  
    .upload-demo {
      .el-upload {
        width: 100%;
      }
    }
  
    .el-textarea {
      width: 100%;
    }
  }
  </style>