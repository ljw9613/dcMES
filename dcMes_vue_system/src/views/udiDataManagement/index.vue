<template>
  <div class="app-container">
    <!-- 搜索区域 -->
    <div class="screen1">
      <div class="screen_content_first">
        <el-form
          :inline="true"
          :model="searchForm"
          ref="searchForm"
          size="small"
        >
          <el-form-item label="型号" prop="materialName">
            <el-input
              v-model="searchForm.materialName"
              placeholder="请输入型号"
              clearable
            ></el-input>
          </el-form-item>
          <el-form-item label="UDI序列号" prop="barcode">
            <el-input
              v-model="searchForm.barcode"
              placeholder="请输入UDI序列号"
              clearable
            ></el-input>
          </el-form-item>
          <el-form-item label="生产批号" prop="batchNo">
            <el-input
              v-model="searchForm.batchNo"
              placeholder="请输入生产批号"
              clearable
            ></el-input>
          </el-form-item>
          <el-form-item label="销售订单" prop="saleOrderNo">
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
              style="width: 240px"
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
          <el-form-item label="客户订单号" prop="custOrderNo">
            <el-input
              v-model="searchForm.custOrderNo"
              placeholder="请输入客户订单号"
              clearable
            ></el-input>
          </el-form-item>
          <el-form-item label="RFID标签" prop="rfidBarcode">
            <el-input
              v-model="searchForm.rfidBarcode"
              placeholder="请输入RFID标签"
              clearable
            ></el-input>
          </el-form-item>
          <el-form-item label="生产日期" prop="dateRange">
            <el-date-picker
              v-model="searchForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="yyyy-MM-dd"
              style="width: 240px"
            ></el-date-picker>
          </el-form-item>
          <el-form-item>
            <el-button 
              type="primary" 
              @click="search" 
              icon="el-icon-search"
              >搜索</el-button
            >
            <el-button 
              @click="resetForm" 
              icon="el-icon-refresh"
              >重置</el-button
            >
            <el-button
              type="success"
              @click="handleAllExcel"
              icon="el-icon-download"
              >导出数据</el-button
            >
            <el-button
              type="warning"
              @click="showExportDialog"
              icon="el-icon-download"
              >按销售订单导出</el-button
            >
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 表格区域 -->
    <el-table
      v-loading="listLoading"
      :data="tableList"
      border
      style="width: 100%"
      :header-cell-style="{ background: '#f5f7fa' }"
    >
      <el-table-column
        type="index"
        label="序号"
        width="50"
        align="center"
      ></el-table-column>
      <el-table-column
        prop="saleOrderNo"
        label="销售订单"
        min-width="160"
        show-overflow-tooltip
      >
        <template slot-scope="scope">
          {{ scope.row.saleOrderNo || "-" }}
        </template>
      </el-table-column>
      <el-table-column
        prop="materialName"
        label="型号"
        min-width="160"
        show-overflow-tooltip
      ></el-table-column>
      <el-table-column label="UDI序列号" min-width="150" show-overflow-tooltip>
        <template slot-scope="scope">
          {{
            scope.row.barcode
              ? scope.row.barcode.substring(scope.row.barcode.length - 12)
              : "-"
          }}
        </template>
      </el-table-column>
      <el-table-column
        prop="batchNo"
        label="生产批号"
        min-width="160"
        show-overflow-tooltip
      ></el-table-column>
      <el-table-column
        prop="custOrderNo"
        label="客户订单号"
        min-width="160"
        show-overflow-tooltip
      >
        <template slot-scope="scope">
          {{
            (scope.row.productionPlanWorkOrderId &&
              scope.row.productionPlanWorkOrderId.custPO) ||
            "-"
          }}
        </template>
      </el-table-column>
      <el-table-column label="外箱UDI" min-width="150" show-overflow-tooltip>
        <template slot-scope="scope">
          {{
            (scope.row.barcodeValidation &&
              scope.row.barcodeValidation.transformedBarcode) ||
            "-"
          }}
        </template>
      </el-table-column>
      <el-table-column label="彩盒UDI" min-width="150" show-overflow-tooltip>
        <template slot-scope="scope">
          {{
            (scope.row.barcodeValidation &&
              scope.row.barcodeValidation.printBarcode) ||
            "-"
          }}
        </template>
      </el-table-column>
      <el-table-column
        prop="barcode"
        label="产品UDI"
        min-width="150"
        show-overflow-tooltip
      ></el-table-column>
      <el-table-column
        prop="rfidBarcode"
        label="RFID标签"
        min-width="150"
        show-overflow-tooltip
      ></el-table-column>
      <el-table-column label="生产日期" min-width="150" show-overflow-tooltip>
        <template slot-scope="scope">
          {{ formatDate(scope.row.createAt) }}
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        @size-change="baseTableHandleSizeChange"
        @current-change="baseTableHandleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
      >
      </el-pagination>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog
      title="UDI数据详情"
      :visible.sync="detailDialogVisible"
      width="800px"
      custom-class="udi-detail-dialog"
    >
      <div class="detail-container" v-if="currentDetail">
        <div class="detail-header">
          <h3>基本信息</h3>
        </div>

        <el-descriptions :column="2" border size="medium">
          <el-descriptions-item
            label="型号"
            label-class-name="detail-label"
            content-class-name="detail-content"
          >
            <el-tag size="medium" type="primary">{{
              currentDetail.materialName || "-"
            }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item
            label="UDI序列号"
            label-class-name="detail-label"
            content-class-name="detail-content"
          >
            <el-tag size="medium" type="success">
              {{
                currentDetail.barcode
                  ? currentDetail.barcode.substring(
                      currentDetail.barcode.length - 12
                    )
                  : "-"
              }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item
            label="生产批号"
            label-class-name="detail-label"
            content-class-name="detail-content"
          >
            {{ currentDetail.batchNo || "-" }}
          </el-descriptions-item>
          <el-descriptions-item
            label="客户订单号"
            label-class-name="detail-label"
            content-class-name="detail-content"
          >
            {{
              (currentDetail.productionPlanWorkOrderId &&
                currentDetail.productionPlanWorkOrderId.custPO) ||
              "-"
            }}
          </el-descriptions-item>
          <el-descriptions-item
            label="产品UDI"
            label-class-name="detail-label"
            content-class-name="detail-content"
          >
            <el-tooltip
              :content="currentDetail.barcode || '-'"
              placement="top"
              effect="light"
            >
              <span class="truncate-text">{{
                currentDetail.barcode || "-"
              }}</span>
            </el-tooltip>
          </el-descriptions-item>
          <el-descriptions-item
            label="RFID标签"
            label-class-name="detail-label"
            content-class-name="detail-content"
          >
            <el-tooltip
              :content="currentDetail.rfidBarcode || '-'"
              placement="top"
              effect="light"
            >
              <span class="truncate-text">{{
                currentDetail.rfidBarcode || "-"
              }}</span>
            </el-tooltip>
          </el-descriptions-item>
          <el-descriptions-item
            label="生产日期"
            label-class-name="detail-label"
            content-class-name="detail-content"
            :span="2"
          >
            <i class="el-icon-time"></i>
            {{ formatDate(currentDetail.createAt) }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="detail-section">
          <div class="detail-header">
            <h3>条码验证信息</h3>
          </div>
          <el-descriptions :column="2" border size="medium">
            <el-descriptions-item
              label="彩盒UDI"
              label-class-name="detail-label"
              content-class-name="detail-content"
            >
              <el-tooltip
                :content="
                  (currentDetail.barcodeValidation &&
                    currentDetail.barcodeValidation.printBarcode) ||
                  '-'
                "
                placement="top"
                effect="light"
              >
                <span class="truncate-text">
                  {{
                    (currentDetail.barcodeValidation &&
                      currentDetail.barcodeValidation.printBarcode) ||
                    "-"
                  }}
                </span>
              </el-tooltip>
            </el-descriptions-item>
            <el-descriptions-item
              label="彩盒条码验证"
              label-class-name="detail-label"
              content-class-name="detail-content"
            >
              <el-tag
                :type="
                  getValidationTagType(
                    currentDetail.barcodeValidation &&
                      currentDetail.barcodeValidation.isPrintBarcodeValid
                  )
                "
                effect="dark"
              >
                <i
                  :class="
                    currentDetail.barcodeValidation &&
                    currentDetail.barcodeValidation.isPrintBarcodeValid
                      ? 'el-icon-check'
                      : 'el-icon-close'
                  "
                ></i>
                {{
                  currentDetail.barcodeValidation &&
                  currentDetail.barcodeValidation.isPrintBarcodeValid
                    ? "验证通过"
                    : "验证失败"
                }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item
              label="外箱UDI"
              label-class-name="detail-label"
              content-class-name="detail-content"
            >
              <el-tooltip
                :content="
                  (currentDetail.barcodeValidation &&
                    currentDetail.barcodeValidation.transformedBarcode) ||
                  '-'
                "
                placement="top"
                effect="light"
              >
                <span class="truncate-text">
                  {{
                    (currentDetail.barcodeValidation &&
                      currentDetail.barcodeValidation.transformedBarcode) ||
                    "-"
                  }}
                </span>
              </el-tooltip>
            </el-descriptions-item>
            <el-descriptions-item
              label="外箱条码验证"
              label-class-name="detail-label"
              content-class-name="detail-content"
            >
              <el-tag
                :type="
                  getValidationTagType(
                    currentDetail.barcodeValidation &&
                      currentDetail.barcodeValidation.isTransformedBarcodeValid
                  )
                "
                effect="dark"
              >
                <i
                  :class="
                    currentDetail.barcodeValidation &&
                    currentDetail.barcodeValidation.isTransformedBarcodeValid
                      ? 'el-icon-check'
                      : 'el-icon-close'
                  "
                ></i>
                {{
                  currentDetail.barcodeValidation &&
                  currentDetail.barcodeValidation.isTransformedBarcodeValid
                    ? "验证通过"
                    : "验证失败"
                }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item
              label="验证时间"
              label-class-name="detail-label"
              content-class-name="detail-content"
              :span="2"
            >
              <i class="el-icon-time"></i>
              {{
                formatDate(
                  currentDetail.barcodeValidation &&
                    currentDetail.barcodeValidation.validationTime
                )
              }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section" v-if="currentDetail.materialProcessFlowId">
          <div class="detail-header">
            <h3>生产信息</h3>
          </div>
          <el-descriptions :column="2" border size="medium">
            <el-descriptions-item
              label="销售订单号"
              label-class-name="detail-label"
              content-class-name="detail-content"
            >
              <el-tag size="medium" type="info">{{
                currentDetail.saleOrderNo || "-"
              }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item
              label="生产订单号"
              label-class-name="detail-label"
              content-class-name="detail-content"
            >
              <el-tag size="medium" type="info">{{
                currentDetail.productionOrderNo || "-"
              }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item
              label="生产线"
              label-class-name="detail-label"
              content-class-name="detail-content"
            >
              {{ currentDetail.productionLineName || "-" }}
            </el-descriptions-item>
            <el-descriptions-item
              label="物料编码"
              label-class-name="detail-label"
              content-class-name="detail-content"
            >
              {{ currentDetail.materialCode || "-" }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleExportSingle(currentDetail)"
          >导出数据</el-button
        >
      </div>
    </el-dialog>

    <!-- 导出弹窗 -->
    <export-dialog :visible.sync="exportDialogVisible"></export-dialog>
  </div>
</template>

<script>
import { getData } from "@/api/data";
import XLSX from "xlsx";
import FileSaver from "file-saver";
import ExportDialog from "./components/ExportDialog.vue";

export default {
  name: "UdiDataManagement",
  components: {
    ExportDialog,
  },
  data() {
    return {
      searchForm: {
        materialName: "",
        barcode: "",
        batchNo: "",
        rfidBarcode: "",
        saleOrderNo: "",
        custOrderNo: "",
        dateRange: [],
      },
      tableList: [],
      total: 0,
      currentPage: 1,
      pageSize: 10,
      listLoading: false,
      detailDialogVisible: false,
      currentDetail: null,
      exportDialogVisible: false,
    };
  },
  methods: {
    // 获取数据
    async fetchData() {
      this.listLoading = true;
      try {
        let req = await this.searchData();
        req.skip = (this.currentPage - 1) * this.pageSize;
        req.limit = this.pageSize;
        req.sort = { createAt: -1 };
        req.count = true;
        req.populate = JSON.stringify([
          {
            path: "productionPlanWorkOrderId",
          },
        ]);

        const result = await getData("material_process_flow", req);

        if (result.code === 200) {
          // 收集所有需要查询的条码
          const barcodes = result.data
            .filter((item) => item.barcode)
            .map((item) => item.barcode);

          // 批量查询条码信息
          let barcodeValidationMap = {};
          if (barcodes.length > 0) {
            try {
              const barcodeResult = await getData("preProductionBarcode", {
                query: { printBarcode: { $in: barcodes } },
              });

              if (barcodeResult.code === 200 && barcodeResult.data.length > 0) {
                // 创建映射表以便快速查找
                barcodeValidationMap = barcodeResult.data.reduce(
                  (map, item) => {
                    map[item.printBarcode] = {
                      printBarcode: item.printBarcode || "-", // 彩箱码
                      transformedBarcode: item.transformedPrintBarcode || "-", // 黄板箱
                      isPrintBarcodeValid: true,
                      isTransformedBarcodeValid: true,
                      validationTime: item.validationTime || new Date(),
                    };
                    return map;
                  },
                  {}
                );
              }
            } catch (error) {
              console.error("批量获取条码信息失败:", error);
            }
          }

          // 处理数据，添加RFID标签信息
          const processedData = [];
          for (const item of result.data) {
            let rfidBarcode = "-";

            // 查找包含RFID的节点
            if (item.processNodes && item.processNodes.length > 0) {
              const rfidNodes = item.processNodes.filter(
                (node) =>
                  (node.materialName && node.materialName.includes("RFID")) ||
                  node.isRfid === true
              );
              // 提取对应的barcode
              if (rfidNodes.length > 0 && rfidNodes[0].barcode) {
                rfidBarcode = rfidNodes[0].barcode;
              }
            }

            // 从映射表中获取条码验证信息
            let barcodeValidation = {
              printBarcode: "-",
              transformedBarcode: "-",
              isPrintBarcodeValid: true,
              isTransformedBarcodeValid: true,
              validationTime: item.endTime || item.createAt,
            };

            if (item.barcode && barcodeValidationMap[item.barcode]) {
              barcodeValidation = barcodeValidationMap[item.barcode];
            }

            // 添加生产信息
            const processedItem = {
              ...item,
              rfidBarcode,
              batchNo:
                item.productionPlanWorkOrderId &&
                item.productionPlanWorkOrderId.custPOLineNo,
              saleOrderNo:
                item.productionPlanWorkOrderId &&
                item.productionPlanWorkOrderId.saleOrderNo,
              productionOrderNo:
                item.productionPlanWorkOrderId &&
                item.productionPlanWorkOrderId.productionOrderNo,
              productionLineId:
                item.productionPlanWorkOrderId &&
                item.productionPlanWorkOrderId.productionLineId,
              productionLineName:
                item.productionPlanWorkOrderId &&
                item.productionPlanWorkOrderId.productionLineName,
              barcodeValidation,
            };

            processedData.push(processedItem);
          }

          this.tableList = processedData;
          this.total = result.countnum || result.data.length;
        } else {
          this.$message.error(result.msg || "获取数据失败");
        }
      } catch (error) {
        console.error("获取数据失败:", error);
        this.$message.error("获取数据失败: " + error.message);
      } finally {
        this.listLoading = false;
      }
    },

    // 分页方法
    baseTableHandleCurrentChange(currentPage) {
      this.currentPage = currentPage;
      this.fetchData();
    },

    baseTableHandleSizeChange(pageSize) {
      this.pageSize = pageSize;
      this.fetchData();
    },

    // 搜索方法
    search() {
      this.currentPage = 1;
      this.fetchData();
    },

    // 重置表单
    resetForm() {
      this.$refs.searchForm.resetFields();
      this.searchForm = {
        materialName: "",
        barcode: "",
        batchNo: "",
        rfidBarcode: "",
        saleOrderNo: "",
        custOrderNo: "",
        dateRange: [],
      };
      this.currentPage = 1;
      this.fetchData();
    },

    // 构建查询条件
    async searchData() {
      let req = {
        query: {
          $and: [{ isProduct: true }],
        },
      };

      // 处理型号查询
      if (this.searchForm.materialName && this.searchForm.materialName.trim()) {
        req.query.$and.push({
          materialName: {
            $regex: this.searchForm.materialName.trim(),
            $options: "i",
          },
        });
      }

      // 处理UDI序列号查询
      if (this.searchForm.barcode && this.searchForm.barcode.trim()) {
        req.query.$and.push({
          barcode: this.searchForm.barcode.trim(),
        });
      }

      // 处理生产批号查询
      if (this.searchForm.batchNo && this.searchForm.batchNo.trim()) {
        let productionPlanWorkOrderData = await getData(
          "production_plan_work_order",
          {
            query: { custPO: this.searchForm.batchNo.trim() },
            select: "_id",
          }
        );
        let productionPlanWorkOrderIds = [];
        if (productionPlanWorkOrderData.code === 200) {
          productionPlanWorkOrderIds = productionPlanWorkOrderData.data.map(
            (item) => item._id
          );
        }
        req.query.$and.push({
          productionPlanWorkOrderId: {
            $in: productionPlanWorkOrderIds,
          },
        });
      }

      // 处理客户订单号查询
      if (this.searchForm.custOrderNo && this.searchForm.custOrderNo.trim()) {
        // 先查询包含该客户订单号的生产计划工单
        let productionPlanWorkOrderData = await getData(
          "production_plan_work_order",
          {
            query: { FSapId: this.searchForm.custOrderNo.trim() },
            select: "_id",
          }
        );

        let productionPlanWorkOrderIds = [];
        if (productionPlanWorkOrderData.code === 200) {
          productionPlanWorkOrderIds = productionPlanWorkOrderData.data.map(
            (item) => item._id
          );
        }

        req.query.$and.push({
          productionPlanWorkOrderId: {
            $in: productionPlanWorkOrderIds,
          },
        });
      }

      // 处理销售订单查询
      if (this.searchForm.saleOrderNo && this.searchForm.saleOrderNo.trim()) {
        // 先查询包含该销售订单号的生产计划工单
        let productionPlanWorkOrderData = await getData(
          "production_plan_work_order",
          {
            query: { saleOrderNo: this.searchForm.saleOrderNo.trim() },
            select: "_id",
          }
        );

        let productionPlanWorkOrderIds = [];
        if (productionPlanWorkOrderData.code === 200) {
          productionPlanWorkOrderIds = productionPlanWorkOrderData.data.map(
            (item) => item._id
          );
        }

        req.query.$and.push({
          productionPlanWorkOrderId: {
            $in: productionPlanWorkOrderIds,
          },
        });
      }

      // 处理生产批号和客户订单号查询
      if (
        (this.searchForm.batchNo && this.searchForm.batchNo.trim()) ||
        (this.searchForm.custOrderNo && this.searchForm.custOrderNo.trim())
      ) {
        // 构建查询条件
        let workOrderQuery = { $or: [] };

        if (this.searchForm.batchNo && this.searchForm.batchNo.trim()) {
          workOrderQuery.$or.push({
            custPOLineNo: this.searchForm.batchNo.trim(),
          });
        }

        if (this.searchForm.custOrderNo && this.searchForm.custOrderNo.trim()) {
          workOrderQuery.$or.push({
            custPO: this.searchForm.custOrderNo.trim(),
          });
        }

        // 发送查询请求
        let productionPlanWorkOrderData = await getData(
          "production_plan_work_order",
          {
            query: workOrderQuery,
            select: "_id",
          }
        );

        let productionPlanWorkOrderIds = [];
        if (productionPlanWorkOrderData.code === 200) {
          productionPlanWorkOrderIds = productionPlanWorkOrderData.data.map(
            (item) => item._id
          );
        }

        // 如果找到了匹配的工单，添加到查询条件中
        if (productionPlanWorkOrderIds.length > 0) {
          req.query.$and.push({
            productionPlanWorkOrderId: {
              $in: productionPlanWorkOrderIds,
            },
          });
        } else {
          req.query.$and.push({ _id: "no_match" });
        }
      }

      // 处理日期范围查询
      if (
        Array.isArray(this.searchForm.dateRange) &&
        this.searchForm.dateRange.length === 2
      ) {
        req.query.$and.push({
          createAt: {
            $gte: this.searchForm.dateRange[0] + " 00:00:00",
            $lte: this.searchForm.dateRange[1] + " 23:59:59",
          },
        });
      }

      // 如果没有查询条件，删除$and
      if (!req.query.$and.length) {
        delete req.query.$and;
      }

      return req;
    },

    // 格式化日期
    formatDate(date) {
      if (!date) return "暂无数据";
      return new Date(date).toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    },

    // 获取验证标签类型
    getValidationTagType(value) {
      return value ? "success" : "danger";
    },

    // 查看详情
    handleDetail(row) {
      this.currentDetail = row;
      this.detailDialogVisible = true;
    },

    // 导出单条数据
    async handleExportSingle(row) {
      try {
        const loading = this.$loading({
          lock: true,
          text: "正在导出数据，请稍候...",
          spinner: "el-icon-loading",
          background: "rgba(0, 0, 0, 0.7)",
        });
        // SKU#	SN_PO#	SN_NO#	BATCH_NO#	MASTER_CARTON_UDI#	COLOR_BOX_UDI#	UNIT_UDI#	RFID_NO#

        // 准备导出数据
        const csvData = [
          {
            "SKU#": row.materialName || "-",
            "SN_PO#":
              (row.productionPlanWorkOrderId &&
                row.productionPlanWorkOrderId.custPO) ||
              "-",
            "SN_NO#": row.barcode
              ? row.barcode.substring(row.barcode.length - 12)
              : "-",
            "BATCH_NO#": row.batchNo || "-",
            "MASTER_CARTON_UDI#":
              (row.barcodeValidation &&
                row.barcodeValidation.transformedBarcode) ||
              "-",
            "COLOR_BOX_UDI#":
              (row.barcodeValidation && row.barcodeValidation.printBarcode) ||
              "-",
            "UNIT_UDI#": row.barcode || "-",
            "RFID_NO#": row.rfidBarcode || "-",
            MANUFACTURING_DATE: row.createAt
              ? this.formatDate(row.createAt)
              : "-",
          },
        ];

        // 转换为CSV格式
        const headers = Object.keys(csvData[0]);
        const csvContent = [
          headers.join(","), // 表头
          ...csvData.map((item) =>
            headers
              .map(
                (header) =>
                  // 处理可能包含逗号的内容，用双引号包围
                  `"${String(item[header]).replace(/"/g, '""')}"`
              )
              .join(",")
          ),
        ].join("\n");

        // 创建Blob对象
        const blob = new Blob(["\uFEFF" + csvContent], {
          // 添加BOM标记支持中文
          type: "text/csv;charset=utf-8",
        });

        // 生成文件名
        const fileName = `UDI数据_${
          row.barcode ? row.barcode.substring(row.barcode.length - 12) : "未知"
        }_${new Date().toLocaleDateString('zh-CN')}.csv`;

        // 下载文件
        FileSaver.saveAs(blob, fileName);

        this.$message.success("导出成功");
      } catch (error) {
        console.error("导出失败:", error);
        this.$message.error("导出失败: " + error.message);
      } finally {
        this.$loading().close();
      }
    },

    // 导出所有数据
    async handleAllExcel() {
      try {
        // 显示加载提示
        const loading = this.$loading({
          lock: true,
          text: "正在导出数据，请稍候...",
          spinner: "el-icon-loading",
          background: "rgba(0, 0, 0, 0.7)",
        });

        // 设置每批次请求的数据量
        const batchSize = 100;

        // 将存储所有批次的数据
        let allResultData = [];

        // 用于存储所有条码，后续批量查询条码信息
        let allBarcodes = [];

        let hasMoreData = true;
        let currentBatch = 0;
        let totalCount = 0;

        // 分批次请求数据，直到没有更多数据
        while (hasMoreData) {
          const batchReq = await this.searchData();
          batchReq.sort = { createAt: -1 };
          batchReq.skip = currentBatch * batchSize;
          batchReq.limit = batchSize;
          batchReq.count = true;
          batchReq.populate = JSON.stringify([
            {
              path: "productionPlanWorkOrderId",
            },
          ]);

          const loadingText = `正在获取数据，已加载 ${
            currentBatch * batchSize
          } 条...`;
          loading.text = loadingText;

          const batchResult = await getData("material_process_flow", batchReq);

          if (batchResult.code !== 200) {
            throw new Error(
              batchResult.msg || `获取第${currentBatch + 1}批数据失败`
            );
          }

          // 第一次请求时获取总数
          if (currentBatch === 0) {
            totalCount = batchResult.countnum || 0;

            if (totalCount === 0) {
              this.$message.info("没有找到符合条件的数据");
              loading.close();
              return;
            }
          }

          // 处理当前批次数据
          const batchData = batchResult.data || [];

          // 如果返回数据少于批次大小，说明没有更多数据了
          if (batchData.length < batchSize) {
            hasMoreData = false;
          }

          // 收集当前批次的条码
          const batchBarcodes = batchData
            .filter((item) => item.barcode)
            .map((item) => item.barcode);

          allBarcodes = [...allBarcodes, ...batchBarcodes];

          // 处理基础数据，暂时不处理条码验证信息
          const processedBatchData = batchData.map((item) => {
            // 查找包含RFID的节点
            let rfidBarcode = "-";
            if (item.processNodes && item.processNodes.length > 0) {
              const rfidNodes = item.processNodes.filter(
                (node) =>
                  (node.materialName && node.materialName.includes("RFID")) ||
                  node.isRfid === true
              );
              // 提取对应的barcode
              if (rfidNodes.length > 0 && rfidNodes[0].barcode) {
                rfidBarcode = rfidNodes[0].barcode;
              }
            }

            return {
              ...item,
              batchNo:
                item.productionPlanWorkOrderId &&
                item.productionPlanWorkOrderId.custPOLineNo,
              saleOrderNo:
                item.productionPlanWorkOrderId &&
                item.productionPlanWorkOrderId.saleOrderNo,
              productionOrderNo:
                item.productionPlanWorkOrderId &&
                item.productionPlanWorkOrderId.productionOrderNo,
              productionLineId:
                item.productionPlanWorkOrderId &&
                item.productionPlanWorkOrderId.productionLineId,
              productionLineName:
                item.productionPlanWorkOrderId &&
                item.productionPlanWorkOrderId.productionLineName,
              rfidBarcode: rfidBarcode,
              // 暂时设置空的条码验证信息，后续会更新
              barcodeValidation: {
                printBarcode: "-",
                transformedBarcode: "-",
                isPrintBarcodeValid: true,
                isTransformedBarcodeValid: true,
                validationTime: item.endTime || item.createAt,
              },
            };
          });

          allResultData = [...allResultData, ...processedBatchData];
          currentBatch++;

          // 显示加载进度
          const loadedPercent = Math.min(
            100,
            Math.floor((allResultData.length / totalCount) * 100)
          );
          loading.text = `正在获取数据，进度：${loadedPercent}%...`;

          // 如果已加载数据达到总数，结束加载
          if (allResultData.length >= totalCount) {
            hasMoreData = false;
          }
        }

        // 批量查询条码信息
        loading.text = "正在处理条码数据，请稍候...";

        let barcodeValidationMap = {};
        if (allBarcodes.length > 0) {
          // 分批查询条码信息
          const barcodeBatchSize = 100;
          const barcodeBatchCount = Math.ceil(
            allBarcodes.length / barcodeBatchSize
          );

          for (let i = 0; i < barcodeBatchCount; i++) {
            const batchBarcodes = allBarcodes.slice(
              i * barcodeBatchSize,
              (i + 1) * barcodeBatchSize
            );

            try {
              const barcodeResult = await getData("preProductionBarcode", {
                query: { printBarcode: { $in: batchBarcodes } },
              });

              if (barcodeResult.code === 200 && barcodeResult.data.length > 0) {
                // 添加到映射表
                barcodeResult.data.forEach((item) => {
                  barcodeValidationMap[item.printBarcode] = {
                    printBarcode: item.printBarcode || "-", // 彩箱码
                    transformedBarcode: item.transformedPrintBarcode || "-", // 黄板箱
                    isPrintBarcodeValid: true,
                    isTransformedBarcodeValid: true,
                    validationTime: item.validationTime || new Date(),
                  };
                });
              }
            } catch (error) {
              console.error(`批量获取第${i + 1}批条码信息失败:`, error);
            }
          }
        }

        // 更新所有数据的条码验证信息
        loading.text = "正在准备导出数据，请稍候...";

        const finalResultData = allResultData.map((item) => {
          if (item.barcode && barcodeValidationMap[item.barcode]) {
            item.barcodeValidation = barcodeValidationMap[item.barcode];
          }
          return item;
        });
        // SKU#	SN_PO#	SN_NO#	BATCH_NO#	MASTER_CARTON_UDI#	COLOR_BOX_UDI#	UNIT_UDI#	RFID_NO#	MANUFACTURING_DATE

        // 转换数据为CSV格式
        const csvData = finalResultData.map((item) => ({
          "SKU#": item.materialName || "-",
          "SN_PO#":
            (item.productionPlanWorkOrderId &&
              item.productionPlanWorkOrderId.custPO) ||
            "-",
          "SN_NO#": item.barcode
            ? item.barcode.substring(item.barcode.length - 12)
            : "-",
          "BATCH_NO#": item.batchNo || "-",
          "MASTER_CARTON_UDI#":
            (item.barcodeValidation &&
              item.barcodeValidation.transformedBarcode) ||
            "-",
          "COLOR_BOX_UDI#":
            (item.barcodeValidation && item.barcodeValidation.printBarcode) ||
            "-",
          "UNIT_UDI#": item.barcode || "-",
          RFID_NO: item.rfidBarcode || "-",
          MANUFACTURING_DATE: item.endTime
            ? this.formatDateForExport(item.endTime)
            : this.formatDateForExport(item.createAt),
        }));

        // 转换为CSV格式
        const headers = Object.keys(csvData[0]);
        const csvContent = [
          headers.join(","), // 表头
          ...csvData.map((item) =>
            headers
              .map(
                (header) =>
                  // 处理可能包含逗号的内容，用双引号包围
                  `"${String(item[header]).replace(/"/g, '""')}"`
              )
              .join(",")
          ),
        ].join("\n");

        // 创建Blob对象
        const blob = new Blob(["\uFEFF" + csvContent], {
          // 添加BOM标记支持中文
          type: "text/csv;charset=utf-8",
        });

        // 生成文件名
        const fileName = `UDI数据导出_${new Date().toLocaleDateString('zh-CN')}.csv`;

        // 下载文件
        FileSaver.saveAs(blob, fileName);

        this.$message.success("导出成功");
      } catch (error) {
        console.error("导出失败:", error);
        this.$message.error("导出失败: " + error.message);
      } finally {
        // 关闭加载提示
        this.$loading().close();
      }
    },
    // 为导出格式化日期 (MM/DD/YYYY)
    formatDateForExport(date) {
      if (!date) return "-";
      const d = new Date(date);
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const year = d.getFullYear();
      return `${month}/${day}/${year}`;
    },
    showExportDialog() {
      this.exportDialogVisible = true;
    },
  },
  created() {
    this.fetchData();
  },
};
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;
}

.screen1 {
  height: auto;
  margin-bottom: 20px;
  width: 100%;
  border: 1px solid #ebeef5;
  border-radius: 5px;
  background-color: #fff;
}

.screen_content_first {
  width: 100%;
  padding: 15px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.detail-container {
  padding: 10px;
}

.detail-section {
  margin-top: 25px;
}

.detail-header {
  margin-bottom: 15px;

  h3 {
    font-size: 16px;
    color: #303133;
    margin: 0;
    padding-left: 10px;
    border-left: 4px solid #409eff;
    line-height: 1.4;
  }
}

.truncate-text {
  display: inline-block;
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}

:deep(.el-table) {
  .el-table__header-wrapper {
    th {
      background: #f5f7fa;
    }
  }

  .el-table__row {
    transition: all 0.3s;

    &:hover {
      background-color: #f5f7fa;
    }
  }
}

:deep(.udi-detail-dialog) {
  .el-dialog__header {
    background: #f5f7fa;
    padding: 15px 20px;
    border-bottom: 1px solid #e4e7ed;
  }

  .el-dialog__title {
    font-weight: bold;
    color: #303133;
  }

  .el-dialog__body {
    padding: 20px;
  }

  .el-dialog__footer {
    border-top: 1px solid #e4e7ed;
    padding: 15px 20px;
  }

  .el-descriptions__label {
    width: 120px;
    background-color: #f5f7fa;
  }

  .el-descriptions__content {
    padding: 12px 15px;
  }

  .detail-label {
    font-weight: bold;
    color: #606266;
  }

  .detail-content {
    color: #303133;
  }
}
</style>