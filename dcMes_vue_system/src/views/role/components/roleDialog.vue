<!--
 * @name: 职位字典列表
 * @content: 对所有的职位字典进行管理
 * @Author: joyce
 * @Date: 2020-03-10 16:22:05
-->
<template>
  <div class="app-container">
    <!-- 弹窗start -->
    <el-dialog
      :title="add ? '添加角色' : '编辑角色'"
      :visible.sync="dialogFormVisible"
    >
      <el-form
        v-if="isShow"
        ref="dataForm"
        v-model="postList"
        label-position="right"
      >
        <el-form-item label="角色名称" label-width="100px" required>
          <el-input v-model="postList.name" placeholder="请输入角色名称"/>
        </el-form-item>
        <el-form-item label="角色标识" label-width="100px" required>
          <el-input v-model="postList.label" placeholder="请输入角色标识"/>
        </el-form-item>

        <el-form-item label="菜单权限" label-width="100px" required>
          <el-card v-if="menu" shadow="never">
            <el-tree
              ref="menuTree"
              v-model="postList.menuList"
              :data="optionsList"
              :default-checked-keys="postList.menuList"
              :props="{ value: '_id', label: 'menuName' }"
              node-key="_id"
              show-checkbox
              @check="getTree"
            >
            </el-tree>
          </el-card>
        </el-form-item>
        <el-form-item label="备注" label-width="100px">
          <el-input
            v-model="postList.remark"
            placeholder="请输入备注"
            type="textarea"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="add ? createData() : editData()"
        >确定
        </el-button
        >
      </div>
    </el-dialog>
    <!-- 弹窗end -->
  </div>
</template>

<script>
import {addData, getData, updateData} from "@/api/data";
import IconSelect from "@/components/IconSelect";
import {formatMenu2Tree} from "@/utils/format2Tree";

export default {
  components: {IconSelect},
  porps: ["dialogFormVisible"],
  data() {
    return {
      menu: false,
      dialogFormVisible: false, //显示弹窗
      add: true,
      _id: null,
      postList: {},
      optionsList: null,
      isShow: false,
    };
  },
  async created() {
  },
  methods: {
    getTree(currentNode, checkedStatus) {
      // 获取选中和半选中的节点
      const checkedNodes = this.$refs.menuTree.getCheckedNodes();
      const halfCheckedNodes = this.$refs.menuTree.getHalfCheckedNodes();
      
      // 获取选中和半选中的节点ID
      const checkedKeys = checkedNodes.map(node => node._id);
      const halfCheckedKeys = halfCheckedNodes.map(node => node._id);
      
      // 合并所有需要的ID
      this.postList.menuList = [...new Set([...checkedKeys, ...halfCheckedKeys])];
      
      console.log({
        完全选中的节点: checkedKeys,
        半选中的父节点: halfCheckedKeys,
        最终选中列表: this.postList.menuList
      });
    },
    async getSelectData() {
      let {data: dataList} = await getData("menu", {
        query: {},
        sort: {sortNum: 1},
      });
      this.optionsList = formatMenu2Tree(dataList, null, []);
      console.log(" this.optionsList", this.optionsList);
    },
    AddClick() {
      console.log("AddClick");
      this.menu = false;
      this.isShow = false;
      this.postList = {};
      this.add = true;
      this.dialogFormVisible = true;
      this.getSelectData();
      this.$nextTick(() => {
        this.menu = true;
        this.isShow = true;
      });
    },
    EditClick(item) {
      this.menu = false;
      this.add = false;
      this.isShow = true;
      this._id = item._id;
      this.postList = item;
      this.dialogFormVisible = true;
      this.getSelectData();
      this.$nextTick(() => {
        this.menu = true;
        this.initTreeSelection();
        this.$forceUpdate();
      });
    },

    async createData() {
      if (!this.postList.name) {
        this.$message.warning("角色名称不能为空");
        return;
      } else if (!this.postList.label) {
        this.$message.warning("角色标识不能为空");
        return;
      }
      const todata = {
        ...this.postList,
      };
      console.log(todata);
      let response = await addData("role", todata);
      console.log(response);
      if (response) {
        console.log(response);
        this.$emit("custom-event");
        this.dialogFormVisible = false;
        this.postList = {
          type: "目录",
          sortNum: 1,
          status: true,
        };
        this.$notify({
          title: "添加角色成功",
          message: "Add Successfully",
          type: "success",
          duration: 2000,
        });
      } else {
        this.$notify({
          title: "添加失败，请重试或刷新",
          message: "Add unsuccessful",
          type: "warning",
          duration: 2000,
        });
      }
    },
    getMenuList(list) {
      return list.filter((item, index) => {
        return list.indexOf(item) === index;
      });
    },
    editData() {
      if (!this.postList.name) {
        this.$message.warning("角色名称不能为空");
        return;
      } else if (!this.postList.label) {
        this.$message.warning("角色标识不能为空");
        return;
      }
      // console.log(this.postList); return
      delete this.postList._id;
      var data = {
        query: {_id: this._id},
        update: {
          ...this.postList,
        },
      };
      console.log(data);
      let response = updateData("role", data);
      console.log(response);
      this.dialogFormVisible = false;
      this.$emit("custom-event");
      this.$notify({
        title: "修改成功",
        message: "edit Successfully",
        type: "success",
        duration: 2000,
      });
    },
    getParentId(item) {
      console.log(item);
      if (Array.isArray(item)) {
        this.postList.parentId = item[item.length - 1];
        console.log(this.postList.parentId);
      }
    },
    // 编辑时初始化树的选中状态
    initTreeSelection() {
      if (this.postList.menuList && this.postList.menuList.length > 0) {
        this.$nextTick(() => {
          this.$refs.menuTree.setCheckedKeys(this.postList.menuList);
        });
      }
    },
  },
};
</script>
<style scoped></style>
