<template>
  <div>
    <el-table
      :class="customer ? 'common-customer-table' : ''"
      ref="table"
      v-loading="tableDataloading"
      :data="tableData"
      :height="$attrs['height']"
      :highlight-current-row="$attrs['highlight-current-row']"
      v-bind="$attrs"
      v-on="$listeners"
      :default-sort="defaultSort"
      :header-cell-style="{
        background: '#F3F4F7',
        height: '40px',
        textAlign: 'center',
      }"
      :border="border"
      :show-header="showHeader"
      :row-style="{ height: '70px' }"
    >
      <el-table-column
        label="序号"
        width="70px"
        align="center"
        v-if="isShowIndex"
      >
        <template slot-scope="scope">
          <div>
            {{ scope.$index + (currentPage - 1) * pageSize + 1 }}
          </div>
        </template>
      </el-table-column>
      <!-- 法律法规专用插槽 -->
      <slot name="law"/>
      <!-- 过程控制-审核提醒专用插槽 -->
      <slot name="reviewRemind"/>
    </el-table>
    <el-pagination
      v-if="total"
      background
      class="pagination"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="currentPage"
      :page-size="pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :total="total"
    ></el-pagination>
  </div>
</template>

<script>
export default {
  props: {
    showHeader: {
      type: Boolean,
      default: true,
    },
    defaultSort: {
      type: Object,
      default: function () {
        return {}
      }
    },
    customer: {
      type: Boolean,
      default: false,
    },
    border: {
      type: Boolean,
      default: false,
    },
    isShowIndex: {
      type: Boolean,
      default: true,
    },
    tableDataloading: {
      type: Boolean,
      default: false,
      required: false,
    },
    // 分页数据总数
    total: {
      type: Number,
      default: 0,
      required: false,
    },
    // 单页数据量
    pageSize: {
      type: Number,
      default: 10,
      required: false,
    },
    // 当前页码
    currentPage: {
      type: Number,
      default: 1,
      required: false,
    },
    // 表格数据
    tableData: {
      type: Array,
      default: () => [],
      required: false,
    },
    // 表头数据
    // columnData: {
    //     type: Array,
    //     required: true,
    // },
  },
  data() {
    return {};
  },
  methods: {
    //当前页码改变
    handleCurrentChange(currentPage) {
      this.$emit("handleCurrentChange", currentPage);
    },
    //每页显示条目个数改变
    handleSizeChange(pageSize) {
      this.$emit("handleSizeChange", pageSize);
    },
    //翻页返回表格顶部
    getTableDom() {
      this.$nextTick(() => {
        this.$refs.table.bodyWrapper.scrollTop = 0;
      });
    },
  },
};
</script>


<style scoped>
.tableButtons {
  float: right;
  margin-top: 20px;
}

.pagination {
  text-align: right;
  margin-top: 20px;
  margin-bottom: 30px;
}
</style>
