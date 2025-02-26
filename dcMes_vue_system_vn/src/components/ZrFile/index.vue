<template>
  <div>
    <div class="sel">
      <div class="title" v-if="value && fimg(value)">
        <div v-if="max > 1">
          <el-image
            v-for="(item, index) in value"
            :key="index"
            style="width: 100px; height: 100px"
            :src="item"
            fit="cover"
          >
          </el-image>
        </div>
        <el-image
          v-if="max == 1"
          style="width: 100px; height: 100px"
          :src="value"
          fit="cover"
        >
        </el-image>
      </div>
      <div class="title" v-if="value && !fimg(value)">
        <div v-if="max > 1">
          <el-tooltip
            v-for="(item, index) in value"
            :key="index"
            class="item"
            effect="dark"
            :content="value"
            placement="top-start"
          >
            <el-tag
              style="width: 160px; height: 30px; overflow: hidden"
              type="success"
            >
              {{ item }}</el-tag
            >
          </el-tooltip>
        </div>
        <el-tooltip
          class="item"
          effect="dark"
          :content="value"
          placement="top-start"
          v-if="max == 1"
        >
          <el-tag
            style="width: 160px; height: 30px; overflow: hidden"
            type="success"
            >{{ value }}</el-tag
          >
        </el-tooltip>
      </div>
      <el-button type="text" @click="opendialog">选择文件</el-button>
    </div>
    <el-dialog
      append-to-body
      title="提示"
      :visible.sync="dialogVisible"
      width="60%"
    >
      <el-tabs style="min-height: 50vh" type="border-card" v-model="active">
        <el-tab-pane name="images" label="文件管理">
          <div class="images">
            <tree class="tree" @nodeClick="nodeClick"></tree>
            <tree-content
              @refresh="refresh"
              @enterSelect="enterSelect"
              v-loading="contentLoading"
              :fileList="fileList"
              :nodeTitle="nodeTitle"
              :nodeId="nodeId"
              :select="select"
              :min="min"
              :max="max"
              class="content"
            ></tree-content>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>
  
<script>
import tree from "./components/tree.vue";
import treeContent from "./components/treeContent.vue";
import { getData, addData, updateData, removeData } from "@/api/data";

export default {
  props: {
    value: { type: [String, Array], default: "" },
    min: {
      type: Number,
      default: 0,
    },
    max: {
      type: Number,
      default: 100,
    },
    select: {
      type: Boolean,
      default: true,
    },
  },
  name: "images",
  filters: {
    fname(val) {
      let extension = file.originalname.split(".").pop();
      return;
    },
  },
  components: {
    tree,
    treeContent,
  },
  data() {
    return {
      active: "images",
      treeList: [],
      foldesList: [], // 文件夹
      imageList: [], // 文件夹外的图片
      treeLoading: false,
      contentLoading: false,

      dialogVisible: false,
      nodeTitle: "",
      nodeId: "",
      fileList: [],
    };
  },
  mounted() {},
  methods: {
    fimg(val) {
      console.log("🚀 ~ fimg ~ val:", typeof val)
      let url;
    
      if (typeof val !== "String") {
        url = val[0];
      } else {
        url = val;
      }
      console.log("🚀 ~ fimg ~ url:", url)
      if (!url) {
        return false;
      }
      const extension = url.split(".").pop().toLowerCase();
      const imageExtensions = ["png", "jpg", "jpeg", "gif", "bmp"];
      if (imageExtensions.includes(extension)) {
        return true;
      }
    },
    opendialog() {
      this.dialogVisible = true;
    },
    async nodeClick(e) {
      this.contentLoading = true;
      let res = await getData("zrFile", { query: { zrFileTreeId: e._id } });
      this.fileList = res.data;
      this.nodeTitle = e.label;
      this.nodeId = e._id;
      this.contentLoading = false;
    },
    async refresh() {
      this.contentLoading = true;
      let res = await getData("zrFile", {
        query: { zrFileTreeId: this.nodeId },
      });
      this.fileList = res.data;
      this.contentLoading = false;
    },
    async enterSelect(value) {
      if (this.max == 1) {
        this.$emit("update:value", value.selectfileUrl[0]);
        this.$emit("getUrl", value.selectfileUrl[0]);
      } else {
        this.$emit("update:value", value.selectfileUrl);
        this.$emit("getUrl", value.selectfileUrl);
      }
      this.dialogVisible = false;
    },
  },
};
</script>
  
  <style lang='less' scoped >
.images {
  display: flex;
}
.sel {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 50px;
  .title {
    display: flex;
    justify-content: space-around;
    align-items: center;
  }
}
.tree {
  width: 300px;
  flex: 0 0 200px;
}

.content {
  flex: 1;
  height: 100%;
  padding-left: 10px;
}
</style>