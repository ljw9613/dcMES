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
                    <div class="info-item">
                        <span class="label">任务标题：</span>
                        <span class="content">{{ taskInfo.title }}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">任务类型：</span>
                        <el-tag :type="getTaskTypeTag(taskInfo.type)">{{ taskInfo.type }}</el-tag>
                    </div>
                    <div class="info-item">
                        <span class="label">任务状态：</span>
                        <el-tag :type="getTaskStatusTag(taskInfo.status)">{{ taskInfo.status }}</el-tag>
                    </div>
                </div>
                <div class="info-row">
                    <div class="info-item">
                        <span class="label">开始时间：</span>
                        <span class="content">{{ formatDate(taskInfo.startTime) }}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">结束时间：</span>
                        <span class="content">{{ formatDate(taskInfo.endTime) }}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">发布时间：</span>
                        <span class="content">{{ formatDate(taskInfo.createTime) }}</span>
                    </div>
                </div>
            </div>

            <!-- 品牌合作信息 -->
            <div class="section-title">品牌合作信息</div>
            <div class="info-section">
                <div class="info-row">
                    <div class="info-item">
                        <span class="label">品牌名称：</span>
                        <span class="content">{{ taskInfo.cooperationDetails && taskInfo.cooperationDetails.brandName
                            }}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">产品名称：</span>
                        <span class="content">{{ taskInfo.cooperationDetails && taskInfo.cooperationDetails.productName
                            }}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">预算：</span>
                        <span class="price">¥{{ formatNumber(taskInfo.cooperationDetails &&
                            taskInfo.cooperationDetails.commercialTerms &&
                            taskInfo.cooperationDetails.commercialTerms.budget) }}</span>
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
            <div class="section-title">KPI目标</div>
            <div class="info-section">
                <div class="info-row">
                    <div class="info-item">
                        <span class="label">播放量目标：</span>
                        <span class="content">{{ formatNumber(taskInfo.cooperationDetails &&
                            taskInfo.cooperationDetails.kpiTargets
                            && taskInfo.cooperationDetails.kpiTargets.viewsTarget) }}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">互动量目标：</span>
                        <span class="content">{{ formatNumber(taskInfo.cooperationDetails &&
                            taskInfo.cooperationDetails.kpiTargets
                            && taskInfo.cooperationDetails.kpiTargets.interactionTarget) }}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">销售目标：</span>
                        <span class="content">{{ formatNumber(taskInfo.cooperationDetails &&
                            taskInfo.cooperationDetails.kpiTargets
                            && taskInfo.cooperationDetails.kpiTargets.salesTarget) }}</span>
                    </div>
                </div>
            </div>

            <!-- 商务条款信息 -->
            <div class="section-title">商务条款</div>
            <div class="info-section">
                <div class="info-row">
                    <div class="info-item">
                        <span class="label">佣金比例：</span>
                        <span class="content">{{ taskInfo.cooperationDetails &&
                            taskInfo.cooperationDetails.commercialTerms &&
                            taskInfo.cooperationDetails.commercialTerms.commissionRate }}%</span>
                    </div>
                    <div class="info-item">
                        <span class="label">独家期限：</span>
                        <span class="content">{{ taskInfo.cooperationDetails &&
                            taskInfo.cooperationDetails.commercialTerms &&
                            taskInfo.cooperationDetails.commercialTerms.exclusivityPeriod }} 天</span>
                    </div>
                </div>
            </div>

            <!-- 物料信息 -->
            <div class="section-title">物料信息</div>
            <div class="info-section">
                <div v-if="taskInfo.cooperationDetails && taskInfo.cooperationDetails.materials && taskInfo.cooperationDetails.materials.length"
                    class="materials-list">
                    <el-table :data="taskInfo.cooperationDetails.materials" border size="small">
                        <el-table-column label="物料名称" prop="name"></el-table-column>
                        <el-table-column label="物料类型" prop="type">
                            <template slot-scope="scope">
                                <el-tag size="small">{{ scope.row.type }}</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label="物料链接" min-width="200">
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
                <div v-else class="empty-materials">
                    暂无物料信息
                </div>
            </div>
        </el-card>

        <!-- 认领列表 -->
        <el-card class="claim-list">
            <div slot="header">
                <span>任务认领列表</span>
                <el-button v-if="isAgent" style="float: right" type="primary" size="small" @click="handleClaim">
                    认领任务
                </el-button>
            </div>

            <el-table :data="claimList" style="width: 100%" border>
                <el-table-column label="经纪人" prop="agentName" width="120"></el-table-column>
                <el-table-column label="关联达人" prop="expertName" width="120"></el-table-column>
                <el-table-column label="任务跟踪员" prop="trackerName" width="120"></el-table-column>
                <el-table-column label="认领状态" width="100">
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
                <el-table-column label="任务进度" width="120">
                    <template slot-scope="scope">
                        <el-tag :type="getProgressStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
                    </template>
                </el-table-column>

                <!-- 最新进度 -->
                <el-table-column label="最新进度">
                    <template slot-scope="scope">
                        <div v-if="scope.row.progressSteps && scope.row.progressSteps.length">
                            {{ scope.row.progressSteps[scope.row.progressSteps.length - 1].step }}
                            <br>
                            <small style="color: #999">
                                {{ formatDate(scope.row.progressSteps[scope.row.progressSteps.length - 1].updateTime) }}
                            </small>
                        </div>
                    </template>
                </el-table-column>

                <!-- 操作 -->
                <el-table-column label="操作" width="200" fixed="right">
                    <template slot-scope="scope">
                        <!-- 管理员 -->
                        <template v-if="isAdmin">
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
                        <template v-if="isAgent && scope.row.agentId._id === currentUserId">
                            <el-button size="mini" type="primary" @click="handleUpdateProgress(scope.row)"
                                v-if="scope.row.claimStatus === '已通过'">
                                更新进度
                            </el-button>
                            <el-button size="mini" type="success" @click="handleSubmitResult(scope.row)"
                                v-if="scope.row.status === '数据统计中'">
                                提交结果
                            </el-button>
                            <el-button size="mini" type="info" @click="handleViewDetails(scope.row)">
                                查看详情
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
        <el-dialog title="更新进度" :visible.sync="progressDialogVisible" width="60%" custom-class="progress-dialog"
            append-to-body>
            <el-form :model="progressForm" :rules="progressRules" ref="progressForm" label-width="120px">
                <!-- 进度状态 -->
                <el-form-item label="进度状态" prop="status">
                    <el-select v-model="progressForm.status" style="width: 100%">
                        <el-option v-for="status in getAvailableStatuses()" :key="status" :label="status"
                            :value="status">
                        </el-option>
                    </el-select>
                </el-form-item>

                <!-- 当状态为"合作成功"时显示任务跟踪员选择 -->
                <el-form-item v-if="progressForm.status === '合作成功'" label="任务跟踪员" prop="trackerId"
                    :rules="{ required: true, message: '请选择任务跟踪员', trigger: 'change' }">
                    <el-select v-model="progressForm.trackerId" filterable placeholder="请选择任务跟踪员" style="width: 100%">
                        <el-option v-for="tracker in trackerOptions" :key="tracker.value" :label="tracker.label"
                            :value="tracker.value">
                        </el-option>
                    </el-select>
                </el-form-item>

                <!-- 根据不同状态显示对应的表单字段 -->
                <template v-if="showTrackingInfo">
                    <div class="tracking-info-section">

                        <!-- 建来源 -->
                        <el-form-item v-if="['合作成功'].includes(progressForm.status)" label="建联来源"
                            prop="trackingInfo.buildConnectionSource">
                            <el-input v-model="progressForm.trackingInfo.buildConnectionSource" placeholder="请输入建联来源">
                            </el-input>
                        </el-form-item>

                        <!-- 确定合作日 -->
                        <el-form-item v-if="['合作成功'].includes(progressForm.status)" label="确定合作日"
                            prop="trackingInfo.cooperationDate">
                            <el-date-picker v-model="progressForm.trackingInfo.cooperationDate" type="date"
                                placeholder="选择确定合作日" style="width: 100%">
                            </el-date-picker>
                        </el-form-item>

                        <!-- 收货时间 -->
                        <el-form-item v-if="['已收货'].includes(progressForm.status)" label="收货时间"
                            prop="trackingInfo.receiveTime">
                            <el-date-picker v-model="progressForm.trackingInfo.receiveTime" type="datetime"
                                placeholder="选择收货时间" style="width: 100%">
                            </el-date-picker>
                        </el-form-item>

                        <!-- 预计发布时间 -->
                        <el-form-item v-if="['内容制作中'].includes(progressForm.status)" label="预计发布时间"
                            prop="trackingInfo.estimatedPublishTime">
                            <el-date-picker v-model="progressForm.trackingInfo.estimatedPublishTime" type="datetime"
                                placeholder="选择预计发布时间" style="width: 100%">
                            </el-date-picker>
                        </el-form-item>
                    </div>
                </template>

                <el-form-item label="进度备注" prop="step">
                    <el-input v-model="progressForm.step" placeholder="请输入进度备注"></el-input>
                </el-form-item>

                <!-- <el-form-item label="详细备注">
                    <el-input type="textarea" v-model="progressForm.remark" rows="3"></el-input>
                </el-form-item> -->
            </el-form>
            <div slot="footer">
                <el-button @click="progressDialogVisible = false">取 消</el-button>
                <el-button type="primary" @click="submitProgress">确 定</el-button>
            </div>
        </el-dialog>

        <!-- 提交结果对话框 -->
        <el-dialog title="提交执行结果" :visible.sync="resultDialogVisible" width="70%" custom-class="result-dialog"
            append-to-body>
            <el-form :model="resultForm" :rules="resultRules" ref="resultForm" label-width="100px">
                <!-- 内容列表 -->
                <div class="form-section">
                    <div class="section-title">
                        <i class="el-icon-video-camera"></i>
                        内容列表
                    </div>
                    <div class="content-list">
                        <div v-for="(content, index) in resultForm.contentList" :key="index" class="content-item">
                            <div class="content-header">
                                <span class="content-index">内容 #{{ index + 1 }}</span>
                                <el-button type="danger" icon="el-icon-delete" circle size="mini"
                                    @click="removeContent(index)">
                                </el-button>
                            </div>

                            <!-- 基本信息 -->
                            <el-row :gutter="20">
                                <el-col :span="8">
                                    <el-form-item :label="'平台'" :prop="`contentList.${index}.platform`"
                                        :rules="{ required: true, message: '请选择平台', trigger: 'change' }">
                                        <el-select v-model="content.platform" placeholder="选择平台">
                                            <el-option label="抖音" value="抖音"></el-option>
                                            <el-option label="小红书" value="小红书"></el-option>
                                            <el-option label="B站" value="B站"></el-option>
                                        </el-select>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="8">
                                    <el-form-item :label="'类型'" :prop="`contentList.${index}.type`"
                                        :rules="{ required: true, message: '请选类型', trigger: 'change' }">
                                        <el-select v-model="content.type" placeholder="内容类型">
                                            <el-option label="视频" value="视频"></el-option>
                                            <el-option label="直播" value="直播"></el-option>
                                            <el-option label="图文" value="图文"></el-option>
                                        </el-select>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="8">
                                    <el-form-item :label="'发布时间'" :prop="`contentList.${index}.publishTime`"
                                        :rules="{ required: true, message: '请选择发布时间', trigger: 'change' }">
                                        <el-date-picker v-model="content.publishTime" type="datetime"
                                            placeholder="选择发布时间" style="width: 100%">
                                        </el-date-picker>
                                    </el-form-item>
                                </el-col>
                            </el-row>

                            <!-- 链接信息 -->
                            <el-row :gutter="20">
                                <el-col :span="12">
                                    <el-form-item :label="'内容链接'" :prop="`contentList.${index}.link`"
                                        :rules="{ required: true, message: '请输入内容链接', trigger: 'blur' }">
                                        <el-input v-model="content.link" placeholder="请输入内容链接"></el-input>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="12">
                                    <el-form-item :label="'视频代码'" :prop="`contentList.${index}.videoCode`">
                                        <el-input v-model="content.videoCode" placeholder="请输入视频/直播代码"></el-input>
                                    </el-form-item>
                                </el-col>
                            </el-row>

                            <!-- 效果数据 -->
                            <div class="performance-data">
                                <div class="sub-title">效果数据</div>
                                <el-row :gutter="20">
                                    <el-col :span="6">
                                        <el-form-item :label="'播放量'"
                                            :prop="`contentList.${index}.performanceData.views`">
                                            <el-input-number v-model="content.performanceData.views" :min="0"
                                                controls-position="right">
                                            </el-input-number>
                                        </el-form-item>
                                    </el-col>
                                    <el-col :span="6">
                                        <el-form-item :label="'点赞数'"
                                            :prop="`contentList.${index}.performanceData.likes`">
                                            <el-input-number v-model="content.performanceData.likes" :min="0"
                                                controls-position="right">
                                            </el-input-number>
                                        </el-form-item>
                                    </el-col>
                                    <el-col :span="6">
                                        <el-form-item :label="'评论数'"
                                            :prop="`contentList.${index}.performanceData.comments`">
                                            <el-input-number v-model="content.performanceData.comments" :min="0"
                                                controls-position="right">
                                            </el-input-number>
                                        </el-form-item>
                                    </el-col>
                                    <el-col :span="6">
                                        <el-form-item :label="'分享数'"
                                            :prop="`contentList.${index}.performanceData.shares`">
                                            <el-input-number v-model="content.performanceData.shares" :min="0"
                                                controls-position="right">
                                            </el-input-number>
                                        </el-form-item>
                                    </el-col>
                                </el-row>
                                <el-row>
                                    <el-col :span="12">
                                        <el-form-item :label="'GMV'" :prop="`contentList.${index}.performanceData.gmv`">
                                            <el-input-number v-model="content.performanceData.gmv" :min="0"
                                                :precision="2" controls-position="right">
                                            </el-input-number>
                                        </el-form-item>
                                    </el-col>
                                </el-row>
                            </div>
                        </div>

                        <!-- 添加内容按钮 -->
                        <div class="add-content-btn">
                            <el-button type="primary" plain icon="el-icon-plus" @click="addContent">
                                添加内容
                            </el-button>
                        </div>
                    </div>
                </div>

                <!-- 合计效果数据 -->
                <div class="form-section">
                    <div class="section-title">
                        <i class="el-icon-data-analysis"></i>
                        合计效果数据
                    </div>
                    <div class="total-performance">
                        <el-row :gutter="20">
                            <el-col :span="8">
                                <div class="data-card">
                                    <div class="data-icon">
                                        <i class="el-icon-video-play"></i>
                                    </div>
                                    <div class="data-content">
                                        <div class="data-label">总播放量</div>
                                        <div class="data-value">{{ formatNumber(getTotalViews) }}</div>
                                    </div>
                                </div>
                            </el-col>
                            <el-col :span="8">
                                <div class="data-card">
                                    <div class="data-icon">
                                        <i class="el-icon-star-on"></i>
                                    </div>
                                    <div class="data-content">
                                        <div class="data-label">总点赞数</div>
                                        <div class="data-value">{{ formatNumber(getTotalLikes) }}</div>
                                    </div>
                                </div>
                            </el-col>
                            <el-col :span="8">
                                <div class="data-card">
                                    <div class="data-icon">
                                        <i class="el-icon-chat-dot-round"></i>
                                    </div>
                                    <div class="data-content">
                                        <div class="data-label">总评论数</div>
                                        <div class="data-value">{{ formatNumber(getTotalComments) }}</div>
                                    </div>
                                </div>
                            </el-col>
                        </el-row>
                        <el-row :gutter="20" style="margin-top: 20px;">
                            <el-col :span="8">
                                <div class="data-card">
                                    <div class="data-icon">
                                        <i class="el-icon-share"></i>
                                    </div>
                                    <div class="data-content">
                                        <div class="data-label">总分享数</div>
                                        <div class="data-value">{{ formatNumber(getTotalShares) }}</div>
                                    </div>
                                </div>
                            </el-col>
                            <el-col :span="8">
                                <div class="data-card">
                                    <div class="data-icon">
                                        <i class="el-icon-money"></i>
                                    </div>
                                    <div class="data-content">
                                        <div class="data-label">总GMV</div>
                                        <div class="data-value">¥{{ formatNumber(getTotalGmv) }}</div>
                                    </div>
                                </div>
                            </el-col>
                        </el-row>
                    </div>
                </div>
            </el-form>
            <div slot="footer">
                <el-button @click="resultDialogVisible = false">取 消</el-button>
                <el-button type="primary" @click="submitResult">确 定</el-button>
            </div>
        </el-dialog>

        <!-- 添加详情对话框 -->
        <el-dialog title="任务详情" :visible.sync="detailsDialogVisible" width="70%" :close-on-click-modal="false"
            custom-class="claim-details-dialog" append-to-body>
            <div class="claim-details">
                <!-- 基本信息 -->
                <div class="detail-section">
                    <div class="section-title">基本信息</div>
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">经纪人</div>
                            <div class="info-content">{{ currentClaimDetails.agentName }}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">关联达人</div>
                            <div class="info-content">{{ currentClaimDetails.expertName }}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">认领状态</div>
                            <div class="info-content">
                                <el-tag :type="getClaimStatusType(currentClaimDetails.claimStatus)">
                                    {{ currentClaimDetails.claimStatus }}
                                </el-tag>
                            </div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">认领时间</div>
                            <div class="info-content">{{ formatDate(currentClaimDetails.claimTime) }}</div>
                        </div>
                        <div class="info-item full-width">
                            <div class="info-label">认领说明</div>
                            <div class="info-content">{{ currentClaimDetails.remark || '无' }}</div>
                        </div>
                    </div>
                </div>

                <!-- 进度记录 -->
                <div class="detail-section">
                    <div class="section-title">进度记录</div>
                    <div class="progress-timeline">
                        <el-timeline>
                            <el-timeline-item v-for="(progress, index) in currentClaimDetails.progressSteps"
                                :key="index" :timestamp="formatDate(progress.updateTime)"
                                :type="getTimelineItemType(progress.status)">
                                <div class="progress-item">
                                    <div class="progress-header">
                                        <el-tag :type="getProgressStatusType(progress.status)" size="small">
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
                    </div>
                </div>

                <!-- 执行结果 -->
                <div class="detail-section" v-if="currentClaimDetails.result && currentClaimDetails.result.contentList">
                    <div class="section-title">执行结果</div>
                    <!-- 内容列表 -->
                    <div class="result-section">
                        <div class="sub-title">内容列表</div>
                        <el-table :data="currentClaimDetails.result.contentList" border size="small"
                            style="width: 100%; margin-bottom: 20px;">
                            <el-table-column label="平台" prop="platform" width="120"></el-table-column>
                            <el-table-column label="类型" prop="type" width="120"></el-table-column>
                            <el-table-column label="发布时间" width="160">
                                <template slot-scope="scope">
                                    {{ formatDate(scope.row.publishTime) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="链接">
                                <template slot-scope="scope">
                                    <el-link type="primary" :href="scope.row.link" target="_blank">
                                        {{ scope.row.link }}
                                    </el-link>
                                </template>
                            </el-table-column>
                            <el-table-column label="视频代码" width="120">
                                <template slot-scope="scope">
                                    <span v-if="scope.row.videoCode">{{ scope.row.videoCode }}</span>
                                    <span v-else>-</span>
                                </template>
                            </el-table-column>
                            <!-- 效果数据 -->
                            <el-table-column label="内容效果数据">
                                <template slot-scope="scope">
                                    <div class="performance-data">
                                        <div class="data-item" style="display: flex;align-items: center;">
                                            <i class="el-icon-video-play"></i>
                                            <div class="data-label">播放量</div>
                                            <div class="data-value">
                                                {{ formatNumber(scope.row.performanceData.views) }}
                                            </div>
                                        </div>
                                        <div class="data-item" style="display: flex;align-items: center;">
                                            <i class="el-icon-star-on"></i>
                                            <div class="data-label">点赞数</div>
                                            <div class="data-value">
                                                {{ formatNumber(scope.row.performanceData.likes) }}
                                            </div>
                                        </div>
                                        <div class="data-item" style="display: flex;align-items: center;">
                                            <i class="el-icon-chat-dot-round"></i>
                                            <div class="data-label">评论数</div>
                                            <div class="data-value">
                                                {{
                                                    formatNumber(scope.row.performanceData.comments
                                                        || 0) }}
                                            </div>
                                        </div>
                                        <div class="data-item" style="display: flex;align-items: center;">
                                            <i class="el-icon-share"></i>
                                            <div class="data-label">总分享数</div>
                                            <div class="data-value">
                                                {{ formatNumber(scope.row.performanceData.shares
                                                    || 0) }}
                                            </div>
                                        </div>
                                        <div class="data-item" style="display: flex;align-items: center;">
                                            <i class="el-icon-money"></i>
                                            <div class="data-label">GMV</div>
                                            <div class="data-value">
                                                {{ formatNumber(scope.row.performanceData.gmv
                                                    || 0) }}
                                            </div>
                                        </div>
                                    </div>
                                </template>
                            </el-table-column>
                        </el-table>
                    </div>
                    <!-- 效果数据 -->
                    <div class="result-section">
                        <div class="sub-title">效果数据</div>
                        <div class="data-grid">
                            <div class="data-item">
                                <i class="el-icon-video-play"></i>
                                <div class="data-label">总播放量</div>
                                <div class="data-value">
                                    {{ formatNumber(currentClaimDetails.result.totalPerformance.totalViews || 0) }}
                                </div>
                            </div>
                            <div class="data-item">
                                <i class="el-icon-star-on"></i>
                                <div class="data-label">总点赞数</div>
                                <div class="data-value">
                                    {{ formatNumber(currentClaimDetails.result.totalPerformance.totalLikes || 0) }}
                                </div>
                            </div>
                            <div class="data-item">
                                <i class="el-icon-chat-dot-round"></i>
                                <div class="data-label">总评论数</div>
                                <div class="data-value">
                                    {{ formatNumber(currentClaimDetails.result.totalPerformance.totalComments || 0) }}
                                </div>
                            </div>
                            <div class="data-item">
                                <i class="el-icon-share"></i>
                                <div class="data-label">总分享数</div>
                                <div class="data-value">
                                    {{ formatNumber(currentClaimDetails.result.totalPerformance.totalShares || 0) }}
                                </div>
                            </div>
                            <div class="data-item">
                                <i class="el-icon-money"></i>
                                <div class="data-label">总GMV</div>
                                <div class="data-value">
                                    ¥{{ formatNumber(currentClaimDetails.result.totalPerformance.totalGmv || 0) }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </el-dialog>
    </div>
</template>
<script>
import { getData, addData, updateData } from "@/api/data";
import { formatDate, formatNumber } from "@/utils/date";

export default {
    name: 'TaskClaim',
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
                step: [{ required: true, message: '请输入进度说明', trigger: 'blur' }]
            },

            // 结果对话框
            resultDialogVisible: false,
            resultForm: {
                contentList: [],
                totalPerformance: {
                    totalViews: 0,
                    totalLikes: 0,
                    totalComments: 0,
                    totalShares: 0,
                    totalGmv: 0
                }
            },
            resultRules: {
                contentList: {
                    type: 'array',
                    required: true,
                    message: '请至少添加一个内容',
                    trigger: 'change'
                }
            },

            // 当前操作的认领记录
            currentClaim: null,

            // 添加详情对话框
            detailsDialogVisible: false,
            currentClaimDetails: {},

            // 任务跟踪员选项
            trackerOptions: [],

            statusList: [
                '未开始',
                '沟通中',
                '合作成功',
                '寄送样品',
                '样品跟踪',
                '已收货',
                '内容制作中',
                '作品已发布',
                '数据统计中',
                '已完成',
                '已取消'
            ],
        };
    },
    created() {

        this.getCurrentUser();
        this.fetchData();
        this.loadTrackerOptions();
    },
    methods: {
        // 获取当前用户信息
        async getCurrentUser() {
            try {
                console.log('this.$store.getters.roles: ', this.$store.getters);
                this.isAdmin = this.$store.getters.roles.label.includes('Admin');
                // this.isAgent = this.$store.getters.roles.label.includes('Agent');
                this.isAgent = this.$store.getters.roles.label.includes('Agent') || this.$store.getters.roles.label.includes('Admin');
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

                // 获取认领列表
                const claimResult = await getData("taskClaim", {
                    query: { taskId: this.taskId, isDeleted: false },
                    populate: JSON.stringify([
                        { path: 'agentId' },
                        { path: 'expertId' },
                        { path: 'trackerId' }
                    ])
                });
                this.claimList = claimResult.data.map(claim => ({
                    ...claim,
                    agentName: claim.agentId.nickName,
                    expertName: claim.expertId.name,
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
                    label: `${expert.name}(${expert.platforms.map(p => p.name).join('/')})`
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
                        // roles: { $elemMatch: { label: 'TaskTracker' } }
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
                            claimStatus: '待审核',
                            remark: this.claimForm.remark
                        });
                        this.$message.success('认领成功，请等待审核');
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

        // 提交进度
        async submitProgress() {
            try {
                await this.$refs.progressForm.validate();

                const progressStep = {
                    step: this.progressForm.step,
                    status: this.progressForm.status,
                    updateTime: new Date(),
                    updatedBy: this.currentUserId,
                    remark: this.progressForm.remark,
                    trackingInfo: { ...this.progressForm.trackingInfo }
                };

                await updateData("taskClaim", {
                    query: { _id: this.currentClaim._id },
                    update: {
                        status: this.progressForm.status,
                        $push: { progressSteps: progressStep }
                    }
                });

                if (this.progressForm.status === '合作成功') {
                    await updateData("taskClaim", {
                        query: { _id: this.currentClaim._id },
                        update: {
                            trackerId: this.progressForm.trackerId
                        }
                    });
                }

                this.$message.success('进度更新成功');
                this.progressDialogVisible = false;
                this.fetchData();
            } catch (error) {
                console.error('进度更新失败:', error);
                this.$message.error('进度更新失败');
            }
        },

        // 处理提交结果按钮点击
        handleSubmitResult(row) {
            this.currentClaim = row;
            this.resultForm = {
                contentList: [],
                totalPerformance: {
                    totalViews: 0,
                    totalLikes: 0,
                    totalComments: 0,
                    totalShares: 0,
                    totalGmv: 0
                }
            };

            if (row.result && row.result.contentList) {
                this.resultForm.contentList = row.result.contentList.map(function (content) {
                    return Object.assign({}, content, {
                        performanceData: Object.assign({
                            views: 0,
                            likes: 0,
                            comments: 0,
                            shares: 0,
                            gmv: 0
                        }, content.performanceData || {})
                    });
                });
            }

            this.resultDialogVisible = true;
        },

        // 添加内容
        addContent() {
            this.resultForm.contentList.push({
                platform: '',
                type: '',
                link: '',
                videoCode: '',
                publishTime: null,
                performanceData: {
                    views: 0,
                    likes: 0,
                    comments: 0,
                    shares: 0,
                    gmv: 0
                }
            });
        },

        // 移除内容
        removeContent(index) {
            this.$confirm('确定要删除该内容吗？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                this.resultForm.contentList.splice(index, 1);
            }).catch(() => { });
        },

        // 提交结果
        async submitResult() {
            try {
                await this.$refs.resultForm.validate();

                // 计算总效果数据
                const totalPerformance = {
                    totalViews: this.calculateTotalViews,
                    totalLikes: this.calculateTotalLikes,
                    totalComments: this.calculateTotalComments,
                    totalShares: this.calculateTotalShares,
                    totalGmv: this.calculateTotalGmv
                };
                console.log(totalPerformance, 'totalPerformance')

                // 更新任务认领数据
                await updateData("taskClaim", {
                    query: { _id: this.currentClaim._id },
                    update: {
                        result: {
                            contentList: this.resultForm.contentList,
                            totalPerformance
                        },
                        status: '数据统计中'
                    }
                });

                // 添加进度记录
                const progressStep = {
                    step: '提交执行结果',
                    status: '数据统计中',
                    updateTime: new Date(),
                    updatedBy: this.currentUserId,
                    remark: `提交了${this.resultForm.contentList.length}个内容的执行结果`
                };

                await updateData("taskClaim", {
                    query: { _id: this.currentClaim._id },
                    update: {
                        $push: { progressSteps: progressStep }
                    }
                });

                this.$message.success('执行结果提交成功');
                this.resultDialogVisible = false;
                this.fetchData();

            } catch (error) {
                console.error('提交执行结果失败:', error);
                this.$message.error('提交执行结果失败');
            }
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
                // 初始状态
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
                '达人视���': 'danger',
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

        // 获取可用状态
        getAvailableStatuses() {
            //TODO 暂时全部放开
            // if (this.isAgent) {
            //     // 经纪人只能更新到"合作成功"
            //     return this.statusList.filter(status =>
            //         ['沟通中', '合作成功'].includes(status)
            //     );
            // } else if (this.isTracker) {
            //     // 任务跟踪员可以更新所有后续状态
            //     return this.statusList.filter(status =>
            //         !['未开始', '沟通中'].includes(status)
            //     );
            // }
            return this.statusList;
        },
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
        isAgent() {
            return this.userInfo.roles.some(role => role.label === 'Agent');
        },

        // 判断当前用户是否为任务跟踪员
        isTracker() {
            return this.userInfo.roles.some(role => role.label === 'TaskTracker');
        },

        // 修改计算属性名称
        getTotalViews() {
            if (!this.resultForm || !this.resultForm.contentList) return 0;
            return this.resultForm.contentList.reduce(function (sum, content) {
                var views = content && content.performanceData && content.performanceData.views || 0;
                return sum + views;
            }, 0);
        },

        getTotalLikes() {
            if (!this.resultForm || !this.resultForm.contentList) return 0;
            return this.resultForm.contentList.reduce(function (sum, content) {
                var likes = content && content.performanceData && content.performanceData.likes || 0;
                return sum + likes;
            }, 0);
        },

        getTotalComments() {
            if (!this.resultForm || !this.resultForm.contentList) return 0;
            return this.resultForm.contentList.reduce(function (sum, content) {
                var comments = content && content.performanceData && content.performanceData.comments || 0;
                return sum + comments;
            }, 0);
        },

        getTotalShares() {
            if (!this.resultForm || !this.resultForm.contentList) return 0;
            return this.resultForm.contentList.reduce(function (sum, content) {
                var shares = content && content.performanceData && content.performanceData.shares || 0;
                return sum + shares;
            }, 0);
        },

        getTotalGmv() {
            if (!this.resultForm || !this.resultForm.contentList) return 0;
            return this.resultForm.contentList.reduce(function (sum, content) {
                var gmv = content && content.performanceData && content.performanceData.gmv || 0;
                return sum + gmv;
            }, 0);
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

    .materials-list {
        padding: 10px;
    }

    .empty-materials {
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
</style>