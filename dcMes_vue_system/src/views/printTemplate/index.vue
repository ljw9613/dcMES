<template>
  <div class="app-container">
    <el-card class="filter-container">
      <div slot="header" class="clearfix">
        <span>筛选搜索</span>
        <el-button
          style="float: right; padding: 3px 0"
          type="text"
          @click="toggleAdvanced"
        >
          {{ showAdvanced ? "收起" : "展开" }}高级搜索
        </el-button>
      </div>

      <el-form :model="searchForm" ref="searchForm" class="demo-form-inline">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="模板名称">
              <el-input
                v-model="searchForm.templateName"
                placeholder="请输入模板名称"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="模板编号">
              <el-input
                v-model="searchForm.templateCode"
                placeholder="请输入模板编号"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="模板类型">
              <el-select
                v-model="searchForm.templateType"
                placeholder="请选择模板类型"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="dict in dict.type.templateType"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" v-show="showAdvanced">
          <el-col :span="6">
            <el-form-item label="业务类型">
              <el-select
                v-model="searchForm.businessType"
                placeholder="请选择业务类型"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="dict in dict.type.businessType"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="状态">
              <el-select
                v-model="searchForm.status"
                placeholder="请选择状态"
                clearable
                style="width: 100%"
              >
                <el-option label="启用" :value="true" />
                <el-option label="禁用" :value="false" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="创建时间">
              <el-date-picker
                v-model="searchForm.createAt"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="yyyy-MM-dd"
                style="width: 100%"
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-button type="primary" @click="search">查询搜索</el-button>
          <el-button @click="resetForm">重置</el-button>
          <el-button type="success" @click="exportData">导出数据</el-button>
          <el-button type="primary" icon="el-icon-plus" @click="handleAdd"
            >新增模板</el-button
          >
          <el-button
            type="danger"
            icon="el-icon-delete"
            :disabled="!selection.length"
            @click="handleBatchDelete"
          >
            批量删除
          </el-button>
          <el-button @click="dayinForm">ZRMES打印模板</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="screen1">
      <div class="screen_content">
        <div class="screen_content_first">
          <i class="el-icon-tickets">打印模板列表</i>
          <hir-input
            ref="hirInput"
            :printData="printData"
            :default-template="localPrintTemplate"
            @template-change="handleTemplateChange"
          />
        </div>
      </div>
    </div>
    <base-table
      ref="baseTable"
      :currentPage="currentPage"
      :highlight-current-row="true"
      :pageSize="pageSize"
      :tableData="tableList"
      :tableDataloading="listLoading"
      :total="total"
      @selection-change="handleSelectionChange"
      @handleCurrentChange="baseTableHandleCurrentChange"
      @handleSizeChange="baseTableHandleSizeChange"
    >
      <template slot="law">
        <el-table-column label="模板名称" prop="templateName" />
        <el-table-column label="模板编号" prop="templateCode" />
        <el-table-column label="模板类型" prop="templateType">
          <template slot-scope="scope">
            <dict-tag
              :options="dict.type.templateType"
              :value="scope.row.templateType"
            />
          </template>
        </el-table-column>
        <el-table-column label="业务类型" prop="businessType">
          <template slot-scope="scope">
            <dict-tag
              :options="dict.type.businessType"
              :value="scope.row.businessType"
            />
          </template>
        </el-table-column>
        <el-table-column label="纸张大小" prop="config.paperSize" />
        <el-table-column label="打印方向" prop="config.orientation" />
        <el-table-column label="版本号" prop="version" width="100" />
        <el-table-column label="是否默认" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.isDefault ? 'success' : 'info'">
              {{ scope.row.isDefault ? "是" : "否" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status ? 'success' : 'danger'">
              {{ scope.row.status ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template slot-scope="scope">
            {{ formatDate(scope.row.createAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button 
              v-if="checkPermission('print_template_editing')"
              type="text" 
              size="small" 
              @click="handleEdit(scope.row)"
            >
              <i class="el-icon-edit"></i> 编辑
            </el-button>
            <el-button 
              type="text" 
              size="small" 
              @click="handlePrint(scope.row)"
            >
              <i class="el-icon-printer"></i> 打印
            </el-button>
            <el-button
              v-if="checkPermission('delete_print_template')"
              type="text"
              size="small"
              class="delete-btn"
              @click="handleDelete(scope.row)"
            >
              <i class="el-icon-delete"></i> 删除
            </el-button>
          </template>
        </el-table-column>
      </template>
    </base-table>

    <edit-dialog
      :visible.sync="dialogFormVisible"
      :dialog-status="dialogStatus"
      :row-data="dataForm"
      @submit="handleSubmit"
    />
    <el-dialog
      title="打印模板"
      :visible="dialogVisible1"
      fullscreen
      @close="closeDialog"
    >
      <Designer
        autoConnect
        :template="template"
        @onDesigned="onDesigned"
        style="height: 80vh"
      />
    </el-dialog>

    <!-- 修改打印对话框 -->
    <el-dialog title="批量打印" :visible.sync="printDialogVisible" width="50%">
      <el-form :model="printForm" label-width="100px">
        <el-form-item label="打印份数">
          <el-input-number
            v-model="printForm.copies"
            :min="1"
            :max="100"
          ></el-input-number>
        </el-form-item>

        <!-- 使用模板参数替代手动添加测试数据 -->
        <template v-if="currentPrintRow && currentPrintRow.printParams && currentPrintRow.printParams.length > 0">
          <el-divider content-position="center">打印参数</el-divider>
          <div v-for="(param, index) in currentPrintRow.printParams" :key="index">
            <el-form-item :label="param.paramName || param.paramKey">
              <!-- 字符串类型或未指定类型 -->
              <el-input 
                v-if="param.paramType === 'string' || !param.paramType" 
                :value="getPrintParamValue(param.paramKey)"
                @input="updatePrintParamValue(param.paramKey, $event)"
                :placeholder="`请输入${param.paramName || param.paramKey}`"
              ></el-input>
              <!-- 数字类型 -->
              <el-input-number 
                v-else-if="param.paramType === 'number'" 
                :value="getPrintParamValue(param.paramKey)"
                @change="updatePrintParamValue(param.paramKey, $event)"
                :controls="true"
                :placeholder="`请输入${param.paramName || param.paramKey}`"
              ></el-input-number>
              <!-- 日期类型 -->
              <el-date-picker 
                v-else-if="param.paramType === 'date'" 
                :value="getPrintParamValue(param.paramKey)"
                @input="updatePrintParamValue(param.paramKey, $event)"
                type="date" 
                value-format="yyyy-MM-dd" 
                :placeholder="`请选择${param.paramName || param.paramKey}`"
              ></el-date-picker>
              <!-- 布尔类型 -->
              <el-switch 
                v-else-if="param.paramType === 'boolean'" 
                :active-value="true"
                :inactive-value="false"
                :value="getPrintParamValue(param.paramKey) === true"
                @change="(val) => updatePrintParamValue(param.paramKey, val)"
              ></el-switch>
              <!-- 其他类型默认使用文本框 -->
              <el-input 
                v-else 
                :value="getPrintParamValue(param.paramKey)"
                @input="updatePrintParamValue(param.paramKey, $event)"
                :placeholder="`请输入${param.paramName || param.paramKey}`"
              ></el-input>
            </el-form-item>
          </div>
        </template>
        <el-empty v-else description="该模板未定义打印参数"></el-empty>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="printDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmPrint">确认打印</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getData, addData, updateData, removeData } from "@/api/data";
import EditDialog from "./components/EditDialog";
import { Designer } from "@sv-print/vue";
import HirInput from "@/components/hirInput";

export default {
  name: "printTemplate",
  dicts: ["templateType", "businessType"],
  components: {
    EditDialog,
    Designer,
    HirInput,
  },
  data() {
    return {
      searchForm: {
        templateName: "",
        templateCode: "",
        templateType: "",
        businessType: "",
        status: "",
      },
      tableList: [],
      total: 0,
      currentPage: 1,
      pageSize: 10,
      listLoading: true,
      showAdvanced: false,
      dialogFormVisible: false,
      dialogVisible1: false,
      dialogStatus: "",
      selection: [],
      dataForm: {},
      template: {},
      previewVisible: false,
      previewTemplate: null,
      previewData: {},
      printData: {},
      printTemplate: null,
      printDialogVisible: false,
      printForm: {
        copies: 1,
        paramValues: {}, // 替换testData，使用对象格式便于通过参数键名访问
      },
      currentPrintRow: null,
    };
  },
  computed: {
    localPrintTemplate: {
      get() {
        try {
          const savedTemplate = localStorage.getItem("printTemplate_template");
          return savedTemplate ? JSON.parse(savedTemplate) : null;
        } catch (error) {
          console.error("解析缓存模板失败:", error);
          return null;
        }
      },
      set(value) {
        try {
          localStorage.setItem("printTemplate_template", JSON.stringify(value));
        } catch (error) {
          console.error("保存模板到缓存失败:", error);
        }
      },
    },
  },
  methods: {
    onDesigned(e) {
      // 这里会 回调 2 个 关键对象
      console.log(e, "onDesigned");
      console.log(e.detail.hiprint); // hiprint 模块
      // 更多 API 可查看 log
      console.log(e.detail.designerUtils);
     
    //   e.detail.designerUtils.hiprintTemplate.setFontList([
    //     { title: "微软雅黑", value: "Microsoft YaHei" },
    //     { title: "黑体", value: "STHeitiSC-Light" },
    //     { title: "思源黑体", value: "SourceHanSansCN-Normal" },
    //     { title: "王羲之书法体", value: "王羲之书法体" },
    //     { title: "宋体", value: "SimSun" },
    //     { title: "华为楷体", value: "STKaiti" },
    //     { title: "cursive", value: "cursive" },
    //   ]);
    },
    dayinForm() {
      this.dialogVisible1 = true;
    },
    closeDialog() {
      this.dialogVisible1 = false;
    },
    getStatusType(status) {
      const statusMap = {
        运行中: "success",
        停机: "warning",
        故障: "danger",
        离线: "info",
      };
      return statusMap[status] || "info";
    },

    searchData() {
      let req = {
        query: {
          $and: [],
        },
      };

      Object.keys(this.searchForm).forEach((key) => {
        if (key === "createAt") {
          if (this.searchForm[key]) {
            req.query.$and.push({
              createAt: {
                $gte: this.searchForm[key][0] + " 00:00:00",
                $lte: this.searchForm[key][1] + " 23:59:59",
              },
            });
          }
        } else if (this.searchForm[key]) {
          req.query.$and.push({
            [key]: { $regex: this.searchForm[key], $options: "i" },
          });
        }
      });

      if (!req.query.$and.length) {
        delete req.query.$and;
      }

      return req;
    },

    async fetchData() {
      this.listLoading = true;
      try {
        let req = this.searchData();
        req.skip = (this.currentPage - 1) * this.pageSize;
        req.limit = this.pageSize;
        req.sort = { createAt: -1 };
        req.count = true;
        const result = await getData("printTemplate", req);
        this.tableList = result.data;
        this.total = result.countnum;
      } catch (error) {
        console.error("获取数据失败:", error);
        this.$message.error("获取数据失败");
      } finally {
        this.listLoading = false;
      }
    },

    formatDate(date) {
      if (!date) return "暂无数据";
      return new Date(date).toLocaleString();
    },

    resetForm() {
      this.searchForm = {
        templateName: "",
        templateCode: "",
        templateType: "",
        businessType: "",
        status: "",
      };

      this.$nextTick(() => {
        this.$refs.searchForm.resetFields();
      });

      this.currentPage = 1;
      this.pageSize = 10;

      this.fetchData();
    },

    search() {
      this.currentPage = 1;
      this.fetchData();
    },

    handleAdd() {
      this.dialogStatus = "create";
      this.dataForm = {}; // 清空表单数据
      this.dialogFormVisible = true; // 显示对话框
    },

    async handleEdit(row) {
      this.dialogStatus = "edit";
      let printTemplate = await getData("printTemplate", {
        query: { _id: row._id },
      });
      this.dataForm = JSON.parse(JSON.stringify(printTemplate.data[0])); // 深拷贝避免直接修改数据
      this.dialogFormVisible = true;
    },

    handleDelete(row) {
      this.$confirm("确认删除该打印模板吗?", "提示", {
        type: "warning",
      })
        .then(async () => {
          try {
            await removeData("printTemplate", { query: { _id: row._id } });
            this.$message.success("删除成功");
            this.fetchData();
          } catch (error) {
            console.error("删除失败:", error);
            this.$message.error("删除失败");
          }
        })
        .catch(() => {});
    },

    handleBatchDelete() {
      if (!this.selection.length) {
        this.$message.warning("请选择要删除的记录");
        return;
      }

      this.$confirm(
        `确认删除选中的 ${this.selection.length} 条记录吗？`,
        "提示",
        {
          type: "warning",
        }
      )
        .then(async () => {
          try {
            const ids = this.selection.map((item) => item._id);
            await removeData("machine", { query: { _id: { $in: ids } } });
            this.$message.success("批量删除成功");
            this.fetchData();
          } catch (error) {
            console.error("批量删除失败:", error);
            this.$message.error("批量删除失败");
          }
        })
        .catch(() => {});
    },

    async getTemplateCode(templateType) {
      try {
        // 获取同类型的所有模板
        const result = await getData("printTemplate", {
          query: { templateType: templateType },
        });

        // 获取当前日期作为编号前缀 (YYYYMMDD)
        // const date = new Date();
        // const year = date.getFullYear();
        // const month = String(date.getMonth() + 1).padStart(2, '0');
        // const day = String(date.getDate()).padStart(2, '0');
        // const datePrefix = `${year}${month}${day}`;

        // 生成序列号 (3位数，从001开始)
        const sequence = String(result.data.length + 1).padStart(3, "0");

        // 返回格式: 模板类型-日期-序号 (例如: PACK-20240319-001)
        return `${templateType}-${sequence}`;
        // return `${templateType}-${datePrefix}-${sequence}`;
      } catch (error) {
        console.error("获取模板编号失败:", error);
        throw error;
      }
    },

    async handleSubmit(formData) {
      try {
        if (this.dialogStatus === "create") {
          // 生成模板编号
          const templateCode = await this.getTemplateCode(
            formData.templateType
          );
          formData.templateCode = templateCode;

          await addData("printTemplate", formData);
          this.$message.success("添加成功");
        } else {
          await updateData("printTemplate", {
            query: { _id: formData._id },
            update: formData,
          });
          this.$message.success("更新成功");
        }
        this.fetchData();
      } catch (error) {
        console.error("操作失败:", error);
        this.$message.error("操作失败");
      }
    },

    handleSelectionChange(selection) {
      this.selection = selection;
    },

    baseTableHandleCurrentChange(currentPage) {
      this.currentPage = currentPage;
      this.fetchData();
    },

    baseTableHandleSizeChange(pageSize) {
      this.pageSize = pageSize;
      this.fetchData();
    },

    toggleAdvanced() {
      this.showAdvanced = !this.showAdvanced;
    },

    exportData() {
      // 获取当前表格数据
      const data = this.tableList;

      // 定义表头
      const headers = {
        templateName: "模板名称",
        templateCode: "模板编号",
        templateType: "模板类型",
        businessType: "业务类型",
        paperSize: "纸张大小",
        orientation: "打印方向",
        version: "版本号",
        isDefault: "是否默认",
        status: "状态",
        createTime: "创建时间",
      };

      // 处理导出数据
      const exportData = data.map((item) => {
        const row = {};
        for (const key in headers) {
          if (key === "createTime") {
            row[headers[key]] = this.formatDate(item[key]);
          } else {
            row[headers[key]] = item[key];
          }
        }
        return row;
      });

      // 导出Excel
      import("@/vendor/Export2Excel").then((excel) => {
        excel.export_json_to_excel({
          header: Object.values(headers),
          data: exportData.map((item) => Object.values(item)),
          filename: "打印模板列表",
          autoWidth: true,
          bookType: "xlsx",
        });
      });
    },

    handlePreview(row) {
      let templateTypeObj = this.dict.type.templateType.find(function (item) {
        return item.value === row.templateType;
      });
      let businessTypeObj = this.dict.type.businessType.find(function (item) {
        return item.value === row.businessType;
      });

      let printData = {
        ...row,
        createAt: this.formatDate(row.createAt),
        templateType: templateTypeObj
          ? templateTypeObj.label
          : row.templateType,
        businessType: businessTypeObj
          ? businessTypeObj.label
          : row.businessType,
        status: row.status ? "启用" : "禁用",
      };

      this.printData = printData;
      this.$nextTick(() => {
        this.$refs.hirInput.handlePrints();
      });
    },

    handleTemplateChange(template) {
      if (!template) return;

      try {
        this.printTemplate = template;
        this.localPrintTemplate = template;
        this.$message.success("打印模板已保存到本地");
      } catch (error) {
        console.error("保存打印模板失败:", error);
        this.$message.error("保存打印模板失败");
      }
    },

    handlePrint(row) {
      this.currentPrintRow = row;
      
      // 创建一个全新的对象
      this.printForm.paramValues = {};
      
      // 初始化参数值
      if (row.printParams && row.printParams.length > 0) {
        row.printParams.forEach(param => {
          let defaultValue = param.defaultValue || '';
          
          // 特殊处理布尔类型值
          if (param.paramType === 'boolean') {
            if (defaultValue === 'true') defaultValue = true;
            else if (defaultValue === 'false') defaultValue = false;
            else defaultValue = false; // 默认为false
          }
          
          // 使用Vue的$set方法确保响应式更新
          this.$set(this.printForm.paramValues, param.paramKey, defaultValue);
        });
      }
      
      this.printDialogVisible = true;
    },

    async confirmPrint() {
      if (!this.currentPrintRow) return;

      try {
        // 获取打印数据
        let templateTypeObj = this.dict.type.templateType.find(
          (item) => item.value === this.currentPrintRow.templateType
        );
        let businessTypeObj = this.dict.type.businessType.find(
          (item) => item.value === this.currentPrintRow.businessType
        );

        // 基础数据
        let printData = {
          ...this.currentPrintRow,
          createAt: this.formatDate(this.currentPrintRow.createAt),
          templateType: templateTypeObj
            ? templateTypeObj.label
            : this.currentPrintRow.templateType,
          businessType: businessTypeObj
            ? businessTypeObj.label
            : this.currentPrintRow.businessType,
          status: this.currentPrintRow.status ? "启用" : "禁用",
        };

        // 合并参数值到打印数据
        Object.assign(printData, this.printForm.paramValues);
        console.log('printData',printData);

        this.printData = printData;

        // 循环调用打印
        for (let i = 0; i < this.printForm.copies; i++) {
          await this.$nextTick();
          await this.$refs.hirInput.handlePrints2();
        }

        this.$message.success(`已打印 ${this.printForm.copies} 份`);
        this.printDialogVisible = false;
      } catch (error) {
        console.error("打印失败:", error);
        this.$message.error("打印失败");
      }
    },

    getPrintParamValue(key) {
      const value = this.printForm.paramValues[key];
      return value !== undefined ? value : '';
    },

    updatePrintParamValue(key, value) {
      console.log('更新参数值:', key, value); // 添加日志帮助调试
      this.$set(this.printForm.paramValues, key, value);
    },

    checkPermission(permission) {
      console.log('检查权限:', permission);
      
      try {
        // 获取用户角色信息
        const roles = this.$store.getters.roles || {};
        console.log('用户角色信息:', roles);
        
        // 检查buttonList是否存在并包含特定权限
        if (roles.buttonList && Array.isArray(roles.buttonList)) {
          return roles.buttonList.includes(permission);
        }
        
        // 如果找不到buttonList，尝试其他可能的路径
        if (roles.permissions) {
          return roles.permissions.includes(permission);
        }
        
        // 超级管理员默认拥有所有权限
        if (roles.roleKey === 'admin' || roles.isAdmin) {
          return true;
        }
        
        console.warn('未找到权限列表，默认返回true');
        return true; // 在开发过程中默认返回true方便测试
      } catch (error) {
        console.error('权限检查出错:', error);
        return true; // 出错时默认显示按钮
      }
    },
  },
  created() {
    this.fetchData();

    // 加载本地缓存的打印模板
    const savedTemplate = this.localPrintTemplate;
    if (savedTemplate) {
      this.$nextTick(() => {
        if (this.$refs.hirInput) {
          this.$refs.hirInput.handleTemplateChange(savedTemplate);
        }
      });
    }
  },
};
</script>


<style lang="scss" scoped>
.screen1 {
  height: auto;
  margin: 2vw 0;
  width: 100%;
  border: 1px solid #ebeef5;
  border-radius: 5px;
}

.screen_content_first {
  width: 100%;
  padding: 10px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
}

.el-icon-search {
  padding: 8px;
}

.el-icon-tickets {
  line-height: 30px;
}

.screen_content_second {
  width: 100%;
  padding: 10px;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
}

.screen_content_second_one {
  padding: 10px;
  display: flex;
  flex-direction: row;
  align-items: center;
}

.expert-detail-dialog {
  .expert-detail-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    padding: 10px;
  }

  .detail-card {
    margin: 10px;
    padding: 10px;
    border: 1px solid #ebeef5;
    border-radius: 5px;

    .card-header {
      font-weight: bold;
      font-size: 16px;
      color: #409eff;
      margin-bottom: 10px;
    }
  }
}

.modern-expert-dialog {
  .expert-detail-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    padding: 20px;
    background: #f5f7fa;
  }

  .detail-card {
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
    }

    .card-header {
      display: flex;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #ebeef5;
      background: linear-gradient(to right, #f0f2f5, #ffffff);

      i {
        margin-right: 8px;
        font-size: 18px;
        color: #409eff;
      }

      span {
        font-size: 16px;
        font-weight: 600;
        background: linear-gradient(120deg, #409eff, #36cfc9);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .stat-card {
    background: #f8fafc;
    border-radius: 8px;
    padding: 16px;
    text-align: center;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      background: #ffffff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .stat-value {
      font-size: 20px;
      font-weight: 600;
      color: #409eff;
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 13px;
      color: #909399;
    }
  }
}

.table-operations {
  margin: 15px 0;
  display: flex;
  gap: 10px;
}

.delete-btn {
  color: #f56c6c;

  &:hover {
    color: #f78989;
  }
}

.app-container {
  padding: 20px;

  .filter-container {
    margin-bottom: 20px;
  }
}

.table-expand {
  padding: 20px;
}
</style>
