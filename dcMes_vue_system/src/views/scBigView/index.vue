<template>
  <div
    class="production-dashboard"
    :class="{ 'fullscreen-mode': isFullscreen }"
  >
    <!-- 头部区域 -->
    <div class="dashboard-header">
      <div class="dashboard-title">
        <span class="title-text">德昌MES-智能生产线实时监控平台</span>
        <div class="title-decoration"></div>
      </div>

      <div class="line-selector">
        <zr-select
          style="width: 100%"
          v-model="selectedLineId"
          @select="handleLineChange"
          collection="production_line"
          :search-fields="['lineCode', 'lineName']"
          label-key="lineName"
          tag-key="lineCode"
          sub-key="workshop"
          :multiple="false"
          placeholder="请输入产线信息搜索"
        />
      </div>

      <div class="header-actions">
        <div class="real-time-info">
          <div class="date-time">
            <div class="current-date">{{ currentDate }}</div>
            <div class="current-time">{{ currentTime }}</div>
          </div>
        </div>
        <div class="fullscreen-btn" @click="toggleFullscreen">
          <i
            :class="isFullscreen ? 'icon-exit-fullscreen' : 'icon-fullscreen'"
          ></i>
        </div>
      </div>
    </div>

    <!-- 上半部分 - 工单信息 -->
    <div class="work-order-section">
      <div class="section-title">
        <span>当前生产工单</span>
        <div class="divider"></div>
      </div>

      <div class="work-order-container" v-if="currentWorkOrder">
        <div class="work-order-info">
          <div class="work-order-header">
            <div class="work-order-no pulse-effect">
              工单号:
              <span class="highlight-text">{{
                currentWorkOrder.workOrderNo
              }}</span>
            </div>
            <div
              class="work-order-status"
              :class="getStatusClass(currentWorkOrder.status)"
            >
              {{ getStatusText(currentWorkOrder.status) }}
            </div>
          </div>

          <div class="work-order-details">
            <div class="detail-item">
              <div class="item-label">产品名称</div>
              <div class="item-value">{{ currentWorkOrder.materialName }}</div>
            </div>
            <div class="detail-item">
              <div class="item-label">产品型号</div>
              <div class="item-value">
                {{ currentWorkOrder.fSpecification }}
              </div>
            </div>
            <div class="detail-item">
              <div class="item-label">计划数量</div>
              <div class="item-value number-scroll">
                {{ currentWorkOrder.planQuantity }}
              </div>
            </div>
            <div class="detail-item">
              <div class="item-label">投入数量</div>
              <div class="item-value number-scroll">
                {{ currentWorkOrder.inputQuantity }}
              </div>
            </div>
            <div class="detail-item">
              <div class="item-label">产出数量</div>
              <div class="item-value number-scroll">
                {{ currentWorkOrder.outputQuantity }}
              </div>
            </div>
            <div class="detail-item">
              <div class="item-label">计划开始</div>
              <div class="item-value">
                {{ formatDate(currentWorkOrder.planStartTime) }}
              </div>
            </div>
            <div class="detail-item">
              <div class="item-label">计划结束</div>
              <div class="item-value">
                {{ formatDate(currentWorkOrder.planEndTime) }}
              </div>
            </div>
          </div>
        </div>

        <div class="work-order-progress">
          <div class="progress-header">
            <span>生产进度</span>
            <span class="progress-percentage"
              >{{ getProgressPercentage(currentWorkOrder) }}%</span
            >
          </div>
          <div class="progress-bar-container">
            <div
              class="progress-bar"
              :style="{ width: getProgressPercentage(currentWorkOrder) + '%' }"
            ></div>
          </div>
          <div class="production-stats">
            <div class="stat-item">
              <div class="stat-value number-scroll">
                {{ currentWorkOrder.outputQuantity }}
              </div>
              <div class="stat-label">已完成</div>
            </div>
            <div class="stat-item">
              <div class="stat-value number-scroll">
                {{
                  currentWorkOrder.planQuantity -
                  currentWorkOrder.outputQuantity
                }}
              </div>
              <div class="stat-label">待完成</div>
            </div>
            <!-- <div class="stat-item">
              <div class="stat-value number-scroll">
                {{ getDefectRate(currentWorkOrder) }}%
              </div>
              <div class="stat-label">不良率</div>
            </div> -->
          </div>
        </div>
      </div>

      <div class="no-data" v-else>
        <div class="no-data-text">暂无生产工单数据</div>
      </div>
    </div>

    <!-- 修改设备和工序信息部分，整合小时产能 -->
    <div class="machines-section">
      <div class="section-title">
        <span>设备生产状态</span>
        <div class="divider"></div>
      </div>
      
      <!-- 添加一个紧凑的小时产能概览 -->
      <div class="hourly-overview" v-if="currentWorkOrder">
        <div class="overview-chart-container">
          <div class="overview-title">工单小时产能</div>
          <div id="workOrderHourlyChart" class="overview-chart"></div>
        </div>
      </div>

      <div class="machines-carousel-container">
        <div class="carousel-arrow prev" @click="prevSlide" v-if="totalPages > 1">
          <i class="el-icon-arrow-left"></i>
        </div>

        <div class="machines-carousel">
          <div 
            class="machines-carousel-wrapper" 
            :style="{transform: `translateX(-${currentPage * 100}%)`}"
          >
            <div 
              v-for="(machinesGroup, groupIndex) in machinesGroups" 
              :key="groupIndex"
              class="machines-carousel-page"
            >
              <div 
                v-for="(machine, machineIndex) in machinesGroup"
                :key="machine._id"
              >
                <div class="machine-card">
                  <div class="machine-sequence-number">{{ getSequenceNumber(machineIndex, groupIndex) }}</div>
                  
                  <div class="machine-header">
                    <div class="machine-name pulse-effect">
                      {{ machine.machineName }}
                    </div>
                    <div
                      class="machine-status"
                      :class="machine.status ? 'status-online' : 'status-offline'"
                    >
                      {{ machine.status ? "在线" : "离线" }}
                    </div>
                  </div>

                  <div class="machine-content">
                    <div class="machine-info-mini">
                      <div class="info-item">
                        <div class="item-label">设备编号</div>
                        <div class="item-value">{{ machine.machineCode }}</div>
                      </div>
                      <div class="info-item">
                        <div class="item-label">当前工序</div>
                        <div class="item-value">
                          {{ getProcessStepName(machine.processStepId) }}
                        </div>
                      </div>
                      
                      <!-- 生产数量信息 -->
                      <div class="production-data">
                        <div class="production-data-row">
                          <div class="production-data-item">
                            <span class="data-label">已生产</span>
                            <span class="data-value good">{{ machine.productionData.processed - machine.productionData.defects }}</span>
                          </div>
                          <div class="production-data-item">
                            <span class="data-label">待生产</span>
                            <span class="data-value pending">{{ machine.productionData.planned - machine.productionData.processed }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="card-decoration left"></div>
                  <div class="card-decoration right"></div>
                  <div class="glow-effect"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="carousel-arrow next" @click="nextSlide" v-if="totalPages > 1">
          <i class="el-icon-arrow-right"></i>
        </div>
      </div>

      <div class="carousel-indicators" v-if="totalPages > 1">
        <span 
          v-for="n in totalPages" 
          :key="n" 
          :class="{'active': currentPage === n-1}"
          @click="goToPage(n-1)"
        ></span>
      </div>
    </div>
  </div>
</template>
  
<script>
import * as echarts from "echarts";
import CountUp from "countup.js";
import { getProductionLines, getDashboardData } from "@/api/dashboard";

export default {
  name: "ProductionDashboard",
  data() {
    return {
      isFullscreen: false,
      selectedLineId: "",
      currentDate: "",
      currentTime: "",
      productionLines: [],
      currentWorkOrder: null,
      machines: [],
      processSteps: {},
      materials: {},
      charts: {},
      countUpInstances: {},
      refreshTimer: null,
      currentPage: 0,
      machinesPerPage: 10,
      processHourlyOutput: {},  // 各工序小时产能
      workOrderHourlyOutput: {} // 工单小时产能
    };
  },
  created() {
    this.updateDateTime();
    setInterval(this.updateDateTime, 1000);
    
    // 初始化仪表板，加载缓存的产线
    this.initDashboard();
  },
  mounted() {
    this.startAutoSlide();
  },
  beforeDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    // 销毁所有图表实例
    Object.values(this.charts).forEach((chart) => {
      chart.dispose();
    });
    this.stopAutoSlide();
  },
  methods: {
    initDashboard() {
      // 尝试从本地存储获取之前选择的产线
      const cachedLineId = localStorage.getItem('selected_production_line');
      if (cachedLineId) {
        this.selectedLineId = cachedLineId;
        this.fetchDashboardData();
      }

      // 设置定时刷新
      this.refreshTimer = setInterval(() => {
        this.fetchDashboardData();
      }, 30000); // 每30秒刷新一次
    },

    updateDateTime() {
      const now = new Date();
      this.currentDate = now.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      });
      this.currentTime = now.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    },

    toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
          this.isFullscreen = true;
        });
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().then(() => {
            this.isFullscreen = false;
          });
        }
      }
    },

    handleLineChange(lineId) {
      console.log(lineId, "lineId");
      this.selectedLineId = lineId._id;
      
      // 将选中的产线ID保存到本地存储
      localStorage.setItem('selected_production_line', this.selectedLineId);
      
      this.fetchDashboardData();
    },

    fetchDashboardData() {
      if (!this.selectedLineId) return;

      getDashboardData(this.selectedLineId)
        .then((response) => {
          if (response.success) {
            // 设置当前工单数据
            this.currentWorkOrder = response.data.currentWorkOrder;

            // 设置设备数据
            this.machines = response.data.machines;

            // 构建工序和物料的映射对象
            this.processSteps = {};
            this.materials = {};

            // 遍历设备，提取工序信息
            this.machines.forEach((machine) => {
              if (machine.processStep) {
                this.processSteps[machine.processStepId] = machine.processStep;
              }
            });

            // 获取小时产能数据
            this.processHourlyOutput = response.data.processHourlyOutput || {};
            this.workOrderHourlyOutput = response.data.workOrderHourlyOutput || {};

            this.$nextTick(() => {
              if (this.currentWorkOrder) {
                this.initNumberScrolling();
              }
              this.renderCharts();
              this.renderHourlyCharts(); // 添加渲染小时产能图表
            });
          } else {
            this.$message.error("获取大屏数据失败");
          }
        })
        .catch((error) => {
          console.error("获取大屏数据错误:", error);
          this.$message.error("获取大屏数据失败");
        });
    },

    initNumberScrolling() {
      // 初始化数字滚动效果
      const numElements = document.querySelectorAll(".number-scroll");
      numElements.forEach((el) => {
        const value = parseInt(el.textContent);
        const id = Math.random().toString(36).substr(2, 9);
        el.id = id;

        if (this.countUpInstances[id]) {
          this.countUpInstances[id].update(value);
        } else {
          const countUp = new CountUp(id, value, {
            duration: 2,
            useEasing: true,
          });
          countUp.start();
          this.countUpInstances[id] = countUp;
        }
      });
    },

    renderCharts() {
      // 渲染各设备生产图表
      this.machines.forEach((machine) => {
        const chartId = "chart-" + machine._id;
        const chartDom = document.getElementById(chartId);

        if (!chartDom) return;

        let chart = this.charts[chartId];
        if (chart) {
          chart.dispose();
        }

        chart = echarts.init(chartDom);
        this.charts[chartId] = chart;

        const option = {
          grid: {
            left: "5%",
            right: "5%",
            top: "10%",
            bottom: "10%",
            containLabel: true,
          },
          tooltip: {
            trigger: "axis",
            axisPointer: {
              type: "shadow",
            },
          },
          xAxis: {
            type: "category",
            data: ["已生产", "不良品", "待生产"],
            axisLine: {
              lineStyle: {
                color: "rgba(255, 255, 255, 0.3)",
              },
            },
            axisLabel: {
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: 10,
            },
          },
          yAxis: {
            type: "value",
            axisLine: {
              show: false,
            },
            axisLabel: {
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: 10,
            },
            splitLine: {
              lineStyle: {
                color: "rgba(255, 255, 255, 0.1)",
              },
            },
          },
          series: [
            {
              name: "数量",
              type: "bar",
              data: [
                {
                  value:
                    machine.productionData.processed -
                    machine.productionData.defects,
                  itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                      { offset: 0, color: "rgba(0, 255, 159, 0.9)" },
                      { offset: 1, color: "rgba(0, 161, 101, 0.5)" },
                    ]),
                  },
                },
                {
                  value: machine.productionData.defects,
                  itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                      { offset: 0, color: "rgba(255, 89, 71, 0.9)" },
                      { offset: 1, color: "rgba(204, 0, 0, 0.5)" },
                    ]),
                  },
                },
                {
                  value:
                    machine.productionData.planned -
                    machine.productionData.processed,
                  itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                      { offset: 0, color: "rgba(73, 152, 255, 0.9)" },
                      { offset: 1, color: "rgba(31, 96, 196, 0.5)" },
                    ]),
                  },
                },
              ],
              barWidth: "50%",
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowColor: "rgba(0, 0, 0, 0.5)",
                },
              },
            },
          ],
        };

        chart.setOption(option);

        // 自适应窗口大小
        window.addEventListener("resize", () => {
          chart.resize();
        });
      });
    },

    formatDate(date) {
      if (!date) return "未设置";
      return new Date(date).toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    },

    getStatusClass(status) {
      switch (status) {
        case "PENDING":
          return "status-pending";
        case "IN_PROGRESS":
          return "status-running";
        case "COMPLETED":
          return "status-completed";
        case "CANCELLED":
          return "status-cancelled";
        default:
          return "";
      }
    },

    getStatusText(status) {
      switch (status) {
        case "PENDING":
          return "待生产";
        case "IN_PROGRESS":
          return "生产中";
        case "COMPLETED":
          return "已完成";
        case "CANCELLED":
          return "已取消";
        default:
          return "未知状态";
      }
    },

    getProgressPercentage(workOrder) {
      if (!workOrder || !workOrder.planQuantity) return 0;
      const percentage =
        (workOrder.outputQuantity / workOrder.planQuantity) * 100;
      return Math.round(percentage);
    },

    getDefectRate(workOrder) {
      if (!workOrder || !workOrder.inputQuantity || !workOrder.outputQuantity)
        return 0;
      const defects = workOrder.inputQuantity - workOrder.outputQuantity;
      const rate = (defects / workOrder.inputQuantity) * 100;
      return rate.toFixed(2);
    },

    getProcessStepName(id) {
      return (
        (this.processSteps[id] && this.processSteps[id].processName) || "未分配"
      );
    },

    getMaterialName(id) {
      return (
        (this.materials[id] && this.materials[id].materialName) || "未知物料"
      );
    },

    getProcessStatusClass(machine) {
      return machine.processStatus === "RUNNING"
        ? "status-running"
        : "status-stopped";
    },

    prevSlide() {
      if (this.currentPage > 0) {
        this.currentPage--;
      } else {
        this.currentPage = this.totalPages - 1;
      }
    },
    
    nextSlide() {
      if (this.currentPage < this.totalPages - 1) {
        this.currentPage++;
      } else {
        this.currentPage = 0;
      }
    },
    
    goToPage(pageIndex) {
      this.currentPage = pageIndex;
    },

    startAutoSlide() {
      this.autoSlideTimer = setInterval(() => {
        this.nextSlide();
      }, 10000);
    },
    
    stopAutoSlide() {
      if (this.autoSlideTimer) {
        clearInterval(this.autoSlideTimer);
      }
    },

    // 计算设备序号
    getSequenceNumber(machineIndex, groupIndex) {
      return groupIndex * this.machinesPerPage + machineIndex + 1;
    },

    // 修改图表渲染方法，简化为只显示工单小时产能
    renderHourlyCharts() {
      // 只渲染工单小时产能图表
      this.renderWorkOrderHourlyChart();
    },
    
    // 修改工单小时产能图表，适配小尺寸
    renderWorkOrderHourlyChart() {
      const chartDom = document.getElementById('workOrderHourlyChart');
      if (!chartDom) return;
      
      let chart = this.charts['workOrderHourlyChart'];
      if (chart) {
        chart.dispose();
      }
      
      chart = echarts.init(chartDom);
      this.charts['workOrderHourlyChart'] = chart;
      
      const hours = [];
      const outputData = [];
      
      for (let hour = 0; hour < 24; hour++) {
        hours.push(hour + ':00');
        outputData.push(this.workOrderHourlyOutput[hour] || 0);
      }
      
      const option = {
        grid: {
          left: '2%',
          right: '2%',
          bottom: '10%',
          top: '15%',
          containLabel: true
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        xAxis: {
          type: 'category',
          data: hours,
          axisLine: {
            lineStyle: {
              color: 'rgba(255, 255, 255, 0.3)'
            }
          },
          axisLabel: {
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: 9,
            interval: 3
          }
        },
        yAxis: {
          type: 'value',
          axisLine: {
            show: false
          },
          axisLabel: {
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: 9
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        },
        series: [{
          name: '产量',
          type: 'bar',
          data: outputData,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 255, 159, 0.9)' },
              { offset: 1, color: 'rgba(0, 161, 101, 0.5)' }
            ])
          }
        }]
      };
      
      chart.setOption(option);
      
      window.addEventListener('resize', () => {
        chart.resize();
      });
    }
  },
  computed: {
    machinesGroups() {
      const groups = [];
      const machinesCount = this.machines.length;
      
      for (let i = 0; i < machinesCount; i += this.machinesPerPage) {
        groups.push(this.machines.slice(i, i + this.machinesPerPage));
      }
      
      return groups;
    },
    
    totalPages() {
      return this.machinesGroups.length;
    },

    // 将工序信息转为数组
    processStepsArray() {
      return Object.values(this.processSteps);
    }
  },
};
</script>
  
<style scoped>
.production-dashboard {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #020024 0%, #090979 35%, #00d4ff 100%);
  color: #ffffff;
  padding: 20px;
  overflow: hidden;
  position: relative;
}

.production-dashboard::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("/assets/circuit-pattern.png");
  opacity: 0.1;
  z-index: 0;
}

.fullscreen-mode {
  padding: 30px;
}

/* 头部样式 */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  margin-bottom: 20px;
  z-index: 1;
}

.dashboard-title {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title-text {
  font-size: 28px;
  font-weight: bold;
  letter-spacing: 2px;
  color: #fff;
  text-shadow: 0 0 10px rgba(0, 162, 255, 0.7);
}

.title-decoration {
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, transparent, #00a2ff, transparent);
  margin-top: 5px;
}

.line-selector {
  width: 200px;
  z-index: 10;
}

.header-actions {
  display: flex;
  align-items: center;
}

.real-time-info {
  margin-right: 20px;
  text-align: right;
}

.current-date {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.current-time {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
}

.fullscreen-btn {
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.fullscreen-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.icon-fullscreen,
.icon-exit-fullscreen {
  font-size: 20px;
  color: #fff;
}

/* 区域通用样式 */
.section-title {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  z-index: 1;
}

.section-title span {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  margin-right: 10px;
}

.divider {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.5), transparent);
}

/* 工单部分样式 */
.work-order-section {
  margin-bottom: 20px;
  z-index: 1;
}

.work-order-container {
  display: flex;
  background: rgba(0, 31, 63, 0.6);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(0, 162, 255, 0.3);
  border: 1px solid rgba(0, 162, 255, 0.3);
}

.work-order-info {
  flex: 2;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.work-order-info::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  width: 1px;
  height: 100%;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(0, 162, 255, 0.5),
    transparent
  );
}

.work-order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.work-order-no {
  font-size: 18px;
  font-weight: bold;
}

.highlight-text {
  color: #00ffcc;
}

.work-order-status {
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 14px;
  font-weight: bold;
}

.status-pending {
  background-color: rgba(255, 193, 7, 0.2);
  color: #ffc107;
  border: 1px solid rgba(255, 193, 7, 0.5);
}

.status-running {
  background-color: rgba(40, 167, 69, 0.2);
  color: #2ecc71;
  border: 1px solid rgba(46, 204, 113, 0.5);
}

.status-completed {
  background-color: rgba(0, 123, 255, 0.2);
  color: #3498db;
  border: 1px solid rgba(52, 152, 219, 0.5);
}

.status-cancelled,
.status-stopped {
  background-color: rgba(220, 53, 69, 0.2);
  color: #e74c3c;
  border: 1px solid rgba(231, 76, 60, 0.5);
}

.status-offline {
  background-color: rgba(108, 117, 125, 0.2);
  color: #95a5a6;
  border: 1px solid rgba(149, 165, 166, 0.5);
}

.status-online {
  background-color: rgba(40, 167, 69, 0.2);
  color: #2ecc71;
  border: 1px solid rgba(46, 204, 113, 0.5);
}

.work-order-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.item-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 5px;
}

.item-value {
  font-size: 16px;
  color: #fff;
}

.work-order-progress {
  flex: 1;
  padding: 20px;
  background: rgba(0, 39, 78, 0.4);
  display: flex;
  flex-direction: column;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.progress-percentage {
  font-size: 22px;
  font-weight: bold;
  color: #00ffcc;
}

.progress-bar-container {
  width: 100%;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 20px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #00c6ff, #0072ff);
  border-radius: 10px;
  transition: width 1s ease-in-out;
  position: relative;
  overflow: hidden;
}

.progress-bar::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.4) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  animation: shimmer 2s infinite;
}

.production-stats {
  display: flex;
  justify-content: space-around;
  margin-top: auto;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 5px;
}

.no-data {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  background: rgba(0, 31, 63, 0.6);
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 162, 255, 0.3);
  border: 1px solid rgba(0, 162, 255, 0.3);
}

.no-data-text {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.6);
}

/* 设备部分样式 */
.machines-section {
  z-index: 1;
}

.machines-carousel-container {
  display: flex;
  align-items: center;
  position: relative;
  margin-bottom: 15px;
}

.machines-carousel {
  width: 100%;
  overflow: hidden;
  position: relative;
}

.machines-carousel-wrapper {
  display: flex;
  transition: transform 0.5s ease;
}

.machines-carousel-page {
  min-width: 100%;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 15px;
  flex-shrink: 0;
}

.machine-card {
  background: rgba(0, 31, 63, 0.8);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 15px rgba(0, 162, 255, 0.3);
  border: 1px solid rgba(0, 162, 255, 0.5);
  height: 225px;
  position: relative;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
  z-index: 1;
}

.machine-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(0, 210, 255, 0.05), rgba(0, 37, 107, 0.1));
  z-index: -1;
}

.machine-card:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 10px 25px rgba(0, 162, 255, 0.5), 0 0 15px rgba(0, 255, 255, 0.3);
}

.card-decoration {
  position: absolute;
  height: 30px;
  width: 5px;
  background: rgba(0, 162, 255, 0.8);
  top: 50%;
  transform: translateY(-50%);
}

.card-decoration.left {
  left: 0;
  border-radius: 0 3px 3px 0;
  box-shadow: 0 0 10px rgba(0, 162, 255, 0.8);
  animation: pulse-blue 2s infinite alternate;
}

.card-decoration.right {
  right: 0;
  border-radius: 3px 0 0 3px;
  box-shadow: 0 0 10px rgba(0, 162, 255, 0.8);
  animation: pulse-blue 2s infinite alternate-reverse;
}

.glow-effect {
  position: absolute;
  width: 100%;
  height: 2px;
  bottom: 0;
  left: 0;
  background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.8), transparent);
  animation: glow-move 3s infinite;
}

.machine-sequence-number {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 25px;
  height: 25px;
  background: rgba(0, 162, 255, 0.8);
  color: white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 13px;
  font-weight: bold;
  z-index: 2;
  box-shadow: 0 0 10px rgba(0, 162, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.machine-header {
  padding: 10px 10px 10px 40px;
  background: linear-gradient(90deg, rgba(0, 39, 78, 0.8), rgba(0, 20, 50, 0.8));
  border-bottom: 1px solid rgba(0, 162, 255, 0.3);
  position: relative;
}

.machine-header::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.5), transparent);
}

.machine-name {
  font-size: 14px;
  margin-bottom: 5px;
  font-weight: bold;
  letter-spacing: 0.5px;
  text-shadow: 0 0 5px rgba(0, 162, 255, 0.5);
}

.machine-status {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  display: inline-block;
  font-weight: bold;
  letter-spacing: 0.5px;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
}

.machine-content {
  padding: 12px;
  height: calc(100% - 55px);
  position: relative;
}

.machine-info-mini {
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
}

.machine-info-mini .info-item {
  margin-bottom: 5px;
}

.machine-info-mini .item-label {
  font-size: 10px;
}

.machine-info-mini .item-value {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.process-status-mini {
  margin-top: 5px;
}

.process-status-mini .process-info {
  text-align: center;
  padding: 5px;
  font-size: 12px;
  border-radius: 4px;
}

.carousel-arrow {
  width: 40px;
  height: 40px;
  background: rgba(0, 31, 63, 0.6);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  z-index: 2;
  cursor: pointer;
  transition: all 0.3s ease;
}

.carousel-arrow:hover {
  background: rgba(0, 162, 255, 0.6);
}

.carousel-arrow.prev {
  left: -20px;
}

.carousel-arrow.next {
  right: -20px;
}

.carousel-indicators {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.carousel-indicators span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  margin: 0 5px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.carousel-indicators span.active {
  background: rgba(0, 162, 255, 0.8);
}

/* 动画效果 */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(0, 255, 204, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(0, 255, 204, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 255, 204, 0);
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.pulse-effect {
  position: relative;
}

.pulse-effect::after {
  content: "";
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background: rgba(0, 255, 204, 0.05);
  border-radius: 4px;
  animation: pulse 2s infinite;
}

/* 生产数据样式 */
.production-data {
  margin-top: 10px;
  border-top: 1px dashed rgba(255, 255, 255, 0.2);
  padding-top: 8px;
  position: relative;
}

.production-data::before {
  content: "";
  position: absolute;
  top: -1px;
  left: 0;
  width: 30%;
  height: 1px;
  background: rgba(0, 162, 255, 0.8);
}

.production-data-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.production-data-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  padding: 5px;
  transition: all 0.3s ease;
}

.production-data-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
}

.data-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 5px;
  position: relative;
  text-transform: uppercase;
}

.data-label::before {
  content: "";
  position: absolute;
  left: -10px;
  top: 50%;
  transform: translateY(-50%);
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(0, 162, 255, 0.8);
  display: none;
}

.data-value {
  font-size: 20px;
  font-weight: bold;
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;
  min-width: 50px;
  text-align: center;
}

.data-value.good {
  color: #2ecc71;
  text-shadow: 0 0 8px rgba(46, 204, 113, 0.5);
}

.data-value.pending {
  color: #ffc107;
  text-shadow: 0 0 8px rgba(52, 152, 219, 0.5);
}

.production-data-item:first-child {
  border-bottom: 2px solid rgba(46, 204, 113, 0.5);
}

.production-data-item:last-child {
  border-bottom: 2px solid rgba(52, 152, 219, 0.5);
}

@keyframes pulse-blue {
  0% {
    opacity: 0.6;
    box-shadow: 0 0 5px rgba(0, 162, 255, 0.5);
  }
  100% {
    opacity: 1;
    box-shadow: 0 0 15px rgba(0, 162, 255, 0.8);
  }
}

@keyframes pulse-green {
  0% {
    box-shadow: 0 0 5px rgba(46, 204, 113, 0.5);
  }
  100% {
    box-shadow: 0 0 10px rgba(46, 204, 113, 0.8);
  }
}

@keyframes glow-move {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* 响应式适配 */
@media screen and (max-width: 1400px) {
  .machines-carousel-page {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media screen and (max-width: 1100px) {
  .machines-carousel-page {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media screen and (max-width: 768px) {
  .machines-carousel-page {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media screen and (max-width: 576px) {
  .machines-carousel-page {
    grid-template-columns: 1fr;
  }
}

/* 小时产能区域样式 */
.hourly-overview {
  margin-bottom: 15px;
  display: flex;
  z-index: 1;
}

.overview-chart-container {
  flex: 1;
  height: 120px;
  background: rgba(0, 31, 63, 0.6);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 0 15px rgba(0, 162, 255, 0.3);
  border: 1px solid rgba(0, 162, 255, 0.3);
  padding: 8px;
  position: relative;
}

.overview-title {
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 5px;
  color: #fff;
  text-shadow: 0 0 5px rgba(0, 162, 255, 0.5);
}

.overview-chart {
  height: 85px;
  width: 100%;
}
</style>