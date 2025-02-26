<!--
 * @name: 搜索数据列表
 * @content: 对所有的搜索数据进行管理
 * @Author: joyce
 * @Date: 2020-03-10 16:22:05
-->
<template>
  <div class="app-container">
    <div class="userstatus">
      <div class="flexs">
        <img :src="userdata.avatar" class="user-avatar" />
        <div class="imgtext">您好，{{ userdata.name }}</div>
      </div>
      <div class="flexs">
        <el-button type="primary" class="buttons" @click="showDialog">修改信息</el-button>
        <el-button class="buttons" @click="logout">退出登录</el-button>
      </div>
    </div>


    <user-info-dialog ref="userInfoDialog" />
  </div>
</template>

<script>
import { getData, addData, updateData } from "@/api/data";
import * as echarts from 'echarts';
import { getMessages, markMessageRead, markAllMessagesRead } from "@/api/message"; // 需要创建这个API文件
import UserInfoDialog from '@/views/mima/index.vue';
export default {
  components: {
    UserInfoDialog
  },
  data() {
    return {
      userdata: {},
      //任务数据 寄样品，样品跟踪，然后作品已发布等
      // 新增消息相关数据
      activeTab: 'unread',
      loading: false,
      unreadMessages: [],
      allMessages: [],
      dialogVisible: false,
      currentMessage: null,
      messageTypeMap: {
        'TASK_PUBLISHED': '任务发布',
        'TASK_CLAIMED': '任务认领',
        'TRACKER_ASSIGNED': '跟踪员指派',
        'TASK_UPDATED': '任务更新'
      },
    };
  },
  mounted() {
    this.userdata = this.$store.state.user;
    console.log(this.userdata,'userdata');
  },
  methods: {
    initCharts() {
      this.initGenderChart();
      this.initRegionChart();
      this.initCategoryChart();
    },
    showDialog() {
      this.$refs.userInfoDialog.show();
    },
    initGenderChart() {
      const chart = echarts.init(document.getElementById('genderChart'));
      const option = {
        series: [
          {
            type: 'pie',
            data: [
              { value: 600, name: '男性' },
              { value: 400, name: '女性' }
            ]
          }
        ]
      };
      chart.setOption(option);
    },
    initRegionChart() {
      const chart = echarts.init(document.getElementById('regionChart'));
      const option = {
        // title: { text: '各地区人数' },
        xAxis: { type: 'category', data: ['北京', '上海', '广州', '深圳'] },
        yAxis: { type: 'value' },
        series: [
          {
            type: 'bar',
            data: [300, 200, 150, 350]
          }
        ]
      };
      chart.setOption(option);
    },
    initCategoryChart() {
      const chart = echarts.init(document.getElementById('categoryChart'));
      const option = {
        // title: { text: '达人分类' },
        series: [
          {
            type: 'pie',
            data: [
              { value: 300, name: '美食' },
              { value: 200, name: '旅游' },
              { value: 500, name: '科技' }
            ]
          }
        ]
      };
      chart.setOption(option);
    },
    async logout() {
      await this.$store.dispatch("user/logout");
      this.$router.push(`/login?redirect=${this.$route.fullPath}`);
    },
    async mima() {
      await this.$store.dispatch("view/mima");
      this.$router.push(`/mima?redirect=${this.$route.fullPath}`);
    },
    // 新增消息相关方法
    async fetchMessages() {
      this.loading = true;
      try {
        const req = {
          user: this.$store.state.user
        };
        const { data } = await getMessages(req);
        console.log(data,'data');
        this.unreadMessages = data.filter(msg =>
          msg.receivers.some(r =>
            r.userId === this.$store.state.user.id && !r.isRead
          )
        );
        this.allMessages = data;
      } catch (error) {
        console.error('获取消息失败:', error);
        this.$message.error('获取消息失败');
      } finally {
        this.loading = false;
      }
    },

    async markAsRead(messageId) {
      try {
        await markMessageRead({ messageId: messageId, user: this.$store.state.user });
        this.$message.success('已标记为已读');
        this.fetchMessages();
      } catch (error) {
        console.error('标记已读失败:', error);
        this.$message.error('标记已读失败');
      }
    },

    async markAllAsRead() {
      try {
        await markAllMessagesRead({ user: this.$store.state.user });
        this.$message.success('已全部标记为已读');
        this.fetchMessages();
      } catch (error) {
        console.error('标记全部已读失败:', error);
        this.$message.error('标记全部已读失败');
      }
    },

    handleTabClick() {
      this.fetchMessages();
    },

    viewDetail(message) {
      this.currentMessage = message;
      this.dialogVisible = true;
      if (!message.isRead) {
        this.markAsRead(message._id);
      }
    },

    formatDate(date) {
      if (!date) return '';
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
  }
}
</script>
<style scoped>
.data-card {
  background-color: #333;
  color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  text-align: center;
}

.progress {
  background-color: #555;
  border-radius: 4px;
  height: 10px;
  margin: 10px 0;
  overflow: hidden;
}

.progress-bar {
  background-color: #1e90ff;
  height: 100%;
  transition: width 0.3s ease;
}

.details {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  color: #ccc;
}

.userstatus {
  flex-wrap: wrap;
  width: 100%;
  box-shadow: 0 1px 6px rgba(102, 102, 102, 0.12);
  display: flex;
  border-radius: 8px;
  flex-direction: row;
  justify-content: space-around;
  color: #fff;
}

.flexs {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #7e7e7e;

  justify-content: center;
}

.user-avatar {
  background-color: #fff;
  margin: 40px 0 0 0;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 1px solid #1e90ff;
}

.imgtext {
  margin-top: 10px;
  margin-bottom: 40px;
  color: #ccc;
}

.buttons {
  margin: 5px;
}

.flexs-title {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.flexs-title1 {
  margin-top: 10px;
  color: rgba(42, 130, 228, 1);
}

.fourbox {
  width: 94%;
  margin: 3%;
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: space-between;
}

.boxss {
  min-width: 200px;
  color: rgba(80, 80, 80, 1);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 30px;
  align-items: center;
  width: 23%;
  border-radius: 8px;
  box-shadow: 0 1px 6px rgba(102, 102, 102, 0.12);
}

.colors1 {
  font-size: 30px;
  color: rgba(42, 130, 228, 1);
  margin-bottom: 10px;
}

.colors2 {
  font-size: 30px;
  color: rgba(255, 141, 26, 1);
  margin-bottom: 10px;
}

.colors3 {
  font-size: 30px;
  color: rgba(0, 186, 173, 1);
  margin-bottom: 10px;
}

.colors4 {
  font-size: 30px;
  color: rgba(212, 48, 48, 1);
  margin-bottom: 10px;
}

.tabels {
  width: 94%;
  margin: 3%;
  height: 100px;
  border-radius: 8px;
  box-shadow: 0 1px 6px rgba(102, 102, 102, 0.12);
}

.screen {
  height: auto;
  margin: 2vw 0;
  width: 100%;
  border: 1px solid #ebeef5;
  border-radius: 5px;
}

.screen_content {
  height: auto;
  display: flex;
  flex-direction: column;
}

.screen_content_first {
  width: 100%;
  padding: 10px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.backupNumber {
  display: flex;
  flex-direction: column;
}

.el-icon-tickets {
  font-size: 24px;
  color: #1e90ff;
  margin-right: 10px;
}

.filter-item {
  background-color: #1e90ff;
  border-color: #1e90ff;
  color: #ffffff;
  transition: background-color 0.3s ease;
}

.filter-item:hover {
  background-color: #104e8b;
}

.message-meta {
  color: #666;
  font-size: 14px;
  margin-top: 20px;
}

.message-meta p {
  margin: 5px 0;
}

.el-tabs {
  margin: 20px;
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}
</style>
