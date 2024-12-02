<template>
  <el-dialog title="更新进度" :visible.sync="dialogVisible" width="60%" custom-class="progress-dialog" append-to-body
    @close="handleClose">
    <el-form :model="form" :rules="rules" ref="progressForm" label-width="120px">
      <!-- 进度状态 -->
      <el-form-item label="进度状态" prop="status">
        <el-select v-model="form.status" style="width: 100%">
          <el-option v-for="status in availableStatuses" :key="status.value" :label="status.label"
            :value="status.value" />
        </el-select>
      </el-form-item>

      <!-- 任务跟踪员选择 -->
      <el-form-item v-if="form.status === '合作成功'" label="任务跟踪员" prop="trackerId"
        :rules="{ required: true, message: '请选择任务跟踪员', trigger: 'change' }">
        <el-select v-model="form.trackerId" filterable placeholder="请选择任务跟踪员" style="width: 100%">
          <el-option v-for="tracker in trackerOptions" :key="tracker.value" :label="tracker.label"
            :value="tracker.value" />
        </el-select>
      </el-form-item>

      <!-- 跟踪信息 -->
      <template v-if="isAgent">
        <div class="tracking-info-section">

          <el-form-item v-if="['合作成功'].includes(form.status)" label="建联来源" prop="trackingInfo.buildConnectionSource">
            <el-input v-model="form.trackingInfo.buildConnectionSource" placeholder="请输入建联来源" />
          </el-form-item>

          <el-form-item v-if="['合作成功'].includes(form.status)" label="确定合作日" prop="trackingInfo.cooperationDate">
            <el-date-picker v-model="form.trackingInfo.cooperationDate" type="date" placeholder="选择确定合作日"
              style="width: 100%" />
          </el-form-item>
        </div>
      </template>

      <!-- 跟踪信息 -->
      <template v-if="isTracker">
        <div class="tracking-info-section">
          <el-form-item v-if="['已签收'].includes(form.status)" label="收货时间" prop="trackingInfo.receiveTime">
            <el-date-picker v-model="form.trackingInfo.receiveTime" type="datetime" placeholder="选择收货时间"
              style="width: 100%" />
          </el-form-item>
        </div>
      </template>

      <el-form-item label="进度备注" prop="step">
        <el-input v-model="form.step" placeholder="进度备注" />
      </el-form-item>

      <!-- <el-form-item label="详细备注">
        <el-input 
          type="textarea" 
          v-model="form.remark" 
          rows="3"
        />
      </el-form-item> -->
    </el-form>

    <div slot="footer">
      <el-button @click="handleClose">取 消</el-button>
      <el-button type="primary" @click="handleSubmit">确 定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { getData } from '@/api/data'

export default {
  dicts: ['tracker_task_progress'],
  name: 'TaskProgressDialog',

  props: {
    visible: {
      type: Boolean,
      default: false
    },
    currentClaim: {
      type: Object,
      default: () => ({})
    },
    statusList: {
      type: Array,
      default: () => []
    }
  },

  data() {
    return {
      isAdmin: false,
      isAgent: false,
      isTracker: false,
      currentUserId: '',
      form: {
        status: '',
        trackerId: '',
        step: '',
        remark: '',
        trackingInfo: {
          buildConnectionSource: '',
          cooperationDate: null,
          receiveTime: null,
          estimatedPublishTime: null
        }
      },
      rules: {
        status: [
          { required: true, message: '请选择进度状态', trigger: 'change' }
        ],
        step: [
          { message: '请输入进度说明', trigger: 'blur' }
        ],
        'trackingInfo.buildConnectionSource': [
          { required: true, message: '请输入建联来源', trigger: 'blur' }
        ],
        'trackingInfo.cooperationDate': [
          { required: true, message: '请选择确定合作日', trigger: 'change' }
        ],
        'trackingInfo.receiveTime': [
          { required: true, message: '请选择收货时间', trigger: 'change' }
        ],
        'trackingInfo.estimatedPublishTime': [
          { required: true, message: '请选择预计发布时间', trigger: 'change' }
        ]
      },
      trackerOptions: []
    }
  },

  watch: {
    visible: {
      immediate: true,
      handler(val) {
        if (val) {
          this.initForm()
          this.getCurrentUser()
          this.loadTrackerOptions()
        }
      }
    },
    currentClaim: {
      immediate: true,
      handler(val) {
        if (val && Object.keys(val).length > 0) {
          this.initForm()
        }
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

    showTrackingInfo() {
      console.log(this.dict.type)
      const trackingInfoStatuses = this.dict.type.tracker_task_progress.map(item => item.value)

      return trackingInfoStatuses.includes(this.form.status)
    },

    availableStatuses() {
      return this.statusList
    }
  },

  methods: {
    handleClose() {
      this.dialogVisible = false
    },
    // 获取当前用户信息
    async getCurrentUser() {
      try {
        this.isAdmin = this.$store.getters.roles.label.includes('Admin')
        this.isAgent = this.$store.getters.roles.label.includes('Agent') || this.$store.getters.roles.label.includes('Admin')
        this.isTracker = this.$store.getters.roles.label.includes('Tracker') || this.$store.getters.roles.label.includes('Admin')
        this.currentUserId = this.$store.state.user.id
      } catch (error) {
        console.error('获取用户信息失败:', error)
      }
    },
    // 初始化表单数据
    initForm() {
      if (this.currentClaim) {
        // 获取最后一条进度记录
        const progressSteps = this.currentClaim.progressSteps || []
        const lastProgress = progressSteps.length > 0 ? progressSteps[progressSteps.length - 1] : {}
        const trackingInfo = lastProgress.trackingInfo || {}

        this.form = {
          status: this.currentClaim.status || '',
          trackerId: this.currentClaim.trackerId || '',
          step: '',
          remark: '',
          trackingInfo: {
            buildConnectionSource: trackingInfo.buildConnectionSource || '',
            cooperationDate: trackingInfo.cooperationDate || null,
            receiveTime: trackingInfo.receiveTime || null,
            estimatedPublishTime: trackingInfo.estimatedPublishTime || null
          }
        }
      }
    },

    // 加载任务跟踪员选项
    async loadTrackerOptions() {
      try {
        const result = await getData('user_login', {
          query: {
            role: '6734de3a55647e147063f158' // 假设有角色字段来筛选跟踪员
          }
        })

        if (result.data) {
          this.trackerOptions = result.data.map(user => ({
            value: user._id,
            label: user.nickName || user.username
          }))
        }
      } catch (error) {
        console.error('获取任务跟踪员列表失败:', error)
        this.$message.error('获取任务跟踪员列表失败')
      }
    },

    // 验证并提交表单
    async handleSubmit() {
      try {
        await this.$refs.progressForm.validate()

        // 根据状态添加必要的验证
        if (this.form.status === '合作成功') {
          if (!this.form.trackerId) {
            this.$message.error('请选择任务跟踪员')
            return
          }
          if (!this.form.trackingInfo.buildConnectionSource) {
            this.$message.error('请输入建联来源')
            return
          }
          if (!this.form.trackingInfo.cooperationDate) {
            this.$message.error('请选择确定合作日')
            return
          }
        }

        if (this.form.status === '已签收' && !this.form.trackingInfo.receiveTime) {
          this.$message.error('请选择收货时间')
          return
        }

        if (this.form.status === '内容制作中' && !this.form.trackingInfo.estimatedPublishTime) {
          this.$message.error('请选择预计发布时间')
          return
        }

        this.$emit('submit', this.form)
        this.handleClose()
      } catch (error) {
        console.error('表单验证失败:', error)
      }
    }
  }
}
</script>