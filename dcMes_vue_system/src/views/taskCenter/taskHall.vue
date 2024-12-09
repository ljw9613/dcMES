<template>
    <div class="task-hall">
        <!-- 搜索区域 -->
        <el-card class="filter-container">
            <div slot="header" class="clearfix">
                <span>筛选搜索</span>
                <el-button style="float: right; padding: 3px 0" type="text" @click="toggleAdvanced">
                    {{ showAdvanced ? '收起' : '展开' }}高级搜索
                </el-button>
            </div>

            <el-form :model="searchForm" ref="searchForm" class="search-form">
                <el-row :gutter="20">
                    <el-col :span="6">
                        <el-form-item label="任务标题">
                            <el-input v-model="searchForm.title" placeholder="请输入任务标题" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="任务类型">
                            <el-select v-model="searchForm.type" placeholder="请选择任务类型" clearable>
                                <el-option v-for="dict in dict.type.task_type" :key="dict.value" :label="dict.label"
                                    :value="dict.value">
                                </el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="品牌名称">
                            <el-input v-model="searchForm.brandName" placeholder="请输入品牌名称" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="合作平台">
                            <el-select v-model="searchForm.platformName" placeholder="请选择平台" clearable
                                style="width: 100%">
                                <el-option v-for="dict in dict.type.expert_platform" :key="dict.value"
                                    :label="dict.label" :value="dict.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-collapse-transition>
                    <div v-show="showAdvanced">
                        <el-row :gutter="20">
                            <el-col :span="6">
                                <el-form-item label="内容形式">
                                    <el-select v-model="searchForm.contentType" placeholder="请选择内容形式" clearable>
                                        <el-option v-for="dict in dict.type.content_type" :key="dict.value"
                                            :label="dict.label" :value="dict.value">
                                        </el-option>
                                    </el-select>
                                </el-form-item>
                            </el-col>
                            <el-col :span="6">
                                <el-form-item label="预算范围">
                                    <el-input-number v-model="searchForm.minBudget" placeholder="最小预算"
                                        style="width: 110px">
                                    </el-input-number>
                                    <span style="margin: 0 5px">-</span>
                                    <el-input-number v-model="searchForm.maxBudget" placeholder="最大预算"
                                        style="width: 110px">
                                    </el-input-number>
                                </el-form-item>
                            </el-col>
                            <el-col :span="12">
                                <el-form-item label="发布时间">
                                    <el-date-picker v-model="searchForm.timeRange" type="daterange" range-separator="至"
                                        start-placeholder="开始日期" end-placeholder="结束日期" style="width: 100%">
                                    </el-date-picker>
                                </el-form-item>
                            </el-col>
                        </el-row>
                    </div>
                </el-collapse-transition>

                <el-row>
                    <el-col :span="24" style="text-align: right">
                        <el-button type="primary" @click="handleSearch">查询</el-button>
                        <el-button @click="resetSearch">重置</el-button>
                    </el-col>
                </el-row>
            </el-form>
        </el-card>

        <!-- 任务列表 -->
        <el-card class="task-list">
            <div slot="header" class="clearfix">
                <span>任务列表</span>
                <el-button v-if="isAdmin" style="float: right" type="primary" size="small" @click="handleCreate">
                    发布任务
                </el-button>
            </div>

            <el-table v-loading="loading" :data="taskList" style="width: 100%" border>
                <el-table-column label="任务标题" min-width="200">
                    <template slot-scope="scope">
                        <el-button type="text" @click="handleViewTask(scope.row)">{{ scope.row.title }}</el-button>
                    </template>
                </el-table-column>

                <el-table-column label="任务类型" prop="type" width="120">
                    <template slot-scope="scope">
                        <el-tag :type="getTaskTypeTag(scope.row.type)">{{ scope.row.type }}</el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="品牌信息" min-width="180">
                    <template slot-scope="scope">
                        <div>品牌：{{ scope.row.cooperationDetails.brandName }}</div>
                        <div>产品：{{ scope.row.cooperationDetails.productName }}</div>
                    </template>
                </el-table-column>

                <el-table-column label="合作要求" min-width="200">
                    <template slot-scope="scope">
                        <div>
                            <el-tag v-for="platform in scope.row.cooperationDetails.requirements.platformType"
                                :key="platform" size="small" style="margin-right: 5px">
                                {{ platform }}
                            </el-tag>
                        </div>
                        <div style="margin-top: 5px">
                            <el-tag v-for="content in scope.row.cooperationDetails.requirements.contentType"
                                :key="content" type="success" size="small" style="margin-right: 5px">
                                {{ content }}
                            </el-tag>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="预算" width="120">
                    <template slot-scope="scope">
                        ¥{{ formatNumber(scope.row.cooperationDetails.commercialTerms.budget) }}
                    </template>
                </el-table-column>

                <el-table-column label="发布时间" width="160">
                    <template slot-scope="scope">
                        {{ formatDate(scope.row.createTime) }}
                    </template>
                </el-table-column>

                <el-table-column label="操作" width="150" fixed="right">
                    <template slot-scope="scope">
                        <el-button type="text" size="small" @click="handleViewTask(scope.row)">查看</el-button>
                        <el-button v-if="isAdmin" type="text" size="small" @click="handleEdit(scope.row)">编辑</el-button>
                        <el-button v-if="isAdmin" type="text" size="small" class="delete-btn"
                            @click="handleDelete(scope.row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-container">
                <el-pagination background @size-change="handleSizeChange" @current-change="handleCurrentChange"
                    :current-page="currentPage" :page-sizes="[10, 20, 30, 50]" :page-size="pageSize"
                    layout="total, sizes, prev, pager, next, jumper" :total="total">
                </el-pagination>
            </div>
        </el-card>

        <!-- 任务详情对话框 -->
        <el-dialog :title="taskDetailTitle" :visible.sync="taskDetailVisible" width="80%" class="task-detail-dialog"
            destroy-on-close>
            <task-claim v-if="taskDetailVisible" :key="selectedTaskId" :taskId="selectedTaskId"></task-claim>
        </el-dialog>

        <!-- 添加任务表单对话框 -->
        <edit-dialog :dialog-form-visible.sync="taskFormVisible" :dialog-status="editTaskId ? 'edit' : 'create'"
            :data-form="taskForm" @submit="handleSubmitTask"></edit-dialog>
    </div>
</template>

<script>
import { getData, addData, updateData, removeData } from "@/api/data";
import { formatDate } from "@/utils/date";
import TaskClaim from './components/taskClaim.vue';
import EditDialog from './editDialog.vue';

export default {
    dicts: ['expert_platform', 'task_type', 'content_type'],
    name: 'TaskHall',
    components: {
        TaskClaim,
        EditDialog
    },
    data() {
        return {
            // 用户信息
            isAdmin: false,

            // 搜索表单
            searchForm: {
                title: '',
                type: '',
                brandName: '',
                platform: '',
                contentType: '',
                minBudget: null,
                maxBudget: null,
                timeRange: []
            },
            showAdvanced: false,

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

            // 表格数据
            loading: false,
            taskList: [],
            currentPage: 1,
            pageSize: 10,
            total: 0,

            // 任务详情
            taskDetailVisible: false,
            taskDetailTitle: '',
            selectedTaskId: null,

            // 添加任务表单数据
            taskForm: {
                title: '',
                type: '',
                description: '',
                startTime: '',
                endTime: '',
                cooperationDetails: {
                    brandName: '',
                    brandIndustry: '',
                    productName: '',
                    productCategory: '',
                    productDetails: '',
                    requirements: {
                        platformType: [],
                        contentType: [],
                        expertRequirements: {
                            fansCountMin: 0,
                            fansCountMax: 0,
                            expertCategory: []
                        }
                    },
                    commercialTerms: {
                        budget: 0,
                        commissionRate: 0
                    },
                    kpiTargets: {
                        viewsTarget: 0,
                        interactionTarget: 0,
                        salesTarget: 0,
                        expertCount: 0,
                        videoCount: 0,
                        liveStreamCount: 0
                    },
                    remarks: []
                }
            },
            taskFormVisible: false,
            editTaskId: '',
        };
    },
    created() {
        this.checkUserRole();
        this.fetchData();
    },
    computed: {
        isAdmin() {
            return this.$store.getters.roles.some(role => role.label === 'Admin');
        }
    },
    methods: {
        // 检查用户角色
        checkUserRole() {
            console.log('this.$store.getters.roles: ', this.$store.getters.roles);
            this.isAdmin = this.$store.getters.roles.label.includes('Admin');
        },

        // 获取任务列表
        async fetchData() {
            this.loading = true;
            try {
                const query = this.buildQuery();
                const result = await getData("task", {
                    query,
                    page: this.currentPage,
                    limit: this.pageSize,
                    sort: { createTime: -1 },
                    count: true
                });
                this.taskList = result.data;
                this.total = result.total;
            } catch (error) {
                console.error('获取任务列表失败:', error);
                this.$message.error('获取任务列表失败');
            }
            this.loading = false;
        },

        // 构建查询条件
        buildQuery() {
            const query = { isDeleted: false };
            if (this.searchForm.title) {
                query.title = { $regex: this.searchForm.title, $options: 'i' };
            }
            if (this.searchForm.type) {
                query.type = this.searchForm.type;
            }
            if (this.searchForm.brandName) {
                query['cooperationDetails.brandName'] = new RegExp(this.searchForm.brandName, 'i');
            }
            if (this.searchForm.platform) {
                query['cooperationDetails.requirements.platformType'] = this.searchForm.platform;
            }
            if (this.searchForm.contentType) {
                query['cooperationDetails.requirements.contentType'] = this.searchForm.contentType;
            }
            if (this.searchForm.minBudget || this.searchForm.maxBudget) {
                query['cooperationDetails.commercialTerms.budget'] = {};
                if (this.searchForm.minBudget) {
                    query['cooperationDetails.commercialTerms.budget'].$gte = this.searchForm.minBudget;
                }
                if (this.searchForm.maxBudget) {
                    query['cooperationDetails.commercialTerms.budget'].$lte = this.searchForm.maxBudget;
                }
            }
            if (this.searchForm.timeRange && this.searchForm.timeRange.length === 2) {
                query.createTime = {
                    $gte: this.searchForm.timeRange[0],
                    $lte: this.searchForm.timeRange[1]
                };
            }
            return query;
        },

        // 搜索相关方法
        handleSearch() {
            this.currentPage = 1;
            this.fetchData();
        },

        resetSearch() {
            this.$refs.searchForm.resetFields();
            this.currentPage = 1;
            this.fetchData();
        },

        toggleAdvanced() {
            this.showAdvanced = !this.showAdvanced;
        },

        // 分页方法
        handleSizeChange(val) {
            this.pageSize = val;
            this.fetchData();
        },

        handleCurrentChange(val) {
            this.currentPage = val;
            this.fetchData();
        },

        // 任务操作方法
        handleViewTask(row) {
            this.selectedTaskId = row._id;
            this.taskDetailTitle = row.title;
            this.taskDetailVisible = true;
            this.taskFormVisible = false;
        },

        handleCreate() {
            this.editTaskId = ''
            this.resetTaskForm()
            this.taskFormVisible = true
        },

        async handleEdit(row) {
            this.editTaskId = row._id
            this.taskForm = JSON.parse(JSON.stringify(row))
            this.taskFormVisible = true
            this.taskDetailVisible = false
        },

        resetTaskForm() {
            this.taskForm = {
                title: '',
                type: '',
                description: '',
                startTime: '',
                endTime: '',
                cooperationDetails: {
                    brandName: '',
                    brandIndustry: '',
                    productName: '',
                    productCategory: '',
                    productDetails: '',
                    requirements: {
                        platformType: [],
                        contentType: [],
                        expertRequirements: {
                            fansCountMin: 0,
                            fansCountMax: 0,
                            expertCategory: []
                        }
                    },
                    commercialTerms: {
                        budget: 0,
                        commissionRate: 0
                    },
                    kpiTargets: {
                        viewsTarget: 0,
                        interactionTarget: 0,
                        salesTarget: 0,
                        expertCount: 0,
                        videoCount: 0,
                        liveStreamCount: 0
                    },
                    remarks: []
                }
            }
        },

        async handleDelete(row) {
            try {
                await this.$confirm('确认删除该任务?', '提示', {
                    type: 'warning'
                });
                await removeData("task", {
                    query: { _id: row._id }
                });
                this.$message.success('删除成功');
                this.fetchData();
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('删除失败:', error);
                    this.$message.error('删除失败');
                }
            }
        },

        // 工具方法
        formatDate(date) {
            return formatDate(new Date(date), 'yyyy-MM-dd HH:mm');
        },

        formatNumber(num) {
            return num ? num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') : '0';
        },

        getTaskTypeTag(type) {
            const typeMap = {
                '品牌宣传': 'primary',
                '达人推广': 'success',
                '达人直播': 'warning',
                '达人视频': 'danger',
                '直播带货': 'info'
            };
            return typeMap[type] || 'info';
        },

        // 获取所有经纪人用户
        async getAgentUsers() {
            try {
                const result = await getData('user_login', {
                    query: {
                        'role': '6734ddfc55647e147063f152'
                    }
                });
                console.log("🚀 ~ getAgentUsers ~ result:", result)
                return result.data || [];
            } catch (error) {
                console.error('获取经纪人列表失败:', error);
                return [];
            }
        },

        // 创建消息日志
        async createMessageLog(messageData) {
            try {
                const agents = await this.getAgentUsers();
                console.log('agents: ', agents);
                const messageLog = {
                    ...messageData,
                    receivers: agents.map(agent => ({
                        userId: agent._id,
                        role: 'AGENT',
                        isRead: false
                    }))
                };
                await addData('messageLog', messageLog);
            } catch (error) {
                console.error('创建消息日志失败:', error);
            }
        },

        // 修改现有的handleSubmitTask方法
        async handleSubmitTask(formData) {
            try {
                if (this.editTaskId) {
                    formData.updateBy = this.$store.state.user.id
                    formData.createAt = new Date()
                    formData.updateAt = new Date()
                    // 更新任务
                    await updateData('task', {
                        query: { _id: this.editTaskId },
                        update: formData
                    });
                    this.$message.success('更新任务成功');

                    // 创建更新任务的消息
                    await this.createMessageLog({
                        title: '任务更新通知',
                        content: `任务【${formData.title}】已更新`,
                        type: 'TASK_UPDATED',
                        taskId: this.editTaskId,
                        sender: {
                            userId: this.$store.state.user.id,
                            role: 'ADMIN'
                        },
                        isSystem: true
                    });
                } else {
                    formData.createBy = this.$store.state.user.id
                    formData.createAt = new Date()
                    formData.updateAt = new Date()
                    // 创建新任务
                    const res = await addData('task', formData);
                    this.$message.success('创建任务成功');

                    // 创建新��务发布的消息
                    await this.createMessageLog({
                        title: '新任务发布通知',
                        content: `新任务【${formData.title}】已发布，快来查看吧！`,
                        type: 'TASK_PUBLISHED',
                        taskId: res.data._id,
                        sender: {
                            userId: this.$store.state.user.id,
                            role: 'ADMIN'
                        },
                        isSystem: true
                    });
                }
                this.taskFormVisible = false;
                this.fetchData();
            } catch (error) {
                console.error('保存任务失败:', error);
                this.$message.error('保存任务失败');
            }
        },

        // 修改现有的handleDelete方法
        async handleDelete(row) {
            try {
                await this.$confirm('确认删除该任务?', '提示', {
                    type: 'warning'
                });

                // await removeData("task", {
                //     query: { _id: row._id }
                // });
                await updateData("task", {
                    query: { _id: row._id },
                    update: { isDeleted: true }
                });

                // 创建任务删除的消息
                await this.createMessageLog({
                    title: '任务删除通知',
                    content: `任务【${row.title}】已被删除`,
                    type: 'TASK_DELETED',
                    taskId: row._id,
                    sender: {
                        userId: this.$store.state.user.id,
                        role: 'ADMIN'
                    },
                    isSystem: true
                });

                this.$message.success('删除成功');
                this.fetchData();
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('删除失败:', error);
                    this.$message.error('删除失败');
                }
            }
        },
    }
};
</script>

<style lang="scss" scoped>
.task-hall {
    .filter-container {
        margin-bottom: 20px;

        .search-form {
            margin-top: 15px;

            .el-select {
                width: 100%;
            }
        }
    }

    .task-list {
        .el-table {
            margin-top: 15px;
        }

        .delete-btn {
            color: #F56C6C;
        }

        .el-tag {
            margin: 2px;
        }
    }

    .pagination-container {
        text-align: right;
        margin-top: 20px;
    }
}

.task-detail-dialog {
    ::v-deep .el-dialog__body {
        padding: 20px;
    }
}
</style>