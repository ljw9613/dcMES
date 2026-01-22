<template>
    <el-dialog :title="dialogStatus === 'create' ? '添加达人' : '编辑达人'" :visible.sync="localVisible" width="80%">
        <el-form :model="dataForm" ref="dataForm" label-width="120px">
            <!-- 账号信息 -->
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">账号信息</div>

            <el-row :gutter="20">
                <el-col :span="8">
                    <el-form-item label="所属平台" prop="platformName">
                        <el-select :disabled="!isAdmin && dialogStatus === 'edit'"  v-model="dataForm.platformName" placeholder="请选择平台">
                            <el-option v-for="dict in dict.type.expert_platform" :key="dict.value" :label="dict.label"
                                :value="dict.value" />
                        </el-select>
                    </el-form-item>
                </el-col>
                <el-col :span="8">

                    <el-form-item label="平台ID" prop="platformId">
                        <el-input v-model="dataForm.platformId" placeholder="请输入平台ID"></el-input>
                    </el-form-item>
                </el-col>
                <el-col :span="8">
                    <el-form-item label="平台昵称" prop="nickname">
                        <el-input v-model="dataForm.nickname" placeholder="请输入平台昵称"></el-input>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="账号链接" prop="platformUrl">
                        <el-input v-model="dataForm.platformUrl" placeholder="请输入账号链接">
                            <!-- <template slot="append">
                                <el-button type="text" @click="openPlatformUrl" v-if="dataForm.platformUrl">
                                    <i class="el-icon-link"></i> 访问
                                </el-button>
                            </template> -->
                        </el-input>
                    </el-form-item>
                </el-col>
                <el-col :span="8">
                    <el-form-item label="达人等级" prop="level">
                        <el-select v-model="dataForm.level" placeholder="请选择账号分类" clearable style="width: 100%">
                            <el-option v-for="dict in dict.type.level" :key="dict.value" :label="dict.label"
                                :value="dict.value" />
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="8">
                    <el-form-item label="粉丝数量" prop="followers">
                        <el-input-number v-model="dataForm.followers" :min="0" placeholder="粉丝数量"></el-input-number>
                    </el-form-item>
                </el-col>
                <el-col :span="8">
                    <el-form-item label="账号分类" prop="category">
                        <el-select v-model="dataForm.category" multiple placeholder="请选择账号分类" clearable
                            style="width: 100%">
                            <el-option v-for="dict in dict.type.category" :key="dict.value" :label="dict.label"
                                :value="dict.value" />
                        </el-select>
                    </el-form-item>
                </el-col>

            </el-row>

            <el-row :gutter="20">
                <el-col :span="8">
                    <el-form-item label="平均互动率" prop="averageEngagement">
                        <el-input-number v-model="dataForm.averageEngagement" :min="0" :max="100" :precision="2"
                            placeholder="平均互动率">
                        </el-input-number>
                    </el-form-item>
                </el-col>
                <el-col :span="8">
                    <el-form-item label="平均播放量" prop="averageViews">
                        <el-input-number v-model="dataForm.averageViews" :min="0" placeholder="平均播放量">
                        </el-input-number>
                    </el-form-item>
                </el-col>
                <!-- <el-col :span="8">
                    <el-form-item label="视频数量" prop="videoCount">
                        <el-input-number v-model="dataForm.videoCount" :min="0" placeholder="视频数量">
                        </el-input-number>
                    </el-form-item>
                </el-col> -->
            </el-row>

            <!-- 经纪人信息 -->
            <div style="font-size: 18px; font-weight: bold; margin: 30px 0;">经纪人信息</div>

            <el-row :gutter="20">
                <el-col :span="8">
                    <el-form-item label="经纪人" prop="createBy" >
                        <AgentSelect v-model="dataForm.createBy" :disabled="!isAdmin && dialogStatus === 'edit'" />
                    </el-form-item>
                </el-col>
            </el-row>

            <div style="font-size: 18px; font-weight: bold; margin: 30px 0;">联系方式</div>

            <el-row :gutter="20">
                <el-col :span="8">
                    <el-form-item label="电话" prop="phone">
                        <el-input v-model="dataForm.phone" placeholder="请输入电话" clearable></el-input>
                    </el-form-item>
                </el-col>
                <el-col :span="8">
                    <el-form-item label="其他联系方式" prop="contactInfo">
                        <el-input v-model="dataForm.contactInfo" placeholder="请输入联系方式" clearable></el-input>
                    </el-form-item>
                </el-col>
                <el-col :span="8">
                    <el-form-item label="WhatsApp账号" prop="whatsappAccount">
                        <el-input v-model="dataForm.whatsappAccount" placeholder="请输入WhatsApp账号" clearable>
                            <!-- <template slot="append">
                                <el-button type="text" @click="openWhatsApp" v-if="dataForm.whatsappAccount">
                                    <i class="el-icon-chat-dot-round"></i> 联系
                                </el-button>
                            </template> -->
                        </el-input>
                    </el-form-item>
                </el-col>
                <el-col :span="8">
                    <el-form-item label="签约机构" prop="agency">
                        <el-input v-model="dataForm.agency" placeholder="请输入签约机构" clearable></el-input>
                    </el-form-item>
                </el-col>
            </el-row>

            <!-- 地区信息 -->
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">地区信息</div>
            <el-form-item label="所在地区" prop="area">
                <ZrAddressSelect v-model="dataForm.area" />
            </el-form-item>


            <div style="font-size: 18px; font-weight: bold; margin: 30px 0;">粉丝画像</div>

            <!-- <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="粉丝年龄范围" prop="followerAgeRange">
                        <el-input v-model="dataForm.followerAgeRange" placeholder="请输入粉丝年龄范围" clearable></el-input>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="粉丝兴趣" prop="followerLocation">
                        <TagInput v-model="dataForm.followerInterests" />
                    </el-form-item>
                </el-col>
            </el-row> -->

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="粉丝男性比例" prop="followerMan">
                        <el-input-number v-model="dataForm.followerMan" :min="0" :max="100"
                            placeholder="请输入粉丝男性比例"></el-input-number>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="粉丝女性比例" prop="followerWoman">
                        <el-input-number v-model="dataForm.followerWoman" :min="0" :max="100"
                            placeholder="请输入粉丝女性比例"></el-input-number>
                    </el-form-item>
                </el-col>
            </el-row>

            <!-- <el-row>
                <el-col :span="24">
                    <el-form-item label="粉丝主要地区" prop="followerLocation">
                        <ZrAddressSelect v-model="dataForm.followerLocation" isMultiple />
                    </el-form-item>
                </el-col>
            </el-row> -->

            <div style="font-size: 18px; font-weight: bold; margin: 30px 0;">带货数据</div>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="热销品类占比" prop="hotCategoryRatio">
                        <TagInput v-model="dataForm.hotCategoryRatio" />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="GPM" prop="gpm">
                        <el-input-number v-model="dataForm.gpm" :min="0" placeholder="请输入GPM"></el-input-number>
                    </el-form-item>
                </el-col>
                <el-col :span="24">
                    <el-form-item label="商品客单价区间" prop="productPrice">
                        <el-input-number v-model="dataForm.productPriceMin" :min="0" placeholder="最低价"
                            style="width: 150px">
                        </el-input-number>
                        <span style="margin: 0 10px">-</span>
                        <el-input-number v-model="dataForm.productPriceMax" :min="0" placeholder="最高价"
                            style="width: 150px">
                        </el-input-number>
                    </el-form-item>
                </el-col>

            </el-row>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="带货top3产品" prop="top3Products">
                        <TagInput v-model="dataForm.top3Products" />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="带货方式" prop="sellingMethod">
                        <el-select v-model="dataForm.sellingMethod" multiple placeholder="请选择带货方式">
                            <el-option v-for="dict in dict.type.delivery_method" :key="dict.value" :label="dict.label"
                                :value="dict.value" />
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>
            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="月销量" prop="followerMan">
                        <el-input-number v-model="dataForm.monthlySales" :min="0" :max="100"
                            placeholder="请输入月销量"></el-input-number>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="月销售额" prop="followerWoman">
                        <el-input-number v-model="dataForm.monthlySalesAmount" :min="0" :max="100"
                            placeholder="请输入月销售额"></el-input-number>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-form-item label="合作次数">
                {{ dataForm.cooperationHistory.length }}
            </el-form-item>

            <div style="font-size: 18px; font-weight: bold; margin: 30px 0;">合作历史</div>

            <el-button type="primary" @click="addCooperationHistory">添加合作历史</el-button>
            <el-table :data="dataForm.cooperationHistory" style="width: 100%; border-radius: 8px; overflow: hidden;">
                <el-table-column label="品牌名称" width="200">
                    <template slot-scope="scope">
                        <el-input v-model="scope.row.brandName" size="mini" placeholder="品牌名称" clearable></el-input>
                    </template>
                </el-table-column>
                <el-table-column label="品牌类目" width="200">
                    <template slot-scope="scope">
                        <el-input v-model="scope.row.brandCategory" size="mini" placeholder="品牌类目" clearable></el-input>
                    </template>
                </el-table-column>
                <el-table-column label="视频链接" width="200">
                    <template slot-scope="scope">
                        <el-input v-model="scope.row.videoUrl" size="mini" placeholder="视频链接" clearable></el-input>
                    </template>
                </el-table-column>
                <el-table-column label="视频发布时间" width="200">
                    <template slot-scope="scope">
                        <el-date-picker v-model="scope.row.videoPublishTime" type="datetime" placeholder="选择发时间" size="mini"
                            value-format="yyyy-MM-dd HH:mm:ss">
                        </el-date-picker>
                    </template>
                </el-table-column>
                <el-table-column label="视频GMV" width="150">
                    <template slot-scope="scope">
                        <el-input-number v-model="scope.row.videoGMV" :min="0" placeholder="视频GMV" size="mini">
                        </el-input-number>
                    </template>
                </el-table-column>
                <el-table-column label="视频订单数" width="150">
                    <template slot-scope="scope">
                        <el-input-number v-model="scope.row.videoOrders" :min="0" placeholder="订单数" size="mini">
                        </el-input-number>
                    </template>
                </el-table-column>
                <el-table-column label="观看数" width="150">
                    <template slot-scope="scope">
                        <el-input-number v-model="scope.row.videoViews" :min="0" placeholder="观看数" size="mini">
                        </el-input-number>
                    </template>
                </el-table-column>
                <el-table-column label="点赞数" width="150">
                    <template slot-scope="scope">
                        <el-input-number v-model="scope.row.videoLikes" :min="0" placeholder="点赞数" size="mini">
                        </el-input-number>
                    </template>
                </el-table-column>
                <el-table-column label="评论数" width="150">
                    <template slot-scope="scope">
                        <el-input-number v-model="scope.row.videoComments" :min="0" placeholder="评论数" size="mini">
                        </el-input-number>
                    </template>
                </el-table-column>
                <el-table-column label="直播时间" width="200">
                    <template slot-scope="scope">
                        <el-date-picker v-model="scope.row.liveTime" type="datetime" placeholder="直播时间" size="mini"
                            value-format="yyyy-MM-dd HH:mm:ss">
                        </el-date-picker>
                    </template>
                </el-table-column>
                <el-table-column label="直播GMV" width="150">
                    <template slot-scope="scope">
                        <el-input-number v-model="scope.row.liveGMV" :min="0" placeholder="直播GMV" size="mini">
                        </el-input-number>
                    </template>
                </el-table-column>
                <el-table-column label="直播订单数" width="150">
                    <template slot-scope="scope">
                        <el-input-number v-model="scope.row.liveOrders" :min="0" placeholder="直播订单数" size="mini">
                        </el-input-number>
                    </template>
                </el-table-column>
                <el-table-column label="评分" width="150">
                    <template slot-scope="scope">
                        <el-rate v-model="scope.row.score" :max="5"></el-rate>
                    </template>
                </el-table-column>
                <el-table-column label="备注" width="150">
                    <template slot-scope="scope">
                        <el-input v-model="scope.row.remark" placeholder="备注" type="textarea"></el-input>
                    </template>
                </el-table-column>
                <el-table-column label="操作" fixed="right" width="80">
                    <template slot-scope="scope">
                        <el-button type="text" size="mini"
                            @click="removeCooperationHistory(scope.$index)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 任务历史 -->
            <div style="font-size: 18px; font-weight: bold; margin: 30px 0;">任务历史</div>
            <el-table :data="systemCooperationHistory" style="width: 100%; border-radius: 8px; overflow: hidden;">
                <el-table-column label="任务标题">
                    <template slot-scope="scope">
                        <el-link type="primary" @click="viewTaskDetails(scope.row.taskId)">{{
                            scope.row.taskTitle
                            }}</el-link>
                    </template>
                </el-table-column>
                <el-table-column label="任务类型" width="200">
                    <template slot-scope="scope">
                        <el-tag size="mini">{{ scope.row.taskType }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="合作时间" width="200">
                    <template slot-scope="scope">
                        {{ formatDate(scope.row.cooperationTime) }}
                    </template>
                </el-table-column>
                <el-table-column label="合作状态" width="200">
                    <template slot-scope="scope">
                        <el-tag :type="getCooperationStatusType(scope.row.status)">{{ scope.row.status
                            }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="播放量" width="200">
                    <template slot-scope="scope">
                        {{ formatNumber(scope.row.performanceData.views) }}
                    </template>
                </el-table-column>
                <el-table-column label="互动量" width="200">
                    <template slot-scope="scope">
                        {{ formatNumber(scope.row.performanceData.interactions) }}
                    </template>
                </el-table-column>
                <el-table-column label="销售额" width="200">
                    <template slot-scope="scope">
                        <span class="price">¥{{ formatNumber(scope.row.performanceData.sales) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="评分" width="200">
                    <template slot-scope="scope">
                        <el-rate v-model="scope.row.score" disabled show-score></el-rate>
                    </template>
                </el-table-column>
            </el-table>

        </el-form>

        <div slot="footer">
            <el-button @click="localVisible = false">取 消</el-button>
            <el-button type="primary" @click="submitForm">确 定</el-button>
        </div>
    </el-dialog>
</template>

<script>
import { getData, addData, updateData, removeData } from "@/api/data";
import TagInput from '@/components/TagInput/TagInput.vue';
import ZrAddressSelect from '@/components/ZrAddressSelect/index.vue';
import AgentSelect from './AgentSelect.vue';
export default {
    dicts: ['delivery_method', 'expert_platform', 'category', 'level'],
    components: {
        TagInput,
        ZrAddressSelect,
        AgentSelect
    },
    props: {
        dialogFormVisible: {
            type: Boolean,
            required: true
        },
        dialogStatus: {
            type: String,
            required: true
        },
        dataForm: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            inputVisible: false,
            inputValue: '',
            uploadAvatarUrl: 'https://macaojob.cn/darenSever/api/upload/avatar',
            serverUrl: 'https://macaojob.cn/darenSever',
            systemCooperationHistory: [], // 系统合作历史数据
            localVisible: false, // 添加本地数据属性
            isAdmin: false
        }
    },
    created() {
        // 获取当前用户角色判断是否为管理员
        this.isAdmin = this.$store.getters.roles.includes('admin');
    },
    methods: {
        handleClose(tag) {
            this.dataForm.followerInterests.splice(this.dataForm.followerInterests.indexOf(tag), 1);
        },

        showInput() {
            this.inputVisible = true;
            this.$nextTick(_ => {
                this.$refs.saveTagInput.$refs.input.focus();
            });
        },
        handleInputConfirm() {
            let inputValue = this.inputValue;
            if (inputValue) {
                this.dataForm.followerInterests.push(inputValue);
            }
            this.inputVisible = false;
            this.inputValue = '';
        },

        handleAvatarSuccess(res, file) {
            console.log(res, file)
            if (res.code === 200) {
                this.dataForm.avatar = this.serverUrl + res.data.url;
                this.$message.success('头像上传成功');
            } else {
                this.$message.error(res.msg || '头像上传失败');
            }
        },
        beforeAvatarUpload(file) {
            const isValidFormat = file.type === 'image/jpeg' || file.type === 'image/png';
            const isLt2M = file.size / 1024 / 1024 < 2;

            if (!isValidFormat) {
                this.$message.error('上传头像图片只能是 JPG 或 PNG 格式!');
            }
            if (!isLt2M) {
                this.$message.error('上传头像图片大小不能超过 2MB!');
            }
            return isValidFormat && isLt2M;
        },
        async checkPlatformIdExists(platformId) {
            try {
                const result = await getData("expert", {
                    query: {
                        platformId: platformId,
                        // 编辑时排除当前记录
                        ...(this.dialogStatus === 'update' && { _id: { $ne: this.dataForm._id } })
                    }
                });
                return result.data && result.data.length > 0;
            } catch (error) {
                console.error('检查平台ID失败:', error);
                return false;
            }
        },

        async submitForm() {
            this.$refs.dataForm.validate(async (valid) => {
                if (valid) {
                    if (this.dataForm.productPriceMax < this.dataForm.productPriceMin) {
                        this.$message.error('商品客单价区间有误：最高价不能小于最低价');
                        return;
                    }

                    // 检查平台ID是否已存在
                    const platformIdExists = await this.checkPlatformIdExists(this.dataForm.platformId);
                    if (platformIdExists) {
                        this.$message.error('该平台ID已存在，请修改后重试');
                        return;
                    }
                    
                    // 如果不是管理员且是编辑模式，使用当前用户作为createBy
                    if (!this.isAdmin && this.dialogStatus === 'edit') {
                        this.dataForm.createBy = this.$store.getters.userId;
                    }
                    
                    this.$emit('submit', this.dataForm);
                    this.$emit('update:dialogFormVisible', false);
                }
            });
        },
        addCooperationHistory() {
            this.dataForm.cooperationHistory.push({
                brands: '',
                videos: '',
                score: 0,
                sales: 0,
                remark: ''
            });
        },
        removeCooperationHistory(index) {
            this.dataForm.cooperationHistory.splice(index, 1);
        },
        // 获取系统合作历史
        async fetchSystemCooperationHistory() {
            if (!this.dataForm._id) return;

            try {
                const result = await getData("taskClaim", {
                    query: {
                        expertId: this.dataForm._id,
                        status: { $in: ['已完成'] },  // 只获取已完成的任务
                        isDeleted: false
                    },
                    populate: JSON.stringify([
                        { path: 'taskId' }
                    ])
                });

                this.systemCooperationHistory = result.data.map(claim => {
                    const performanceData = claim.result && claim.result.performanceData ? claim.result.performanceData : {
                        views: 0,
                        interactions: 0,
                        sales: 0
                    };

                    return {
                        taskId: claim.taskId._id,
                        taskTitle: claim.taskId.title,
                        taskType: claim.taskId.type,
                        cooperationTime: claim.taskId.startTime,
                        status: claim.status,
                        performanceData: performanceData,
                        score: claim.result && claim.result.score ? claim.result.score : 0
                    };
                });
            } catch (error) {
                console.error('获取系统合作历史失败:', error);
                this.$message.error('获取系统合作历史失败');
            }
        },

        // 查看任务详情
        viewTaskDetails(taskId) {
            // 跳转到任务详情页面
            this.$router.push(`/task-center/task-claim/${taskId}`);
        },

        // 获取合作状态样式
        getCooperationStatusType(status) {
            const statusMap = {
                '已完成': 'success',
                '进行中': 'primary',
                '已取消': 'danger'
            };
            return statusMap[status] || 'info';
        },

        // 格式化数字
        formatNumber(num) {
            if (!num && num !== 0) return '0';
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        },

        // 打开平台账号链接
        openPlatformUrl() {
            if (this.dataForm.platformUrl) {
                window.open(this.dataForm.platformUrl, '_blank');
            }
        },

        // 打开WhatsApp聊天
        openWhatsApp() {
            if (this.dataForm.whatsappAccount) {
                const whatsappUrl = `https://wa.me/${this.dataForm.whatsappAccount.replace(/\D/g, '')}`;
                window.open(whatsappUrl, '_blank');
            }
        },

        // 初始化表单时添加新字段
        initForm() {
            this.dataForm = {
                // ... other fields ...
                platformUrl: '',
                whatsappAccount: '',
                // ... other fields ...
            }
        }
    },
    watch: {
        // 监听父组件的dialogFormVisible变化
        dialogFormVisible(val) {
            this.localVisible = val;
            if (val && this.dataForm._id) {
                this.fetchSystemCooperationHistory();
            }
        },
        // 监听本地visible变化，通知父组件
        localVisible(val) {
            if (val !== this.dialogFormVisible) {
                this.$emit('update:dialogFormVisible', val);
            }
        }
    }
};
</script>

<style scoped>
.avatar-uploader {
    display: flex;
    flex-direction: column;
    align-items: center;
}
</style>