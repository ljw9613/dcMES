<template>
  <div id="div1" style="margin: 10px">
    <el-upload :disabled="disabled" ref="uploada" class="upload-demo" :data="uploadData" :action="dataUrl"
      :before-upload="beforeUpload" :on-success="handleSuccess" :on-preview="handlePreview" :on-remove="handleRemove"
      :on-error="handleError" :before-remove="beforeRemove" :on-change="handleChange" :limit="10"
      :on-exceed="handleExceed" :file-list="fileList" :list-type="type === 'img' ? 'picture-card' : ''">
      <el-button :disabled="disabled" size="small" type="primary">点击上传</el-button>
      <div slot="tip" class="el-upload__tip">请上传文件</div>
    </el-upload>
    <el-dialog title="命名文件" @close="finish" :append-to-body="true" :close-on-click-modal="false" :visible="dlgVisible">
      <el-form>
        <el-form-item label="文件名">
          <el-input type="text" v-model="filename"> </el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <!-- <el-button @click="dlgVisible = false">取 消</el-button> -->
        <el-button type="primary" @click="onok()">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import store from "@/store";

export default {
  name: "upload-list",

  props: ["value", "type", "disabled"],
  data() {
    return {
      uploadData: null,
      filename: "",
      loading: null,
      dlgVisible: false,
      dataUrl: "",
      // fileList: [],
      recvFile: null,
    };
  },

  computed: {
    fileList: {
      get: function () {
        console.log("this.value", this.value, this.value == "[]");
        let temp = JSON.parse(
          this.value == "" || !this.value ? "[]" : this.value
        );
        console.log(temp);
        let fileList = temp.map((file) => {
          console.log(file.url);
          return {
            url: process.env.VUE_APP_UPLOADS + file.url,
            name: file.name,
          };
        });
        return fileList;
      },
      // setter
      set: function (newValue) {
        this.$emit("input", newValue);
        this.$emit("change", newValue);
      },
    },
  },
  created() {
    const userName = store.getters.userName;

    this.uploadData = { userName: userName };

    // this.dataUrl = "http://localhost:2222/api/v1/upload-file";
    // http://localhost:9528 
    // TODO 测试环境
    this.dataUrl = "http://www.fengyang-zh.com/fengyangServer/api/v1/upload-file";
  },
  methods: {
    handleChange(file, fileList) {
      console.log(JSON.stringify(file));
    },
    beforeUpload(file) {
      this.loading = this.$loading({
        lock: true,
        text: "正在上传",
        spinner: "el-icon-loading",
        target: document.querySelector("#div1"),
      });
    },
    finish() {
      console.log("finish");
      this.dlgVisible = false;
    },
    handleRemove(file, fileList) {
      this.fileList = fileList;
      console.log(file, fileList);
    },
    handleError() {
      //
      //
    },
    onok() {
      const fileList = this.$refs.uploada.fileList;
      const index = fileList.length - 1;
      console.log(index, fileList, "=-====");
      console.log(process.env.VUE_APP_UPLOADS + this.recvFile.response);
      this.fileList.push({
        url: process.env.VUE_APP_UPLOADS + this.recvFile.response,
        name: this.filename,
      });

      console.log(JSON.stringify(this.fileList));
      this.dlgVisible = false;
      this.$emit(
        "input",
        JSON.stringify(
          this.fileList.map((file) => {
            return { url: file.url.split("/").pop(), name: file.name };
          })
        )
      );
    },
    handleSuccess(e, file) {
      console.log(JSON.stringify(file));
      this.loading.close();
      //filename = file.name;
      this.filename = file.name.split(".")[0];
      // this.dlgVisible = true;
      this.recvFile = file;
      //取消重命名
      this.onok();
    },
    handlePreview(file) {
      javascipt: window.open(file.url);
    },
    handleExceed(files, fileList) {
      this.$message.warning(
        `当前限制选择 3 个文件，本次选择了 ${files.length} 个文件，共选择了 ${files.length + fileList.length
        } 个文件`
      );
    },
    beforeRemove(file, fileList) {
      this.$confirm(`确定移除 ${file.name}？`).then((e) => {
        this.$emit("input", JSON.stringify(this.fileList));
      });
    },
  },
};
</script>

<style></style>