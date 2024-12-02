<template>
  <div class="app-container">
      <el-card class="filter-container">
          <div slot="header" class="clearfix">
              <span>筛选搜索</span>
              <el-button style="float: right; padding: 3px 0" type="text" @click="toggleAdvanced">
                  {{ showAdvanced ? '收起' : '展开' }}高级搜索
              </el-button>
          </div>

          <el-form :model="searchForm" ref="searchForm" class="demo-form-inline">
              <el-row :gutter="20">
                  <el-col :span="6">
                      <el-form-item label="单据编号">
                          <el-input v-model="searchForm.FBillNo" placeholder="请输入单据编号" clearable></el-input>
                      </el-form-item>
                  </el-col>
                  <el-col :span="6">
                      <el-form-item label="单据状态">
                          <el-select v-model="searchForm.FDocumentStatus" placeholder="请选择单据状态" clearable
                              style="width: 100%">
                              <el-option label="草稿" value="DRAFT" />
                              <el-option label="已审核" value="APPROVED" />
                              <el-option label="已关闭" value="CLOSED" />
                          </el-select>
                      </el-form-item>
                  </el-col>
                  <el-col :span="6">
                      <el-form-item label="单据日期">
                          <el-date-picker v-model="searchForm.FDate" type="daterange" range-separator="至"
                              start-placeholder="开始日期" end-placeholder="结束日期" style="width: 100%">
                          </el-date-picker>
                      </el-form-item>
                  </el-col>
                  <el-col :span="6">
                      <el-form-item label="物料编码">
                          <el-input v-model="searchForm.FMaterialId" placeholder="请输入物料编码" clearable></el-input>
                      </el-form-item>
                  </el-col>
              </el-row>

              <el-collapse-transition>
                  <div v-show="showAdvanced">
                      <el-row :gutter="20">
                          <el-col :span="6">
                              <el-form-item label="生产车间">
                                  <el-select v-model="searchForm.FWorkShopID0" placeholder="请选择生产车间" clearable
                                      style="width: 100%">
                                      <el-option v-for="shop in workshopList" :key="shop.value" :label="shop.label"
                                          :value="shop.value" />
                                  </el-select>
                              </el-form-item>
                          </el-col>
                          <el-col :span="6">
                              <el-form-item label="产品类型">
                                  <el-input v-model="searchForm.FProductType" placeholder="请输入产品类型"
                                      clearable></el-input>
                              </el-form-item>
                          </el-col>
                          <el-col :span="6">
                              <el-form-item label="计划开工时间">
                                  <el-date-picker v-model="searchForm.FPlanStartDate" type="date" placeholder="选择开工时间"
                                      style="width: 100%">
                                  </el-date-picker>
                              </el-form-item>
                          </el-col>
                          <el-col :span="6">
                              <el-form-item label="计划完工时间">
                                  <el-date-picker v-model="searchForm.FPlanFinishDate" type="date"
                                      placeholder="选择完工时间" style="width: 100%">
                                  </el-date-picker>
                              </el-form-item>
                          </el-col>
                      </el-row>
                  </div>
              </el-collapse-transition>

              <el-form-item>
                  <el-button type="primary" @click="handleSearch">查询</el-button>
                  <el-button @click="resetForm">重置</el-button>
                  <el-button type="success" @click="handleAdd">新增订单</el-button>
              </el-form-item>
          </el-form>
      </el-card>

      <el-table v-loading="loading" :data="tableData" style="width: 100%;margin-top: 20px;" border>
          <el-table-column prop="FBillNo" label="单据编号" width="150" />
          <el-table-column prop="FDocumentStatus" label="单据状态" width="100">
              <template slot-scope="scope">
                  <el-tag :type="getStatusType(scope.row.FDocumentStatus)">
                      {{ getStatusText(scope.row.FDocumentStatus) }}
                  </el-tag>
              </template>
          </el-table-column>
          <el-table-column prop="FDate" label="单据日期" width="120">
              <template slot-scope="scope">
                  {{ formatDate(scope.row.FDate) }}
              </template>
          </el-table-column>
          <el-table-column prop="FMaterialId" label="物料编码" width="120" />
          <el-table-column prop="FMaterialName" label="物料名称" width="150" />
          <el-table-column prop="FSpecification" label="规格型号" width="120" />
          <el-table-column prop="FProductType" label="产品类型" width="120" />
          <el-table-column prop="FQty" label="数量" width="100" />
          <el-table-column prop="FUnitId" label="单位" width="80" />
          <el-table-column prop="FWorkShopID_FName" label="生产车间" width="120" />
          <el-table-column prop="FPlanStartDate" label="计划开工时间" width="120">
              <template slot-scope="scope">
                  {{ formatDate(scope.row.FPlanStartDate) }}
              </template>
          </el-table-column>
          <el-table-column prop="FPlanFinishDate" label="计划完工时间" width="120">
              <template slot-scope="scope">
                  {{ formatDate(scope.row.FPlanFinishDate) }}
              </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
              <template slot-scope="scope">
                  <el-button size="mini" type="text" @click="handleEdit(scope.row)">编辑</el-button>
                  <el-button size="mini" type="text" @click="handleView(scope.row)">查看</el-button>
                  <el-button size="mini" type="text" @click="handleDelete(scope.row)"
                      v-if="scope.row.FDocumentStatus === 'DRAFT'">删除</el-button>
              </template>
          </el-table-column>
      </el-table>

      <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange"
          :current-page="page.current" :page-sizes="[10, 20, 50, 100]" :page-size="page.size"
          layout="total, sizes, prev, pager, next, jumper" :total="page.total" style="margin-top: 20px;">
      </el-pagination>
  </div>
</template>

<script>
import { mode } from 'crypto-js';
import model from './model.json'
import { formatDate } from '@/utils/date'

export default {
  name: 'ProductionOrder',

  data() {
      return {
          // 模型定义
          modelName: 'PRD_MO',
          model: null,

          // 搜索表单
          searchForm: {
              FBillNo: '',
              FDocumentStatus: '',
              FDate: [],
              FMaterialId: '',
              FWorkShopID0: '',
              FProductType: '',
              FPlanStartDate: '',
              FPlanFinishDate: ''
          },

          // 高级搜索显示控制
          showAdvanced: false,

          // 表格数据
          tableData: [],
          loading: false,

          // 分页
          page: {
              current: 1,
              size: 10,
              total: 0
          },

          // 下拉选项数据
          orgList: [],
          workshopList: []
      }
  },

  created() {
      this.init()
      this.getList()
      this.getOrgList()
      this.getWorkshopList()
  },

  methods: {
      // 初始化
      init() {
          this.model = model.find(item => item.modelName === this.modelName)
      },

      // 获取数据列表
      async getList() {
          this.loading = true
          try {
              const res = await this.$requestK3Data({
                  modelName: "PRD_MO",
                  method: "BillQuery",
                  methodData: {
                      FormId: "PRD_MO",
                      FieldKeys: this.getFieldKeys(),
                      FilterString: this.getFilterString(),
                      OrderString: "",
                      TopRowCount: this.page.size,
                      StartRow: (this.page.current - 1) * this.page.size,
                      Limit: this.page.size
                  }
              })

              // 使用新的转换方法
              this.tableData = res.data.map(item => this.convertArrayToObject(item))
              this.page.total = res.total
          } catch (error) {
              console.error(error)
              this.$message.error('获取数据失败')
          }
          this.loading = false
      },

      // 获取字段列表
      getFieldKeys() {
          return this.model.header.map(item => {
              // 如果字段名包含下划线，则转换为点号格式
              if (item.name.includes('_')) {
                  return item.name.replace('_', '.')
              }
              return item.name
          }).join(',')
      },

      // 构建过滤条件
      getFilterString() {
          const filters = []

          if (this.searchForm.FBillNo) {
              filters.push(`FBillNo like '%${this.searchForm.FBillNo}%'`)
          }

          if (this.searchForm.FDocumentStatus) {
              filters.push(`FDocumentStatus = '${this.searchForm.FDocumentStatus}'`)
          }

          if (this.searchForm.FDate && this.searchForm.FDate.length === 2) {
              filters.push(`FDate >= '${formatDate(this.searchForm.FDate[0])}'`)
              filters.push(`FDate <= '${formatDate(this.searchForm.FDate[1])}'`)
          }

          if (this.searchForm.FMaterialId) {
              filters.push(`FMaterialId = '${this.searchForm.FMaterialId}'`)
          }

          if (this.searchForm.FProductType) {
              filters.push(`FProductType = '${this.searchForm.FProductType}'`)
          }

          if (this.searchForm.FPlanStartDate) {
              filters.push(`FPlanStartDate >= '${formatDate(this.searchForm.FPlanStartDate)}'`)
          }

          if (this.searchForm.FPlanFinishDate) {
              filters.push(`FPlanFinishDate <= '${formatDate(this.searchForm.FPlanFinishDate)}'`)
          }

          return filters.join(' and ')
      },

      // 获取组织列表
      async getOrgList() {
          // TODO: 实现获取组织列表的接口调用
      },

      // 获取车间列表  
      async getWorkshopList() {
          // TODO: 实现获取车间列表的接口调用
      },

      // 搜索
      handleSearch() {
          this.page.current = 1
          this.getList()
      },

      // 重置表单
      resetForm() {
          this.$refs.searchForm.resetFields()
          this.handleSearch()
      },

      // 新增
      handleAdd() {
          this.$router.push('/production/order/add')
      },

      // 编辑
      handleEdit(row) {
          this.$router.push(`/production/order/edit/${row.FID}`)
      },

      // 查看
      handleView(row) {
          this.$router.push(`/production/order/view/${row.FID}`)
      },

      // 删除
      handleDelete(row) {
          this.$confirm('确认删除该生产订单?', '提示', {
              type: 'warning'
          }).then(() => {
              // TODO: 实现删除接口调用
          })
      },

      // 分页大小改变
      handleSizeChange(val) {
          this.page.size = val
          this.getList()
      },

      // 当前页改变
      handleCurrentChange(val) {
          this.page.current = val
          this.getList()
      },

      // 格式化日期
      formatDate,

      // 获取状态类型
      getStatusType(status) {
          const map = {
              'DRAFT': 'info',
              'APPROVED': 'success',
              'CLOSED': 'warning'
          }
          return map[status] || 'info'
      },

      // 获取状态文本
      getStatusText(status) {
          const map = {
              'DRAFT': '草稿',
              'APPROVED': '已审核',
              'CLOSED': '已关闭'
          }
          return map[status] || status
      },

      // 切换高级搜索显示
      toggleAdvanced() {
          this.showAdvanced = !this.showAdvanced
      },

      // 新增转换方法
      convertArrayToObject(arrayData) {
          return this.model.header.reduce((obj, field, index) => {
              obj[field.name] = arrayData[index];
              return obj;
          }, {});
      }
  }
}
</script>

<style scoped>
.filter-container {
  margin-bottom: 20px;
}
</style>