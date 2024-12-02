<template>
  <el-dialog title="任务详情" :visible.sync="visible" width="70%" :close-on-click-modal="false"
    custom-class="claim-details-dialog" append-to-body @close="handleClose">
    <div class="claim-details">
      <!-- 基本信息 -->
      <div class="detail-section">
        <div class="section-title">基本信息</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">经纪人</div>
            <div class="info-content">{{ details.agentName }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">关联达人</div>
            <div class="info-content">{{ details.expertName }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">认领状态</div>
            <div class="info-content">
              <el-tag :type="getClaimStatusType(details.claimStatus)">
                {{ details.claimStatus }}
              </el-tag>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">认领时间</div>
            <div class="info-content">{{ formatDate(details.claimTime) }}</div>
          </div>
          <div class="info-item full-width">
            <div class="info-label">认领说明</div>
            <div class="info-content">{{ details.remark || '无' }}</div>
          </div>
        </div>
      </div>

      <!-- 进度记录 -->
      <div class="detail-section">
        <div class="section-title" style="display: flex; justify-content: space-between; align-items: center;">
          <span>进度记录</span>
          <el-button type="text" @click="isTimelineExpanded = !isTimelineExpanded">
            {{ isTimelineExpanded ? '收起' : '展开' }}
            <i :class="isTimelineExpanded ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
          </el-button>
        </div>
        <div class="progress-timeline" v-show="isTimelineExpanded">
          <el-timeline>
            <el-timeline-item v-for="(progress, index) in details.progressSteps" :key="index"
              :timestamp="formatDate(progress.updateTime)" :type="getTimelineItemType(progress.status)">
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
      <div class="detail-section" v-if="details.result && details.result.contentList">
        <div class="section-title">执行结果</div>
        <!-- 内容列表 -->
        <div class="result-section">
          <div class="sub-title">内容列表</div>
          <el-table :data="details.result.contentList" border size="small" style="width: 100%; margin-bottom: 20px;">
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
                      {{ formatNumber(scope.row.performanceData.comments || 0) }}
                    </div>
                  </div>
                  <div class="data-item" style="display: flex;align-items: center;">
                    <i class="el-icon-share"></i>
                    <div class="data-label">总分享数</div>
                    <div class="data-value">
                      {{ formatNumber(scope.row.performanceData.shares || 0) }}
                    </div>
                  </div>
                  <div class="data-item" style="display: flex;align-items: center;">
                    <i class="el-icon-money"></i>
                    <div class="data-label">视频GMV</div>
                    <div class="data-value">
                      {{ formatNumber(scope.row.performanceData.videoGmv || 0) }}
                    </div>
                  </div>
                  <div class="data-item" style="display: flex;align-items: center;">
                    <i class="el-icon-money"></i>
                    <div class="data-label">直播GMV</div>
                    <div class="data-value">
                      {{ formatNumber(scope.row.performanceData.liveGmv || 0) }}
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
              <div class="data-label">总播放量:</div>
              <div class="data-value">
                {{ formatNumber(details.result.totalPerformance.totalViews || 0) }}
              </div>
            </div>
            <div class="data-item">
              <i class="el-icon-star-on"></i>
              <div class="data-label">总点赞数:</div>
              <div class="data-value">
                {{ formatNumber(details.result.totalPerformance.totalLikes || 0) }}
              </div>
            </div>
            <div class="data-item">
              <i class="el-icon-chat-dot-round"></i>
              <div class="data-label">总评论数:</div>
              <div class="data-value">
                {{ formatNumber(details.result.totalPerformance.totalComments || 0) }}
              </div>
            </div>
            <div class="data-item">
              <i class="el-icon-share"></i>
              <div class="data-label">总分享数:</div>
              <div class="data-value">
                {{ formatNumber(details.result.totalPerformance.totalShares || 0) }}
              </div>
            </div>
            <div class="data-item">
              <i class="el-icon-money"></i>
              <div class="data-label">总视频GMV:</div>
              <div class="data-value">
                ¥{{ formatNumber(details.result.totalPerformance.totalVideoGmv || 0) }}
              </div>
            </div>
            <div class="data-item">
              <i class="el-icon-money"></i>
              <div class="data-label">总直播GMV:</div>
              <div class="data-value">
                ¥{{ formatNumber(details.result.totalPerformance.totalLiveGmv || 0) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import { formatDate, formatNumber } from "@/utils/date";

export default {
  name: 'TaskClaimDetails',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    details: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      isTimelineExpanded: false // 默认展开
    }
  },
  methods: {
    handleClose() {
      this.$emit('update:visible', false);
    },

    formatDate(date) {
      return formatDate(date, 'yyyy-MM-dd HH:mm');
    },

    formatNumber(num) {
      return formatNumber(num);
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
        '未开始': 'info',
        '沟通中': 'warning',
        '合作成功': 'success',
        '寄送样品': 'primary',
        '样品跟踪': 'primary',
        '已收货': 'success',
        '内容制作中': 'primary',
        '作品已发布': 'success',
        '数据统计中': 'warning',
        '已完成': 'success',
        '已取消': 'danger',
        '合作失败': 'danger'
      };
      return typeMap[status] || 'info';
    },

    getTimelineItemType(status) {
      const typeMap = {
        '未开始': 'info',
        '沟通中': 'warning',
        '执行中': 'primary',
        '已完成': 'success',
        '已取消': 'danger'
      };
      return typeMap[status] || 'info';
    }
  }
};
</script>

<style lang="scss" scoped>
// 复制原有的相关样式

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

// ... 其他样式保持不变 ...</style>