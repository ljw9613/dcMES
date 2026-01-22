<template>
  <el-button size="small" type="primary" @click="downloadTemplate">{{
    text
  }}</el-button>
</template>

<script>
import axios from "axios";

export default {
  props: {
    url: {
      type: String,
      default: "template.xlsx",
    },
    text: {
      type: String,
      default: "下载导入模板",
    },
  },
  data() {
    return {};
  },
  methods: {
    // 下载模板
    downloadTemplate() {
      axios
        .get(`https://duhuservice.cnts.gov.cn/seafoodStreetServer/document/${this.url}`, {
          responseType: "blob",
        })
        .then(({ data }) => {
          const blob = new Blob([data], {
            type: "application/octet-stream",
          });
          const link = document.createElement("a");
          link.href = window.URL.createObjectURL(blob);
          link.download = this.url;
          link.click();
        });
    },
  },
};
</script>

<style></style>
