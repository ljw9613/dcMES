<template>
  <span>
    <el-button
      type="success"
      size="small"
      style="display: inline-block; margin: 0px 10px"
      @click="openDialog"
      >导入表格</el-button
    >

    <el-dialog
      :show-close="false"
      :visible.sync="mVisible"
      append-to-body
      width="40%"
    >
      <el-descriptions class="margin-top" title="操作指南" :column="1">
        <el-descriptions-item label="1">
          <DownFile type="text" url="食品检验记录信息导入模版.xlsx" />

          批量填写食品检验记录信息</el-descriptions-item
        >
        <el-descriptions-item label="2">上传填写好的表格</el-descriptions-item>
      </el-descriptions>
      <el-upload
        class="upload-demo"
        drag
        action=""
        :auto-upload="false"
        :show-file-list="false"
        :on-change="importData"
      >
        <i class="el-icon-upload" />
        <div v-if="tips" class="el-upload__text">{{ tips }}</div>

        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
      </el-upload>
      <span slot="footer" class="dialog-footer">
        <el-button @click="closeDialog">取 消</el-button>
        <el-button type="primary" @click="onok">开始导入</el-button>
      </span>
    </el-dialog>
  </span>
</template>

<script>
import * as xlsx from "xlsx";
import { getData, addData, updateData, removeData } from "@/api/data";
import DownFile from "@/components/DownFile/index";
export default {
  name: "ImportStudentInfoBtn",
  components: {
    DownFile,
  },
  data() {
    return {
      mVisible: false,
      iData: [],
      tips: "",
      loading: false,
    };
  },
  methods: {
    openDialog() {
      this.mVisible = true;
    },
    closeDialog() {
      this.mVisible = false;
      this.iData = [];
      this.tips = "";
    },
    onok() {
      let foodInspectionData = {
        inspectionData: this.iData,
        createAt: new Date(),
        updateAt: new Date(),
      };
      addData("foodInspection", foodInspectionData);
      // 导入数据
      this.$emit("onok", foodInspectionData);
      this.closeDialog();
    },
    checkExcel(workbook) {
      // 模板合法性检查
      const sheet = workbook.Sheets["食品检验记录"];
      console.log("🚀 ~ checkExcel ~ sheet:", sheet);
      if (sheet === undefined) {
        throw Error("请使用正常的模板上传数据");
      }

      if (
        (sheet["A1"] && sheet["A1"].v !== "序号") ||
        (sheet["B1"] && sheet["B1"].v !== "经营户名称")
      ) {
        throw Error("请使用正常的模板上传数据");
      }
    },
    getExcelStudentData(workbook) {
      const addArray = [];
      const worksheet = workbook.Sheets["食品检验记录"]; // 获取表数据
      const res = xlsx.utils.sheet_to_json(worksheet, {
        range: 0,
      });
      // console.log("res", res);
      console.log("🚀 ~ getExcelStudentData ~ res:", res);
      res.forEach((item) => {
        const addObj = {};
        if (item.经营户名称)
          addObj["merchantName"] = item.经营户名称.toString().trim();
        if (item.负责人)
          addObj["responsiblePerson"] = item.负责人.toString().trim();
        if (item.联系电话)
          addObj["contactPhone"] = item.联系电话.toString().trim();
        if (item.商品名称)
          addObj["productName"] = item.商品名称.toString().trim();
        if (item.检验结果) addObj["result"] = item.检验结果.toString().trim();
        if (item.检验说明)
          addObj["description"] = item.检验说明.toString().trim();
        addArray.push(addObj);
      });
      return addArray;
    },

    async checkUserData(data) {
      try {
        let failArray = [];
        let successArray = [];
        // 通过身份来源验证
        //
        let merchantArray = [];
        for (let index = 0; index < data.length; index++) {
          const element = data[index];
          merchantArray.push(element.merchantName);
        }

        let { data: marketData } = await getData("merchant", {
          query: { name: { $in: merchantArray } },
        });

        let foodInspectionArray = [];

        for await (const iterator of data) {
          console.log(iterator.merchantName);
          console.log(marketData);
          let merchantId = marketData.find((e) => {
            console.log(e.name == iterator.merchantName);
            return e.name == iterator.merchantName;
          });
          console.log("🚀 ~ merchantId ~ merchantId:", merchantId);
          if (merchantId) {
            foodInspectionArray.push({
              ...iterator,
              merchantId: merchantId._id,
            });
            successArray.push({ ...iterator, merchantId: merchantId._id });
          } else {
            failArray.push({ ...iterator, msg: "经营户名称有误" });
          }
        }

        console.log("failArray", failArray);
        console.log("successArray", successArray);
        console.log("foodInspectionArray", foodInspectionArray);
        this.tips = `Excel检测完成，共 ${successArray.length} 条数据待导入, `;
        this.tips +=
          failArray.length !== 0 ? `${failArray.length} 条数据存在问题` : "";

        if (failArray.length !== 0) {
          // 导入失败信息
          await this.$confirm("存在导入失败的人员，是否导出失败信息?", "提示", {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
          })
            .then(() => {
              const ws_data = [["经营户名称", "商品名称", "原因"]];
              failArray.forEach((e) => {
                ws_data.push([e.merchantName, e.productName, e.msg]);
              });
              // 生成并下载模版
              const workBook = xlsx.utils.book_new(); // 创建一个工作簿
              const workSheet = xlsx.utils.aoa_to_sheet(ws_data); // 使用二维数组创建一个工作表对象
              xlsx.utils.book_append_sheet(workBook, workSheet, "导入失败信息"); // 向工作簿追加一个工作表
              xlsx.writeFile(workBook, "导入失败信息.xlsx");
            })
            .catch(() => {});
        }
        return {
          successData: successArray,
          failData: failArray,
        };
      } catch (err) {
        console.log("err", err);
        this.$message.error(err);
      }
    },
    // 导入数据
    async importData(file) {
      console.log("开始上传", file);
      const loading = this.$loading({
        lock: true,
        text: "Loading",
        spinner: "el-icon-loading",
        fullscreen: true,
        background: "rgba(0, 0, 0, 0.7)",
      });
      const fileReader = new FileReader();
      fileReader.onload = async (ev) => {
        try {
          const data = ev.target.result;
          const workbook = xlsx.read(data, {
            type: "binary",
          });
          // 校验Excel信息
          this.checkExcel(workbook);

          // 获取Excel数据
          const addArray = this.getExcelStudentData(workbook);
          console.log("🚀 ~ fileReader.onload= ~ addArray:", addArray);
          // 校验导入数据信息
          const res = await this.checkUserData(addArray);
          this.iData = res.successData;
        } catch (err) {
          console.log("err", err);
          this.$message.error(err.message);
        } finally {
          loading.close();
        }
      };
      fileReader.readAsBinaryString(file.raw);
    },
  },
};
</script>

<style scoped></style>
