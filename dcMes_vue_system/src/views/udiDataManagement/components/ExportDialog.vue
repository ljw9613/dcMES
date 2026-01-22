<template>
  <el-dialog
    title="销售订单导出"
    :visible.sync="visible"
    width="500px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <el-form :model="form" ref="form" :rules="rules" label-width="100px">
      <el-form-item label="销售订单" prop="saleOrderNo">
        <zr-select
          v-model="form.saleOrderNo"
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
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleCancel">取 消</el-button>
      <el-button type="primary" @click="handleConfirm" :loading="exporting"
        >确 定</el-button
      >
    </div>
  </el-dialog>
</template>

<script>
import { getData } from "@/api/data";
import FileSaver from "file-saver";

export default {
  name: "ExportDialog",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      form: {
        saleOrderNo: "",
      },
      rules: {
        saleOrderNo: [
          { required: true, message: "请选择销售订单", trigger: "change" },
        ],
      },
      exporting: false,
    };
  },
  methods: {
    handleCancel() {
      this.$refs.form.resetFields();
      this.$emit("update:visible", false);
    },
    async handleConfirm() {
      try {
        await this.$refs.form.validate();
        await this.exportData();
      } catch (error) {
        console.error("表单验证失败", error);
      }
    },
    async exportData() {
      try {
        // 显示加载提示
        this.exporting = true;
        const loading = this.$loading({
          lock: true,
          text: "正在查询数据，请稍候...",
          spinner: "el-icon-loading",
          background: "rgba(0, 0, 0, 0.7)",
        });

        // 1. 查询出库单
        const { data: outboundResult } = await getData("warehouse_ontry", {
          query: { saleOrderNo: this.form.saleOrderNo },
          select: "_id,entryItems",
        });

        if (!outboundResult || outboundResult.length === 0) {
          this.$message.warning("未找到相关出库单数据");
          return;
        }

        // 2. 收集托盘码
        let palletCodes = [];
        for (const element of outboundResult) {
          for (const el of element.entryItems) {
            palletCodes.push(el.palletCode);
          }
        }

        if (palletCodes.length === 0) {
          this.$message.warning("未找到相关托盘数据");
          return;
        }

        // 3. 分批查询托盘单据详情
        const batchSize = 50; // 每批查询的托盘数量
        let allBarcodes = [];
        
        for (let i = 0; i < palletCodes.length; i += batchSize) {
          loading.text = `正在查询托盘数据 ${i + 1}/${palletCodes.length}...`;
          
          const batchPalletCodes = palletCodes.slice(i, i + batchSize);
          const { data: palletDetailResult } = await getData(
            "material_palletizing",
            {
              query: { palletCode: { $in: batchPalletCodes } },
              select: "palletBarcodes",
            }
          );

          for (const element of palletDetailResult) {
            for (const el of element.palletBarcodes) {
              allBarcodes.push(el.barcode);
            }
          }
        }

        if (allBarcodes.length === 0) {
          this.$message.warning("未找到相关条码数据");
          return;
        }

        // 4. 分批查询物料流转数据
        const materialBatchSize = 100; // 每批查询的条码数量
        let allResultData = [];
        
        for (let i = 0; i < allBarcodes.length; i += materialBatchSize) {
          loading.text = `正在查询物料数据 ${i + 1}/${allBarcodes.length}...`;
          
          const batchBarcodes = allBarcodes.slice(i, i + materialBatchSize);
          const { data: materialResult } = await getData("material_process_flow", {
            query: {
              barcode: { $in: batchBarcodes },
              isProduct: true,
            },
            populate: JSON.stringify([
              {
                path: "productionPlanWorkOrderId",
              },
            ]),
          });

          allResultData = [...allResultData, ...materialResult];
        }

        // 5. 查询条码验证信息
        loading.text = "正在处理条码验证数据...";
        let barcodeValidationMap = {};
        
        for (let i = 0; i < allBarcodes.length; i += materialBatchSize) {
          const batchBarcodes = allBarcodes.slice(i, i + materialBatchSize);
          try {
            const { data: barcodeResult } = await getData("preProductionBarcode", {
              query: { printBarcode: { $in: batchBarcodes } },
            });

            if (barcodeResult && barcodeResult.length > 0) {
              barcodeResult.forEach((item) => {
                barcodeValidationMap[item.printBarcode] = {
                  printBarcode: item.printBarcode || "-",
                  transformedBarcode: item.transformedPrintBarcode || "-",
                  isPrintBarcodeValid: true,
                  isTransformedBarcodeValid: true,
                  validationTime: item.validationTime || new Date(),
                };
              });
            }
          } catch (error) {
            console.error("批量获取条码信息失败:", error);
          }
        }

        // 6. 处理导出数据
        loading.text = "正在准备导出数据...";
        const exportData = allResultData.map((item) => {
          // 查找RFID标签
          let rfidBarcode = "-";
          if (item.processNodes && item.processNodes.length > 0) {
            const rfidNodes = item.processNodes.filter(
              (node) =>
                (node.materialName && node.materialName.includes("RFID")) ||
                node.isRfid === true
            );
            if (rfidNodes.length > 0 && rfidNodes[0].barcode) {
              rfidBarcode = rfidNodes[0].barcode;
            }
          }

          // 获取条码验证信息
          const barcodeValidation = item.barcode
            ? barcodeValidationMap[item.barcode] || {
                printBarcode: "-",
                transformedBarcode: "-",
                isPrintBarcodeValid: true,
                isTransformedBarcodeValid: true,
                validationTime: item.endTime || item.createAt,
              }
            : null;

          return {
            "SKU#": item.materialName || "-",
            "SN_PO#":
              (item.productionPlanWorkOrderId &&
                item.productionPlanWorkOrderId.custPO) ||
              "-",
            "SN_NO#": item.barcode
              ? item.barcode.substring(item.barcode.length - 12)
              : "-",
            "BATCH_NO#":
              (item.productionPlanWorkOrderId &&
                item.productionPlanWorkOrderId.custPOLineNo) ||
              "-",
            "MASTER_CARTON_UDI#":
              (barcodeValidation && barcodeValidation.transformedBarcode) || "-",
            "COLOR_BOX_UDI#":
              (barcodeValidation && barcodeValidation.printBarcode) || "-",
            "UNIT_UDI#": item.barcode || "-",
            "RFID_NO#": rfidBarcode !== "-" ? rfidBarcode.replace(/[A-Z]/g, char => char.toLowerCase()) : rfidBarcode,
            MANUFACTURING_DATE: item.endTime
              ? this.formatDateForExport(item.endTime)
              : this.formatDateForExport(item.createAt),
          };
        });

        // 7. 生成CSV文件
        const headers = Object.keys(exportData[0]);
        const csvContent = [
          headers.join(","),
          ...exportData.map((item) =>
            headers
              .map(
                (header) => {
                  // MANUFACTURING_DATE字段使用特殊格式，让Excel识别为文本
                  if (header === 'MANUFACTURING_DATE' && item[header] !== '-') {
                    return `="${item[header]}"`;
                  }
                  // 其他字段正常处理，用双引号包围
                  return `"${String(item[header]).replace(/"/g, '""')}"`;
                }
              )
              .join(",")
          ),
        ].join("\n");

        // 8. 下载文件
        const blob = new Blob(["\uFEFF" + csvContent], {
          type: "text/csv;charset=utf-8",
        });

        const fileName = `UDI数据_${this.form.saleOrderNo}_${new Date().toLocaleDateString('zh-CN')}.csv`;
        FileSaver.saveAs(blob, fileName);

        this.$message.success("导出成功");
        this.handleCancel();
      } catch (error) {
        console.error("导出失败:", error);
        this.$message.error("导出失败: " + error.message);
      } finally {
        this.exporting = false;
        this.$loading().close();
      }
    },
    formatDateForExport(date) {
      if (!date) return "-";
      const d = new Date(date);
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const year = d.getFullYear();
      return `${year}-${month}-${day}`;
    },
  },
};
</script>

<style lang="scss" scoped>
.select-option {
  .option-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style> 