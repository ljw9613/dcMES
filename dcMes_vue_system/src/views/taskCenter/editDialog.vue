<template>
  <el-dialog :title="dialogStatus === 'create' ? '新建任务' : '编辑任务'" :visible.sync="dialogFormVisible" width="70%"
    :close-on-click-modal="false" class="task-dialog">
    <el-form ref="dataForm" :model="dataForm" :rules="rules" label-width="120px">
      <!-- 基本信息 -->
      <el-divider content-position="left">基本信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="任务标题" prop="title">
            <el-input v-model="dataForm.title" placeholder="请输入任务标题"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="任务类型" prop="type">
            <el-select v-model="dataForm.type" placeholder="请选择任务类型" style="width: 100%">
              <el-option v-for="item in dict.type.task_type" :key="item.value" :label="item.label" :value="item.value">
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="任务描述" prop="description">
            <el-input type="textarea" v-model="dataForm.description" :rows="3" placeholder="请输入任务描述"></el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="开始时间" prop="startTime">
            <el-date-picker v-model="dataForm.startTime" type="datetime" placeholder="选择开始时间" style="width: 100%">
            </el-date-picker>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="结束时间" prop="endTime">
            <el-date-picker v-model="dataForm.endTime" type="datetime" placeholder="选择结束时间" style="width: 100%">
            </el-date-picker>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 品牌合作信息 -->
      <el-divider content-position="left">品牌合作信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="品牌名称" prop="cooperationDetails.brandName">
            <el-input v-model="dataForm.cooperationDetails.brandName" placeholder="请输入品牌名称"></el-input>
          </el-form-item>
        </el-col>
        <!-- <el-col :span="12">
          <el-form-item label="品牌行业" prop="cooperationDetails.brandIndustry">
            <el-input v-model="dataForm.cooperationDetails.brandIndustry" placeholder="请输入品牌所属行业"></el-input>
          </el-form-item>
        </el-col> -->
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="产品名称" prop="cooperationDetails.productName">
            <el-input v-model="dataForm.cooperationDetails.productName" placeholder="请输入产品名称"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="产品品类" prop="cooperationDetails.productCategory">
            <el-input v-model="dataForm.cooperationDetails.productCategory" placeholder="请输入产品品类"></el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="产品详情" prop="cooperationDetails.productDetails">
            <el-input type="textarea" v-model="dataForm.cooperationDetails.productDetails" :rows="3"
              placeholder="请输入产品详情描述"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 合作要求 -->
      <el-divider content-position="left">合作要求</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="合作平台" prop="cooperationDetails.requirements.platformType">
            <el-select v-model="dataForm.cooperationDetails.requirements.platformType" multiple placeholder="请选择合作平台"
              style="width: 100%">
              <el-option v-for="dict in dict.type.expert_platform" :key="dict.value" :label="dict.label" :value="dict.value">
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="内容形式" prop="cooperationDetails.requirements.contentType">
            <el-select v-model="dataForm.cooperationDetails.requirements.contentType" multiple placeholder="请选择内容形式"
              style="width: 100%">
              <el-option v-for="dict in dict.type.content_type" :key="dict.value" :label="dict.label" :value="dict.value">
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 达人要求 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="粉丝数要求" prop="cooperationDetails.requirements.expertRequirements.fansCountMin">
            <el-input-number v-model="dataForm.cooperationDetails.requirements.expertRequirements.fansCountMin" :min="0"
              style="width: 40%"></el-input-number>
            <span style="margin-left: 10px;">-</span>
            <el-input-number v-model="dataForm.cooperationDetails.requirements.expertRequirements.fansCountMax" :min="0"
              style="width: 40%"></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="达人类目" prop="cooperationDetails.requirements.expertRequirements.expertCategory">
            <el-select multiple v-model="dataForm.cooperationDetails.requirements.expertRequirements.expertCategory"
              placeholder="请选择达人分类" clearable style="width: 100%">
              <el-option v-for="dict in dict.type.category" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 商务条款 -->
      <el-divider content-position="left">商务条款</el-divider>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="达人预算" prop="cooperationDetails.commercialTerms.budget">
            <el-input-number v-model="dataForm.cooperationDetails.commercialTerms.budget" :min="0"
              style="width: 100%"></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="佣金比例" prop="cooperationDetails.commercialTerms.commissionRate">
            <el-input-number v-model="dataForm.cooperationDetails.commercialTerms.commissionRate" :min="0" :max="100"
              style="width: 100%"></el-input-number>
          </el-form-item>
        </el-col>
 
      </el-row>

      <!-- KPI目标 -->
      <el-divider content-position="left">KPI目标</el-divider>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="播放量目标" prop="cooperationDetails.kpiTargets.viewsTarget">
            <el-input-number v-model="dataForm.cooperationDetails.kpiTargets.viewsTarget" :min="0"
              style="width: 100%"></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="互动量目标" prop="cooperationDetails.kpiTargets.interactionTarget">
            <el-input-number v-model="dataForm.cooperationDetails.kpiTargets.interactionTarget" :min="0"
              style="width: 100%"></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="销售目标" prop="cooperationDetails.kpiTargets.salesTarget">
            <el-input-number v-model="dataForm.cooperationDetails.kpiTargets.salesTarget" :min="0"
              style="width: 100%"></el-input-number>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="达人数量目标" prop="cooperationDetails.kpiTargets.expertCount">
            <el-input-number v-model="dataForm.cooperationDetails.kpiTargets.expertCount" :min="0"
              style="width: 100%"></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="视频数量目标" prop="cooperationDetails.kpiTargets.videoCount">
            <el-input-number v-model="dataForm.cooperationDetails.kpiTargets.videoCount" :min="0"
              style="width: 100%"></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="直播场次目标" prop="cooperationDetails.kpiTargets.liveStreamCount">
            <el-input-number v-model="dataForm.cooperationDetails.kpiTargets.liveStreamCount" :min="0"
              style="width: 100%"></el-input-number>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 备注信息 -->
      <el-divider content-position="left">备注信息</el-divider>
      <el-form-item>
        <el-button type="primary" @click="addMaterial" size="small">添加备注</el-button>
      </el-form-item>
      <div v-for="(remark, index) in dataForm.cooperationDetails.remarks" :key="index" class="remark-item">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="'备注名称' + (index + 1)" :prop="'cooperationDetails.remarks.' + index + '.name'">
              <el-input v-model="remark.name" placeholder="请输入备注名称"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="'备注类型'" :prop="'cooperationDetails.remarks.' + index + '.type'">
              <el-input v-model="remark.type" placeholder="请输入备注类型"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="22">
            <el-form-item :label="'备注链接'" :prop="'cooperationDetails.remarks.' + index + '.url'">
              <el-input v-model="remark.url" placeholder="请输入备注链接"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="2">
            <el-button type="danger" icon="el-icon-delete" circle @click="removeMaterial(index)"></el-button>
          </el-col>
        </el-row>
      </div>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button @click="dialogFormVisible = false">取 消</el-button>
      <el-button type="primary" @click="submitForm">确 定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import dict from '@/utils/dict';

export default {
  dicts: ['expert_platform', 'task_type', 'content_type', 'category'],
  name: 'EditDialog',
  props: {
    dialogFormVisible: {
      type: Boolean,
      default: false
    },
    dialogStatus: {
      type: String,
      default: 'create'
    },
    dataForm: {
      type: Object,
      required: true
    }
  },
  data() {
    // 添加时间验证规则
    const validateEndTime = (rule, value, callback) => {
      if (value && this.dataForm.startTime) {
        if (value < this.dataForm.startTime) {
          callback(new Error('结束时间不能早于开始时间'))
        } else {
          callback()
        }
      } else {
        callback()
      }
    }

    return {
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
      expertCategoryOptions: [
        { value: '美妆', label: '美妆' },
        { value: '服装', label: '服装' },
        { value: '美食', label: '美食' },
        { value: '母婴', label: '母婴' }
      ],
      remarkTypeOptions: [
        { value: '图片', label: '图片' },
        { value: '视频', label: '视频' },
        { value: '文档', label: '文档' }
      ],

      // 表单验证规则
      rules: {
        title: [{ required: true, message: '请输入任务标题', trigger: 'blur' }],
        type: [{ required: true, message: '请选择任务类型', trigger: 'change' }],
        description: [{ required: true, message: '请输入任务描述', trigger: 'blur' }],
        startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
        endTime: [
          { required: true, message: '请选择结束时间', trigger: 'change' },
          { validator: validateEndTime, trigger: 'change' }
        ],
        'cooperationDetails.brandName': [{ required: true, message: '请输入品牌名称', trigger: 'blur' }],
        'cooperationDetails.requirements.platformType': [{ required: true, message: '请选择合作平台', trigger: 'change' }],
        'cooperationDetails.requirements.contentType': [{ required: true, message: '请选择内容形式', trigger: 'change' }],
        'cooperationDetails.commercialTerms.budget': [{ required: true, message: '请输入项目预算', trigger: 'blur' }]
      }
    };
  },
  methods: {
    // 添加物料
    addMaterial() {
      this.dataForm.cooperationDetails.remarks.push({
        name: '',
        type: '',
        url: '',
        description: '',
        uploadTime: new Date()
      });
    },

    // 移除物料
    removeMaterial(index) {
      this.dataForm.cooperationDetails.remarks.splice(index, 1);
    },

    // 提交表单
    submitForm() {
      this.$refs.dataForm.validate(async (valid) => {
        if (valid) {
          // 创建一个新的对象，避免直接修改 props
          const submitData = JSON.parse(JSON.stringify(this.dataForm))

          // 添加创建/更新时间
          if (this.dialogStatus === 'create') {
            submitData.createTime = new Date()
          }
          submitData.updateTime = new Date()

          this.$emit('submit', submitData)
        } else {
          return false
        }
      })
    }
  }
};
</script>

<style lang="scss" scoped>
.task-dialog {
  .el-dialog__body {
    padding: 20px 40px;
  }

  .remark-item {
    border: 1px dashed #dcdfe6;
    border-radius: 4px;
    padding: 10px;
    margin-bottom: 10px;
  }

  .el-divider {
    margin: 24px 0;
  }

  .el-divider__text {
    font-size: 16px;
    font-weight: bold;
    color: #409EFF;
  }
}
</style>