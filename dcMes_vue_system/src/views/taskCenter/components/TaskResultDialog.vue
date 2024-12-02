<template>
    <el-dialog title="提交执行结果" :visible.sync="dialogVisible" width="70%" custom-class="result-dialog" append-to-body>
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
                                    <el-select v-model="content.platform" placeholder="请选择平台" clearable
                                        style="width: 100%">
                                        <el-option v-for="dict in dict.type.expert_platform" :key="dict.value"
                                            :label="dict.label" :value="dict.value" />
                                    </el-select>
                                </el-form-item>
                            </el-col>
                            <el-col :span="8">
                                <el-form-item :label="'类型'" :prop="`contentList.${index}.type`"
                                    :rules="{ required: true, message: '请选类型', trigger: 'change' }">
                                    <el-select v-model="content.type" placeholder="请选择内容形式" clearable>
                                        <el-option v-for="dict in dict.type.content_type" :key="dict.value"
                                            :label="dict.label" :value="dict.value">
                                        </el-option>
                                    </el-select>
                                </el-form-item>
                            </el-col>
                            <el-col :span="8">
                                <el-form-item :label="'发布时间'" :prop="`contentList.${index}.publishTime`"
                                    :rules="{ required: true, message: '请选择发布时间', trigger: 'change' }">
                                    <el-date-picker v-model="content.publishTime" type="datetime" placeholder="选择发布时间"
                                        style="width: 100%">
                                    </el-date-picker>
                                </el-form-item>
                            </el-col>
                        </el-row>

                        <!-- 链接信息 -->
                        <el-row :gutter="20">
                            <el-col :span="8">
                                <el-form-item :label="'内容链接'" :prop="`contentList.${index}.link`"
                                    :rules="{ required: true, message: '请输入内容链接', trigger: 'blur' }">
                                    <el-input v-model="content.link" placeholder="请输入内容链接"></el-input>
                                </el-form-item>
                            </el-col>
                            <el-col :span="8">
                                <el-form-item :label="'视频代码'" :prop="`contentList.${index}.videoCode`">
                                    <el-input v-model="content.videoCode" placeholder="请输入视频/直播代码"></el-input>
                                </el-form-item>
                            </el-col>
                            <el-col :span="8">
                                <el-form-item :label="'广告码'" :prop="`contentList.${index}.adCode`">
                                    <el-input v-model="content.adCode" placeholder="请输入广告码"></el-input>
                                </el-form-item>
                            </el-col>
                        </el-row>

                        <!-- 带货产品 -->
                        <el-form-item :label="'带货产品'" :prop="`contentList.${index}.products`">
                            <TagInput v-model="content.products" />
                        </el-form-item>

                        <!-- 效果数据 -->
                        <div class="performance-data">
                            <div class="sub-title">效果数据</div>
                            <el-row :gutter="20">
                                <el-col :span="8">
                                    <el-form-item :label="'播放量'" :prop="`contentList.${index}.performanceData.views`">
                                        <el-input-number v-model="content.performanceData.views" :min="0"
                                            controls-position="right">
                                        </el-input-number>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="8">
                                    <el-form-item :label="'点赞数'" :prop="`contentList.${index}.performanceData.likes`">
                                        <el-input-number v-model="content.performanceData.likes" :min="0"
                                            controls-position="right">
                                        </el-input-number>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="8">
                                    <el-form-item :label="'评论数'"
                                        :prop="`contentList.${index}.performanceData.comments`">
                                        <el-input-number v-model="content.performanceData.comments" :min="0"
                                            controls-position="right">
                                        </el-input-number>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-row :gutter="20">
                                <el-col :span="8">
                                    <el-form-item :label="'点赞数'" :prop="`contentList.${index}.performanceData.likes`">
                                        <el-input-number v-model="content.performanceData.likes" :min="0"
                                            controls-position="right">
                                        </el-input-number>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="8">
                                    <el-form-item :label="'评论数'"
                                        :prop="`contentList.${index}.performanceData.comments`">
                                        <el-input-number v-model="content.performanceData.comments" :min="0"
                                            controls-position="right">
                                        </el-input-number>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="8">
                                    <el-form-item :label="'分享数'" :prop="`contentList.${index}.performanceData.shares`">
                                        <el-input-number v-model="content.performanceData.shares" :min="0"
                                            controls-position="right">
                                        </el-input-number>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-row :gutter="20">
                                <el-col :span="8">
                                    <el-form-item :label="'直播GMV'"
                                        :prop="`contentList.${index}.performanceData.liveGmv`">
                                        <el-input-number v-model="content.performanceData.liveGmv" :min="0"
                                            :precision="2" controls-position="right">
                                        </el-input-number>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="8">
                                    <el-form-item :label="'视频GMV'"
                                        :prop="`contentList.${index}.performanceData.videoGmv`">
                                        <el-input-number v-model="content.performanceData.videoGmv" :min="0"
                                            :precision="2" controls-position="right">
                                        </el-input-number>
                                    </el-form-item>
                                </el-col>
                                <!-- <el-col :span="8">
                                    <el-form-item :label="'订单GMV'" :prop="`contentList.${index}.performanceData.gmv`">
                                        <el-input-number v-model="content.performanceData.gmv" :min="0" :precision="2"
                                            controls-position="right">
                                        </el-input-number>
                                    </el-form-item>
                                </el-col> -->
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
                                    <div class="data-label">视频GMV</div>
                                    <div class="data-value">¥{{ formatNumber(getTotalVideoGmv) }}</div>
                                </div>

                            </div>
                        </el-col>
                        <el-col :span="8">
                            <div class="data-card">
                                <div class="data-icon">
                                    <i class="el-icon-money"></i>
                                </div>
                                <div class="data-content">
                                    <div class="data-label">直播GMV</div>
                                    <div class="data-value">¥{{ formatNumber(getTotalLiveGmv) }}</div>
                                </div>
                            </div>
                        </el-col>
                    </el-row>
                </div>
            </div>
        </el-form>
        <div slot="footer">
            <el-button @click="handleCancel">取 消</el-button>
            <el-button type="primary" @click="handleSubmit">确 定</el-button>
        </div>
    </el-dialog>
</template>

<script>
import { formatNumber } from "@/utils/date";
import { updateData, addData } from "@/api/data";
import TagInput from '@/components/TagInput/TagInput.vue';

export default {
    dicts: ['expert_platform', 'task_type', 'content_type'],
    components: {
        TagInput
    },
    name: 'TaskResultDialog',
    props: {
        visible: {
            type: Boolean,
            default: false
        },
        currentClaim: {
            type: Object,
            default: () => ({})
        },
        taskInfo: {
            type: Object,
            default: () => ({})
        }
    },
    data() {
        return {
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
            productOptions: [
                { value: '产品1', label: '产品1' },
                { value: '产品2', label: '产品2' },
                // 这里需要根据实际产品列表动态生成
            ]
        }
    },
    computed: {
        dialogVisible: {
            get() {
                return this.visible;
            },
            set(val) {
                this.$emit('update:visible', val);
            }
        },
        getTotalViews() {
            return this.resultForm.contentList.reduce((sum, content) => {
                return sum + ((content.performanceData && content.performanceData.views) || 0);
            }, 0);
        },
        getTotalLikes() {
            return this.resultForm.contentList.reduce((sum, content) => {
                return sum + ((content.performanceData && content.performanceData.likes) || 0);
            }, 0);
        },
        getTotalComments() {
            return this.resultForm.contentList.reduce((sum, content) => {
                return sum + ((content.performanceData && content.performanceData.comments) || 0);
            }, 0);
        },
        getTotalShares() {
            return this.resultForm.contentList.reduce((sum, content) => {
                return sum + ((content.performanceData && content.performanceData.shares) || 0);
            }, 0);
        },
        getTotalVideoGmv() {
            return this.resultForm.contentList.reduce((sum, content) => {
                return sum + ((content.performanceData && content.performanceData.videoGmv) || 0);
            }, 0);
        },
        getTotalLiveGmv() {
            return this.resultForm.contentList.reduce((sum, content) => {
                return sum + ((content.performanceData && content.performanceData.liveGmv) || 0);
            }, 0);
        }
    },
    watch: {
        visible(val) {
            if (val) {
                this.initForm();
            }
        }
    },
    methods: {
        formatNumber,
        initForm() {
            // 初始化表单数据
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

            // 如果有现有数据，则加载
            if (this.currentClaim.result && this.currentClaim.result.contentList) {
                this.resultForm.contentList = this.currentClaim.result.contentList.map(content => ({
                    ...content,
                    performanceData: {
                        views: 0,
                        likes: 0,
                        comments: 0,
                        shares: 0,
                        liveGmv: 0,
                        videoGmv: 0,
                        gmv: 0,
                        ...content.performanceData
                    }
                }));
            }
        },
        addContent() {
            this.resultForm.contentList.push({
                platform: '',
                type: '',
                link: '',
                videoCode: '',
                adCode: '',
                products: [],
                publishTime: null,
                performanceData: {
                    views: 0,
                    likes: 0,
                    comments: 0,
                    shares: 0,
                    liveGmv: 0,
                    videoGmv: 0,
                    gmv: 0
                }
            });
        },
        removeContent(index) {
            this.$confirm('确定要删除该内容吗？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                this.resultForm.contentList.splice(index, 1);
            }).catch(() => { });
        },
        handleCancel() {
            this.dialogVisible = false;
        },
        async handleSubmit() {
            try {
                await this.$refs.resultForm.validate();

                const totalPerformance = {
                    totalViews: this.getTotalViews,
                    totalLikes: this.getTotalLikes,
                    totalComments: this.getTotalComments,
                    totalShares: this.getTotalShares,
                    totalGmv: this.getTotalGmv
                };

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
                await updateData("taskClaim", {
                    query: { _id: this.currentClaim._id },
                    update: {
                        $push: {
                            progressSteps: {
                                step: '提交执行结果',
                                status: '数据统计中',
                                updateTime: new Date(),
                                updatedBy: this.$store.getters.id,
                                remark: `提交了${this.resultForm.contentList.length}个内容的执行结果`
                            }
                        }
                    }
                });

                // 创建结果提交消息
                await addData('messageLog', {
                    title: '任务结果提交通知',
                    content: `任务【${this.taskInfo.title}】的执行结果已提交，请查看`,
                    type: 'TASK_RESULT_SUBMITTED',
                    taskId: this.currentClaim.taskId,
                    taskClaimId: this.currentClaim._id,
                    sender: {
                        userId: this.$store.state.user.id,
                        role: 'TRACKER'
                    },
                    receivers: [
                        {
                            userId: this.currentClaim.agentId._id, // 发送给经纪人
                            role: 'AGENT',
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

                this.$message.success('执行结果提交成功');
                this.dialogVisible = false;
                this.$emit('submit-success');
            } catch (error) {
                console.error('提交执行结果失败:', error);
                this.$message.error('提交执行结果失败');
            }
        }
    }
}
</script>

<style lang="scss" scoped>
// ... 保持原有样式 ...
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