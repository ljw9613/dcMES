<template>
  <div class="app-container">
    <!-- 搜索区域 -->
    <div class="screen1">
      <div class="screen_content_first">
        <el-form :inline="true" :model="searchForm" ref="searchForm" size="small">
          <el-form-item label="型号" prop="materialName">
            <el-input v-model="searchForm.materialName" placeholder="请输入型号" clearable></el-input>
          </el-form-item>
          <el-form-item label="UDI序列号" prop="barcode">
            <el-input v-model="searchForm.barcode" placeholder="请输入UDI序列号" clearable></el-input>
          </el-form-item>
          <el-form-item label="生产批号" prop="batchNo">
            <el-input v-model="searchForm.batchNo" placeholder="请输入生产批号" clearable></el-input>
          </el-form-item>
          <el-form-item label="RFID标签" prop="rfidBarcode">
            <el-input v-model="searchForm.rfidBarcode" placeholder="请输入RFID标签" clearable></el-input>
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
            <el-button type="primary" @click="search" icon="el-icon-search">搜索</el-button>
            <el-button @click="resetForm" icon="el-icon-refresh">重置</el-button>
            <el-button type="success" @click="handleAllExcel" icon="el-icon-download">导出数据</el-button>
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
      <el-table-column type="index" label="序号" width="50" align="center"></el-table-column>
      <el-table-column prop="materialName" label="型号" min-width="120" show-overflow-tooltip></el-table-column>
      <el-table-column label="UDI序列号" min-width="150" show-overflow-tooltip>
        <template slot-scope="scope">
          {{ scope.row.barcode ? scope.row.barcode.substring(scope.row.barcode.length - 12) : "-" }}
        </template>
      </el-table-column>
      <el-table-column prop="batchNo" label="生产批号" min-width="120" show-overflow-tooltip></el-table-column>
      <el-table-column label="外箱UDI" min-width="150" show-overflow-tooltip>
        <template slot-scope="scope">
          {{ scope.row.barcodeValidation && scope.row.barcodeValidation.transformedBarcode || "-" }}
        </template>
      </el-table-column>
      <el-table-column label="彩盒UDI" min-width="150" show-overflow-tooltip>
        <template slot-scope="scope">
          {{ scope.row.barcodeValidation && scope.row.barcodeValidation.printBarcode || "-" }}
        </template>
      </el-table-column>
      <el-table-column prop="barcode" label="产品UDI" min-width="150" show-overflow-tooltip></el-table-column>
      <el-table-column prop="rfidBarcode" label="RFID标签" min-width="150" show-overflow-tooltip></el-table-column>
      <el-table-column label="生产日期" min-width="150" show-overflow-tooltip>
        <template slot-scope="scope">
          {{ formatDate(scope.row.createAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template slot-scope="scope">
          <el-button size="mini" type="primary" @click="handleDetail(scope.row)">详情</el-button>
          <el-button size="mini" type="success" @click="handleExportSingle(scope.row)">导出</el-button>
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
    <el-dialog title="UDI数据详情" :visible.sync="detailDialogVisible" width="700px">
      <div class="detail-container" v-if="currentDetail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="型号">{{ currentDetail.materialName }}</el-descriptions-item>
          <el-descriptions-item label="UDI序列号">
            {{ currentDetail.barcode ? currentDetail.barcode.substring(currentDetail.barcode.length - 12) : "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="生产批号">{{ currentDetail.batchNo || "-" }}</el-descriptions-item>
          <el-descriptions-item label="产品UDI">{{ currentDetail.barcode || "-" }}</el-descriptions-item>
          <el-descriptions-item label="RFID标签">{{ currentDetail.rfidBarcode || "-" }}</el-descriptions-item>
          <el-descriptions-item label="生产日期">{{ formatDate(currentDetail.createAt) }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-section">
          <h4>条码验证信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="彩盒UDI">
              {{ currentDetail.barcodeValidation && currentDetail.barcodeValidation.printBarcode || "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="彩盒条码验证">
              <el-tag :type="getValidationTagType(
                currentDetail.barcodeValidation && currentDetail.barcodeValidation.isPrintBarcodeValid
              )">
                {{
                  currentDetail.barcodeValidation && currentDetail.barcodeValidation.isPrintBarcodeValid
                    ? "验证通过"
                    : "验证失败"
                }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="外箱UDI">
              {{ currentDetail.barcodeValidation && currentDetail.barcodeValidation.transformedBarcode || "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="外箱条码验证">
              <el-tag :type="getValidationTagType(
                currentDetail.barcodeValidation && currentDetail.barcodeValidation.isTransformedBarcodeValid
              )">
                {{
                  currentDetail.barcodeValidation && currentDetail.barcodeValidation.isTransformedBarcodeValid
                    ? "验证通过"
                    : "验证失败"
                }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="验证时间" :span="2">
              {{ formatDate(currentDetail.barcodeValidation && currentDetail.barcodeValidation.validationTime) }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section" v-if="currentDetail.materialProcessFlowId">
          <h4>生产信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="销售订单号">
              {{ currentDetail.saleOrderNo || "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="生产订单号">
              {{ currentDetail.productionOrderNo || "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="生产线">
              {{ currentDetail.productionLineName || "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="物料编码">
              {{ currentDetail.materialCode || "-" }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getData } from "@/api/data";
import XLSX from "xlsx";
import FileSaver from "file-saver";

export default {
  name: "UdiDataManagement",
  data() {
    return {
      searchForm: {
        materialName: "",
        barcode: "",
        batchNo: "",
        rfidBarcode: "",
        dateRange: []
      },
      tableList: [],
      total: 0,
      currentPage: 1,
      pageSize: 10,
      listLoading: false,
      detailDialogVisible: false,
      currentDetail: null
    };
  },
  methods: {
    // 获取数据
    async fetchData() {
      this.listLoading = true;
      try {
        let req = this.searchData();
        req.page = this.currentPage;
        req.skip = (this.currentPage - 1) * this.pageSize;
        req.limit = this.pageSize;
        req.sort = { createAt: -1 };
        req.count = true;
        req.populate = JSON.stringify([
          {
            path: "productionPlanWorkOrderId"
          }
        ]);

        const result = await getData("material_process_flow", req);

        if (result.code === 200) {
          // 处理数据，添加RFID标签信息
          const processedData = [];
          for (const item of result.data) {
            let rfidBarcode = "-";
            
            // 查找包含RFID的节点
            if (item.processNodes && item.processNodes.length > 0) {
              const rfidNodes = item.processNodes.filter(node => 
                (node.materialName && node.materialName.includes("RFID")) || node.isRfid === true
              );
              // 提取对应的barcode
              if (rfidNodes.length > 0 && rfidNodes[0].barcode) {
                rfidBarcode = rfidNodes[0].barcode;
              }
            }
            
            // 查询对应的预生产条码信息
            let barcodeValidation = {
              printBarcode: "-",
              transformedBarcode: "-",
              isPrintBarcodeValid: true,
              isTransformedBarcodeValid: true,
              validationTime: item.endTime || item.createAt
            };
            
            if (item.barcode) {
              try {
                const barcodeResult = await getData("preProductionBarcode", {
                  query: { barcode: item.barcode },
                  limit: 1
                });
                
                if (barcodeResult.code === 200 && barcodeResult.data.length > 0) {
                  const barcodeData = barcodeResult.data[0];
                  barcodeValidation = {
                    printBarcode: barcodeData.printBarcode || "-", // 彩箱码
                    transformedBarcode: barcodeData.transformedPrintBarcode || "-", // 黄板箱
                    isPrintBarcodeValid: true,
                    isTransformedBarcodeValid: true,
                    validationTime: item.endTime || item.createAt
                  };
                }
              } catch (error) {
                console.error("获取条码信息失败:", error);
              }
            }
            
            // 添加生产信息
            const processedItem = {
              ...item,
              rfidBarcode,
              batchNo: item.productionPlanWorkOrderId && item.productionPlanWorkOrderId.custPO,
              saleOrderNo: item.productionPlanWorkOrderId && item.productionPlanWorkOrderId.saleOrderNo,
              productionOrderNo: item.productionPlanWorkOrderId && item.productionPlanWorkOrderId.productionOrderNo,
              productionLineId: item.productionPlanWorkOrderId && item.productionPlanWorkOrderId.productionLineId,
              productionLineName: item.productionPlanWorkOrderId && item.productionPlanWorkOrderId.productionLineName,
              barcodeValidation
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
        dateRange: []
      };
      this.currentPage = 1;
      this.fetchData();
    },

    // 构建查询条件
    searchData() {
      let req = {
        query: {
          $and: []
        }
      };

      // 处理型号查询
      if (this.searchForm.materialName && this.searchForm.materialName.trim()) {
        req.query.$and.push({
          materialName: { $regex: this.searchForm.materialName.trim(), $options: "i" }
        });
      }

      // 处理UDI序列号查询
      if (this.searchForm.barcode && this.searchForm.barcode.trim()) {
        req.query.$and.push({
          barcode: { $regex: this.searchForm.barcode.trim(), $options: "i" }
        });
      }

      // 处理生产批号查询
      if (this.searchForm.batchNo && this.searchForm.batchNo.trim()) {
        req.query.$and.push({
          "productionPlanWorkOrderId.custPO": { 
            $regex: this.searchForm.batchNo.trim(), 
            $options: "i" 
          }
        });
      }

      // 处理RFID标签查询 - 这需要特殊处理，因为它在processNodes中
      if (this.searchForm.rfidBarcode && this.searchForm.rfidBarcode.trim()) {
        req.query.$and.push({
          "processNodes": {
            $elemMatch: {
              $or: [
                { materialName: { $regex: "RFID", $options: "i" } },
                { isRfid: true }
              ],
              barcode: { $regex: this.searchForm.rfidBarcode.trim(), $options: "i" }
            }
          }
        });
      }

      // 处理日期范围查询
      if (Array.isArray(this.searchForm.dateRange) && this.searchForm.dateRange.length === 2) {
        req.query.$and.push({
          createAt: {
            $gte: this.searchForm.dateRange[0] + " 00:00:00",
            $lte: this.searchForm.dateRange[1] + " 23:59:59"
          }
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
        second: "2-digit"
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
          background: "rgba(0, 0, 0, 0.7)"
        });

        // 准备导出数据
        const excelData = [{
          型号: row.materialName || "-",
          客户订单: row.saleOrderNo || "-",
          UDI序列号: row.barcode ? row.barcode.substring(row.barcode.length - 12) : "-",
          生产批号: row.batchNo || "-",
          外箱UDI: row.barcodeValidation && row.barcodeValidation.transformedBarcode || "-",
          彩盒UDI: row.barcodeValidation && row.barcodeValidation.printBarcode || "-",
          产品UDI: row.barcode || "-",
          RFID标签: row.rfidBarcode || "-",
          生产日期: row.createAt ? this.formatDate(row.createAt) : "-"
        }];

        // 创建工作簿
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);

        // 设置列宽
        const colWidths = [
          { wch: 15 }, // 型号
          { wch: 15 }, // 客户订单
          { wch: 20 }, // UDI序列号
          { wch: 15 }, // 生产批号
          { wch: 20 }, // 外箱UDI
          { wch: 20 }, // 彩盒UDI
          { wch: 20 }, // 产品UDI
          { wch: 20 }, // RFID标签
          { wch: 20 }  // 生产日期
        ];
        ws["!cols"] = colWidths;

        // 设置表头样式
        const range = XLSX.utils.decode_range(ws["!ref"]);
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const address = XLSX.utils.encode_cell({ r: 0, c: C });
          if (!ws[address]) continue;
          ws[address].s = {
            font: { bold: true },
            alignment: { horizontal: "center" },
            fill: { fgColor: { rgb: "f5f7fa" } }
          };
        }

        // 将工作表添加到工作簿
        XLSX.utils.book_append_sheet(wb, ws, "UDI数据");

        // 生成Excel文件并下载
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        });

        // 生成文件名
        const fileName = `UDI数据_${row.barcode ? row.barcode.substring(row.barcode.length - 12) : "未知"}_${new Date().toLocaleDateString()}.xlsx`;

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
          background: "rgba(0, 0, 0, 0.7)"
        });

        // 获取表格数据（使用当前搜索条件，但不分页）
        let req = this.searchData();
        req.sort = { createAt: -1 };
        req.populate = JSON.stringify([
          {
            path: "productionPlanWorkOrderId"
          }
        ]);

        const result = await getData("material_process_flow", req);

        if (result.code !== 200) {
          throw new Error(result.msg || "获取数据失败");
        }

        // 处理数据
        let resultData = [];
        for (const item of result.data) {
          // 查找包含RFID的节点
          let rfidBarcode = "-";
          if (item.processNodes && item.processNodes.length > 0) {
            const rfidNodes = item.processNodes.filter(node => 
              (node.materialName && node.materialName.includes("RFID")) || node.isRfid === true
            );
            
            // 提取对应的barcode
            if (rfidNodes.length > 0 && rfidNodes[0].barcode) {
              rfidBarcode = rfidNodes[0].barcode;
            }
          }
          
          // 查询对应的预生产条码信息
          let barcodeValidation = {
            printBarcode: "-",
            transformedBarcode: "-",
            isPrintBarcodeValid: true,
            isTransformedBarcodeValid: true,
            validationTime: item.endTime || item.createAt
          };
          
          if (item.barcode) {
            try {
              const barcodeResult = await getData("preProductionBarcode", {
                query: { barcode: item.barcode },
                limit: 1
              });
              
              if (barcodeResult.code === 200 && barcodeResult.data.length > 0) {
                const barcodeData = barcodeResult.data[0];
                barcodeValidation = {
                  printBarcode: barcodeData.printBarcode || "-", // 彩箱码
                  transformedBarcode: barcodeData.transformedPrintBarcode || "-", // 黄板箱
                  isPrintBarcodeValid: true,
                  isTransformedBarcodeValid: true,
                  validationTime: item.endTime || item.createAt
                };
              }
            } catch (error) {
              console.error("获取条码信息失败:", error);
            }
          }

          resultData.push({
            ...item,
            batchNo: item.productionPlanWorkOrderId && item.productionPlanWorkOrderId.custPO,
            saleOrderNo: item.productionPlanWorkOrderId && item.productionPlanWorkOrderId.saleOrderNo,
            productionOrderNo: item.productionPlanWorkOrderId && item.productionPlanWorkOrderId.productionOrderNo,
            productionLineId: item.productionPlanWorkOrderId && item.productionPlanWorkOrderId.productionLineId,
            productionLineName: item.productionPlanWorkOrderId && item.productionPlanWorkOrderId.productionLineName,
            rfidBarcode: rfidBarcode,
            barcodeValidation
          });
        }

        // 转换数据为Excel格式
        const excelData = resultData.map((item) => ({
          型号: item.materialName || "-",
          客户订单: item.saleOrderNo || "-",
          UDI序列号: item.barcode ? item.barcode.substring(item.barcode.length - 12) : "-",
          生产批号: item.batchNo || "-",
          外箱UDI: item.barcodeValidation && item.barcodeValidation.transformedBarcode || "-",
          彩盒UDI: item.barcodeValidation && item.barcodeValidation.printBarcode || "-",
          产品UDI: item.barcode || "-",
          RFID标签: item.rfidBarcode || "-",
          生产日期: item.endTime ? this.formatDate(item.endTime) : this.formatDate(item.createAt)
        }));

        // 创建工作簿
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);

        // 设置列宽
        const colWidths = [
          { wch: 15 }, // 型号
          { wch: 15 }, // 客户订单
          { wch: 20 }, // UDI序列号
          { wch: 15 }, // 生产批号
          { wch: 20 }, // 外箱UDI
          { wch: 20 }, // 彩盒UDI
          { wch: 20 }, // 产品UDI
          { wch: 20 }, // RFID标签
          { wch: 20 }  // 生产日期
        ];
        ws["!cols"] = colWidths;

        // 设置表头样式
        const range = XLSX.utils.decode_range(ws["!ref"]);
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const address = XLSX.utils.encode_cell({ r: 0, c: C });
          if (!ws[address]) continue;
          ws[address].s = {
            font: { bold: true },
            alignment: { horizontal: "center" },
            fill: { fgColor: { rgb: "f5f7fa" } }
          };
        }

        // 将工作表添加到工作簿
        XLSX.utils.book_append_sheet(wb, ws, "UDI数据列表");

        // 生成Excel文件并下载
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        });

        // 生成文件名
        const fileName = `UDI数据导出_${new Date().toLocaleDateString()}.xlsx`;

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
    }
  },
  created() {
    this.fetchData();
  }
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
  margin-top: 20px;
  
  h4 {
    font-size: 16px;
    color: #303133;
    margin-bottom: 10px;
    padding-left: 8px;
    border-left: 3px solid #409eff;
  }
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
</style> 