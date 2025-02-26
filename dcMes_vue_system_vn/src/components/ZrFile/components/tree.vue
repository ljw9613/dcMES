<template>
  <div>
    <el-input placeholder="输入关键字进行过滤" v-model="filterText"> </el-input>
    <!-- <el-button type="text" size="mini" @click="() => append(data)">
      Append
    </el-button> -->
    <!-- <el-button type="text" size="mini" @click="() => append(data)">
      Append
    </el-button> -->
    <el-tree
      class="filter-tree"
      :data="data"
      :props="defaultProps"
      default-expand-all
      :filter-node-method="filterNode"
      :expand-on-click-node="false"
      @node-click="nodeClick"
      ref="tree"
    >
      <span class="custom-tree-node" slot-scope="{ node, data }">
        <span>{{ node.label }}</span>
        <span>
          <el-button type="text" size="mini" @click="() => append(data)">
            Append
          </el-button>
          <el-button
            type="text"
            size="mini"
            @click="() => deleteTree(node, data)"
          >
            Delete
          </el-button>
        </span>
      </span>
    </el-tree>

    <el-dialog
      title="新增文件夹"
      append-to-body
      :visible.sync="dialogFormVisible"
    >
      <el-form :model="form">
        <el-form-item label="节点名称" :label-width="formLabelWidth">
          <el-input v-model="form.menuName" autocomplete="off"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取 消</el-button>
        <el-button type="primary" @click="CreateAddappendData()"
          >确 定</el-button
        >
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getData, addData, updateData, removeData } from "@/api/data";

export default {
  watch: {
    filterText(val) {
      this.$refs.tree.filter(val);
    },
  },
  data() {
    return {
      //新增
      addappendData: {},
      form: { menuName: "" },
      dialogFormVisible: false,
      formLabelWidth: "100px",

      filterText: "",
      data: [
        {
          id: 1,
          label: "图片",
          children: [
            {
              id: 4,
              label: "产品图片",
              children: [],
            },
          ],
        },
        {
          id: 2,
          label: "视频",
          children: [],
        },
        {
          id: 3,
          label: "文件",
          children: [],
        },
      ],
      defaultProps: {
        children: "children",
        label: "label",
      },
    };
  },
  mounted() {
    this.initData();
  },
  methods: {
    async initData() {
      let res = await getData("zrFileTree", { query: {} });
      console.log("🚀 ~ initData ~ res:", res);
      let jsonData = res.data;
      const itemsById = {};
      const tree = [];

      jsonData.forEach((item, index) => {
        // 创建一个新的节点对象
        const node = {
          id: index + 1,
          _id: item._id,
          label: item.menuName,
          children: [],
        };

        // 将节点存储在映射中，以便可以通过 _id 快速访问
        itemsById[item._id] = node;

        // 检查是否有 parentId，有则添加到对应父节点的 children 数组
        if (item.parentId) {
          if (itemsById[item.parentId]) {
            itemsById[item.parentId].children.push(node);
          }
        } else {
          // 没有 parentId 的是根节点
          tree.push(node);
        }
      });

      this.data = tree;
    },
    nodeClick(e) {
      console.log("🚀 ~ nodeClick ~ e:", e);
      this.$emit("nodeClick", e);
    },
    filterNode(value, data) {
      if (!value) return true;
      return data.label.indexOf(value) !== -1;
    },
    async CreateAddappendData() {
      const loading = this.$loading({
        lock: true,
        text: "Loading",
        spinner: "el-icon-loading",
        background: "rgba(0, 0, 0, 0.7)",
      });
      console.log(this.addappendData);
      let saveData = {
        ...this.form,
        parentId: this.addappendData._id, //父级id
        // menuName: { type: String }, //名称（目录名称、菜单名称、权限名称）
        // sortNum: { type: Number, default: 0 }, //顺序
        // path: { type: String }, //路由路径
        // component: { type: String }, //文件路径
        // query: { type: String }, //访问路由的默认传递参数
        // type: { type: String }, //类型 目录 菜单
        // visible: { type: Boolean, default: true }, //是否可见 0显示 1隐藏
        // perms: { type: String }, //权限标签
        // icon: { type: String }, //图标
        // status: { type: Boolean, default: true }, //状态 1正常 0禁用
        // createBy: { type: String }, // 创建人
        // updateBy: { type: String }, // 更新人
        // createAt: { type: Date, default: Date.now }, // 创建时间
        // updateAt: { type: Date, default: Date.now }, // 更新时间
        // remark: { type: String }, //备注
      };

      let res = await addData("zrFileTree", saveData);
      console.log(res, "res");
      this.form = { menuName: "" };
      this.dialogFormVisible = false;
      this.initData();
      loading.close();
    },
    async deleteTree(node, data) {
      this.$confirm("此操作将永久删除该文件夹, 是否继续?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(async () => {
          console.log(data);
          let res = await removeData("zrFileTree", {
            query: { _id: data._id },
          });
          this.initData();
          this.$message({
            type: "success",
            message: "删除成功!",
          });
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "已取消删除",
          });
        });
    },
    append(data) {
      this.addappendData = data;
      this.dialogFormVisible = true;
      //   let id = 1000;
      //   const newChild = { id: id++, label: "testtest", children: [] };
      //   if (!data.children) {
      //     this.$set(data, "children", []);
      //   }
      //   data.children.push(newChild);
    },

    remove(node, data) {
      const parent = node.parent;
      const children = parent.data.children || parent.data;
      const index = children.findIndex((d) => d.id === data.id);
      children.splice(index, 1);
    },
  },
};
</script>

<style lang="less" scoped>
.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}
</style>