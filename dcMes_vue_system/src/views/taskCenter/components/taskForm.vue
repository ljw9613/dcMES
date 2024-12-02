<template>
  <el-dialog :title="title" :visible.sync="visible" width="70%" @close="handleClose">
    <el-form :model="form" :rules="rules" ref="taskForm" label-width="120px">
      <!-- 基本信息 -->
      <el-divider>基本信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="任务标题" prop="title">
            <el-input v-model="form.title" placeholder="请输入任务标题"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="任务类型" prop="type">
            <el-select v-model="form.type" placeholder="请选择任务类型">
              <el-option v-for="item in taskTypeOptions" :key="item.value" :label="item.label" :value="item.value">
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="任务描述" prop="description">
        <el-input type="textarea" v-model="form.description" :rows="4" placeholder="请输入任务描述"></el-input>
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="开始时间" prop="startTime">
            <el-date-picker v-model="form.startTime" type="datetime" placeholder="选择开始时间"></el-date-picker>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="结束时间" prop="endTime">
            <el-date-picker v-model="form.endTime" type="datetime" placeholder="选择结束时间"></el-date-picker>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 品牌信息 -->
      <el-divider>品牌信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="品牌名称" prop="cooperationDetails.brandName">
            <el-input v-model="form.cooperationDetails.brandName" placeholder="请输入品牌名称"></el-input>
          </el-form-item>
        </el-col>
        <!-- <el-col :span="12">
          <el-form-item label="品牌行业" prop="cooperationDetails.brandIndustry">
            <el-input v-model="form.cooperationDetails.brandIndustry" placeholder="请输入品牌所属行业"></el-input>
          </el-form-item>
        </el-col> -->
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="产品名称" prop="cooperationDetails.productName">
            <el-input v-model="form.cooperationDetails.productName" placeholder="请输入产品名称"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="产品品类" prop="cooperationDetails.productCategory">
            <el-input v-model="form.cooperationDetails.productCategory" placeholder="请输入产品品类"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="产品详情" prop="cooperationDetails.productDetails">
        <el-input type="textarea" v-model="form.cooperationDetails.productDetails" :rows="3"
          placeholder="请输入产品详情描述"></el-input>
      </el-form-item>

      <!-- 合作要求 -->
      <el-divider>合作要求</el-divider>
      <el-form-item label="合作平台" prop="cooperationDetails.requirements.platformType">
        <el-select v-model="form.cooperationDetails.requirements.platformType" multiple placeholder="请选择合作平台">
          <el-option v-for="item in platformOptions" :key="item.value" :label="item.label" :value="item.value">
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="内容形式" prop="cooperationDetails.requirements.contentType">
        <el-select v-model="form.cooperationDetails.requirements.contentType" multiple placeholder="请选择内容形式">
          <el-option v-for="item in contentTypeOptions" :key="item.value" :label="item.label" :value="item.value">
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="内容要求" prop="cooperationDetails.requirements.contentRequirements">
        <el-input type="textarea" v-model="form.cooperationDetails.requirements.contentRequirements" :rows="3"
          placeholder="请输入内容要求"></el-input>
      </el-form-item>

      <!-- 达人要求 -->
      <el-divider>达人要求</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="粉丝数要求" prop="cooperationDetails.requirements.expertRequirements.fansCountMin">
            <el-input-number v-model="form.cooperationDetails.requirements.expertRequirements.fansCountMin" :min="0"
              :step="10000" placeholder="请输入最低粉丝数"></el-input-number>
            <span style="margin-left: 10px;">-</span>
            <el-input-number v-model="form.cooperationDetails.requirements.expertRequirements.fansCountMax" :min="0"
              :step="10000" placeholder="请输入最高粉丝数"></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="粉丝类型" prop="cooperationDetails.requirements.expertRequirements.fansType">
            <el-select v-model="form.cooperationDetails.requirements.expertRequirements.fansType" multiple
              placeholder="请选择粉丝类型">
              <el-option v-for="item in fansTypeOptions" :key="item.value" :label="item.label" :value="item.value">
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 商务条款 -->
      <el-divider>商务条款</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="项目预算" prop="cooperationDetails.commercialTerms.budget">
            <el-input-number v-model="form.cooperationDetails.commercialTerms.budget" :min="0" :step="1000"
              placeholder="请输入项目预算"></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="支付方式" prop="cooperationDetails.commercialTerms.paymentMethod">
            <el-select v-model="form.cooperationDetails.commercialTerms.paymentMethod" placeholder="请选择支付方式">
              <el-option v-for="item in paymentMethodOptions" :key="item.value" :label="item.label" :value="item.value">
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- KPI目标 -->
      <el-divider>KPI目标</el-divider>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="播放量目标" prop="cooperationDetails.kpiTargets.viewsTarget">
            <el-input-number v-model="form.cooperationDetails.kpiTargets.viewsTarget" :min="0"
              :step="1000"></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="互动量目标" prop="cooperationDetails.kpiTargets.interactionTarget">
            <el-input-number v-model="form.cooperationDetails.kpiTargets.interactionTarget" :min="0"
              :step="100"></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="销售目标" prop="cooperationDetails.kpiTargets.salesTarget">
            <el-input-number v-model="form.cooperationDetails.kpiTargets.salesTarget" :min="0"
              :step="100"></el-input-number>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">取 消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="loading">确 定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { addData, updateData, getData } from "@/api/data";

export default {
  name: 'TaskForm',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    taskId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      title: '',
      loading: false,
      isAdmin: false,

      //粉丝类型
      fansTypeOptions: [
        { value: '粉丝', label: '粉丝' },
        { value: '达人', label: '达人' }
      ],
      // 选项数据
      taskTypeOptions: [
        { value: '品牌宣传', label: '品牌宣传' },
        { value: '达人推广', label: '达人推广' },
        { value: '达人直播', label: '达人直播' },
        { value: '达人视频', label: '达人视频' },
        { value: '直播带货', label: '直播带货' }
      ],
      platformOptions: [
        { value: '抖音', label: '抖音' },
        { value: '小红书', label: '小红书' },
        { value: 'B站', label: 'B站' },
        { value: '微博', label: '微博' }
      ],
      contentTypeOptions: [
        { value: '短视频', label: '短视频' },
        { value: '直播', label: '直播' },
        { value: '图文', label: '图文' }
      ],
      paymentMethodOptions: [
        { value: '预付款', label: '预付款' },
        { value: '尾款', label: '尾款' }
      ],

      form: {
        title: '',
        type: '',
        description: '',
        startTime: null,
        endTime: null,
        cooperationDetails: {
          brandName: '',
          brandIndustry: '',
          productName: '',
          productCategory: '',
          productDetails: '',
          requirements: {
            platformType: [],
            contentType: [],
            contentRequirements: '',
            expertRequirements: {
              fansCountMin: 0,
              fansCountMax: 0,
              fansType: [],
              expertStyle: [],
              expertCategory: [],
              location: [],
              otherRequirements: ''
            }
          },
          commercialTerms: {
            budget: 0,
            paymentMethod: '',
            paymentTerms: '',
            commissionRate: 0,
            exclusivityPeriod: 0
          },
          kpiTargets: {
            viewsTarget: 0,
            interactionTarget: 0,
            salesTarget: 0,
            otherTargets: []
          }
        }
      },
      rules: {
        title: [{ required: true, message: '请输入任务标题', trigger: 'blur' }],
        type: [{ required: true, message: '请选择任务类型', trigger: 'change' }],
        description: [{ required: true, message: '请输入任务描述', trigger: 'blur' }],
        'cooperationDetails.brandName': [{ required: true, message: '请输入品牌名称', trigger: 'blur' }],
        'cooperationDetails.brandIndustry': [{ required: true, message: '请输入品牌所属行业', trigger: 'blur' }],
        'cooperationDetails.productName': [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
        'cooperationDetails.productCategory': [{ required: true, message: '请输入产品品类', trigger: 'blur' }],
        'cooperationDetails.productDetails': [{ required: true, message: '请输入产品详情描述', trigger: 'blur' }],
        'cooperationDetails.requirements.platformType': [{ required: true, message: '请选择合作平台', trigger: 'change' }],
        'cooperationDetails.requirements.contentType': [{ required: true, message: '请选择内容形式', trigger: 'change' }],
        'cooperationDetails.requirements.contentRequirements': [{ required: true, message: '请输入内容要求', trigger: 'blur' }],
        'cooperationDetails.requirements.expertRequirements.fansCountMin': [{ required: true, message: '请输入最低粉丝数', trigger: 'blur' }],
        'cooperationDetails.requirements.expertRequirements.fansCountMax': [{ required: true, message: '请输入最高粉丝数', trigger: 'blur' }],
        'cooperationDetails.requirements.expertRequirements.fansType': [{ required: true, message: '请选择粉丝类型', trigger: 'change' }],
        'cooperationDetails.commercialTerms.budget': [{ required: true, message: '请输入项目预算', trigger: 'blur' }],
        'cooperationDetails.commercialTerms.paymentMethod': [{ required: true, message: '请选择支付方式', trigger: 'change' }],
        'cooperationDetails.kpiTargets.viewsTarget': [{ required: true, message: '请输入播放量目标', trigger: 'blur' }],
        'cooperationDetails.kpiTargets.interactionTarget': [{ required: true, message: '请输入互动量目标', trigger: 'blur' }],
        'cooperationDetails.kpiTargets.salesTarget': [{ required: true, message: '请输入销售目标', trigger: 'blur' }]
      }
    };
  },
  methods: {
    handleClose() {
      this.$emit('update:visible', false);
    },
    handleSubmit() {
      this.$refs['taskForm'].validate((valid) => {
        if (valid) {
          this.loading = true;
          if (this.taskId) {
            updateData(this.taskId, this.form).then(response => {
              this.$message.success('任务更新成功');
              this.handleClose();
            }).catch(error => {
              this.$message.error('任务更新失败');
              this.loading = false;
            });
          } else {
            addData('task', this.form).then(response => {
              this.$message.success('任务添加成功');
              this.handleClose();
            }).catch(error => {
              this.$message.error('任务添加失败');
              this.loading = false;
            });
          }
        } else {
          this.$message.error('请填写完整任务信息');
          this.loading = false;
        }
      });
    }
  }
};
</script>