<template>
  <div class="app-container">
    <!-- 搜索表单 -->
    <el-card class="filter-container">
      <div slot="header" class="clearfix">
        <span>筛选搜索</span>
      </div>
      <el-form :model="searchForm" ref="searchForm" class="demo-form-inline">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="工单号">
              <el-input
                v-model="searchForm.workOrderNo"
                placeholder="请输入工单号"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="物料编码">
              <el-input
                v-model="searchForm.materialNumber"
                placeholder="请输入物料编码"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="明码">
              <el-input
                v-model="searchForm.barcode"
                placeholder="请输入明码"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="暗码">
              <el-input
                v-model="searchForm.printBarcode"
                placeholder="请输入暗码"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="转换明码">
              <el-input
                v-model="searchForm.transformedBarcode"
                placeholder="请输入转换明码"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="转换暗码">
              <el-input
                v-model="searchForm.transformedPrintBarcode"
                placeholder="请输入转换暗码"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="批次号">
              <el-input
                v-model="searchForm.batchNo"
                placeholder="请输入批次号"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="状态">
              <el-select
                v-model="searchForm.status"
                placeholder="请选择状态"
                clearable
                style="width: 100%"
              >
                <el-option label="待使用" value="PENDING" />
                <el-option label="已使用" value="USED" />
                <el-option label="已作废" value="VOIDED" />
                <el-option label="已暂停" value="SUSPENDED" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item>
          <el-button type="primary" @click="search">查询搜索</el-button>
          <el-button @click="resetForm">重置</el-button>
          <el-button type="primary" icon="el-icon-plus" @click="handleGenerate"
            >批量生成</el-button
          >
          <el-button
            type="danger"
            icon="el-icon-delete"
            :disabled="!selection.length"
            @click="handleBatchVoid"
            >批量作废</el-button
          >
          <el-button type="success" @click="handleExport">导出数据</el-button>
          <el-button
            type="primary"
            icon="el-icon-printer"
            @click="handleBatchPrint"
            :loading="batchPrinting"
            >批量打印</el-button
          >
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 在工具栏按钮区域添加打印组件 -->
    <div class="screen1">
      <div class="screen_content">
        <div class="screen_content_first">
          <i class="el-icon-tickets">预生产条码列表</i>
          <hir-input
            ref="hirInput"
            :printData="printData"
            :default-template="localPrintTemplate"
            @template-change="handleTemplateChange"
          />
        </div>
      </div>
    </div>

    <!-- 条码列表 -->
    <el-card class="list-container">
      <el-table
        v-loading="listLoading"
        :data="barcodeList"
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="序号" prop="serialNumber" width="80" />
        <el-table-column label="明码" prop="barcode" />
        <el-table-column label="暗码" prop="printBarcode" />
        <el-table-column label="转换明码" prop="transformedBarcode">
          <template slot-scope="{ row }">
            {{ row.transformedBarcode || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="转换暗码" prop="transformedPrintBarcode">
          <template slot-scope="{ row }">
            {{ row.transformedPrintBarcode || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="工单号" prop="workOrderNo" />
        <el-table-column label="物料编码" prop="materialNumber" />
        <el-table-column label="物料名称" prop="materialName" />
        <el-table-column label="规则名称" prop="ruleName" />
        <el-table-column label="批次号" prop="batchNo" width="160" />
        <el-table-column label="状态" width="100">
          <template slot-scope="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="暂停信息" width="300">
          <template slot-scope="{ row }">
            <template v-if="row.status === 'SUSPENDED'">
              <div>暂停人: {{ row.suspendBy || "-" }}</div>
              <div>暂停时间: {{ formatDate(row.suspendAt) || "-" }}</div>
              <el-tooltip
                v-if="row.suspendReason"
                :content="row.suspendReason"
                placement="top"
              >
                <div class="ellipsis">暂停原因: {{ row.suspendReason }}</div>
              </el-tooltip>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="作废信息" width="300">
          <template slot-scope="{ row }">
            <template v-if="row.status === 'VOIDED'">
              <div>作废人: {{ row.voidBy || "-" }}</div>
              <div>作废时间: {{ formatDate(row.voidAt) || "-" }}</div>
              <el-tooltip
                v-if="row.voidReason"
                :content="row.voidReason"
                placement="top"
              >
                <div class="ellipsis">作废原因: {{ row.voidReason }}</div>
              </el-tooltip>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template slot-scope="scope">
            {{ formatDate(scope.row.createAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center">
          <template slot-scope="{ row }">
            <!-- <el-button
              v-if="row.status === 'PENDING'"
              type="text"
              size="small"
              @click="handleVoid(row)"
            >
              作废
            </el-button> -->
            <el-button
              v-if="row.status === 'PENDING'"
              type="text"
              size="small"
              @click="handleSuspend(row)"
            >
              暂停
            </el-button>
            <el-button
              v-if="row.status === 'SUSPENDED'"
              type="text"
              size="small"
              @click="handleResume(row)"
            >
              恢复
            </el-button>
            <el-button type="text" size="small" @click="handlePrint(row)">
              打印
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        :total="total"
        :page.sync="currentPage"
        :limit.sync="pageSize"
        @pagination="fetchData"
      />
    </el-card>

    <!-- 批量生成对话框 -->
    <el-dialog
      title="批量生成条码"
      :visible.sync="generateDialogVisible"
      width="50%"
    >
      <el-form
        :model="generateForm"
        ref="generateForm"
        :rules="generateRules"
        label-width="100px"
      >
        <el-form-item label="工单" prop="workOrderId">
          <el-select
            v-model="generateForm.workOrderId"
            placeholder="请选择工单"
            filterable
            style="width: 100%"
            @change="handleWorkOrderChange"
          >
            <el-option
              v-for="item in workOrderOptions"
              :key="item._id"
              :label="item.workOrderNo"
              :value="item._id"
            >
              <span>{{ item.workOrderNo }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">
                {{ item.materialName }}
              </span>
            </el-option>
          </el-select>
        </el-form-item>

        <!-- 添加产线编码显示 -->
        <el-form-item label="产线编码">
          <el-input v-model="generateForm.lineNum" disabled />
        </el-form-item>

        <el-form-item label="生成数量" prop="quantity">
          <el-input-number
            v-model="generateForm.quantity"
            :min="1"
            :max="maxQuantity"
          />
          <span style="margin-left: 10px; color: #909399">
            剩余可生成：{{ maxQuantity }}
          </span>
        </el-form-item>
        <el-form-item label="起始序号" prop="startNumber">
          <el-input-number
            disabled
            v-model="generateForm.startNumber"
            :min="1"
          />
        </el-form-item>
        <el-form-item label="打印批次" prop="batchNo">
          <el-input
            v-model="generateForm.batchNo"
            placeholder="请输入打印批次"
            :disabled="true"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="generateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitGenerate">确定生成</el-button>
      </div>
    </el-dialog>

    <!-- 作废对话框 -->
    <el-dialog title="条码作废" :visible.sync="voidDialogVisible" width="40%">
      <el-form
        :model="voidForm"
        ref="voidForm"
        :rules="voidRules"
        label-width="100px"
      >
        <el-form-item label="作废原因" prop="reason">
          <el-input
            type="textarea"
            v-model="voidForm.reason"
            :rows="3"
            placeholder="请输入作废原因"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="voidDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitVoid">确定作废</el-button>
      </div>
    </el-dialog>

    <!-- 添加暂停对话框 -->
    <el-dialog
      title="条码暂停"
      :visible.sync="suspendDialogVisible"
      width="40%"
    >
      <el-form
        :model="suspendForm"
        ref="suspendForm"
        :rules="suspendRules"
        label-width="100px"
      >
        <el-form-item label="暂停原因" prop="reason">
          <el-input
            type="textarea"
            v-model="suspendForm.reason"
            :rows="3"
            placeholder="请输入暂停原因"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="suspendDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSuspend">确定暂停</el-button>
      </div>
    </el-dialog>

    <!-- 修改批量打印对话框 -->
    <el-dialog
      title="批量打印"
      :visible.sync="batchPrintDialogVisible"
      width="70%"
    >
      <div class="batch-print-container">
        <div class="print-settings">
          <!-- 添加搜索条件 -->
          <el-form
            :model="printSearchForm"
            ref="printSearchForm"
            label-width="100px"
          >
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="工单号">
                  <el-input
                    v-model="printSearchForm.workOrderNo"
                    placeholder="请输入工单号"
                    clearable
                  ></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="物料编码">
                  <el-input
                    v-model="printSearchForm.materialNumber"
                    placeholder="请输入物料编码"
                    clearable
                  ></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="明码">
                  <el-input
                    v-model="printSearchForm.barcode"
                    placeholder="请输入明码"
                    clearable
                  ></el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="暗码">
                  <el-input
                    v-model="printSearchForm.printBarcode"
                    placeholder="请输入暗码"
                    clearable
                  ></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="批次号">
                  <el-input
                    v-model="printSearchForm.batchNo"
                    placeholder="请输入批次号"
                    clearable
                  ></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="状态">
                  <el-select
                    v-model="printSearchForm.status"
                    placeholder="请选择状态"
                    clearable
                    style="width: 100%"
                  >
                    <el-option label="待使用" value="PENDING" />
                    <el-option label="已使用" value="USED" />
                    <el-option label="已作废" value="VOIDED" />
                    <el-option label="已暂停" value="SUSPENDED" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24" style="text-align: right">
                <el-form-item>
                  <el-button type="primary" @click="searchPrintData"
                    >查询</el-button
                  >
                  <el-button @click="resetPrintSearch">重置</el-button>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>

          <el-divider></el-divider>

          <el-form :model="printSettings" label-width="100px">
            <el-form-item label="打印数量">
              <span>当前搜索结果共 {{ printDataList.length }} 条记录</span>
            </el-form-item>
            <el-form-item label="打印模板">
              <hir-input
                ref="batchPrintHirInput"
                :print-data="currentPrintData"
                :print-data-list="printDataList"
                :default-template="localPrintTemplate"
                @template-change="handleTemplateChange"
              />
            </el-form-item>
          </el-form>
        </div>
        <div class="print-list">
          <el-table
            :data="printDataList"
            height="400"
            border
            style="width: 100%"
          >
            <el-table-column type="index" label="序号" width="50" />
            <el-table-column prop="barcode" label="条码" />
            <el-table-column prop="workOrderNo" label="工单号" />
            <el-table-column prop="materialNumber" label="物料编码" />
            <el-table-column prop="materialName" label="物料名称" />
            <el-table-column prop="lineNum" label="产线编码" />
            <el-table-column prop="batchNo" label="打印批次" />
            <el-table-column label="状态" width="100">
              <template slot-scope="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="batchPrintDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="executeBatchPrint"
          :loading="printing"
        >
          开始打印
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getData, addData, updateData } from "@/api/data";
import HirInput from "@/components/hirInput";

export default {
  name: "PreProductionBarcode",
  components: {
    HirInput,
  },
  data() {
    return {
      // 搜索表单
      searchForm: {
        workOrderNo: "",
        materialNumber: "",
        barcode: "",
        printBarcode: "",
        transformedBarcode: "",
        transformedPrintBarcode: "",
        status: "",
        batchNo: "",
      },

      // 列表数据
      barcodeList: [],
      listLoading: false,
      selection: [],
      total: 0,
      currentPage: 1,
      pageSize: 10,

      // 批量生成相关
      generateDialogVisible: false,
      generateForm: {
        workOrderId: "",
        startNumber: 1,
        quantity: 1,
        fieldValues: {},
        batchNo: "",
        lineNum: "",
      },
      generateRules: {
        workOrderId: [
          { required: true, message: "请选择工单", trigger: "change" },
        ],
        quantity: [
          { required: true, message: "请输入生成数量", trigger: "blur" },
        ],
        startNumber: [
          { required: true, message: "请输入起始序号", trigger: "blur" },
        ],
        // fieldValues 的验证规则会在 handleWorkOrderChange 中动态添加
      },
      workOrderOptions: [],
      maxQuantity: 0,
      currentWorkOrder: null,

      // 作废相关
      voidDialogVisible: false,
      voidForm: {
        ids: [],
        reason: "",
      },
      voidRules: {
        reason: [
          { required: true, message: "请输入作废原因", trigger: "blur" },
        ],
      },
      printData: {},
      printTemplate: null,

      // 批量打印相关
      batchPrintDialogVisible: false,
      printDataList: [],
      printing: false,
      batchPrinting: false, // 添加批量打印按钮的loading状态
      currentPrintData: {},
      // 添加打印搜索表单
      printSearchForm: {
        workOrderNo: "",
        materialNumber: "",
        barcode: "",
        printBarcode: "",
        status: "PENDING", // 默认待使用状态
        batchNo: "",
      },

      // 添加暂停对话框
      suspendDialogVisible: false,
      suspendForm: {
        id: "",
        reason: "",
      },
      suspendRules: {
        reason: [
          { required: true, message: "请输入暂停原因", trigger: "blur" },
        ],
      },
    };
  },

  computed: {
    localPrintTemplate: {
      get() {
        try {
          const savedTemplate = localStorage.getItem(
            "printTemplate_preProductionBarcode"
          );
          return savedTemplate ? JSON.parse(savedTemplate) : null;
        } catch (error) {
          console.error("解析缓存模板失败:", error);
          return null;
        }
      },
      set(value) {
        try {
          localStorage.setItem(
            "printTemplate_preProductionBarcode",
            JSON.stringify(value)
          );
        } catch (error) {
          console.error("保存模板到缓存失败:", error);
        }
      },
    },
  },

  created() {
    this.fetchData();

    // 加载本地缓存的打印模板
    const savedTemplate = this.localPrintTemplate;
    if (savedTemplate) {
      this.$nextTick(() => {
        if (this.$refs.hirInput) {
          this.$refs.hirInput.handleTemplateChange(savedTemplate);
        }
      });
    }
  },

  methods: {
    // 获取状态标签类型
    getStatusType(status) {
      const statusMap = {
        PENDING: "info",
        USED: "success",
        VOIDED: "danger",
        SUSPENDED: "warning",
      };
      return statusMap[status] || "info";
    },

    // 获取状态显示文本
    getStatusText(status) {
      const statusMap = {
        PENDING: "待使用",
        USED: "已使用",
        VOIDED: "已作废",
        SUSPENDED: "已暂停",
      };
      return statusMap[status] || status;
    },

    // 查询列表
    async fetchData() {
      this.listLoading = true;
      try {
        const query = this.buildQuery();
        const result = await getData("preProductionBarcode", {
          query,
          page: this.currentPage,
          limit: this.pageSize,
          skip: (this.currentPage - 1) * this.pageSize,
          sort: { createAt: -1, serialNumber: -1 },
          count: true,
        });

        this.barcodeList = result.data;
        this.total = result.countnum;
      } catch (error) {
        console.error("获取数据失败:", error);
        this.$message.error("获取数据失败");
      } finally {
        this.listLoading = false;
      }
    },

    // 构建查询条件
    buildQuery() {
      const query = {};
      if (this.searchForm.workOrderNo) {
        query.workOrderNo = {
          $regex: this.searchForm.workOrderNo,
          $options: "i",
        };
      }
      if (this.searchForm.materialNumber) {
        query.materialNumber = {
          $regex: this.searchForm.materialNumber,
          $options: "i",
        };
      }
      if (this.searchForm.barcode) {
        query.barcode = { $regex: this.searchForm.barcode, $options: "i" };
      }
      if (this.searchForm.printBarcode) {
        query.printBarcode = {
          $regex: this.searchForm.printBarcode,
          $options: "i",
        };
      }
      if (this.searchForm.transformedBarcode) {
        query.transformedBarcode = {
          $regex: this.searchForm.transformedBarcode,
          $options: "i",
        };
      }
      if (this.searchForm.transformedPrintBarcode) {
        query.transformedPrintBarcode = {
          $regex: this.searchForm.transformedPrintBarcode,
          $options: "i",
        };
      }
      if (this.searchForm.status) {
        query.status = this.searchForm.status;
      }
      if (this.searchForm.batchNo) {
        query.batchNo = { $regex: this.searchForm.batchNo, $options: "i" };
      }
      return query;
    },

    // 打开批量生成对话框
    async handleGenerate() {
      try {
        // 获取未完成的工单列表
        const result = await getData("production_plan_work_order", {
          // query: { status: { $in: ['PENDING', 'IN_PROGRESS'] } }
        });
        this.workOrderOptions = result.data;

        // 生成批次号：当前时间戳
        const timestamp = new Date().getTime();
        this.generateForm.batchNo = `B${timestamp}`;

        this.generateDialogVisible = true;
      } catch (error) {
        console.error("获取工单列表失败:", error);
        this.$message.error("获取工单列表失败");
      }
    },

    // 工单选择变更
    async handleWorkOrderChange(workOrderId) {
      try {
        // 获取工单详情
        const workOrder = this.workOrderOptions.find(
          (item) => item._id === workOrderId
        );

        console.log(workOrder, "工单数据");

        // 获取产线编号
        const lineResult = await getData("production_line", {
          query: { _id: workOrder.productionLineId },
        });

        if (!lineResult.data || !lineResult.data.length) {
          this.$message.warning("未找到工单对应的产线信息");
          return;
        }

        const lineNum = lineResult.data[0].lineNum;
        this.generateForm.lineNum = lineNum;
        workOrder.lineNum = lineNum;
        this.currentWorkOrder = workOrder;

        // 验证物料是否绑定了条码规则
        const ruleResult = await getData("barcodeSegmentRuleMaterial", {
          query: {
            materialId: workOrder.materialId,
            enabled: true,
          },
        });

        if (!ruleResult.data || !ruleResult.data.length) {
          this.$message.warning("该工单对应的物料未绑定条码规则，请先绑定规则");
          this.generateForm.workOrderId = "";
          return;
        }

        // 获取规则详情
        const ruleDetail = await getData("BarcodeSegmentRule", {
          query: {
            _id: ruleResult.data[0].ruleId,
            enabled: true,
          },
        });

        if (!ruleDetail.data || !ruleDetail.data.length) {
          this.$message.error("获取条码规则详情失败");
          return;
        }

        const rule = ruleDetail.data[0];

        // 重置 fieldValues 对象
        this.$set(this.generateForm, "fieldValues", {});

        // 检查并收集缺失的字段
        const missingFields = [];

        // 从工单中获取字段映射值并检查
        rule.segments.forEach((segment) => {
          if (segment.type === "fieldMapping" && segment.config.mappingField) {
            const fieldValue =
              this.currentWorkOrder[segment.config.mappingField];
            if (
              fieldValue === undefined ||
              fieldValue === null ||
              fieldValue === ""
            ) {
              missingFields.push({
                field: segment.config.mappingField,
                label: segment.config.label || segment.config.mappingField,
              });
            } else {
              this.$set(
                this.generateForm.fieldValues,
                segment.config.mappingField,
                fieldValue
              );
            }
          }
        });

        // 如果有缺失字段，显示提示并重置工单选择
        if (missingFields.length > 0) {
          const missingFieldsStr = missingFields.map((f) => f.label).join("、");
          this.$message.warning(
            `工单缺少必要字段：${missingFieldsStr}，请完善工单信息后再生成条码`
          );
          this.generateForm.workOrderId = "";
          return;
        }

        //获取相同的销售订单的工单ids
        const sameSaleOrderResult = await getData(
          "production_plan_work_order",
          {
            query: {
              saleOrderId: workOrder.saleOrderId,
              status: { $ne: "VOIDED" },
            },
          }
        );
        const sameSaleOrderIds = sameSaleOrderResult.data.map(
          (item) => item._id
        );
        console.log(sameSaleOrderIds, "相同的销售订单的工单ids");

        // 获取已生成的条码数量和最大序号（排除已作废的）
        const [countResult, maxSerialResult] = await Promise.all([
          getData("preProductionBarcode", {
            query: {
              workOrderId: { $in: sameSaleOrderIds },
              status: { $ne: "VOIDED" },
            },
            count: true,
          }),
          getData("preProductionBarcode", {
            query: {
              workOrderId: { $in: sameSaleOrderIds },
              "segmentBreakdown.value": lineNum,
              status: { $ne: "VOIDED" },
              createAt: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0)), // 当天开始时间
                $lt: new Date(new Date().setHours(23, 59, 59, 999)), // 当天结束时间
              },
            },
            sort: { serialNumber: -1 },
            limit: 1,
          }),
        ]);

        // 计算剩余可生成数量
        this.maxQuantity =
          workOrder.planProductionQuantity - (countResult.countnum || 0);

        // 设置起始序号为最大序号+1或1
        this.generateForm.startNumber =
          maxSerialResult.data && maxSerialResult.data.length > 0
            ? maxSerialResult.data[0].serialNumber + 1
            : 1;

        // 重置生成数量
        this.generateForm.quantity = Math.min(
          this.generateForm.quantity,
          this.maxQuantity
        );
      } catch (error) {
        console.error("获取工单信息失败:", error);
        this.$message.error("获取工单信息失败");
      }
    },

    // 修改 generateBarcode 方法
    async generateBarcode(rule, workOrder, serialNumber) {
      try {
        const segments = [];
        const displayValues = [];
        const printValues = [];
        const transformedValues = [];
        const transformedPrintValues = [];
        let hasTransform = false;

        // 遍历规则的每个段落
        for (const segment of rule.segments) {
          // 生成段落值
          const segmentResult = await this.generateSegmentValue(segment, {
            date: new Date(),
            sequence: serialNumber,
            fieldValues: workOrder,
          });

          // 保存段落明细
          segments.push({
            name: segment.name,
            value: segmentResult.basic,
            transformedValue: segmentResult.transformed,
            config: segment.config,
          });

          // 基础值处理
          let baseValue = segmentResult.basic;
          let displayValue = baseValue;
          let printValue = baseValue;

          // 明码处理（默认显示前缀和后缀）
          if (segment.config.prefix) {
            displayValue = segment.config.prefix + displayValue;
          }
          if (segment.config.suffix) {
            displayValue = displayValue + segment.config.suffix;
          }
          displayValues.push(displayValue);

          // 暗码处理（只在showPrefix/showSuffix为true时显示）
          if (segment.config.prefix && segment.config.showPrefix === true) {
            printValue = segment.config.prefix + printValue;
          }
          if (segment.config.suffix && segment.config.showSuffix === true) {
            printValue = printValue + segment.config.suffix;
          }
          printValues.push(printValue);

          // 转换值处理
          if (segmentResult.transformed) {
            hasTransform = true;
            let transformedBase = segmentResult.transformed;
            let transformedValue = transformedBase;
            let transformedPrintValue = transformedBase;

            // 转换后的明码
            if (segment.config.prefix) {
              transformedValue = segment.config.prefix + transformedValue;
            }
            if (segment.config.suffix) {
              transformedValue = transformedValue + segment.config.suffix;
            }
            transformedValues.push(transformedValue);

            // 转换后的暗码
            if (segment.config.prefix && segment.config.showPrefix === true) {
              transformedPrintValue =
                segment.config.prefix + transformedPrintValue;
            }
            if (segment.config.suffix && segment.config.showSuffix === true) {
              transformedPrintValue =
                transformedPrintValue + segment.config.suffix;
            }
            transformedPrintValues.push(transformedPrintValue);
          } else {
            transformedValues.push(displayValue);
            transformedPrintValues.push(printValue);
          }
        }

        return {
          barcode: displayValues.join(""),
          printBarcode: printValues.join(""),
          transformedBarcode: hasTransform ? transformedValues.join("") : null,
          transformedPrintBarcode: hasTransform
            ? transformedPrintValues.join("")
            : null,
          segmentBreakdown: segments,
        };
      } catch (error) {
        console.error("生成条码失败:", error);
        throw new Error(`生成条码失败: ${error.message}`);
      }
    },

    // 修改 generateSegmentValue 方法
    async generateSegmentValue(segment, params) {
      let basic = "";
      let transformed = null;

      switch (segment.type) {
        case "constant":
          basic = segment.config.constantValue;
          // 常量类型的转换处理
          if (segment.config.enableTransform && segment.config.transformValue) {
            transformed = segment.config.transformValue;
          }
          break;

        case "fieldMapping":
          basic = params.fieldValues[segment.config.mappingField] || "";
          // 字段映射的转换处理
          if (
            segment.config.fieldMappings &&
            segment.config.fieldMappings.length
          ) {
            const mapping = segment.config.fieldMappings.find(
              (m) => m.value === basic
            );
            if (mapping) {
              basic = mapping.code;
              // 如果有转换值，使用转换值
              if (mapping.transformValue) {
                transformed = mapping.transformValue;
              }
            }
          }
          break;

        case "date":
          basic = this.formatDateWithMappings(params.date, segment.config);
          // 日期类型的转换处理 - 使用相同的映射逻辑但可能有不同的转换值
          if (segment.config.enableTransform && segment.config.transformValue) {
            // 创建一个新的配置对象，包含转换值
            const transformConfig = { ...segment.config };
            // 如果有特定的转换映射，使用它们
            if (segment.config.transformYearMappings) {
              transformConfig.yearMappings =
                segment.config.transformYearMappings;
            }
            if (segment.config.transformMonthMappings) {
              transformConfig.monthMappings =
                segment.config.transformMonthMappings;
            }
            if (segment.config.transformDayMappings) {
              transformConfig.dayMappings = segment.config.transformDayMappings;
            }
            transformed = this.formatDateWithMappings(
              params.date,
              transformConfig
            );
          }
          break;

        case "sequence":
          // 如果是序列号类型，且配置了按产线重置
          if (segment.config.resetByLine) {
            basic = this.formatSequenceWithPositionMapping(params.sequence, {
              ...segment.config,
              lineNum: params.fieldValues.lineNum,
            });
          } else {
            basic = this.formatSequenceWithPositionMapping(
              params.sequence,
              segment.config
            );
          }

          if (segment.config.enableTransform && segment.config.transformValue) {
            // 创建一个新的配置对象用于转换
            const transformConfig = { ...segment.config };
            // 如果有特定的转换映射，使用它们
            if (segment.config.transformNumberMappings) {
              transformConfig.numberMappings =
                segment.config.transformNumberMappings;
            }

            transformed = this.formatSequenceWithPositionMapping(
              params.sequence,
              {
                ...transformConfig,
                lineNum: params.fieldValues.lineNum,
              }
            );
          }
          break;
      }

      return {
        basic,
        transformed,
      };
    },

    formatDateWithMappings(date, format) {
      let value = this.formatDate(date, format.dateFormat);
      const dateFormat = format.dateFormat || "";

      // 解析日期格式，找出年月日的位置
      const yearPos = dateFormat.indexOf("YYYY");
      const monthPos = dateFormat.indexOf("MM");
      const dayPos = dateFormat.indexOf("DD");

      // 只有在格式中存在且有映射时才应用映射
      if (yearPos !== -1 && format.yearMappings && format.yearMappings.length) {
        const yearStr = value.substring(yearPos, yearPos + 4);
        const mapping = format.yearMappings.find((m) => m.value === yearStr);
        if (mapping) {
          value =
            value.substring(0, yearPos) +
            mapping.code +
            value.substring(yearPos + 4);
        }
      }

      if (
        monthPos !== -1 &&
        format.monthMappings &&
        format.monthMappings.length
      ) {
        const monthStr = value.substring(monthPos, monthPos + 2);
        const mapping = format.monthMappings.find((m) => m.value === monthStr);
        if (mapping) {
          value =
            value.substring(0, monthPos) +
            mapping.code +
            value.substring(monthPos + 2);
        }
      }

      if (dayPos !== -1 && format.dayMappings && format.dayMappings.length) {
        const dayStr = value.substring(dayPos, dayPos + 2);
        const mapping = format.dayMappings.find((m) => m.value === dayStr);
        if (mapping) {
          value =
            value.substring(0, dayPos) +
            mapping.code +
            value.substring(dayPos + 2);
        }
      }

      return value;
    },

    formatSequenceWithPositionMapping(sequence, config) {
      let value = String(sequence).padStart(config.length, config.padChar);

      if (config.numberMappings && config.numberMappings.length) {
        const chars = value.split("");
        config.numberMappings.forEach((mapping) => {
          if (mapping.position && mapping.position <= chars.length) {
            const pos = mapping.position - 1;
            if (chars[pos] === mapping.value) {
              chars[pos] = mapping.code;
            }
          }
        });
        value = chars.join("");
      }

      return value;
    },

    // 修改 submitGenerate 方法中调用 generateBarcode 的部分
    async submitGenerate() {
      try {
        await this.$refs.generateForm.validate();

        if (this.generateForm.quantity > this.maxQuantity) {
          this.$message.warning("生成数量超过剩余可生成数量");
          return;
        }

        // 获取物料对应的条码规则
        const ruleResult = await getData("barcodeSegmentRuleMaterial", {
          query: {
            materialId: this.currentWorkOrder.materialId,
            enabled: true,
          },
        });

        if (!ruleResult.data || !ruleResult.data.length) {
          this.$message.error("该物料未绑定条码规则");
          return;
        }

        // 获取完整的规则信息
        const ruleDetail = await getData("BarcodeSegmentRule", {
          query: {
            _id: ruleResult.data[0].ruleId,
            enabled: true,
          },
        });

        if (!ruleDetail.data || !ruleDetail.data.length) {
          this.$message.error("获取条码规则详情失败");
          return;
        }

        const rule = ruleDetail.data[0];

        // 构建条码记录
        const barcodes = [];
        for (let i = 0; i < this.generateForm.quantity; i++) {
          try {
            const serialNumber = this.generateForm.startNumber + i;
            const barcodeResult = await this.generateBarcode(
              rule,
              {
                ...this.currentWorkOrder,
                ...this.generateForm.fieldValues,
              },
              serialNumber
            );

            if (!barcodeResult.barcode) {
              throw new Error("生成的条码为空");
            }

            barcodes.push({
              workOrderId: this.generateForm.workOrderId,
              workOrderNo: this.currentWorkOrder.workOrderNo,
              materialId: this.currentWorkOrder.materialId,
              materialNumber: this.currentWorkOrder.materialNumber,
              materialName: this.currentWorkOrder.materialName,
              ruleId: rule._id,
              ruleName: rule.name,
              ruleCode: rule.code,
              // 基础条码
              barcode: barcodeResult.barcode,
              printBarcode: barcodeResult.printBarcode,
              // 转换后的条码
              transformedBarcode: barcodeResult.transformedBarcode,
              transformedPrintBarcode: barcodeResult.transformedPrintBarcode,
              // 段落明细
              segmentBreakdown: barcodeResult.segmentBreakdown,
              serialNumber,
              batchNo: this.generateForm.batchNo,
              // 添加产线相关信息
              lineNum: this.generateForm.lineNum,
              productionLineId: this.currentWorkOrder.productionLineId,
              status: "PENDING",
              creator: this.$store.state.user.name,
              createAt: new Date(),
            });
          } catch (error) {
            console.error(`生成第 ${i + 1} 个条码时出错:`, error);
            throw error;
          }
        }

        // 检查条码是否已存在（排除已作废的），按批次查询避免条件过大
        const batchSize = 100; // 每批次查询的条码数量
        let allExistingBarcodes = { data: [] };

        // 对明码和转换明码分别进行批量查询
        const regularBarcodes = barcodes.map((item) => item.barcode);
        const transformedBarcodes = barcodes
          .map((item) => item.transformedBarcode)
          .filter(Boolean);

        // 查询普通条码
        for (let i = 0; i < regularBarcodes.length; i += batchSize) {
          const batchBarcodes = regularBarcodes.slice(i, i + batchSize);
          const batchResult = await getData("preProductionBarcode", {
            query: {
              barcode: { $in: batchBarcodes },
              status: { $ne: "VOIDED" },
            },
          });

          if (batchResult.data && batchResult.data.length > 0) {
            allExistingBarcodes.data = [
              ...allExistingBarcodes.data,
              ...batchResult.data,
            ];
          }
        }

        // 如果有转换明码，也需要查询
        if (transformedBarcodes.length > 0) {
          for (let i = 0; i < transformedBarcodes.length; i += batchSize) {
            const batchTransformedBarcodes = transformedBarcodes.slice(
              i,
              i + batchSize
            );
            const batchResult = await getData("preProductionBarcode", {
              query: {
                transformedBarcode: { $in: batchTransformedBarcodes },
                status: { $ne: "VOIDED" },
              },
            });

            if (batchResult.data && batchResult.data.length > 0) {
              allExistingBarcodes.data = [
                ...allExistingBarcodes.data,
                ...batchResult.data,
              ];
            }
          }
        }

        // 检查是否有重复条码
        if (allExistingBarcodes.data && allExistingBarcodes.data.length > 0) {
          const duplicates = allExistingBarcodes.data.map((item) => ({
            barcode: item.barcode,
            transformedBarcode: item.transformedBarcode,
            workOrderNo: item.workOrderNo,
            serialNumber: item.serialNumber,
            status: item.status,
          }));

          console.error("重复的条码:", duplicates);
          this.$message.error(
            `存在重复的条码，请调整起始序号。重复条码: ${duplicates
              .map((d) => d.transformedBarcode || d.barcode)
              .join(", ")}`
          );
          return;
        }

        // 按批次提交条码数据
        for (let i = 0; i < barcodes.length; i += batchSize) {
          const batchBarcodes = barcodes.slice(i, i + batchSize);
          await addData("preProductionBarcode", batchBarcodes);

          // 显示进度
          const progress = Math.min(
            100,
            Math.round(((i + batchSize) / barcodes.length) * 100)
          );
          this.$message({
            type: "info",
            message: `正在保存条码数据：${progress}%`,
            duration: 1000,
          });
        }

        this.$message.success(`成功生成 ${barcodes.length} 个条码`);

        // 重置表单和关闭对话框
        this.resetGenerateForm();
        this.generateDialogVisible = false;
        this.fetchData();
      } catch (error) {
        console.error("生成条码失败:", error);
        this.$message.error("生成条码失败: " + error.message);
      }
    },

    // 添加重置方法
    resetGenerateForm() {
      // 重置表单数据
      this.generateForm = {
        workOrderId: "",
        quantity: 1,
        startNumber: 1,
        batchNo: "",
        fieldValues: {},
        lineNum: "",
      };

      // 清除工单相关信息
      this.currentWorkOrder = null;

      // 重置表单验证
      if (this.$refs.generateForm) {
        this.$refs.generateForm.resetFields();
      }
    },

    // 作废条码
    handleVoid(row) {
      this.voidForm.ids = [row._id];
      this.voidDialogVisible = true;
    },

    // 批量作废
    handleBatchVoid() {
      const pendingBarcodes = this.selection.filter(
        (item) => item.status === "PENDING"
      );
      if (!pendingBarcodes.length) {
        this.$message.warning("请选择待使用的条码进行作废");
        return;
      }
      this.voidForm.ids = pendingBarcodes.map((item) => item._id);
      this.voidDialogVisible = true;
    },

    // 提交作废
    async submitVoid() {
      try {
        await this.$refs.voidForm.validate();

        await updateData("preProductionBarcode", {
          query: { _id: { $in: this.voidForm.ids } },
          update: {
            status: "VOIDED",
            voidReason: this.voidForm.reason,
            voidBy: this.$store.state.user.name,
            voidAt: new Date(),
            updater: this.$store.state.user.name,
            updateAt: new Date(),
          },
        });

        this.$message.success("作废成功");
        this.voidDialogVisible = false;
        this.fetchData();
      } catch (error) {
        console.error("作废失败:", error);
        this.$message.error("作废失败");
      }
    },

    // 导出数据
    async handleExport() {
      try {
        const query = this.buildQuery();
        const result = await getData("preProductionBarcode", {
          query,
          sort: { serialNumber: 1 },
          limit: 100000,
        });

        const data = result.data.map((item) => ({
          序号: item.serialNumber,
          条码: item.barcode,
          工单号: item.workOrderNo,
          物料编码: item.materialNumber,
          物料名称: item.materialName,
          规则名称: item.ruleName,
          批次号: item.batchNo,
          状态: this.getStatusText(item.status),
          创建时间: this.formatDate(item.createAt),
          作废原因: item.voidReason || "",
          作废人: item.voidBy || "",
          作废时间: item.voidAt ? this.formatDate(item.voidAt) : "",
        }));

        // 使用 xlsx 导出
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "预生产条码");
        XLSX.writeFile(wb, "预生产条码数据.xlsx");
      } catch (error) {
        console.error("导出失败:", error);
        this.$message.error("导出失败");
      }
    },

    // 格式化日期
    formatDate(date, format = "YYYY-MM-DD HH:mm:ss") {
      if (!date) return "";
      if (!format) return "";

      try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return "";

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");
        const seconds = String(d.getSeconds()).padStart(2, "0");

        let result = format
          .replace("YYYY", year)
          .replace("MM", month)
          .replace("DD", day)
          .replace("HH", hours)
          .replace("mm", minutes)
          .replace("ss", seconds);

        return result;
      } catch (error) {
        console.error("日期格式化错误:", error);
        return "";
      }
    },

    handleSelectionChange(selection) {
      this.selection = selection;
    },

    search() {
      this.currentPage = 1;
      this.fetchData();
    },

    resetForm() {
      this.$refs.searchForm.resetFields();
      this.searchForm = {
        workOrderNo: "",
        materialNumber: "",
        barcode: "",
        printBarcode: "",
        transformedBarcode: "",
        transformedPrintBarcode: "",
        status: "",
        batchNo: "",
      };
      this.currentPage = 1;
      this.fetchData();
    },

    handlePrint(row) {
      let printData = { ...row };
      printData.createAt = this.formatDate(row.createAt);
      // 使用暗码进行打印
      printData.printBarcodeText = row.printBarcode.substring(
        row.printBarcode.length - 13
      ); // 截取后13位
      this.printData = printData;
      console.log(this.printData);
      this.$nextTick(() => {
        this.$refs.hirInput.handlePrints();
      });
    },

    handleTemplateChange(template) {
      if (!template) return;

      try {
        this.printTemplate = template;
        this.localPrintTemplate = template;
        this.$message.success("打印模板已保存到本地");
      } catch (error) {
        console.error("保存打印模板失败:", error);
        this.$message.error("保存打印模板失败");
      }
    },

    // 处理每页显示数量变化
    handleSizeChange(val) {
      this.pageSize = val;
      this.fetchData();
    },

    // 处理页码变化
    handleCurrentChange(val) {
      this.currentPage = val;
      this.fetchData();
    },

    // 处理批量打印按钮点击
    async handleBatchPrint() {
      if (this.batchPrinting) return; // 如果正在打印中，则不响应点击

      this.batchPrinting = true; // 设置按钮loading状态
      try {
        this.printing = false;
        this.batchPrintDialogVisible = true;
        // 打开对话框后立即执行一次搜索
        await this.searchPrintData();
      } catch (error) {
        console.error("打开批量打印对话框失败:", error);
        this.$message.error("打开批量打印对话框失败");
      } finally {
        this.batchPrinting = false; // 恢复按钮状态
      }
    },

    // 搜索打印数据
    async searchPrintData() {
      try {
        const query = this.buildPrintQuery();
        const result = await getData("preProductionBarcode", {
          query,
          sort: { serialNumber: -1 },
          limit: 1000,
        });

        if (!result.data || result.data.length === 0) {
          this.$message.warning("没有找到符合条件的数据");
          this.printDataList = [];
          return;
        }

        // 处理打印数据
        this.printDataList = result.data.map((item) => ({
          ...item,
          createAt: this.formatDate(item.createAt),
          printBarcodeText: item.printBarcode.substring(
            item.printBarcode.length - 13
          ),
        }));

        // 设置第一条数据作为模板预览数据
        this.currentPrintData = this.printDataList[0];
      } catch (error) {
        console.error("获取打印数据失败:", error);
        this.$message.error("获取打印数据失败");
        this.printDataList = [];
      }
    },

    // 构建打印查询条件
    buildPrintQuery() {
      const query = {};

      if (this.printSearchForm.workOrderNo) {
        query.workOrderNo = {
          $regex: this.printSearchForm.workOrderNo,
          $options: "i",
        };
      }
      if (this.printSearchForm.materialNumber) {
        query.materialNumber = {
          $regex: this.printSearchForm.materialNumber,
          $options: "i",
        };
      }
      if (this.printSearchForm.barcode) {
        query.barcode = { $regex: this.printSearchForm.barcode, $options: "i" };
      }
      if (this.printSearchForm.printBarcode) {
        query.printBarcode = {
          $regex: this.printSearchForm.printBarcode,
          $options: "i",
        };
      }
      if (this.printSearchForm.status) {
        query.status = this.printSearchForm.status;
      }
      if (this.printSearchForm.batchNo) {
        query.batchNo = { $regex: this.printSearchForm.batchNo, $options: "i" };
      }

      return query;
    },

    // 重置打印搜索条件
    resetPrintSearch() {
      this.$refs.printSearchForm.resetFields();
      this.printSearchForm = {
        workOrderNo: "",
        materialNumber: "",
        barcode: "",
        printBarcode: "",
        status: "PENDING", // 重置时保持默认待使用状态
        batchNo: "",
      };
      this.searchPrintData();
    },

    // 修改 executeBatchPrint 方法
    async executeBatchPrint() {
      if (!this.printDataList.length) {
        this.$message.warning("没有可打印的数据");
        return;
      }

      if (!this.printTemplate) {
        this.$message.warning("请先设置打印模板");
        return;
      }

      this.printing = true;
      this.batchPrinting = true; // 设置主页面按钮的loading状态
      try {
        // 准备打印数据列表
        const printList = this.printDataList.map((data) => ({
          ...data,
          createAt: this.formatDate(data.createAt),
          printBarcodeText: data.printBarcode.substring(
            data.printBarcode.length - 13
          ),
        }));

        // 使用 hirInput 组件的批量打印方法
        await this.$nextTick();
        if (this.$refs.batchPrintHirInput) {
          // 使用浏览器打印
          await this.$refs.batchPrintHirInput.handleBatchPrint();
          this.$message.success("浏览器打印完成");
          this.batchPrintDialogVisible = false;
        } else {
          throw new Error("打印组件未初始化");
        }
      } catch (error) {
        console.error("批量打印失败:", error);
        this.$message.error("批量打印失败: " + error.message);
      } finally {
        this.printing = false;
        this.batchPrinting = false; // 恢复按钮状态
      }
    },

    // 处理暂停条码
    async handleSuspend(row) {
      try {
        // 校验条码是否为当天生成
        const createdAt = new Date(row.createAt);
        const today = new Date();
        if (
          createdAt.getFullYear() !== today.getFullYear() ||
          createdAt.getMonth() !== today.getMonth() ||
          createdAt.getDate() !== today.getDate()
        ) {
          this.$message.warning("只能暂停当天生成的条码");
          return;
        }

        // 打开暂停对话框
        this.suspendForm.id = row._id;
        this.suspendForm.reason = "";
        this.suspendDialogVisible = true;
      } catch (error) {
        console.error("暂停操作失败:", error);
        this.$message.error("暂停操作失败: " + (error.message || "未知错误"));
      }
    },

    // 添加提交暂停方法
    async submitSuspend() {
      try {
        await this.$refs.suspendForm.validate();

        await updateData("preProductionBarcode", {
          query: { _id: this.suspendForm.id },
          update: {
            status: "SUSPENDED",
            suspendReason: this.suspendForm.reason,
            suspendBy: this.$store.state.user.name,
            suspendAt: new Date(),
            updater: this.$store.state.user.name,
            updateAt: new Date(),
          },
        });

        this.$message.success("暂停成功");
        this.suspendDialogVisible = false;
        this.fetchData();
      } catch (error) {
        console.error("暂停失败:", error);
        this.$message.error("暂停失败: " + (error.message || "未知错误"));
      }
    },

    // 处理恢复暂停的条码
    async handleResume(row) {
      try {
        // 校验条码是否为当天生成
        const createdAt = new Date(row.createAt);
        const today = new Date();
        if (
          createdAt.getFullYear() !== today.getFullYear() ||
          createdAt.getMonth() !== today.getMonth() ||
          createdAt.getDate() !== today.getDate()
        ) {
          this.$message.warning("只能恢复当天生成的条码");
          return;
        }

        await this.$confirm("确定要恢复这条暂停的记录吗？", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        });

        await updateData("preProductionBarcode", {
          query: { _id: row._id },
          update: {
            status: "PENDING",
            suspendBy: null,
            suspendAt: null,
            updater: this.$store.state.user.name,
            updateAt: new Date(),
          },
        });

        this.$message.success("恢复成功");
        this.fetchData();
      } catch (error) {
        if (error !== "cancel") {
          console.error("恢复失败:", error);
          this.$message.error("恢复失败: " + (error.message || "未知错误"));
        }
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;

  .filter-container {
    margin-bottom: 20px;
  }

  .list-container {
    margin-bottom: 20px;
  }

  .pagination-container {
    margin-top: 20px;
    text-align: right;
  }
}

.el-tag {
  min-width: 70px;
  text-align: center;
}

.dialog-footer {
  text-align: right;
}

.screen1 {
  height: auto;
  margin: 2vw 0;
  width: 100%;
  border: 1px solid #ebeef5;
  border-radius: 5px;
}

.screen_content_first {
  width: 100%;
  padding: 10px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
}

.el-icon-tickets {
  line-height: 30px;
}

.batch-print-container {
  .print-settings {
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f5f7fa;
    border-radius: 4px;
  }

  .print-list {
    margin-top: 20px;
  }

  .el-divider {
    margin: 20px 0;
  }
}

.dialog-footer {
  text-align: right;
  margin-top: 20px;
}

.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px; // 设置最大宽度
}
</style>