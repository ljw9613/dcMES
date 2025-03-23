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
      :title="add ? '添加菜单' : '编辑菜单'"
      :visible.sync="dialogFormVisible"
    >
      <el-form
        v-if="isShow"
        ref="dataForm"
        v-model="postList"
        label-position="right"
      >
        <el-form-item label="类型" label-width="100px">
          <el-radio-group v-model="postList.type">
            <el-radio label="目录">目录</el-radio>
            <el-radio label="菜单">菜单</el-radio>
            <el-radio label="权限">权限</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="节点标题" label-width="100px">
          <el-input v-model="postList.menuName" placeholder="请输入节点标题" />
        </el-form-item>

        <el-form-item label="上级节点" label-width="100px">
          <el-cascader
            v-model="postList.parentId"
            :options="optionsList"
            :props="{ checkStrictly: true, value: '_id', label: 'menuName' }"
            clearable
            filterable
            placeholder="请选择上级节点"
            @change="getParentId"
          ></el-cascader>
        </el-form-item>
        <el-form-item label="菜单顺序" label-width="100px">
          <el-input-number
            v-model="postList.sortNum"
            :max="1000"
            :min="0"
            label="菜单顺序"
          ></el-input-number>
        </el-form-item>
        <el-divider></el-divider>
        <el-form-item
          v-if="postList.type != '权限'"
          label="路由路径"
          label-width="100px"
        >
          <el-input v-model="postList.path" placeholder="请输入路由路径" />
        </el-form-item>
        <el-form-item
          v-if="postList.type === '菜单'"
          label="文件路径"
          label-width="100px"
        >
          <el-input v-model="postList.component" placeholder="请输入文件路径" />
        </el-form-item>
        <el-form-item
          v-if="postList.type === '菜单'"
          label="传递参数"
          label-width="100px"
        >
          <el-input
            v-model="postList.query"
            placeholder="请输入访问路由的默认传递参数"
          />
        </el-form-item>
        <el-form-item
          v-if="postList.type === '权限'"
          label="权限标签"
          label-width="100px"
        >
          <el-input v-model="postList.perms" placeholder="请输入权限标签" />
        </el-form-item>
        <el-form-item
          v-if="postList.type != '权限'"
          label="节点图标"
          label-width="100px"
        >
          <IconSelect
            ref="IconSelects"
            :IconData.sync="postList.icon"
          ></IconSelect>
        </el-form-item>
        <el-form-item label="是否显示" label-width="100px">
          <el-switch
            v-model="postList.visible"
            active-color="#13ce66"
            inactive-color="#ff4949"
          >
          </el-switch>
        </el-form-item>
        <el-form-item label="是否启用" label-width="100px">
          <el-switch
            v-model="postList.status"
            active-color="#13ce66"
            inactive-color="#ff4949"
          >
          </el-switch>
        </el-form-item>
        <el-form-item
          label="组件名称"
          label-width="100px"
          prop="componentName"
          v-if="postList.type === '菜单'"
        >
          <el-input
            v-model="postList.componentName"
            placeholder="请输入组件名称，需与vue文件中的name属性一致"
          ></el-input>
        </el-form-item>
        <el-form-item
          label="是否缓存"
          label-width="100px"
          prop="isCache"
          v-if="postList.type === '菜单'"
        >
          <el-radio-group v-model="postList.isCache">
            <el-radio :label="true">是</el-radio>
            <el-radio :label="false">否</el-radio>
          </el-radio-group>
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
        </el-button>
      </div>
    </el-dialog>
    <!-- 弹窗end -->
  </div>
</template>

<script>
import { addData, getData, updateData } from "@/api/data";
import IconSelect from "@/components/IconSelect";
import { formatMenu2Tree } from "@/utils/format2Tree";

export default {
  components: { IconSelect },
  porps: ["dialogFormVisible"],
  data() {
    return {
      dialogFormVisible: false, //显示弹窗
      add: true,
      _id: null,
      postList: {
        type: "目录",
        parentId: null,
        sortNum: 1,
        visible: false,
        status: true,
      },
      optionsList: null,
      isShow: false,
    };
  },
  async created() {},
  methods: {
    async getSelectData() {
      let { data: dataList } = await getData("menu", {
        query: {},
        sort: {
          sortNum: 1,
        },
      });
      // let { data: dataList } = await getData("menu", {});
      console.log("🚀 ~ getSelectData ~ dataList:", dataList);

      this.optionsList = formatMenu2Tree(dataList, null, []);
      console.log(" this.optionsList", this.optionsList);
    },
    AddClick() {
      this.isShow = false;
      this.postList = {
        parentId: null,
        type: "目录",
        sortNum: 1,
        status: true,
      };
      this.add = true;
      this.dialogFormVisible = true;
      this.getSelectData();
      this.$nextTick(() => {
        this.isShow = true;
        this.$refs.IconSelects.editClicks();
      });
    },
    EditClick(item) {
      this.add = false;
      this.isShow = true;
      this._id = item._id;
      this.postList = item;
      this.dialogFormVisible = true;
      this.getSelectData();
      this.$nextTick(() => {
        this.$forceUpdate();
        this.$refs.IconSelects.editClicks();
      });
    },

    async createData() {
      console.log("this.postList", !this.postList.menuName);

      if (!this.postList.menuName) {
        this.$message.warning("节点标题不能为空");
        return;
      }
      const todata = {
        ...this.postList,
      };
      console.log(todata);
      let response = await addData("menu", todata);
      console.log(response);
      if (response) {
        console.log(response);
        this.$emit("custom-event");
        this.dialogFormVisible = false;
        this.postList = {
          parentId: null,
          type: "目录",
          sortNum: 1,
          status: true,
        };
        this.$notify({
          title: "添加菜单成功",
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
    //编辑时标签修改
    handleClose(tag) {
      console.log(tag);
    },
    editData() {
      if (!this.postList.menuName) {
        this.$message.warning("节点标题不能为空");
        return;
      }
      delete this.postList._id;
      var data = {
        query: { _id: this._id },
        update: {
          ...this.postList,
        },
      };
      console.log(data);
      let response = updateData("menu", data);
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
  },
};
</script>
<style lang="scss" scoped>
.app-container {
  .el-dialog {
    .el-dialog__body {
      padding: 10px 20px;
    }

    .el-form {
      .el-form-item {
        margin-bottom: 18px;

        &.is-required .el-form-item__label:before {
          color: #f56c6c;
        }
      }

      .el-input,
      .el-cascader,
      .el-radio-group {
        width: 100%;
      }

      .el-input-number {
        width: 120px;
      }
    }

    .el-divider {
      margin: 15px 0;
    }

    .dialog-footer {
      text-align: right;
      padding-top: 10px;

      .el-button + .el-button {
        margin-left: 10px;
      }
    }
  }
}
</style>
