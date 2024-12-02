<template>
    <div class="task-claim">
        <!-- 任务基本信息 -->
        <el-card class="task-info">
            <div slot="header">
                <span>任务信息</span>
            </div>

            <!-- 基础信息 -->
            <div class="info-section">
                <div class="info-row">
                    <div class="info-item" v-if="taskInfo.title">
                        <span class="label">任务标题：</span>
                        <span class="content">{{ taskInfo.title }}</span>
                    </div>
                    <div class="info-item" v-if="taskInfo.type">
                        <span class="label">任务类型：</span>
                        <el-tag :type="getTaskTypeTag(taskInfo.type)">{{ taskInfo.type }}</el-tag>
                    </div>
                    <div class="info-item" v-if="computedTaskStatus">
                        <span class="label">任务状态：</span>
                        <el-tag :type="getTaskStatusTag(computedTaskStatus)">{{ computedTaskStatus }}</el-tag>
                    </div>
                </div>
                <div class="info-row">
                    <div class="info-item" v-if="taskInfo.startTime">
                        <span class="label">开始时间：</span>
                        <span class="content">{{ formatDate(taskInfo.startTime) }}</span>
                    </div>
                    <div class="info-item" v-if="taskInfo.endTime">
                        <span class="label">结束时间：</span>
                        <span class="content">{{ formatDate(taskInfo.endTime) }}</span>
                    </div>
                    <div class="info-item" v-if="taskInfo.createTime">
                        <span class="label">发布时间：</span>
                        <span class="content">{{ formatDate(taskInfo.createTime) }}</span>
                    </div>
                </div>
            </div>

            <!-- 品牌合作信息 -->
            <div class="section-title"
                v-if="taskInfo.cooperationDetails && (taskInfo.cooperationDetails.brandName || taskInfo.cooperationDetails.productName)">
                品牌合作信息</div>
            <div class="info-section"
                v-if="taskInfo.cooperationDetails && (taskInfo.cooperationDetails.brandName || taskInfo.cooperationDetails.productName)">
                <div class="info-row">
                    <div class="info-item" v-if="taskInfo.cooperationDetails && taskInfo.cooperationDetails.brandName">
                        <span class="label">品牌名称：</span>
                        <span class="content">{{ taskInfo.cooperationDetails.brandName }}</span>
                    </div>
                    <div class="info-item"
                        v-if="taskInfo.cooperationDetails && taskInfo.cooperationDetails.productName">
                        <span class="label">产品名称：</span>
                        <span class="content">{{ taskInfo.cooperationDetails.productName }}</span>
                    </div>
                </div>
            </div>

            <!-- 合作要求 -->
            <div class="section-title">合作要求</div>
            <div class="info-section">
                <div class="info-row">
                    <div class="info-item">
                        <span class="label">合作平台：</span>
                        <template
                            v-if="taskInfo.cooperationDetails && taskInfo.cooperationDetails.requirements && taskInfo.cooperationDetails.requirements.platformType">
                            <el-tag v-for="platform in taskInfo.cooperationDetails.requirements.platformType"
                                :key="platform" style="margin-right: 5px">
                                {{ platform }}
                            </el-tag>
                        </template>
                    </div>
                    <div class="info-item">
                        <span class="label">内容形式：</span>
                        <template
                            v-if="taskInfo.cooperationDetails && taskInfo.cooperationDetails.requirements && taskInfo.cooperationDetails.requirements.contentType">
                            <el-tag v-for="content in taskInfo.cooperationDetails.requirements.contentType"
                                :key="content" type="success" style="margin-right: 5px">
                                {{ content }}
                            </el-tag>
                        </template>
                    </div>
                </div>
                <div class="info-row">
                    <div class="info-item full-width">
                        <span class="label">达人要求：</span>
                        <div class="requirement-list"
                            v-if="taskInfo.cooperationDetails && taskInfo.cooperationDetails.requirements && taskInfo.cooperationDetails.requirements.expertRequirements">
                            <div class="requirement-item"
                                v-if="taskInfo.cooperationDetails.requirements.expertRequirements.fansCountMin">
                                <i class="el-icon-user"></i> 粉丝数：{{
                                    formatNumber(taskInfo.cooperationDetails.requirements.expertRequirements.fansCountMin)
                                }} - {{
                                    formatNumber(taskInfo.cooperationDetails.requirements.expertRequirements.fansCountMax)
                                }}
                            </div>
                            <div class="requirement-item"
                                v-if="taskInfo.cooperationDetails.requirements.expertRequirements.expertCategory && taskInfo.cooperationDetails.requirements.expertRequirements.expertCategory.length">
                                <i class="el-icon-collection-tag"></i> 达人类目：
                                <el-tag
                                    v-for="category in taskInfo.cooperationDetails.requirements.expertRequirements.expertCategory"
                                    :key="category" size="small" type="warning" style="margin-right: 5px">
                                    {{ category }}
                                </el-tag>
                            </div>
                            <div class="requirement-item"
                                v-if="taskInfo.cooperationDetails.requirements.expertRequirements.otherRequirements">
                                <i class="el-icon-info"></i> 其他要求：{{
                                    taskInfo.cooperationDetails.requirements.expertRequirements.otherRequirements }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 任务描述 -->
            <div class="section-title">任务描述</div>
            <div class="task-description">
                {{ taskInfo.description || '暂无描述' }}
            </div>

            <!-- KPI目标信息 -->
            <div class="section-title" v-if="hasKpiTargets">KPI目标</div>
            <div class="info-section" v-if="hasKpiTargets">
                <div class="info-row">
                    <div class="info-item" v-if="getKpiTarget('viewsTarget')">
                        <span class="label">播放量目标：</span>
                        <span class="content">{{ formatNumber(getKpiTarget('viewsTarget')) }}</span>
                    </div>
                    <div class="info-item" v-if="getKpiTarget('interactionTarget')">
                        <span class="label">互动量目标：</span>
                        <span class="content">{{ formatNumber(getKpiTarget('interactionTarget')) }}</span>
                    </div>
                    <div class="info-item" v-if="getKpiTarget('salesTarget')">
                        <span class="label">销售目标：</span>
                        <span class="content">{{ formatNumber(getKpiTarget('salesTarget')) }}</span>
                    </div>
                </div>
            </div>

            <!-- 商务条款信息 -->
            <div class="section-title" v-if="hasCommercialTerms">商务条款</div>
            <div class="info-section" v-if="hasCommercialTerms">
                <div class="info-row">
                    <div class="info-item" v-if="getCommercialTerm('budget')">
                        <span class="label">达人预算：</span>
                        <span class="content">{{ getCommercialTerm('budget') }}元</span>
                    </div>
                </div>
            </div>

            <!-- 备注信息 -->
            <div class="section-title">备注信息</div>
            <div class="info-section">
                <div v-if="taskInfo.cooperationDetails && taskInfo.cooperationDetails.remarks && taskInfo.cooperationDetails.remarks.length"
                    class="remarks-list">
                    <el-table :data="taskInfo.cooperationDetails.remarks" border size="small">
                        <el-table-column label="备注名称" prop="name"></el-table-column>
                        <el-table-column label="备注类型" prop="type">
                            <template slot-scope="scope">
                                <el-tag size="small">{{ scope.row.type }}</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label="备注链接" min-width="200">
                            <template slot-scope="scope">
                                <el-link type="primary" :href="scope.row.url" target="_blank">{{ scope.row.url
                                    }}</el-link>
                            </template>
                        </el-table-column>
                        <el-table-column label="上传时间" width="160">
                            <template slot-scope="scope">
                                {{ formatDate(scope.row.uploadTime) }}
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
                <div v-else class="empty-remarks">
                    暂无备注信息
                </div>
            </div>
        </el-card>

        <!-- 认领列表 -->
        <el-card class="claim-list">
            <div slot="header">
                <span>任务认领列表</span>
                <el-button style="float: right;margin-left: 10px;" type="warning" size="small"
                    @click="showProgressHistory = !showProgressHistory">
                    {{ showProgressHistory ? '隐藏任务进度历史' : '展开任务进度历史' }}
                </el-button>
                <el-button style="float: right;margin-left: 10px;" type="warning" size="small"
                    @click="showResultDialog = !showResultDialog">
                    {{ showResultDialog ? '隐藏执行结果列表' : '展开执行结果列表' }}
                </el-button>
                <!-- <el-button v-if="isAgent" style="float: right;margin-left: 10px;" type="primary" size="small" @click="handleClaim">
                    认领任务
                </el-button> -->
                <!-- v-if="isAgent" -->
                <el-button v-if="isAgent" style="float: right;margin-left: 10px;" type="success" size="small"
                    @click="handleBatchClaim">
                    认领任务
                </el-button>
            </div>

            <el-table :data="claimList" style="width: 100%" border>
                <el-table-column label="经纪人" prop="agentName" width="120"></el-table-column>
                <el-table-column label="关联达人" prop="expertName" width="120"></el-table-column>
                <el-table-column label="达人账号ID" prop="platformId" width="120"></el-table-column>
                <el-table-column label="任务跟踪员" prop="trackerName" width="120"></el-table-column>
                <el-table-column label="认领状态" width="100" v-if="isAdmin && taskConfig.requireClaimAudit">
                    <template slot-scope="scope">
                        <el-tag :type="getClaimStatusType(scope.row.claimStatus)">{{ scope.row.claimStatus }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="认领时间" width="160">
                    <template slot-scope="scope">
                        {{ formatDate(scope.row.claimTime) }}
                    </template>
                </el-table-column>

                <!-- 任务进度 -->
                <el-table-column label="当前任务进度" width="120">
                    <template slot-scope="scope">
                        <el-tag :type="getProgressStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
                    </template>
                </el-table-column>

                <!-- 最新进度 -->
                <!-- <el-table-column label="最新进度">
                    <template slot-scope="scope">
                        <div v-if="scope.row.progressSteps && scope.row.progressSteps.length">
                            {{ scope.row.progressSteps[scope.row.progressSteps.length - 1].step }}
                            <br>
                            <small style="color: #999">
                                {{ formatDate(scope.row.progressSteps[scope.row.progressSteps.length - 1].updateTime) }}
                            </small>
                        </div>
                    </template>
                </el-table-column> -->

                <!-- 进度列表 -->
                <el-table-column label="进度历史" width="300" v-if="showProgressHistory">
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
                <el-table-column label="执行结果" width="600">
                    <template slot-scope="scope">
                        <template
                            v-if="scope.row.result && scope.row.result.contentList && scope.row.result.contentList.length">
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
                <el-table-column label="操作"
                    :width="isAdmin && taskConfig.requireClaimAudit ? 300 : isTracker ? 300 : 200" fixed="right">
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
                        <template v-if="isAdmin">
                            <el-button size="mini" type="danger" @click="deleteClaim(scope.row)">
                                删除
                            </el-button>
                        </template>

                        <!-- 经纪人操作 -->
                        <template
                            v-if="isAgent && scope.row.agentId._id === currentUserId && checkAgentPermission(scope.row)">
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
        </el-card>

        <!-- 认领任务对话框 -->
        <el-dialog title="认领任务" :visible.sync="claimDialogVisible" append-to-body width="50%">
            <el-form :model="claimForm" :rules="claimRules" ref="claimForm" label-width="100px">
                <el-form-item label="选择达人" prop="expertId">
                    <el-select v-model="claimForm.expertId" filterable placeholder="请选择达人" style="width: 100%">
                        <el-option v-for="expert in expertOptions" :key="expert.value" :label="expert.label"
                            :value="expert.value">
                        </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="认领说明">
                    <el-input type="textarea" v-model="claimForm.remark" rows="3"></el-input>
                </el-form-item>
            </el-form>
            <div slot="footer">
                <el-button @click="claimDialogVisible = false">取 消</el-button>
                <el-button type="primary" @click="submitClaim">确 定</el-button>
            </div>
        </el-dialog>

        <!-- 更新进度对话框 -->
        <task-progress-dialog :visible.sync="progressDialogVisible" :current-claim="currentClaim"
            :status-list="getAvailableStatuses()" @submit="handleProgressSubmit" />

        <!-- 提交结果对话框 -->
        <task-result-dialog :visible.sync="resultDialogVisible" :current-claim="currentClaim" :task-info="taskInfo"
            @submit-success="fetchData" />

        <!-- 添加详情对话框 -->
        <task-claim-details :visible.sync="detailsDialogVisible" :details="currentClaimDetails" />

        <!-- 批量认领任务对话框 -->
        <el-dialog title="批量认领任务" :visible.sync="batchClaimDialogVisible" append-to-body width="90%">
            <el-form :model="batchClaimForm" :rules="batchClaimRules" ref="batchClaimForm" label-width="100px">
                <!-- 达人选择组件 -->
                <expert-database ref="expertSelector" :is-select-mode="true" :multiple="true" :maxSelect="10"
                    :check-selectable="checkExpertSelectable" @selection-change="handleExpertSelectionChange" />

                <el-form-item label="认领说明" style="margin-top: 20px;">
                    <el-input type="textarea" v-model="batchClaimForm.remark" rows="3"></el-input>
                </el-form-item>
            </el-form>
            <div slot="footer">
                <el-button @click="batchClaimDialogVisible = false">取 消</el-button>
                <el-button type="primary" @click="submitBatchClaim">确 定</el-button>
            </div>
        </el-dialog>
    </div>
</template>
<script>
import { getData, addData, updateData, removeData } from "@/api/data";
import { formatDate, formatNumber } from "@/utils/date";
import TaskClaimDetails from './TaskClaimDetails.vue'
import TaskResultDialog from './TaskResultDialog.vue'
import TaskProgressDialog from './TaskProgressDialog.vue'
import ExpertDatabase from '@/views/expertDatabase/index.vue'

export default {
    dicts: ['broker_task_progress', 'tracker_task_progress', 'task_progress'],
    name: 'TaskClaim',
    components: {
        TaskClaimDetails,
        TaskResultDialog,
        TaskProgressDialog,
        ExpertDatabase
    },
    props: {
        taskId: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            // 用户信息
            currentUserId: '',
            isAdmin: false,
            isAgent: false,
            isTracker: false,
            // 任务信息
            taskInfo: {},
            claimList: [],

            // 达人选项
            expertOptions: [],

            // 认领对话框
            claimDialogVisible: false,
            claimForm: {
                expertId: '',
                trackerId: '',
                remark: ''
            },
            claimRules: {
                expertId: [
                    { required: true, message: '请选择达人', trigger: 'change' }
                ],
                trackerId: [
                    { required: true, message: '请选择任务跟踪员', trigger: 'change' }
                ]
            },

            // 进度历史
            showProgressHistory: false,
            // 执行结果列表
            showResultDialog: false,

            // 进度对框
            progressDialogVisible: false,
            progressForm: {
                status: '',
                trackerId: '',
                step: '',
                remark: '',
                trackingInfo: {
                    buildConnectionSource: '',
                    cooperationDate: null,
                    receiveTime: null,
                    estimatedPublishTime: null,
                    actualPublishTime: null,
                    adCode: ''
                }
            },
            progressRules: {
                status: [{ required: true, message: '请选择进度状态', trigger: 'change' }],
                // step: [{ required: true, message: '请输入进度说明', trigger: 'blur' }]
            },

            // 结果对话框
            resultDialogVisible: false,
            currentClaim: null,

            // 添加详情对话框
            detailsDialogVisible: false,
            currentClaimDetails: {},

            // 任务跟踪员选项
            trackerOptions: [],

            statusList: [
                // '未开始',
                // '沟通中',
                // '合作成功',
                // '寄送样品',
                // '样品跟踪',
                // '已收货',
                // '内容制作中',
                // '作品已发布',
                // '数据统计中',
                // '已完成',
                // '已取消'
            ],

            // 添加配置项
            taskConfig: {
                requireClaimAudit: false, // 是否需要认领审核
            },

            // 批量认领相关
            batchClaimDialogVisible: false,
            batchClaimForm: {
                experts: [],
                remark: ''
            },
            batchClaimRules: {
                experts: [
                    { required: true, message: '请选择至少一个达人', trigger: 'change' }
                ]
            }
        };
    },
    created() {
        this.getCurrentUser();
        this.fetchData();
        this.loadTrackerOptions();
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
        // 删除认领
        async deleteClaim(row) {
            await updateData("taskClaim", { query: { _id: row._id }, update: { isDeleted: true } });
            this.fetchData();
        },
        // 获取当前用户信息
        async getCurrentUser() {
            try {
                console.log('this.$store.getters.roles: ', this.$store.getters);
                this.isAdmin = this.$store.getters.roles.label.includes('Admin');
                this.isAgent = this.$store.getters.roles.label.includes('Agent') || this.$store.getters.roles.label.includes('Admin');
                this.isTracker = this.$store.getters.roles.label.includes('Tracker') || this.$store.getters.roles.label.includes('Admin');
                // this.isAgent = this.$store.getters.roles.label.includes('Admin');
                this.currentUserId = this.$store.getters.id;
            } catch (error) {
                console.error('获取用户信息失败:', error);
            }
        },

        // 获取数据
        async fetchData() {
            try {
                // 获取任务信息
                const taskResult = await getData("task", {
                    query: { _id: this.taskId }
                });
                this.taskInfo = taskResult.data[0];
                console.log("🚀 ~ fetchData ~  this.taskInfo:", this.taskInfo)

                // 获取认领列表
                let taskClaimQuery = { taskId: this.taskId, isDeleted: false };
                if (!this.isAdmin) {
                    if (this.isAgent) {
                        taskClaimQuery.agentId = this.$store.state.user.id;
                    }
                    if (this.isTracker) {
                        taskClaimQuery.trackerId = this.$store.state.user.id;
                    }
                }

                const claimResult = await getData("taskClaim", {
                    query: taskClaimQuery,
                    populate: JSON.stringify([
                        { path: 'agentId' },
                        { path: 'expertId' },
                        { path: 'trackerId' }
                    ])
                });
                this.claimList = claimResult.data.map(claim => ({
                    ...claim,
                    agentName: claim.agentId.nickName,
                    expertName: claim.expertId.nickname,
                    platformId: claim.expertId.platformId,
                    trackerName: claim.trackerId && claim.trackerId.nickName ? claim.trackerId.nickName : '未指定'
                }));
            } catch (error) {
                console.error('获取数据失败:', error);
                this.$message.error('获取数据失败');
            }
        },

        // 加载达人选项
        async loadExpertOptions() {
            try {
                const result = await getData("expert", {
                    query: {}
                });
                this.expertOptions = result.data.map(expert => ({
                    value: expert._id,
                    label: `${expert.name}(${expert.platformName})`
                }));
            } catch (error) {
                console.error('获取达人列表失败:', error);
                this.$message.error('获取达人列表失败');
            }
        },

        // 加载任务跟踪员选项
        async loadTrackerOptions() {
            try {
                const result = await getData("user_login", {
                    query: {
                        role: '6734de3a55647e147063f158'
                    }

                });
                console.log('任务跟踪员: ', result);
                this.trackerOptions = result.data.map(user => ({
                    value: user._id,
                    label: user.nickName || user.username
                }));
            } catch (error) {
                console.error('获取任务跟踪员列表失败:', error);
                this.$message.error('获取任务跟踪员列表失败');
            }
        },

        // 认领任务
        handleClaim() {
            this.loadExpertOptions();
            this.claimForm = {
                expertId: '',
                remark: ''
            };
            this.claimDialogVisible = true;
        },

        // 提交认领
        async submitClaim() {
            try {
                this.$refs.claimForm.validate(async valid => {
                    if (valid) {
                        await addData("taskClaim", {
                            taskId: this.taskId,
                            agentId: this.currentUserId,
                            expertId: this.claimForm.expertId,
                            // 根据配置决定初始状态
                            claimStatus: this.taskConfig.requireClaimAudit ? '待审核' : '已通过',
                            remark: this.claimForm.remark
                        });

                        // 根据配置显示不同的提示信息
                        this.$message.success(
                            this.taskConfig.requireClaimAudit
                                ? '认领成功，请等待审核'
                                : '认领成功'
                        );

                        this.claimDialogVisible = false;
                        this.fetchData();
                    }
                });
            } catch (error) {
                console.error('认领失败:', error);
                this.$message.error('认领失败');
            }
        },

        // 审核处理
        async handleAudit(row, status) {
            try {
                await updateData("taskClaim", {
                    query: { _id: row._id },
                    update: {
                        claimStatus: status,
                        auditTime: new Date(),
                        auditRemark: status === '已拒绝' ? '不符合要求' : '符合要求'
                    }
                });
                this.$message.success('审核完成');
                this.fetchData();
            } catch (error) {
                this.$message.error('审核失');
            }
        },

        // 更新进度
        handleUpdateProgress(row) {
            this.currentClaim = row;
            this.progressForm = {
                status: row.status || '',
                trackerId: row.trackerId || '',
                step: '',
                remark: '',
                trackingInfo: {
                    buildConnectionSource: '',
                    cooperationDate: null,
                    receiveTime: null,
                    estimatedPublishTime: null,
                    actualPublishTime: null,
                    adCode: ''
                }
            };

            if (row.progressSteps && row.progressSteps.length > 0) {
                const lastProgress = row.progressSteps[row.progressSteps.length - 1];
                if (lastProgress.trackingInfo) {
                    this.progressForm.trackingInfo = {
                        buildConnectionSource: lastProgress.trackingInfo.buildConnectionSource || '',
                        cooperationDate: lastProgress.trackingInfo.cooperationDate || null,
                        receiveTime: lastProgress.trackingInfo.receiveTime || null,
                        estimatedPublishTime: lastProgress.trackingInfo.estimatedPublishTime || null,
                        actualPublishTime: lastProgress.trackingInfo.actualPublishTime || null,
                        adCode: lastProgress.trackingInfo.adCode || ''
                    };
                }
            }

            this.progressDialogVisible = true;
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
                            updatedBy: this.$store.state.user.userId, // 假设使用vuex管理用户状态
                            remark: formData.remark,
                            trackingInfo: formData.trackingInfo
                        }
                    }
                }
                console.log(this.taskInfo, 'this.taskInfo');

                // 如果是合作成功状态，更新跟踪员
                if (formData.status === '合作成功') {
                    updateObj.trackerId = formData.trackerId
                    // 创建跟踪员指派消息
                    console.log(this.currentClaim, 'this.currentClaim');
                    console.log(this.taskInfo, 'this.taskInfo');
                    await addData('messageLog', {
                        title: '跟踪员指派通知',
                        content: `任务【${this.taskInfo.title}】已指派跟踪员`,
                        type: 'TRACKER_ASSIGNED',
                        taskId: this.currentClaim.taskId,
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
                            },
                            {
                                userId: this.taskInfo.createBy,
                                role: 'ADMIN',
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

                // 创建进度更新消息
                // 创建进度更新消息
                await addData('messageLog', {
                    title: '任务进度更新',
                    content: `任务【${this.taskInfo.title}】的进度已更新为：${formData.status}`,
                    type: 'TASK_PROGRESS',
                    taskId: this.currentClaim.taskId,
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
                        },
                        {
                            userId: this.taskInfo.createBy,
                            role: 'ADMIN',
                            isRead: false
                        }
                    ],
                    isSystem: false
                });

                this.$message.success('进度更新成功')
                this.fetchData() // 刷新列表数据
            } catch (error) {
                console.error('进度更新失败:', error)
                this.$message.error('进度更新失败')
            }
        },

        // 处理提交结果按钮点击
        handleSubmitResult(row) {
            this.currentClaim = row;
            this.resultDialogVisible = true;
        },

        // 查看详情
        handleViewDetails(row) {
            this.currentClaimDetails = {
                ...row,
                result: row.result ? {
                    ...row.result,
                    performanceData: {
                        views: 0,
                        likes: 0,
                        comments: 0,
                        shares: 0,
                        gmv: 0,
                        ...(row.result.performanceData || {})
                    }
                } : null
            };
            this.detailsDialogVisible = true;
        },

        // 工具方法
        formatDate(date) {
            return date ? formatDate(new Date(date), 'yyyy-MM-dd HH:mm') : '';
        },

        getClaimStatusType(status) {
            const typeMap = {
                '待审核': 'warning',
                '已通过': 'success',
                '已拒绝': 'danger'
            };
            return typeMap[status] || 'info';
        },

        getProgressStatusType(status) {
            const typeMap = {
                // 初始态
                '未开始': 'info',

                // 沟通阶段
                '沟通中': 'warning',
                '合作成功': 'success',

                // 执行阶段
                '寄送样品': 'primary',
                '样品跟踪': 'primary',
                '已收货': 'success',
                '内容制作中': 'primary',
                '作品已发布': 'success',
                '数据统计中': 'warning',

                // 结束状态
                '已完成': 'success',
                '已取消': 'danger',
                '合作失败': 'danger'
            };
            return typeMap[status] || 'info'; // 默认返回 info 类型
        },

        getTaskTypeTag(type) {
            const typeMap = {
                '品牌宣传': 'primary',
                '达人推广': 'success',
                '达人直播': 'warning',
                '达人视': 'danger',
                '直播带货': 'info'
            };
            return typeMap[type] || 'info';
        },

        getTaskStatusTag(status) {
            const statusMap = {
                '进行中': 'success',
                '已结束': 'info',
                '已取消': 'danger',
                '待开始': 'warning'
            };
            return statusMap[status] || 'info';
        },

        formatNumber(num) {
            if (!num && num !== 0) return '0';
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        },

        // 计算总播放量
        calculateTotalViews() {
            if (!this.resultForm || !this.resultForm.contentList) return 0;
            return this.resultForm.contentList.reduce(function (sum, content) {
                var views = content && content.performanceData && content.performanceData.views || 0;
                return sum + views;
            }, 0);
        },

        // 计算总点赞数
        calculateTotalLikes() {
            if (!this.resultForm || !this.resultForm.contentList) return 0;
            return this.resultForm.contentList.reduce(function (sum, content) {
                var likes = content && content.performanceData && content.performanceData.likes || 0;
                return sum + likes;
            }, 0);
        },

        // 计算总评论数
        calculateTotalComments() {
            if (!this.resultForm || !this.resultForm.contentList) return 0;
            return this.resultForm.contentList.reduce(function (sum, content) {
                var comments = content && content.performanceData && content.performanceData.comments || 0;
                return sum + comments;
            }, 0);
        },

        // 计算总分享数
        calculateTotalShares() {
            if (!this.resultForm || !this.resultForm.contentList) return 0;
            return this.resultForm.contentList.reduce(function (sum, content) {
                var shares = content && content.performanceData && content.performanceData.shares || 0;
                return sum + shares;
            }, 0);
        },

        // 计算总GMV
        calculateTotalGmv() {
            if (!this.resultForm || !this.resultForm.contentList) return 0;
            return this.resultForm.contentList.reduce(function (sum, content) {
                var gmv = content && content.performanceData && content.performanceData.gmv || 0;
                return sum + gmv;
            }, 0);
        },

        // 获取时间线项目类型
        getTimelineItemType(status) {
            const typeMap = {
                '未开始': 'info',
                '沟通中': 'warning',
                '执行中': 'primary',
                '已完成': 'success',
                '已取消': 'danger'
            };
            return typeMap[status] || 'info';
        },

        // 获可用状态
        getAvailableStatuses() {
            // 根据业务逻辑返回可用的状态列表
            //TODO 暂时全部放开
            if (this.isAgent) {
                // 经纪人只能更新到"合作成功"
                console.log(this.dict.type.broker_task_progress, 'this.dict.type.broker_task_progress');
                return this.statusList = [...this.dict.type.broker_task_progress, { label: '合作成功', value: '合作成功', type: 'success' }];;
            } else if (this.isTracker) {
                // 任务跟踪员可以更新所有后续状态
                let statusList = [{ label: '合作成功', value: '合作成功', type: 'success' }];
                statusList = [...statusList, ...this.dict.type.tracker_task_progress];;
                return this.statusList = statusList;
            }
            return this.statusList;
        },

        // 开进度更新对话框
        openProgressDialog(claim) {
            this.currentClaim = claim
            this.progressDialogVisible = true
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

        // 打开批量认领对话框
        handleBatchClaim() {
            this.batchClaimForm = {
                experts: [],
                remark: ''
            }
            this.batchClaimDialogVisible = true
        },

        // 处理达人选择变化
        handleExpertSelectionChange(selection) {
            this.batchClaimForm.experts = selection;
        },

        // 检查达人是否已认领任务
        async checkExpertClaimed(expertId) {
            try {
                const result = await getData("taskClaim", {
                    query: {
                        taskId: this.taskId,
                        expertId: expertId,
                        isDeleted: false
                    }
                });
                return result.data.length > 0;
            } catch (error) {
                console.error('检查达人认领状态失败:', error);
                return false;
            }
        },

        // 修改提交批量认领方法
        async submitBatchClaim() {
            try {
                if (!this.batchClaimForm.experts.length) {
                    this.$message.warning('请选择至少一个达人');
                    return;
                }

                // 检查所选达人是否已认领
                const claimedExperts = [];
                const claimPromises = [];

                for (const expert of this.batchClaimForm.experts) {
                    const isClaimed = await this.checkExpertClaimed(expert._id);
                    if (isClaimed) {
                        claimedExperts.push(expert.name || expert.nickname);
                    } else {
                        const claim = {
                            taskId: this.taskId,
                            agentId: this.currentUserId,
                            expertId: expert._id,
                            claimStatus: this.taskConfig.requireClaimAudit ? '待审核' : '已通过',
                            remark: this.batchClaimForm.remark
                        };
                        claimPromises.push(addData("taskClaim", claim));
                    }
                }

                // 如果有已认领的达人，显示提示
                if (claimedExperts.length > 0) {
                    this.$message.warning(`以下达人已认领过该任务: ${claimedExperts.join(', ')}`);
                    if (claimPromises.length === 0) {
                        return; // 如果所有达人都已认领，直接返回
                    }
                }

                // 提交未认领达人的认领请求
                await Promise.all(claimPromises);

                this.$message.success(
                    this.taskConfig.requireClaimAudit
                        ? '批量认领成功，请等待审核'
                        : '批量认领成功'
                );

                this.batchClaimDialogVisible = false;
                this.fetchData();
            } catch (error) {
                console.error('批量认领失败:', error);
                this.$message.error('批量认领失败');
            }
        },

        // 修改达人选择组件的可选判断
        checkExpertSelectable(expert) {
            return !this.claimList.some(claim => claim.expertId._id === expert._id);
        },

        // 获取KPI目标值
        getKpiTarget(field) {
            if (!this.taskInfo.cooperationDetails || !this.taskInfo.cooperationDetails.kpiTargets) {
                return null;
            }
            return this.taskInfo.cooperationDetails.kpiTargets[field];
        },

        // 获取商务条款值
        getCommercialTerm(field) {
            if (!this.taskInfo.cooperationDetails || !this.taskInfo.cooperationDetails.commercialTerms) {
                return null;
            }
            return this.taskInfo.cooperationDetails.commercialTerms[field];
        }
    },
    computed: {
        // 是否显示跟踪信息
        showTrackingInfo() {
            // 以下状态需要显示跟踪信息
            const trackingInfoStatuses = [
                '合作成功',
                '寄送样品',
                '样品跟踪',
                '已收货',
                '内容制作中',
                '作品已发布'
            ];
            return trackingInfoStatuses.includes(this.progressForm.status);
        },

        // 判断当前用户是否为经纪人
        // isAgent() {
        //     console.log(this.userInfo.roles, 'this.userInfo.roles')
        //     return this.userInfo.roles.some(role => role.label === 'Agent');
        // },

        // // 判断当前用户是否为任务跟踪员
        // isTracker() {
        //     return this.userInfo.roles.some(role => role.label === 'TaskTracker');
        // },

        // 计算任务状态
        computedTaskStatus() {
            if (!this.taskInfo.startTime || !this.taskInfo.endTime) {
                return '未知';
            }

            const now = new Date().getTime();
            const startTime = new Date(this.taskInfo.startTime).getTime();
            const endTime = new Date(this.taskInfo.endTime).getTime();

            if (now < startTime) {
                return '待开始';
            } else if (now >= startTime && now <= endTime) {
                return '进行中';
            } else if (now > endTime) {
                return '已结束';
            }

            // 如果任务被手动取消,则保持取消状态
            if (this.taskInfo.status === '已取消') {
                return '已取消';
            }

            return '未知';
        },

        // 检查是否有KPI目标
        hasKpiTargets() {
            return this.taskInfo.cooperationDetails
                && this.taskInfo.cooperationDetails.kpiTargets
                && (this.taskInfo.cooperationDetails.kpiTargets.viewsTarget
                    || this.taskInfo.cooperationDetails.kpiTargets.interactionTarget
                    || this.taskInfo.cooperationDetails.kpiTargets.salesTarget);
        },

        // 检查是否有商务条款
        hasCommercialTerms() {
            return this.taskInfo.cooperationDetails
                && this.taskInfo.cooperationDetails.commercialTerms
                && this.taskInfo.cooperationDetails.commercialTerms.budget;
        }
    }
};
</script>
<style lang="scss">
.task-claim {
    .task-info {
        margin-bottom: 20px;

        .section-title {
            font-size: 16px;
            font-weight: 500;
            color: #303133;
            margin: 20px 0 15px;
            padding-left: 10px;
            border-left: 4px solid #409EFF;
        }

        .info-section {
            border: 1px solid #EBEEF5;
            border-radius: 4px;
            margin-bottom: 15px;
        }

        .info-row {
            display: flex;
            border-bottom: 1px solid #EBEEF5;

            &:last-child {
                border-bottom: none;
            }
        }

        .info-item {
            flex: 1;
            padding: 12px 15px;
            border-right: 1px solid #EBEEF5;
            display: flex;
            align-items: center;

            &:last-child {
                border-right: none;
            }

            &.full-width {
                flex: 0 0 100%;
            }

            .label {
                color: #606266;
                margin-right: 8px;
                min-width: 70px;
            }

            .content {
                color: #303133;
            }
        }

        .price {
            color: #F56C6C;
            font-weight: bold;
            font-size: 16px;
        }

        .requirement-list {
            flex: 1;
        }

        .requirement-item {
            margin: 8px 0;
            display: flex;
            align-items: center;

            i {
                margin-right: 8px;
                font-size: 16px;
                color: #909399;
            }

            .el-tag {
                margin: 0 4px;
            }
        }

        .task-description {
            padding: 15px;
            background: #f8f9fa;
            border-radius: 4px;
            color: #606266;
            line-height: 1.6;
            white-space: pre-wrap;
            min-height: 100px;
        }

        .el-tag {
            margin: 2px 4px;
        }
    }

    .claim-list {
        .el-table {
            margin-top: 15px;
        }

        .content-link-item {
            margin-bottom: 10px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 4px;

            &:last-child {
                margin-bottom: 0;
            }
        }

        .el-tag {
            margin: 2px 4px;
        }

        .small-text {
            font-size: 12px;
            color: #909399;
        }
    }

    // 对话框样式
    ::v-deep .el-dialog {
        .el-dialog__body {
            padding: 20px 30px;
        }

        .el-form-item {
            margin-bottom: 22px;
        }

        .el-select {
            width: 100%;
        }

        .el-input-number {
            width: 100%;
        }
    }

    // 进度信息样式
    .progress-info {
        padding: 5px 0;

        .time {
            font-size: 12px;
            color: #909399;
            margin-top: 4px;
        }
    }

    // 结果表单样式
    .result-form {
        .metrics-group {
            border: 1px solid #EBEEF5;
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 15px;
        }
    }

    .remarks-list {
        padding: 10px;
    }

    .empty-remarks {
        text-align: center;
        color: #909399;
        padding: 20px;
    }

    .el-link {
        word-break: break-all;
    }

    // 添加新的样式
    .info-section {
        .info-row {
            .info-item {
                .content {
                    &.highlight {
                        color: #409EFF;
                        font-weight: bold;
                    }
                }
            }
        }
    }

    .claim-details {
        padding: 0 20px;

        .detail-section {
            margin-bottom: 30px;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
            overflow: hidden;

            &:last-child {
                margin-bottom: 0;
            }

            .section-title {
                font-size: 16px;
                font-weight: 500;
                color: #303133;
                padding: 15px 20px;
                border-bottom: 1px solid #EBEEF5;
                background: #fafafa;
            }

            .info-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 15px;
                padding: 20px;

                .info-item {
                    background: #f8f9fa;
                    border-radius: 6px;
                    padding: 15px;

                    &.full-width {
                        grid-column: 1 / -1;
                    }

                    .info-label {
                        color: #909399;
                        font-size: 13px;
                        margin-bottom: 8px;
                    }

                    .info-content {
                        color: #303133;
                        font-size: 14px;
                        line-height: 1.4;
                    }
                }
            }

            .progress-timeline {
                padding: 20px;

                .el-timeline-item {
                    .progress-item {
                        background: #fff;
                        padding: 12px 15px;
                        border-radius: 6px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

                        .progress-header {
                            display: flex;
                            align-items: center;
                            margin-bottom: 8px;

                            .progress-step {
                                margin-left: 10px;
                                color: #303133;
                                font-weight: 500;
                            }
                        }

                        .progress-remark {
                            color: #909399;
                            font-size: 13px;
                            background: #f8f9fa;
                            padding: 8px 12px;
                            border-radius: 4px;
                            margin-top: 8px;
                        }
                    }
                }
            }

            .result-section {
                padding: 20px;

                .sub-title {
                    font-size: 14px;
                    color: #606266;
                    margin-bottom: 15px;
                    font-weight: 500;
                }

                .data-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                    margin-top: 20px;

                    .data-item {
                        background: #fff;
                        border-radius: 8px;
                        padding: 20px;
                        text-align: center;
                        transition: all 0.3s;
                        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

                        &:hover {
                            transform: translateY(-2px);
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        }

                        i {
                            font-size: 24px;
                            color: #409EFF;
                            margin-bottom: 10px;
                        }

                        .data-label {
                            color: #909399;
                            font-size: 14px;
                            margin-bottom: 8px;
                        }

                        .data-value {
                            font-size: 24px;
                            color: #303133;
                            font-weight: bold;
                        }
                    }
                }

                .el-table {
                    margin-bottom: 20px;
                }
            }
        }
    }

    // 对话框样式优化
    ::v-deep .el-dialog {
        border-radius: 8px;

        .el-dialog__header {
            padding: 20px;
            border-bottom: 1px solid #EBEEF5;

            .el-dialog__title {
                font-size: 18px;
                font-weight: 500;
            }
        }

        .el-dialog__body {
            padding: 20px 0;
        }

        .el-timeline-item__node {
            background-color: #409EFF;
        }

        .el-table {
            border-radius: 4px;
        }
    }
}

.claim-details-dialog {
    border-radius: 8px;
    overflow: hidden;

    .el-dialog__header {
        padding: 20px;
        border-bottom: 1px solid #EBEEF5;
        background: #fff;
        margin: 0;

        .el-dialog__title {
            font-size: 18px;
            font-weight: 500;
            color: #303133;
        }
    }

    .el-dialog__body {
        padding: 0;
        background: #f5f7fa;
    }

    .el-dialog__headerbtn {
        top: 20px;
    }
}

.claim-details {
    padding: 20px;

    .detail-section {
        margin-bottom: 20px;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
        overflow: hidden;

        &:last-child {
            margin-bottom: 0;
        }

        .section-title {
            font-size: 16px;
            font-weight: 500;
            color: #303133;
            padding: 15px 20px;
            border-bottom: 1px solid #EBEEF5;
            background: #fafafa;
        }

        .info-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            padding: 20px;

            .info-item {
                background: #f8f9fa;
                border-radius: 6px;
                padding: 15px;

                &.full-width {
                    grid-column: 1 / -1;
                }

                .info-label {
                    color: #909399;
                    font-size: 13px;
                    margin-bottom: 8px;
                }

                .info-content {
                    color: #303133;
                    font-size: 14px;
                    line-height: 1.4;
                }
            }
        }

        .progress-timeline {
            padding: 20px;

            .el-timeline-item {
                .progress-item {
                    background: #fff;
                    padding: 12px 15px;
                    border-radius: 6px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

                    .progress-header {
                        display: flex;
                        align-items: center;
                        margin-bottom: 8px;

                        .progress-step {
                            margin-left: 10px;
                            color: #303133;
                            font-weight: 500;
                        }
                    }

                    .progress-remark {
                        color: #909399;
                        font-size: 13px;
                        background: #f8f9fa;
                        padding: 8px 12px;
                        border-radius: 4px;
                        margin-top: 8px;
                    }
                }
            }
        }

        .result-section {
            padding: 20px;

            .sub-title {
                font-size: 14px;
                color: #606266;
                margin-bottom: 15px;
                font-weight: 500;
            }

            .data-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
                margin-top: 20px;

                .data-item {
                    background: #fff;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    transition: all 0.3s;
                    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

                    &:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    }

                    i {
                        font-size: 24px;
                        color: #409EFF;
                        margin-bottom: 10px;
                    }

                    .data-label {
                        color: #909399;
                        font-size: 14px;
                        margin-bottom: 8px;
                    }

                    .data-value {
                        font-size: 24px;
                        color: #303133;
                        font-weight: bold;
                    }
                }
            }

            .el-table {
                margin-bottom: 20px;
            }
        }
    }
}

/* 提交结果对话框样式 */
.result-dialog {
    .el-dialog__body {
        padding: 20px 30px;
    }

    .form-section {
        margin-bottom: 30px;

        .section-title {
            font-size: 16px;
            font-weight: 500;
            color: #303133;
            margin-bottom: 20px;
            display: flex;
            align-items: center;

            i {
                margin-right: 8px;
                font-size: 18px;
                color: #409EFF;
            }
        }
    }

    .content-list {
        .content-item {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;

            .content-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;

                .content-index {
                    font-size: 16px;
                    font-weight: 500;
                    color: #303133;
                }
            }

            .performance-data {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #EBEEF5;

                .sub-title {
                    font-size: 14px;
                    color: #606266;
                    margin-bottom: 15px;
                }
            }
        }
    }

    .total-performance {
        .data-card {
            background: #fff;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 12px 0 rgba(0, 0, 0, .1);
            display: flex;
            align-items: center;

            .data-icon {
                width: 48px;
                height: 48px;
                border-radius: 8px;
                background: #ecf5ff;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 15px;

                i {
                    font-size: 24px;
                    color: #409EFF;
                }
            }

            .data-content {
                .data-label {
                    font-size: 14px;
                    color: #909399;
                    margin-bottom: 8px;
                }

                .data-value {
                    font-size: 24px;
                    color: #303133;
                    font-weight: 500;
                }
            }
        }
    }

    .add-content-btn {
        text-align: center;
        margin-top: 20px;
    }
}

.result-summary {
    margin-bottom: 10px;
    padding: 8px;
    background: #f5f7fa;
    border-radius: 4px;

    .result-data-item {
        margin-bottom: 4px;
        font-size: 12px;
        display: flex;
        justify-content: space-between;

        &:last-child {
            margin-bottom: 0;
        }

        .label {
            color: #909399;
        }

        .value {
            color: #303133;
            font-weight: 500;

            &.highlight {
                color: #F56C6C;
            }
        }
    }
}

.content-list {
    margin-top: 10px;

    .content-data {
        font-size: 12px;
        line-height: 1.4;

        >div {
            margin-bottom: 2px;

            &:last-child {
                margin-bottom: 0;
                color: #F56C6C;
                font-weight: 500;
            }
        }
    }
}

// 嵌套表格样式优化
.el-table {
    .el-table {
        margin: 5px 0;

        &.el-table--mini {
            font-size: 12px;

            td {
                padding: 4px 0;
            }
        }
    }
}

.progress-item {
    background: #fff;
    padding: 8px 12px;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

    .progress-header {
        display: flex;
        align-items: center;
        margin-bottom: 4px;

        .progress-step {
            margin-left: 8px;
            color: #303133;
            font-size: 13px;
        }
    }

    .progress-remark {
        color: #909399;
        font-size: 12px;
        background: #f8f9fa;
        padding: 4px 8px;
        border-radius: 4px;
        margin-top: 4px;
    }
}

::v-deep .el-timeline {
    padding: 6px 10px;

    .el-timeline-item {
        padding-bottom: 15px;

        &:last-child {
            padding-bottom: 0;
        }

        .el-timeline-item__node {
            width: 8px;
            height: 8px;
        }

        .el-timeline-item__timestamp {
            font-size: 12px;
            color: #909399;
            margin-top: 4px;
        }
    }
}

// 批量认领对话框样式
.batch-claim-dialog {
    .el-dialog__body {
        padding: 20px 30px;
    }

    .expert-selection {
        margin-bottom: 20px;
    }

    .selected-experts {
        margin: 10px 0;

        .expert-tag {
            margin: 5px;
        }
    }
}
</style>