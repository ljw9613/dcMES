<template>
  <div class="tracker-tasks">
    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="任务标题">
          <task-select v-model="searchForm.taskIds"></task-select>
        </el-form-item>
        <el-form-item label="任务类型">
          <el-select v-model="searchForm.taskType" placeholder="请选择任务类型" clearable>
            <el-option v-for="dict in dict.type.task_type" :key="dict.value" :label="dict.label" :value="dict.value">
            </el-option>
          </el-select>
        </el-form-item>
        <!-- 内容形式 -->
        <el-form-item label="内容形式">
          <el-select v-model="searchForm.contentType" placeholder="请选择内容形式" clearable>
            <el-option v-for="dict in dict.type.content_type" :key="dict.value" :label="dict.label"
              :value="dict.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="任务进度">
          <el-select v-model="searchForm.status" placeholder="请选择进度" clearable>
            <el-option v-for="dict in dict.type.task_progress" :key="dict.value" :label="dict.label"
              :value="dict.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="审核状态" v-if="taskConfig.requireClaimAudit">
          <el-select v-model="searchForm.claimStatus" placeholder="请选择审核状态" clearable>
            <el-option v-for="status in claimStatusList" :key="status" :label="status" :value="status"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="发布时间">
          <el-date-picker v-model="searchForm.publishTimeRange" type="daterange" range-separator="至"
            start-placeholder="开始日期" end-placeholder="结束日期" value-format="yyyy-MM-dd"
            :default-time="['00:00:00', '23:59:59']">
          </el-date-picker>
        </el-form-item>

        <el-form-item label="达人">
          <expert-select v-model="searchForm.expertIds"></expert-select>
        </el-form-item>
        <el-form-item label="经纪人">
          <agent-select v-model="searchForm.agentIds"></agent-select>
        </el-form-item>
        <el-form-item label="跟踪员">
          <tracker-select v-model="searchForm.trackerIds"></tracker-select>
        </el-form-item>
        <el-row>
          <el-form-item label="视频GMV">
            <el-input-number v-model="searchForm.videoGmvMin" placeholder="最小值" :min="0"></el-input-number>
            <span class="range-separator">-</span>
            <el-input-number v-model="searchForm.videoGmvMax" placeholder="最大值" :min="0"></el-input-number>
          </el-form-item>
          <el-form-item label="直播GMV">
            <el-input-number v-model="searchForm.liveGmvMin" placeholder="最小值" :min="0"></el-input-number>
            <span class="range-separator">-</span>
            <el-input-number v-model="searchForm.liveGmvMax" placeholder="最大值" :min="0"></el-input-number>
          </el-form-item>
        </el-row>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 任务列表 -->
    <el-card class="task-list">
      <div slot="header">
        <span>任务列表</span>
        <el-button style="float: right;margin-left: 10px;" type="warning" size="small"
          @click="showProgressHistory = !showProgressHistory">
          {{ showProgressHistory ? '隐藏任务进度历史' : '展开任务进度历史' }}
        </el-button>
        <el-button style="float: right;margin-left: 10px;" type="warning" size="small"
          @click="showResultDialog = !showResultDialog">
          {{ showResultDialog ? '隐藏执行结果列表' : '展开执行结果列表' }}
        </el-button>
      </div>

      <el-table :data="taskList" border style="width: 100%">
        <!-- 任务基本信息 -->
        <el-table-column label="任务信息" min-width="200">
          <template slot-scope="scope">
            <div class="task-info">
              <div class="task-title">{{ scope.row.taskInfo.title }}</div>
              <div class="task-meta">
                <el-tag size="small" :type="getTaskTypeTag(scope.row.taskInfo.type)">
                  {{ scope.row.taskInfo.type }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 任务时间 -->
        <el-table-column label="任务时间" min-width="200">
          <template slot-scope="scope">
            <el-tag size="mini" type="success">开始：{{ formatDate(scope.row.taskInfo.startTime) }} </el-tag>
            <el-tag size="mini" type="warning">结束：{{ formatDate(scope.row.taskInfo.endTime) }}</el-tag>
          </template>
        </el-table-column>

        <!-- 达人信息 -->
        <el-table-column label="达人信息" min-width="150">
          <template slot-scope="scope">
            <div class="expert-info">
              <div>{{ scope.row.expertName }}</div>
              <small class="agent-name">经纪人：{{ scope.row.agentName }}</small>
            </div>
          </template>
        </el-table-column>

        <!-- 经纪人 -->
        <el-table-column label="任务经纪人" min-width="120">
          <template slot-scope="scope">
            {{ scope.row.agentName }}
          </template>
        </el-table-column>

        <!-- 任务进度 -->
        <el-table-column label="当前任务进度" min-width="120">
          <template slot-scope="scope">
            <el-tag :type="getProgressStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>

        <!-- 跟踪员 -->
        <el-table-column label="跟踪员" min-width="120">
          <template slot-scope="scope">
            {{ scope.row.trackerName }}
          </template>
        </el-table-column>
        <!-- 进度列表 -->
        <el-table-column label="进度历史" min-width="300" v-if="showProgressHistory">
          <template slot-scope="scope">
            <el-timeline v-if="scope.row.progressSteps && scope.row.progressSteps.length">
              <el-timeline-item v-for="(progress, index) in scope.row.progressSteps" :key="index"
                :type="getProgressStatusType(progress.status)" size="small"
                :timestamp="formatDate(progress.updateTime)">
                <div class="progress-item">
                  <div class="progress-header">
                    <el-tag size="mini" :type="getProgressStatusType(progress.status)">
                      {{ progress.status }}
                    </el-tag>
                    <span class="progress-step">{{ progress.step }}</span>
                  </div>
                  <div class="progress-remark" v-if="progress.remark">
                    {{ progress.remark }}
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
            <span v-else>暂无进度</span>
          </template>
        </el-table-column>

        <!-- 执行结果列 -->
        <el-table-column v-if="isTracker" label="执行结果" width="600">
          <template slot-scope="scope">
            <template v-if="scope.row.result && scope.row.result.contentList && scope.row.result.contentList.length">
              <!-- 结果汇总 -->
              <div class="result-summary" style="width: 150px;">
                <div class="result-data-item">
                  <span class="label">总播放量：</span>
                  <span class="value">{{
                    formatNumber(calculateTotalMetric(scope.row.result.contentList, 'views'))
                  }}</span>
                </div>
                <div class="result-data-item">
                  <span class="label">总互动量：</span>
                  <span class="value">{{
                    formatNumber(calculateTotalInteractions(scope.row.result.contentList)) }}</span>
                </div>
                <div class="result-data-item">
                  <span class="label">总视频销售额：</span>
                  <span class="value highlight">¥{{
                    formatNumber(calculateTotalMetric(scope.row.result.contentList, 'videoGmv'))
                  }}</span>
                </div>
                <div class="result-data-item">
                  <span class="label">总直播销售额：</span>
                  <span class="value highlight">¥{{
                    formatNumber(calculateTotalMetric(scope.row.result.contentList, 'liveGmv'))
                  }}</span>
                </div>
              </div>

              <!-- 内容列表表格 -->
              <el-table v-if="showResultDialog" :data="scope.row.result.contentList" size="mini" border
                class="content-table">
                <el-table-column label="发布平台" width="90">
                  <template slot-scope="contentScope">
                    <el-tag size="mini" type="primary">{{ contentScope.row.platform }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="内容类型" width="90">
                  <template slot-scope="contentScope">
                    <el-tag size="mini" type="success" style="margin-top: 4px">{{
                      contentScope.row.type }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="视频链接" width="90">
                  <template slot-scope="contentScope">
                    <el-link type="primary" :href="contentScope.row.link" target="_blank">{{
                      contentScope.row.link }}</el-link>
                  </template>
                </el-table-column>
                <el-table-column label="广告码" width="90">
                  <template slot-scope="contentScope">
                    {{ contentScope.row.adCode }}
                  </template>
                </el-table-column>
                <el-table-column label="发布时间" width="90">
                  <template slot-scope="contentScope">
                    <span class="publish-time">{{ formatDate(contentScope.row.publishTime) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="数据表现">
                  <template slot-scope="contentScope">
                    <div class="metrics-container">
                      <div class="metric-item">
                        <i class="el-icon-video-play"></i>
                        <span class="metric-value">{{
                          formatNumber(contentScope.row.performanceData.views) }}</span>
                      </div>
                      <div class="metric-item">
                        <i class="el-icon-star-on"></i>
                        <span class="metric-value">{{
                          formatNumber(contentScope.row.performanceData.likes) }}</span>
                      </div>
                      <div class="metric-item">
                        <i class="el-icon-chat-dot-round"></i>
                        <span class="metric-value">{{
                          formatNumber(contentScope.row.performanceData.comments) }}</span>
                      </div>
                      <div class="metric-item">
                        <i class="el-icon-share"></i>
                        <span class="metric-value">{{
                          formatNumber(contentScope.row.performanceData.shares) }}</span>
                      </div>
                      <div class="metric-item highlight">
                        视频GMV：¥{{ formatNumber(contentScope.row.performanceData.videoGmv) }}
                      </div>
                      <div class="metric-item highlight">
                        直播GMV：¥{{ formatNumber(contentScope.row.performanceData.liveGmv) }}
                      </div>
                    </div>
                  </template>
                </el-table-column>

              </el-table>
            </template>
            <span v-else class="no-result">暂无执行结果</span>
          </template>
        </el-table-column>


        <!-- 操作 -->
        <el-table-column label="操作" :width="isAdmin && taskConfig.requireClaimAudit ? 300 : isTracker ? 300 : 200"
          fixed="right">
          <template slot-scope="scope">
            <el-button size="mini" type="info" @click="handleViewDetails(scope.row)">
              查看详情
            </el-button>
            <!-- 管理员 -->
            <template v-if="isAdmin && taskConfig.requireClaimAudit">
              <el-button v-if="scope.row.claimStatus === '待审核'" size="mini" type="success"
                @click="handleAudit(scope.row, '已通过')">
                通过
              </el-button>
              <el-button v-if="scope.row.claimStatus === '待审核'" size="mini" type="danger"
                @click="handleAudit(scope.row, '已拒绝')">
                拒绝
              </el-button>
            </template>

            <!-- 经纪人操作 -->
            <template
              v-if="isAgent && scope.row.agentId && scope.row.agentId._id === currentUserId && checkAgentPermission(scope.row)">
              <el-button size="mini" type="primary" @click="handleUpdateProgress(scope.row)"
                v-if="scope.row.claimStatus === '已通过'">
                更新进度
              </el-button>
            </template>

            <!-- 任务跟踪员操作 -->
            <template
              v-if="scope.row.trackerId && scope.row.trackerId._id === currentUserId && checkTrackerPermission(scope.row)">
              <el-button size="mini" type="primary" @click="handleUpdateProgress(scope.row)"
                v-if="scope.row.claimStatus === '已通过'">
                更新进度
              </el-button>
              <el-button size="mini" type="success" @click="handleSubmitResult(scope.row)">
                提交结果
              </el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange"
          :current-page="page.current" :page-sizes="[10, 20, 50, 100]" :page-size="page.size"
          layout="total, sizes, prev, pager, next, jumper" :total="page.total">
        </el-pagination>
      </div>
    </el-card>

    <!-- 更新进度对话框 -->
    <task-progress-dialog :visible.sync="progressDialogVisible" :current-claim="currentClaim"
      :status-list="getAvailableStatuses()" @submit="handleProgressSubmit" />

    <!-- 提交结果对话框 -->
    <task-result-dialog :visible.sync="resultDialogVisible" :current-claim="currentClaim" @submit-success="fetchData" />

    <!-- 查看详情对话框 -->
    <task-claim-details :visible.sync="detailsDialogVisible" :details="currentClaimDetails" />
  </div>
</template>

<script>
import { getData, updateData, addData } from '@/api/data'
import { formatDate, formatNumber } from "@/utils/date";
import TaskProgressDialog from './components/TaskProgressDialog.vue'
import TaskResultDialog from './components/TaskResultDialog.vue'
import TaskClaimDetails from './components/TaskClaimDetails.vue'
import ExpertSelect from './components/ExpertSelect.vue'
import AgentSelect from './components/AgentSelect.vue'
import TaskSelect from './components/TaskSelect.vue'
import TrackerSelect from './components/TrackerSelect.vue'
export default {
  dicts: ['expert_platform', 'task_type', 'content_type', 'category', 'task_progress', 'broker_task_progress', 'tracker_task_progress'],
  name: 'TrackerTasks',
  components: {
    TaskProgressDialog,
    TaskResultDialog,
    TaskClaimDetails,
    ExpertSelect,
    AgentSelect,
    TaskSelect,
    TrackerSelect
  },
  data() {
    return {
      //待审核、已通过、已拒绝
      claimStatusList: ['待审核', '已通过', '已拒绝'],
      // 用户信息
      currentUserId: '',
      isAdmin: false,
      isAgent: false,
      isTracker: false,
      taskInfo: null,

      // 搜索表单
      searchForm: {
        taskIds: [],
        taskType: '',
        status: '',
        claimStatus: '',
        publishTimeRange: [],
        videoGmvMin: null,
        videoGmvMax: null,
        liveGmvMin: null,
        liveGmvMax: null,
        expertIds: [], // 替换原来的 expertNickname
        agentIds: [], // 替换原来的 agentName
      },

      // 任列表
      taskList: [],

      // 分页
      page: {
        current: 1,
        size: 10,
        total: 0
      },

      // 状态列表
      statusList: [
        // '未开始',
        // '沟通中',
        // '合作成功',
        // '寄送样品',
        // '样品跟踪',
        // '已收',
        // '内制作中',
        // '作品已发布',
        // '数据统计中',
        // '已完成',
        // '已取消'
      ],
      // 任务进度历史
      showProgressHistory: false,
      // 执行结果列表
      showResultDialog: false,


      // 对话框控制
      progressDialogVisible: false,
      resultDialogVisible: false,
      detailsDialogVisible: false,

      // 当前选中的认领
      currentClaim: null,
      currentClaimDetails: null,

      // 任务类型和状态的标签类型映射
      taskTypeTagMap: {
        '直播带货': 'success',
        '短视频': 'primary',
        '图文': 'warning'
      },
      taskStatusTagMap: {
        '待开始': 'info',
        '进行中': 'primary',
        '已结束': 'success',
        '已取消': 'danger'
      },
      progressStatusTagMap: {
        '未开始': 'info',
        '沟通中': 'warning',
        '合作成功': 'success',
        '寄送样品': 'primary',
        '样品跟踪': 'warning',
        '已收货': 'success',
        '内容制作中': 'primary',
        '作品已发布': 'success',
        '数据统计中': 'warning',
        '已完成': 'success',
        '已取消': 'danger'
      },
      claimStatusTagMap: {
        '待审核': 'warning',
        '已通过': 'success',
        '已拒绝': 'danger'
      },
      taskConfig: {
        requireClaimAudit: false, // 是否需要认领审核
      },
      // 新增任务类型列表
      taskTypeList: ['直播带货', '短视频', '图文'],
    }
  },
  created() {
    this.getCurrentUser()
    this.fetchData()

  },
  methods: {
    checkAgentPermission(row) {
      console.log("🚀 ~ checkAgentPermission ~ row:", row)
      //如果progressSteps中包含"合作成功"，则经纪人不能更新进度
      return !row.progressSteps.some(step => step.status === '合作成功')
    },
    checkTrackerPermission(row) {
      return row.progressSteps.some(step => step.status === '合作成功')
    },
    // 获可用状态
    getAvailableStatuses() {
      // 根据业务逻辑返回可用的状态列表
      //TODO 暂时全部放开
      console.log(this.dict.type.broker_task_progress, 'this.dict.type.broker_task_progress');

      if (this.isAgent) {
        // 经纪人只能更新到"合作成功"
        return this.statusList = [...this.dict.type.broker_task_progress, { label: '合作成功', value: '合作成功', type: 'success' }];;
      } else if (this.isTracker) {
        // 任务跟踪员可以更新所有后续状态
        let statusList = [{ label: '合作成功', value: '合作成功', type: 'success' }];
        statusList = [...statusList, ...this.dict.type.tracker_task_progress];;
        return this.statusList = statusList;
      }
      return this.statusList;
    },
    // 计算总计指标
    calculateTotalMetric(contentList, metric) {
      if (!contentList || !Array.isArray(contentList)) return 0;
      return contentList.reduce((sum, content) => {
        return sum + ((content.performanceData && content.performanceData[metric]) || 0);
      }, 0);
    },

    // 计算总互动量（点赞+评论+转发）
    calculateTotalInteractions(contentList) {
      if (!contentList || !Array.isArray(contentList)) return 0;
      return contentList.reduce((sum, content) => {
        const data = content.performanceData || {};
        return sum + (data.likes || 0) + (data.comments || 0) + (data.shares || 0);
      }, 0);
    },

    // 获取内容时间轴类型
    getContentTimelineType(content) {
      const types = {
        '短视频': 'primary',
        '直播': 'success',
        '图文': 'warning'
      };
      return types[content.contentType] || 'info';
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

    // 获取数据
    async fetchData() {
      try {
        const query = await this.buildQuery()
        const result = await getData('taskClaim', {
          query,
          populate: JSON.stringify([
            { path: 'taskId' },
            { path: 'agentId' },
            { path: 'expertId' },
            { path: 'trackerId' }
          ]),
          sort: {
            _id: -1
          },
          page: this.page.current,
          limit: this.page.size
        })

        this.taskList = result.data.map(claim => ({
          ...claim,
          taskInfo: claim.taskId,
          agentName: claim.agentId && claim.agentId.nickName ? claim.agentId.nickName : '未知',
          expertName: claim.expertId && claim.expertId.nickname ? claim.expertId.nickname : '未知',
          trackerName: claim.trackerId && claim.trackerId.nickName ? claim.trackerId.nickName : '未指定'
        }))
        this.page.total = result.total
      } catch (error) {
        console.error('获取数据失败:', error)
        this.$message.error('获取数据失败')
      }
    },

    // 构建查询条件
    async buildQuery() {
      const query = {}

      // 基础查询条件
      if (this.searchForm.taskIds && this.searchForm.taskIds.length > 0) {
        query['taskId'] = { $in: this.searchForm.taskIds }
      }

      // 修改任务类型的查询逻辑
      if (this.searchForm.taskType) {
        // 或者使用 $in 操作符查询多个任务ID
        const taskIds = await this.getTaskIdsByType(this.searchForm.taskType)
        console.log("🚀 ~ buildQuery ~ taskIds:", taskIds)
        if (taskIds.length > 0) {
          query.taskId = { $in: taskIds }
        }
      }

      // 内容形式
      if (this.searchForm.contentType) {
        const taskIds = await this.getTaskIdsByContentType(this.searchForm.contentType)
        if (taskIds.length > 0) {
          query.taskId = { $in: taskIds }
        }
      }

      // 任务进度和审核状态
      if (this.searchForm.status) {
        query.status = this.searchForm.status
      }
      if (this.searchForm.claimStatus) {
        query.claimStatus = this.searchForm.claimStatus
      }

      // 发布时间范围
      if (this.searchForm.publishTimeRange && this.searchForm.publishTimeRange.length === 2) {
        query['result.contentList.publishTime'] = {
          $gte: new Date(this.searchForm.publishTimeRange[0]),
          $lte: new Date(this.searchForm.publishTimeRange[1])
        }
      }

      // GMV范围查询 - 只有当最小值或最大值有效时才添加条件
      if (this.searchForm.videoGmvMin || this.searchForm.videoGmvMax) {
        query['result.contentList.performanceData.videoGmv'] = {}
        if (this.searchForm.videoGmvMin) {
          query['result.contentList.performanceData.videoGmv'].$gte = this.searchForm.videoGmvMin
        }
        if (this.searchForm.videoGmvMax) {
          query['result.contentList.performanceData.videoGmv'].$lte = this.searchForm.videoGmvMax
        }
      }

      if (this.searchForm.liveGmvMin || this.searchForm.liveGmvMax) {
        query['result.contentList.performanceData.liveGmv'] = {}
        if (this.searchForm.liveGmvMin) {
          query['result.contentList.performanceData.liveGmv'].$gte = this.searchForm.liveGmvMin
        }
        if (this.searchForm.liveGmvMax) {
          query['result.contentList.performanceData.liveGmv'].$lte = this.searchForm.liveGmvMax
        }
      }

      // 使用达人ID数组进行查询
      if (this.searchForm.expertIds && this.searchForm.expertIds.length > 0) {
        query.expertId = { $in: this.searchForm.expertIds }
      }

      if (this.searchForm.agentIds && this.searchForm.agentIds.length > 0) {
        query.agentId = { $in: this.searchForm.agentIds }
      }
      if (!this.isAdmin) {
        // 角色特定查询条件
        if (this.isAgent) {
          query.agentId = this.$store.state.user.id
        }
        if (this.isTracker) {
          query.trackerId = this.$store.state.user.id
        }

      }

      return query
    },

    // 审核处理
    async handleAudit(row, status) {
      try {
        await updateData('taskClaim', {
          query: { _id: row._id },
          update: {
            claimStatus: status,
            auditTime: new Date(),
            auditRemark: status === '已拒绝' ? '不符合要求' : '符合要求'
          }
        })
        this.$message.success('审核完成')
        this.fetchData()
      } catch (error) {
        console.error('审核失败:', error)
        this.$message.error('审核失败')
      }
    },

    // 处理进度提交
    async handleProgressSubmit(formData) {
      try {
        const updateObj = {
          status: formData.status,
          $push: {
            progressSteps: {
              step: formData.step,
              status: formData.status,
              updateTime: new Date(),
              updatedBy: this.currentUserId,
              remark: formData.remark,
              trackingInfo: formData.trackingInfo
            }
          }
        }

        if (formData.status === '合作成功') {
          updateObj.trackerId = formData.trackerId
          // 创建跟踪员指派消息
          await addData('messageLog', {
            title: '跟踪员指派通知',
            content: `您已被指派为任务【${this.taskInfo.title}】的跟踪员`,
            type: 'TRACKER_ASSIGNED',
            taskId: this.taskInfo._id,
            taskClaimId: this.currentClaim._id,
            sender: {
              userId: this.$store.state.user.id,
              role: 'AGENT'
            },
            receivers: [
              {
                userId: formData.trackerId,
                role: 'TRACKER',
                isRead: false
              }
            ],
            isSystem: false
          });
        }

        await updateData('taskClaim', {
          query: { _id: this.currentClaim._id },
          update: updateObj
        })

        this.$message.success('进度更新成功')

        // 创建进度更新消息
        await addData('messageLog', {
          title: '任务进度更新',
          content: `任务【${this.taskInfo.title}】的进度已更新为：${formData.status}`,
          type: 'TASK_PROGRESS',
          taskId: this.taskInfo._id,
          taskClaimId: this.currentClaim._id,
          sender: {
            userId: this.$store.state.user.id,
            role: this.isTracker ? 'TRACKER' : 'AGENT'
          },
          receivers: [
            {
              userId: this.currentClaim.agentId && this.currentClaim.agentId._id,
              role: 'AGENT',
              isRead: false
            },
            {
              userId: this.currentClaim.trackerId && this.currentClaim.trackerId._id,
              role: 'TRACKER',
              isRead: false
            }
          ],
          isSystem: false
        });
        this.$message.success('进度更新成功');

        this.fetchData()
        this.progressDialogVisible = false
      } catch (error) {
        console.error('进度更新失败:', error)
        this.$message.error('进度更新失败')
      }
    },

    // 获取任务类型对应的标签类型
    getTaskTypeTag(type) {
      return this.taskTypeTagMap[type] || 'info'
    },

    // 获取任务状态对应的标签类型
    getTaskStatusTag(status) {
      return this.taskStatusTagMap[status] || 'info'
    },

    // 获取进度状态对应的标签类型
    getProgressStatusType(status) {
      return this.progressStatusTagMap[status] || 'info'
    },

    // 获取认领状态对应的标签类型
    getClaimStatusType(status) {
      return this.claimStatusTagMap[status] || 'info'
    },

    // 处理更新进度按钮点击
    handleUpdateProgress(row) {
      this.taskInfo = row.taskId
      this.currentClaim = row
      this.progressDialogVisible = true
    },

    // 处理提交结果按钮点击
    handleSubmitResult(row) {
      this.taskInfo = row.taskId
      this.currentClaim = row
      this.resultDialogVisible = true
    },

    // 处理看详情按钮点击
    handleViewDetails(row) {
      if (!row) {
        this.$message.warning('数据不完整')
        return
      }

      // 构建详情数据，使用传统的空值检查
      this.currentClaimDetails = {
        _id: row._id || '',
        taskInfo: row.taskInfo || {},
        agentName: row.agentId && row.agentId.nickName ? row.agentId.nickName : '未知',
        expertName: row.expertId && row.expertId.name ? row.expertId.name : '未知',
        trackerName: row.trackerId && row.trackerId.nickName ? row.trackerId.nickName : '未指定',
        claimStatus: row.claimStatus || '未知',
        claimTime: row.claimTime || null,
        status: row.status || '未知',
        progressSteps: row.progressSteps || [],
        result: row.result ? {
          ...row.result,
          performanceData: {
            views: row.result && row.result.performanceData ? row.result.performanceData.views || 0 : 0,
            likes: row.result && row.result.performanceData ? row.result.performanceData.likes || 0 : 0,
            comments: row.result && row.result.performanceData ? row.result.performanceData.comments || 0 : 0,
            shares: row.result && row.result.performanceData ? row.result.performanceData.shares || 0 : 0,
            gmv: row.result && row.result.performanceData ? row.result.performanceData.gmv || 0 : 0,
            orderCount: row.result && row.result.performanceData ? row.result.performanceData.orderCount || 0 : 0
          }
        } : null
      }

      this.detailsDialogVisible = true
    },

    // 处理搜索
    handleSearch() {
      this.page.current = 1
      this.fetchData()
    },

    // 重置搜索
    resetSearch() {
      this.searchForm = {
        taskIds: [],
        taskType: '',
        status: '',
        claimStatus: '',
        publishTimeRange: [],
        videoGmvMin: null,
        videoGmvMax: null,
        liveGmvMin: null,
        liveGmvMax: null,
        expertIds: [],
        agentIds: []
      }
      this.handleSearch()
    },

    // 处理每页显示数量变化
    handleSizeChange(val) {
      this.page.size = val
      this.fetchData()
    },

    // 处理页码变化
    handleCurrentChange(val) {
      this.page.current = val
      this.fetchData()
    },

    // 格式化数字
    formatNumber(num) {
      if (!num) return '0'
      return num.toString().replace(/(\d)(?=(?:\d{3})+$)/g, '$1,')
    },

    // 格式化日期
    formatDate(date) {
      return formatDate(date)
    },

    // 可以添加一个新方法来获取指定类型的任务ID
    async getTaskIdsByType(taskType) {
      try {
        const result = await getData('task', {
          query: { type: taskType },
          select: '_id'
        })
        return result.data.map(task => task._id)
      } catch (error) {
        console.error('获取任务ID失败:', error)
        return []
      }
    },
    // 获取内容形式
    async getTaskIdsByContentType(contentType) {
      try {
        const result = await getData('task', {
          query: { 'cooperationDetails.requirements.contentType': contentType },
          select: '_id'
        })
        return result.data.map(task => task._id)
      } catch (error) {
        console.error('获取任务ID失败:', error)
        return []
      }
    }
  },
  computed: {

  }
}
</script>

<style lang="scss" scoped>
.tracker-tasks {
  .search-card {
    margin-bottom: 20px;
  }

  .task-info {
    .task-title {
      font-weight: 500;
      margin-bottom: 8px;
    }

    .task-meta {
      .time {
        margin-left: 10px;
        color: #909399;
        font-size: 12px;
      }
    }
  }

  .expert-info {
    .agent-name {
      color: #909399;
      display: block;
      margin-top: 4px;
    }
  }

  .update-time {
    color: #909399;
    font-size: 12px;
    margin-top: 4px;
  }

  .pagination {
    margin-top: 20px;
    text-align: right;
  }

  .search-form {
    .range-separator {
      margin: 0 8px;
    }

    .el-input-number {
      width: 120px;
    }
  }
}
</style>