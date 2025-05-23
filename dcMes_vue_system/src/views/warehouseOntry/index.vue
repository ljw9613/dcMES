<template>
  <div class="app-container">
    <el-card class="filter-container">
      <div slot="header" class="clearfix">
        <span>筛选搜索</span>
      </div>

      <el-form :model="searchForm" ref="searchForm" class="demo-form-inline">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="出库单号">
              <!-- <el-input v-model="searchForm.entryNo" placeholder="请输入出库单号" clearable></el-input> -->
              <zr-select
                v-model="searchForm.entryNo"
                collection="warehouse_ontry"
                :search-fields="['entryNo']"
                label-key="entryNo"
                value-key="entryNo"
                :multiple="false"
                placeholder="请输入出库单号"
                clearable
                style="width: 100%"
              >
                <template #option="{ item }">
                  <div class="select-option">
                    <div class="option-main">
                      <span class="option-label">{{ item.entryNo }}</span>
                      <!-- <el-tag size="mini" type="info" class="option-tag">
                                                {{ item.entryNo }}
                                            </el-tag> -->
                    </div>
                  </div>
                </template>
              </zr-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="生产订单号">
              <!-- <el-input v-model="searchForm.productionOrderNo" placeholder="请输入生产订单号"
                                clearable></el-input> -->
              <zr-select
                v-model="searchForm.productionOrderNo"
                collection="warehouse_ontry"
                :search-fields="['productionOrderNo']"
                label-key="productionOrderNo"
                value-key="productionOrderNo"
                :multiple="false"
                placeholder="请输入生产订单号"
                clearable
                style="width: 100%"
              >
                <template #option="{ item }">
                  <div class="select-option">
                    <div class="option-main">
                      <span class="option-label">{{
                        item.productionOrderNo
                      }}</span>
                      <!-- <el-tag size="mini" type="info" class="option-tag">
                                                {{ item.entryNo }}
                                            </el-tag> -->
                    </div>
                  </div>
                </template>
              </zr-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="销售订单号">
              <!-- <el-input v-model="searchForm.saleOrderNo" placeholder="请输入销售订单号" clearable></el-input> -->
              <zr-select
                v-model="searchForm.saleOrderNo"
                collection="k3_SAL_SaleOrder"
                :search-fields="['FBillNo']"
                label-key="FBillNo"
                value-key="FBillNo"
                sub-key="FBillNo"
                :multiple="false"
                placeholder="请输入销售单号"
                clearable
                style="width: 100%"
              >
                <template #option="{ item }">
                  <div class="select-option">
                    <div class="option-main">
                      <span class="option-label">{{ item.FBillNo }}</span>
                      <el-tag size="mini" type="info" class="option-tag">
                        {{ item.FBillNo }} - {{ item.FSaleOrgId }}
                      </el-tag>
                    </div>
                  </div>
                </template>
              </zr-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="工单编号">
              <zr-select
                v-model="searchForm.workOrderNo"
                collection="production_plan_work_order"
                :search-fields="['workOrderNo']"
                label-key="workOrderNo"
                value-key="workOrderNo"
                :multiple="false"
                placeholder="请输入工单编号"
                clearable
                style="width: 100%"
              >
                <template #option="{ item }">
                  <div class="select-option">
                    <div class="option-main">
                      <span class="option-label">{{ item.workOrderNo }}</span>
                    </div>
                  </div>
                </template>
              </zr-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="托盘编号">
              <!-- <el-input v-model="searchForm.palletCode" placeholder="请输入托盘编号" clearable></el-input> -->
              <zr-select
                v-model="searchForm.palletCode"
                collection="material_palletizing"
                :search-fields="['palletCode']"
                label-key="palletCode"
                value-key="palletCode"
                :multiple="false"
                placeholder="请输入托盘编号"
                clearable
                style="width: 100%"
              >
                <template #option="{ item }">
                  <div class="select-option">
                    <div class="option-main">
                      <span class="option-label">{{ item.palletCode }}</span>
                    </div>
                  </div>
                </template>
              </zr-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="出库状态">
              <el-select
                v-model="searchForm.status"
                placeholder="请选择状态"
                clearable
                style="width: 100%"
              >
                <el-option label="待出库" value="PENDING"></el-option>
                <el-option label="出库中" value="IN_PROGRESS"></el-option>
                <el-option label="已完成" value="COMPLETED"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="创建时间">
              <el-date-picker
                v-model="searchForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="yyyy-MM-dd"
                style="width: 100%"
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-button type="primary" @click="search">查询搜索</el-button>
          <el-button @click="resetForm">重置</el-button>
          <!-- 扫码出库 -->
          <el-button
            type="primary"
            @click="handlePalletBarcodeOpen"
            :loading="scanLoading"
            v-if="$checkPermission('生产出库单新增')"
            >新增</el-button
          >
          <!-- 导出按钮 -->
          <el-button
            type="success"
            @click="handleExport"
            :loading="exportLoading"
            v-if="$checkPermission('生产出库单导出数据')"
            >导出数据</el-button
          >
        </el-form-item>
      </el-form>
    </el-card>

    <base-table
      ref="baseTable"
      :currentPage="currentPage"
      :highlight-current-row="true"
      :pageSize="pageSize"
      :tableData="tableList"
      :tableDataloading="listLoading"
      :total="total"
      @handleCurrentChange="baseTableHandleCurrentChange"
      @handleSizeChange="baseTableHandleSizeChange"
    >
      <template slot="law">
        <el-table-column type="expand">
          <template slot-scope="scope">
            <el-form label-position="left" inline class="table-expand">
              <!-- 托盘明细 -->
              <el-card class="box-card" style="width: 100%">
                <div slot="header" class="clearfix">
                  <span>托盘出库明细</span>
                  <el-tooltip
                    content="点击每行前的箭头可查看托盘中已出库的产品条码明细"
                    placement="top"
                  >
                    <i
                      class="el-icon-info"
                      style="margin-left: 5px; color: #409eff; cursor: help"
                    ></i>
                  </el-tooltip>
                </div>
                <el-table
                  :data="scope.row.entryItems"
                  border
                  style="width: 100%"
                >
                  <el-table-column type="expand">
                    <template slot-scope="itemScope">
                      <el-card class="box-card" style="margin: 10px">
                        <div slot="header" class="clearfix">
                          <span>产品条码明细</span>
                          <span
                            style="
                              font-size: 12px;
                              color: #909399;
                              margin-left: 5px;
                            "
                            >(仅显示已出库条码)</span
                          >
                        </div>
                        <el-table
                          :data="getCompletedBarcodes(itemScope.row)"
                          border
                          style="width: 100%"
                        >
                          <el-table-column
                            label="条码"
                            prop="barcode"
                            align="center"
                          ></el-table-column>
                          <el-table-column label="扫描时间" align="center">
                            <template slot-scope="scope">
                              {{ formatDate(scope.row.scanTime) }}
                            </template>
                          </el-table-column>
                          <el-table-column label="出库状态" align="center">
                            <template>
                              <el-tag type="success">已出库</el-tag>
                            </template>
                          </el-table-column>
                        </el-table>
                        <div
                          v-if="
                            getCompletedBarcodes(itemScope.row).length === 0
                          "
                          class="no-data-tip"
                        >
                          暂无已出库条码数据
                        </div>
                      </el-card>
                    </template>
                  </el-table-column>
                  <el-table-column
                    label="托盘编号"
                    prop="palletCode"
                    align="center"
                  >
                    <template slot-scope="itemScope">
                      <div>
                        {{ itemScope.row.palletCode }}
                        <el-tag
                          size="mini"
                          type="info"
                          v-if="getCompletedBarcodes(itemScope.row).length > 0"
                        >
                          {{
                            getCompletedBarcodes(itemScope.row).length
                          }}个已出库条码
                        </el-tag>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column
                    label="出库数量"
                    prop="quantity"
                    align="center"
                  ></el-table-column>
                  <el-table-column label="扫描时间" align="center">
                    <template slot-scope="itemScope">
                      {{ formatDate(itemScope.row.scanTime) }}
                    </template>
                  </el-table-column>
                </el-table>
              </el-card>
            </el-form>
          </template>
        </el-table-column>

        <el-table-column label="出库单号" prop="entryNo" align="center">
          <template slot-scope="scope">
            <el-link type="primary" @click="handleView(scope.row)">{{
              scope.row.entryNo
            }}</el-link>
          </template>
        </el-table-column>

        <el-table-column label="订单信息" align="center">
          <template slot-scope="scope">
            <div>生产单号: {{ scope.row.productionOrderNo }}</div>
            <div>销售单号: {{ scope.row.saleOrderNo }}</div>
          </template>
        </el-table-column>

        <el-table-column label="物料信息" align="center">
          <template slot-scope="scope">
            {{ scope.row.materialName }}
            <el-tag size="mini" v-if="scope.row.materialSpec">{{
              scope.row.materialSpec
            }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="数量信息" align="center">
          <template slot-scope="scope">
            <div>应出: {{ scope.row.outboundQuantity }}</div>
            <div>已出: {{ scope.row.outNumber }}</div>
            <div>托盘数: {{ scope.row.palletCount || "0" }}</div>
          </template>
        </el-table-column>

        <el-table-column label="货柜号" prop="HuoGuiCode" align="center">
          <template slot-scope="scope">
            {{ scope.row.HuoGuiCode || "暂无数据" }}
          </template>
        </el-table-column>

        <el-table-column label="发票号" prop="FaQIaoNo" align="center">
          <template slot-scope="scope">
            {{ scope.row.FaQIaoNo || "暂无数据" }}
          </template>
        </el-table-column>

        <el-table-column label="出库状态" align="center">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="时间信息" align="center">
          <template slot-scope="scope">
            <div>创建: {{ formatDate(scope.row.createAt) }}</div>
            <div v-if="scope.row.startTime">
              开始: {{ formatDate(scope.row.startTime) }}
            </div>
            <div v-if="scope.row.endTime">
              完成: {{ formatDate(scope.row.endTime) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" align="center" width="200">
          <template slot-scope="scope">
            <el-button
              type="text"
              style="color: orange"
              @click="handleUpdateNumber(scope.row)"
              >修改应出库数量</el-button
            >
            <el-button
              type="text"
              style="color: green"
              @click="handleChuKu(scope.row)"
              :loading="scanLoading"
            >
              继续出库
            </el-button>
            <!-- <el-button
                            type="text"
                            style="color: #67C23A"
                            v-if="scope.row.outboundMode === 'SINGLE' && hasPalletPartOut(scope.row) && scope.row.status == 'IN_PROGRESS'"
                            @click="handleFinishPallet(scope.row)"
                            :loading="scanLoading"
                            title="将部分出库的托盘剩余产品一次性出库">
                            整托出库
                            <el-badge value="new" class="item" v-if="hasPalletPartOut(scope.row)"></el-badge>
                        </el-button> -->
            <el-button
              type="text"
              style="color: red"
              @click="handleDelete(scope.row)"
              >删除</el-button
            >
            <el-button
              type="text"
              style="color: blue"
              @click="handleSingleExport(scope.row)"
              >导出</el-button
            >
            <!-- <el-button type="text" @click="handleSync(scope.row)">同步金蝶云</el-button> -->
          </template>
        </el-table-column>
      </template>
    </base-table>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      :title="dialogStatus === 'create' ? '新增出库单' : '查看出库单'"
      :visible.sync="dialogFormVisible"
    >
      <el-form
        ref="dataForm"
        :model="dataForm"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="生产订单号" prop="productionOrderNo">
          <el-input
            v-model="dataForm.productionOrderNo"
            placeholder="请输入生产订单号"
            :disabled="dialogStatus === 'view'"
            @blur="handleOrderNoBlur"
          ></el-input>
        </el-form-item>
        <el-form-item label="销售订单号">
          <el-input v-model="dataForm.saleOrderNo" disabled></el-input>
        </el-form-item>
        <el-form-item label="物料信息">
          <el-input v-model="dataForm.materialName" disabled>
            <template slot="append">{{ dataForm.materialSpec }}</template>
          </el-input>
        </el-form-item>
        <el-form-item label="计划出库数量">
          <el-input v-model="dataForm.plannedQuantity" disabled></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取 消</el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          v-if="dialogStatus === 'create'"
          >确 定</el-button
        >
      </div>
    </el-dialog>

    <!-- 应出库数量输入对话框 -->
    <el-dialog
      title="基础信息"
      :visible.sync="outboundQuantityDialog"
      width="30%"
      :close-on-click-modal="false"
    >
      <el-form>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="货柜号">
              <el-input v-model="scanData.HuoGuiCode"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发票号">
              <el-input v-model="scanData.FaQIaoNo"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="应出库数量">
          <el-input
            v-model="scanData.outboundQuantity"
            type="number"
          ></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="outboundQuantityDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmOutboundQuantity"
          >确定</el-button
        >
      </span>
    </el-dialog>

    <!-- 托盘扫描对话框 -->
    <el-dialog
      title="扫描托盘"
      :visible.sync="scanPalletDialog"
      width="80%"
      :close-on-click-modal="false"
    >
      <el-form>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="销售单号">
              <el-input v-model="scanData.FBillNo" readonly></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="销售数量">
              <el-input
                v-model="scanData.FQty"
                type="number"
                readonly
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="货柜号">
              <el-input v-model="scanData.HuoGuiCode" readonly></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发票号">
              <el-input v-model="scanData.FaQIaoNo" readonly></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品名称">
              <el-input v-model="scanData.materialName" readonly></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品型号">
              <el-input v-model="scanData.materialSpec" readonly></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="应出库数量">
              <el-input
                v-model="scanData.outboundQuantity"
                type="number"
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="请扫描托盘条码">
              <el-input
                v-model="palletBarcode"
                @keyup.enter.native="handlePalletScan"
              >
                <el-button slot="append" @click="handlePalletScan"
                  >确认</el-button
                >
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <!-- 托盘信息表格 -->
      <el-table :data="palletList">
        <el-table-column prop="palletCode" label="托盘编号" />
        <el-table-column prop="saleOrderId.FBillNo" label="销售订单" />
        <el-table-column prop="materialCode" label="物料编码" />
        <el-table-column prop="totalQuantity" label="数量" />
        <el-table-column prop="productLineName" label="产线" />
        <el-table-column prop="scanTime" label="扫描时间">
          <template slot-scope="scope">
            <div>{{ formatDate(scope.row.scanTime) }}</div>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 使用通用扫描弹窗 -->
    <scan-dialog
      :visible.sync="scanDialogVisible"
      title="托盘扫码出库"
      placeholder="请扫描托盘条码"
      @scan="handleScan"
      :scanData="scanData"
      @complete="handleScanComplete"
      @delete="handleScanDelete"
      @refresh="fetchData"
    />
  </div>
</template>

<script>
import { getData, addData, updateData, removeData } from "@/api/data";
import {
  syncWarehouseOn,
  scanPalletOn,
  deleteWarehouseEntry,
} from "@/api/warehouse/entry";
import ScanDialog from "./components/ScanDialog.vue";
import { query } from "quill";

export default {
  name: "warehouseOntry",
  components: {
    ScanDialog,
  },
  data() {
    return {
      scanData: {
        FBillNo: null,
        FaQIaoNo: null,
        HuoGuiCode: null,
        materialSpec: null,
        materialName: null,
        outboundQuantity: 0,
        FQty: 0,
      },
      palletList: [],
      searchForm: {
        entryNo: "",
        productionOrderNo: "",
        saleOrderNo: "",
        palletCode: "",
        workOrderNo: "",
        status: "",
        dateRange: [],
      },
      tableList: [],
      total: 0,
      currentPage: 1,
      pageSize: 10,
      listLoading: false,
      dialogFormVisible: false,
      dialogStatus: "",
      dataForm: {},
      rules: {
        productionOrderNo: [
          { required: true, message: "请输入生产订单号", trigger: "blur" },
        ],
      },
      scanDialogVisible: false,
      scanForm: {
        palletCode: "",
      },
      scanRules: {
        palletCode: [
          { required: true, message: "请扫描托盘编号", trigger: "blur" },
        ],
      },
      exportLoading: false,
      exportProgress: 0,
      outboundQuantityDialog: false,
      outboundQuantity: "",
      scanPalletDialog: false,
      palletBarcode: "",
      hasDeletePermission: false,
      scanLoading: false,
    };
  },
  methods: {
    handleUpdateNumber(row) {
      // 检查出库单状态，如果已完成则不允许修改
      if (row.status === "COMPLETED") {
        this.$message.error("已完成的出库单不允许修改数量");
        return;
      }

      this.$prompt("请修改应出库数量", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputValue: row.outboundQuantity,
      })
        .then(({ value }) => {
          if (value >= row.outNumber) {
            // 检查是否大于等于已出库数量
            const update = {
              outboundQuantity: value,
            };

            // 当修改的应出库数量等于已出库数量时，自动更新为完成状态
            if (Number(value) === row.outNumber) {
              update.status = "COMPLETED";
              update.endTime = new Date();
            }

            updateData("warehouse_ontry", {
              query: { _id: row._id },
              update: update,
            }).then(() => {
              this.$message({
                type: "success",
                message: "修改成功: " + value,
              });
              this.fetchData(); // 刷新数据
            });
          } else {
            this.$message({
              type: "error",
              message: "应出库数量不能小于已出库数量：" + row.outNumber,
            });
          }
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "取消输入",
          });
        });
    },
    handleChuKu(row) {
      // 检查出库单状态，如果已完成则不允许继续出库
      if (row.status === "COMPLETED") {
        this.$message.error("已完成的出库单不允许继续出库");
        return;
      }

      // 检查是否正在加载中，防止重复点击
      if (this.scanLoading) {
        return;
      }

      // 设置加载状态为true
      this.scanLoading = true;

      this.scanData = row;

      // 确保托盘数量正确显示
      if (row.entryItems && row.entryItems.length > 0) {
        this.scanData.palletCount = row.entryItems.length;
      } else {
        this.scanData.palletCount = 0;
      }

      this.scanDialogVisible = true;

      // 打开弹窗后重置加载状态
      this.scanLoading = false;
    },
    handlePalletBarcodeOpen() {
      // 检查是否正在加载中，防止重复点击
      if (this.scanLoading) {
        return;
      }

      // 设置加载状态为true
      this.scanLoading = true;

      this.scanData = {
        FBillNo: null,
        HuoGuiCode: null,
        FaQIaoNo: null,
        materialName: null,
        materialSpec: null,
        plannedQuantity: null,
        outboundQuantity: null,
        outNumber: null,
        saleNumber: null,
        actualQuantity: 0,
        palletCount: 0,
        progress: 0,
        status: null,
        entryItems: [],
      };
      this.scanDialogVisible = true;

      // 打开弹窗后重置加载状态
      this.scanLoading = false;
    },

    confirmOutboundQuantity() {
      if (!this.scanData.outboundQuantity) {
        this.$message.warning("请输入应出库数量");
        return;
      }
      this.outboundQuantityDialog = false;
      this.scanDialogVisible = true;
      // this.scanPalletDialog = true
    },
    async handlePalletScan() {
      console.log("palletBarcode", this.palletBarcode);
      const result = await getData("material_palletizing", {
        query: {
          palletCode: this.palletBarcode,
        },
        populate: JSON.stringify([{ path: "saleOrderId" }]),
      });
      console.log("result", result);
      if (result.data.length > 0) {
        this.scanData["FBillNo"] = result.data[0].saleOrderId.FBillNo;
        this.scanData["FQty"] = result.data[0].saleOrderId.FQty;
        this.scanData["palletCode"] = result.data[0].palletCode;
        this.scanData["materialName"] = result.data[0].materialName;
        this.scanData["materialSpec"] = result.data[0].materialSpec;
        this.palletList.push({ ...result.data[0], scanTime: new Date() });
      }
    },
    // 构建查询条件
    async searchData() {
      let req = {
        query: {
          $and: [],
        },
      };
      const escapeRegex = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      };
      if (this.searchForm.entryNo) {
        req.query.$and.push({
          entryNo: {
            $regex: escapeRegex(this.searchForm.entryNo),
            $options: "i",
          },
        });
      }

      if (this.searchForm.productionOrderNo) {
        req.query.$and.push({
          productionOrderNo: {
            $regex: escapeRegex(this.searchForm.productionOrderNo),
            $options: "i",
          },
        });
      }

      if (this.searchForm.saleOrderNo) {
        req.query.$and.push({
          saleOrderNo: {
            $regex: escapeRegex(this.searchForm.saleOrderNo),
            $options: "i",
          },
        });
      }

      if (this.searchForm.palletCode) {
        req.query.$and.push({
          "entryItems.palletCode": {
            $regex: escapeRegex(this.searchForm.palletCode),
            $options: "i",
          },
        });
      }

      if (this.searchForm.workOrderNo) {
        //用工单查询相关的托盘单据
        let palletIds = [];
        const palletData = await getData("material_palletizing", {
          query: { workOrderNo: this.searchForm.workOrderNo },
          select: "_id palletCode",
        });
        palletIds = palletData.data.map((item) => item._id);

        req.query.$and.push({
          "entryItems.palletId": {
            $in: palletIds,
          },
        });
      }

      if (this.searchForm.status) {
        req.query.$and.push({
          status: this.searchForm.status,
        });
      }

      if (this.searchForm.dateRange && this.searchForm.dateRange.length === 2) {
        const [startDate, endDate] = this.searchForm.dateRange;
        req.query.$and.push({
          createAt: {
            $gte: new Date(startDate).toISOString(),
            $lte: new Date(endDate + " 23:59:59.999").toISOString(),
          },
        });
      }

      if (!req.query.$and.length) {
        delete req.query.$and;
      }

      return req;
    },

    // 获取数据
    async fetchData() {
      this.listLoading = true;
      try {
        let req = await this.searchData();
        req.page = this.currentPage;
        req.skip = (this.currentPage - 1) * this.pageSize;
        req.limit = this.pageSize;
        req.sort = { createAt: -1 };
        req.count = true;

        // 添加关联查询，获取托盘及其条码明细
        req.populate = JSON.stringify([
          {
            path: "entryItems.palletId",
            select:
              "palletCode materialName materialSpec totalQuantity palletBarcodes",
          },
        ]);

        const result = await getData("warehouse_ontry", req);
        this.tableList = result.data;

        // 确保计算正确的托盘数量
        if (this.tableList && this.tableList.length > 0) {
          this.tableList.forEach((item) => {
            if (item.entryItems && item.entryItems.length > 0) {
              item.palletCount = item.entryItems.length;
            } else {
              item.palletCount = 0;
            }
          });
        }

        this.total = result.countnum;
      } catch (error) {
        console.error("获取数据失败:", error);
        this.$message.error("获取数据失败");
      } finally {
        this.listLoading = false;
      }
    },

    // 获取生产订单信息
    async handleOrderNoBlur() {
      if (this.dataForm.productionOrderNo) {
        try {
          const result = await getData("k3_PRD_MO", {
            query: { FBillNo: this.dataForm.productionOrderNo },
          });
          if (result.data && result.data.length > 0) {
            const orderData = result.data[0];
            this.dataForm = {
              ...this.dataForm,
              saleOrderNo: orderData.FSaleOrderNo,
              materialName: orderData.FMaterialName,
              materialSpec: orderData.FSpecification,
              plannedQuantity: orderData.FQty,
            };
          } else {
            this.$message.warning("未找到生产订单信息");
          }
        } catch (error) {
          this.$message.error("获取订单信息失败");
        }
      }
    },

    // 处理单个托盘扫描
    async handleScan() {
      try {
        this.scanLoading = true; // 添加加载状态
        await this.fetchData();
      } catch (error) {
        this.$message.error(error.message || "扫描失败");
        throw error;
      } finally {
        this.scanLoading = false; // 无论成功失败都重置加载状态
      }
    },

    // 处理扫描完成
    async handleScanComplete(palletCodes) {
      try {
        this.scanLoading = true; // 设置加载状态
        await this.fetchData(); // 刷新列表

        // 更新表格中的托盘数量
        if (this.tableList && this.tableList.length > 0) {
          this.tableList.forEach((item) => {
            if (item.entryItems && item.entryItems.length > 0) {
              item.palletCount = item.entryItems.length;
            }
          });
        }

        this.$message.success(`成功出库 ${palletCodes.length} 个托盘`);
      } catch (error) {
        this.$message.error("完成出库失败");
      } finally {
        this.scanLoading = false; // 无论成功失败都重置加载状态
      }
    },

    // 处理扫描记录删除
    async handleScanDelete(palletCode) {
      try {
        await deletePallet(palletCode);
        this.$message.success("删除成功");
      } catch (error) {
        this.$message.error("删除失败");
      }
    },

    // 完成出库
    async handleComplete(row) {
      this.$confirm("确认完成出库？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(async () => {
        try {
          await updateData("warehouse_ontry", {
            query: { entryNo: row.entryNo },
            update: { status: "COMPLETED", endTime: new Date() },
          });
          this.$message.success("出库完成");
          this.fetchData();
        } catch (error) {
          this.$message.error("操作失败");
        }
      });
    },

    handleSync(row) {
      let req = {
        entryId: row._id,
      };
      syncWarehouseOn(req)
        .then((res) => {
          if (res.code == 200) {
            this.$message.success("同步成功");
          } else {
            this.$message.error(res.message);
          }
        })
        .catch((error) => {
          this.$message.error("同步失败");
        });
    },

    // 删除出库单
    async handleDelete(row) {
      if (row.status === "COMPLETED") {
        this.$message.error("已完成出库的单据不能删除");
        return;
      }

      this.$confirm(
        "确认删除该出库单？删除后将只恢复该出库单中扫描的条码出库状态",
        "提示",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        }
      )
        .then(async () => {
          try {
            // 使用新的API删除出库单并恢复条码状态
            const response = await deleteWarehouseEntry({
              entryId: row._id,
            });

            if (response.code === 200) {
              this.$message.success("删除成功，已恢复相关条码状态");

              // 可以显示详细信息
              if (response.data && response.data.processResults) {
                const totalPallets = response.data.processResults.length;
                const totalBarcodes = response.data.processResults.reduce(
                  (sum, item) => sum + (item.barcodesRestored || 0),
                  0
                );
                console.log(
                  `成功处理 ${totalPallets} 个托盘，恢复了 ${totalBarcodes} 个条码的状态`
                );
              }

              this.fetchData(); // 刷新数据
            } else {
              this.$message.error(response.message || "删除失败");
            }
          } catch (error) {
            console.error("删除失败:", error);
            this.$message.error("删除失败: " + (error.message || "未知错误"));
          }
        })
        .catch(() => {
          this.$message.info("已取消删除");
        });
    },

    // 删除托盘
    async handleDeletePallet(entryNo, palletCode) {
      this.$confirm("确认删除该托盘记录？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(async () => {
        try {
          await removeData("warehouse_ontry/pallet", {
            query: {
              entryNo: entryNo,
              palletCode: palletCode,
            },
          });
          this.$message.success("删除成功");
          this.fetchData();
        } catch (error) {
          this.$message.error("删除失败");
        }
      });
    },

    // 其他通用方法保持不变
    getStatusType(status) {
      const types = {
        PENDING: "info",
        IN_PROGRESS: "warning",
        COMPLETED: "success",
      };
      return types[status] || "info";
    },
    getStatusText(status) {
      const texts = {
        PENDING: "待出库",
        IN_PROGRESS: "出库中",
        COMPLETED: "已完成",
      };
      return texts[status] || status;
    },
    formatDate(date) {
      if (!date) return "暂无数据";
      return new Date(date).toLocaleString();
    },
    search() {
      this.currentPage = 1;
      this.fetchData();
    },
    resetForm() {
      this.$refs.searchForm.resetFields();
      (this.searchForm = {
        entryNo: "",
        productionOrderNo: "",
        saleOrderNo: "",
        palletCode: "",
        workOrderNo: "",
        status: "",
        dateRange: [],
      }),
        this.search();
    },
    handleAdd() {
      this.dialogStatus = "create";
      this.dataForm = {};
      this.dialogFormVisible = true;
    },
    baseTableHandleCurrentChange(currentPage) {
      this.currentPage = currentPage;
      this.fetchData();
    },
    baseTableHandleSizeChange(pageSize) {
      this.pageSize = pageSize;
      this.fetchData();
    },
    // 导出数据
    async handleExport() {
      try {
        this.exportLoading = true;
        this.$message({
          message: "正在准备导出数据，请稍候...",
          type: "info",
        });

        // 获取所有数据
        let req = await this.searchData();
        req.skip = 0;
        req.page = 1;
        req.sort = { createAt: -1 };
        req.populate = JSON.stringify([{ path: "entryItems.palletId" }]);

        const result = await getData("warehouse_ontry", req);

        // 准备导出数据 - 以条码为基础进行导出，只保留指定字段
        const exportData = [];

        result.data.forEach((item) => {
          // 检查是否有托盘和条码数据
          if (item.entryItems && item.entryItems.length > 0) {
            item.entryItems.forEach((entryItem) => {
              // 检查托盘是否有条码数据
              if (
                entryItem.palletId &&
                entryItem.palletId.palletBarcodes &&
                entryItem.palletId.palletBarcodes.length > 0
              ) {
                // 遍历每个条码，为每个条码创建一行数据
                entryItem.palletId.palletBarcodes.forEach((barcodeItem) => {
                  exportData.push({
                    出库单号: item.entryNo || "",
                    工单编号: item.productionOrderNo || "",
                    销售单号: item.saleOrderNo || "",
                    托盘编码: entryItem.palletCode || "",
                    出库时间: item.endTime ? this.formatDate(item.endTime) : "",
                    产品型号: item.materialSpec || "",
                    物料信息: item.materialName || "",
                    产品条码: barcodeItem.barcode || "",
                  });
                });
              } else {
                // 如果没有条码数据，仍然为托盘创建一行
                exportData.push({
                  出库单号: item.entryNo || "",
                  工单编号: item.productionOrderNo || "",
                  销售单号: item.saleOrderNo || "",
                  托盘编码: entryItem.palletCode || "",
                  出库时间: item.endTime ? this.formatDate(item.endTime) : "",
                  产品型号: item.materialSpec || "",
                  物料信息: item.materialName || "",
                  产品条码: "",
                });
              }
            });
          } else {
            // 如果没有托盘数据，为出库单创建一行
            exportData.push({
              出库单号: item.entryNo || "",
              工单编号: item.productionOrderNo || "",
              销售单号: item.saleOrderNo || "",
              托盘编码: "",
              出库时间: item.endTime ? this.formatDate(item.endTime) : "",
              产品型号: item.materialSpec || "",
              物料信息: item.materialName || "",
              产品条码: "",
            });
          }
        });

        // 转换为CSV格式
        const csvContent = this.convertToCSV(exportData);
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `出库条码数据_${new Date().toLocaleDateString("zh-CN")}.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.$message.success(`成功导出${exportData.length}条数据`);
      } catch (error) {
        console.error("导出失败:", error);
        this.$message.error("导出失败: " + (error.message || "未知错误"));
      } finally {
        this.exportLoading = false;
      }
    },

    // 将数据转换为CSV格式
    convertToCSV(data) {
      if (!data || data.length === 0) return "";

      const headers = Object.keys(data[0]);
      const rows = data.map((item) =>
        headers
          .map((header) => {
            const value = item[header] || "";
            // 处理包含逗号的值
            return value.includes(",") ? `"${value}"` : value;
          })
          .join(",")
      );

      // 添加UTF-8 BOM头，解决Excel打开CSV文件中文乱码问题
      return "\uFEFF" + [headers.join(","), ...rows].join("\n");
    },

    // 导出单个出库单数据
    async handleSingleExport(row) {
      try {
        this.exportLoading = true;
        this.$message({
          message: "正在准备导出数据，请稍候...",
          type: "info",
        });

        // 获取单个出库单数据
        let req = {
          query: { _id: row._id },
          populate: JSON.stringify([{ path: "entryItems.palletId" }]),
        };

        const result = await getData("warehouse_ontry", req);

        if (!result.data || result.data.length === 0) {
          this.$message.warning("未找到出库单数据");
          return;
        }

        const item = result.data[0];
        const exportData = [];

        // 检查是否有托盘和条码数据
        if (item.entryItems && item.entryItems.length > 0) {
          item.entryItems.forEach((entryItem) => {
            // 检查托盘是否有条码数据
            if (
              entryItem.palletId &&
              entryItem.palletId.palletBarcodes &&
              entryItem.palletId.palletBarcodes.length > 0
            ) {
              // 遍历每个条码，为每个条码创建一行数据
              entryItem.palletId.palletBarcodes.forEach((barcodeItem) => {
                exportData.push({
                  出库单号: item.entryNo || "",
                  工单编号: item.productionOrderNo || "",
                  销售单号: item.saleOrderNo || "",
                  托盘编码: entryItem.palletCode || "",
                  出库时间: item.endTime ? this.formatDate(item.endTime) : "",
                  产品型号: item.materialSpec || "",
                  物料信息: item.materialName || "",
                  产品条码: barcodeItem.barcode || "",
                });
              });
            } else {
              // 如果没有条码数据，仍然为托盘创建一行
              exportData.push({
                出库单号: item.entryNo || "",
                工单编号: item.productionOrderNo || "",
                销售单号: item.saleOrderNo || "",
                托盘编码: entryItem.palletCode || "",
                出库时间: item.endTime ? this.formatDate(item.endTime) : "",
                产品型号: item.materialSpec || "",
                物料信息: item.materialName || "",
                产品条码: "",
              });
            }
          });
        } else {
          // 如果没有托盘数据，为出库单创建一行
          exportData.push({
            出库单号: item.entryNo || "",
            工单编号: item.productionOrderNo || "",
            销售单号: item.saleOrderNo || "",
            托盘编码: "",
            出库时间: item.endTime ? this.formatDate(item.endTime) : "",
            产品型号: item.materialSpec || "",
            物料信息: item.materialName || "",
            产品条码: "",
          });
        }

        // 转换为CSV格式
        const csvContent = this.convertToCSV(exportData);
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `出库单_${item.entryNo}_${new Date().toLocaleDateString("zh-CN")}.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.$message.success(`成功导出${exportData.length}条数据`);
      } catch (error) {
        console.error("导出失败:", error);
        this.$message.error("导出失败: " + (error.message || "未知错误"));
      } finally {
        this.exportLoading = false;
      }
    },

    getCompletedBarcodes(entryItem) {
      if (!entryItem) {
        return [];
      }

      // 处理新数据结构
      if (entryItem.palletBarcodes && entryItem.palletBarcodes.length > 0) {
        return entryItem.palletBarcodes;
      }

      // 处理旧数据结构
      if (
        entryItem.palletId &&
        entryItem.palletId.palletBarcodes &&
        entryItem.palletId.palletBarcodes.length > 0
      ) {
        return entryItem.palletId.palletBarcodes;
      }

      return [];
    },

    // 处理整托出库
    async handleFinishPallet(row) {
      try {
        // 检查是否正在加载中，防止重复点击
        if (this.scanLoading) {
          return;
        }

        // 找出所有部分出库的托盘
        const partOutPallets = row.entryItems.filter(
          (item) =>
            item.palletId &&
            item.palletId.inWarehouseStatus === "PART_OUT_WAREHOUSE"
        );

        if (partOutPallets.length === 0) {
          this.$message.warning("没有找到部分出库的托盘");
          return;
        }

        this.$confirm(
          `确认将 ${partOutPallets.length} 个部分出库的托盘全部出库吗？`,
          "确认",
          {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
          }
        )
          .then(async () => {
            this.scanLoading = true; // 设置加载状态

            let successCount = 0;
            let errorMessages = [];

            // 对每个部分出库的托盘进行整托出库操作
            for (const palletItem of partOutPallets) {
              try {
                const response = await scanPalletOn({
                  palletCode: palletItem.palletCode,
                  userId: this.$store.state.user.id,
                  entryInfo: {
                    entryNo: row.entryNo,
                    outboundQuantity: row.outboundQuantity,
                    HuoGuiCode: row.HuoGuiCode,
                    FaQIaoNo: row.FaQIaoNo,
                    outboundMode: row.outboundMode,
                    workOrderWhitelist: row.workOrderWhitelist || [],
                  },
                  palletFinished: true, // 指示整托出库
                });

                if (response.code === 200) {
                  successCount++;
                } else {
                  errorMessages.push(
                    `托盘 ${palletItem.palletCode}: ${response.message}`
                  );
                }
              } catch (error) {
                errorMessages.push(
                  `托盘 ${palletItem.palletCode}: ${
                    error.message || "出库失败"
                  }`
                );
              }
            }

            // 显示处理结果
            if (successCount > 0) {
              this.$message.success(
                `成功出库 ${successCount} 个托盘的剩余产品`
              );
            }

            if (errorMessages.length > 0) {
              this.$message.error(
                `有 ${
                  errorMessages.length
                } 个托盘出库失败: ${errorMessages.join("; ")}`
              );
            }

            this.fetchData(); // 刷新数据
            this.scanLoading = false; // 重置加载状态
          })
          .catch(() => {
            this.$message.info("已取消整托出库");
          });
      } catch (error) {
        console.error("整托出库失败:", error);
        this.$message.error("整托出库失败: " + error.message);
        this.scanLoading = false; // 出错时也重置加载状态
      }
    },

    // 检查是否有部分出库的托盘
    hasPalletPartOut(row) {
      // 确保托盘列表存在
      if (!row.entryItems || row.entryItems.length === 0) {
        return false;
      }

      // 检查是否有部分出库的托盘
      const partOutPallets = row.entryItems.filter(
        (item) =>
          item.palletId &&
          item.palletId.inWarehouseStatus === "PART_OUT_WAREHOUSE"
      );

      return partOutPallets.length > 0;
    },
  },
  created() {
    this.fetchData();
    const roles = this.$store.getters.roles;
    if (!roles || !roles.buttonList) {
      return false;
    }
    if (roles.buttonList.includes("Delete_inbound_and_outbound_documents")) {
      this.hasDeletePermission = true;
    }
  },
};
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;

  .filter-container {
    margin-bottom: 20px;
  }

  .table-expand {
    padding: 20px;

    .box-card {
      margin-bottom: 15px;
    }
  }

  .no-data-tip {
    text-align: center;
    color: #909399;
    padding: 20px 0;
    font-size: 14px;
  }
}
</style>


