<template>
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
</template>
  
<script>
import tree from "./components/tree.vue";
import treeContent from "./components/treeContent.vue";
import { getData, addData, updateData, removeData } from "@/api/data";

export default {
  props: {
    value: {
      type: String,
    },
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
      default: false,
    },
  },
  name: "images",
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

      nodeTitle: "",
      nodeId: "",
      fileList: [],
    };
  },
  mounted() {
    this.loadData();
  },
  methods: {
    loadData() {},
    async nodeClick(e) {
      console.log("🚀 ~ nodeClick ~ e:", e);

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
        $emit("update:value", value.selectfileUrl[0]);
      } else {
        $emit("update:value", value.selectfileUrl);
      }
    },
  },
};
</script>
  
  <style lang='less' scoped >
.images {
  display: flex;
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