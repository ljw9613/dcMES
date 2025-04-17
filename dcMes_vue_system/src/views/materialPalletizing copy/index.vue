<template>
  <div class="app-container">
    <el-card class="filter-container">
      <div slot="header" class="clearfix">
        <span>筛选搜索</span>
      </div>

      <el-form :model="searchForm" ref="searchForm" class="demo-form-inline">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="托盘编号">
              <el-input
                v-model="searchForm.palletCode"
                placeholder="请输入托盘编号"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="销售订单号">
              <el-input
                v-model="searchForm.saleOrderNo"
                placeholder="请输入销售订单号"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="生产订单号">
              <el-input
                v-model="searchForm.productionOrderNo"
                placeholder="请输入生产订单号"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="工单号">
              <el-input
                v-model="searchForm.workOrderNo"
                placeholder="请输入工单号"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="条码查询">
              <el-input
                v-model="searchForm.barcode"
                placeholder="请输入条码"
                clearable
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="产线">
              <zr-select
                style="width: 100%"
                v-model="searchForm.productLineId"
                collection="production_line"
                :search-fields="['lineCode', 'lineName']"
                label-key="lineName"
                tag-key="lineCode"
                sub-key="workshop"
                :multiple="false"
                placeholder="请输入产线信息搜索"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="组托状态">
              <el-select
                v-model="searchForm.status"
                placeholder="请选择状态"
                clearable
                style="width: 100%"
              >
                <el-option label="组托中" value="STACKING"></el-option>
                <el-option label="组托完成" value="STACKED"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="创建时间">
              <el-date-picker
                v-model="searchForm.dateRange"
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
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="出入库状态">
              <el-select
                v-model="searchForm.inWarehouseStatus"
                placeholder="请选择出入库状态"
                clearable
                style="width: 100%"
              >
                <el-option label="待入库" value="PENDING"></el-option>
                <el-option label="已入库" value="IN_WAREHOUSE"></el-option>
                <el-option label="已出库" value="OUT_WAREHOUSE"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-button type="primary" @click="search">查询搜索</el-button>
          <el-button @click="resetForm">重置</el-button>
          <!-- <el-button
            type="primary"
            @click="handleExport"
            :loading="exportLoading"
          >
            <i class="el-icon-download"></i>
            {{ exportLoading ? `正在导出(${exportProgress}%)` : "导出数据" }}
          </el-button> -->
          <el-button
            type="primary"
            @click="handleExportDetails"
            :loading="exportDetailsLoading"
          >
            <i class="el-icon-download"></i>
            {{ exportDetailsLoading ? `正在导出明细(${exportProgress}%)` : "导出条码明细" }}
          </el-button>
          <el-button
            type="primary"
            @click="handleExportAllBarcodes"
            :loading="exportAllBarcodesLoading"
          >
            <i class="el-icon-download"></i>
            {{ exportAllBarcodesLoading ? `正在导出(${exportProgress}%)` : "导出所有条码数据" }}
          </el-button>
          <el-button type="primary" @click="openScanDialog">
            <i class="el-icon-refresh"></i> 托盘抽检复位
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="screen1">
      <div class="screen_content">
        <div class="screen_content_first">
          <i class="el-icon-tickets">托盘组托列表</i>
          <div>
            <hir-input
              ref="hirInput"
              :printData="printData"
              :default-template="localPrintTemplate"
              @template-change="handleTemplateChange"
            />
          </div>
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
        <el-table-column type="expand">
          <template slot-scope="scope">
            <el-form label-position="left" inline class="table-expand">
              <!-- 订单信息 -->
              <el-card
                class="box-card"
                style="width: 100%; margin-bottom: 10px"
              >
                <div slot="header" class="clearfix">
                  <span>订单信息</span>
                </div>
                <div class="order-info-grid">
                  <div class="info-item">
                    <span class="label">销售订单号：</span>
                    <span class="value">{{
                      scope.row.saleOrderNo || "--"
                    }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">生产订单号：</span>
                    <span class="value">{{
                      scope.row.productionOrderNo || "--"
                    }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">工单号：</span>
                    <span class="value">{{
                      scope.row.workOrderNo || "--"
                    }}</span>
                  </div>
                </div>
              </el-card>

              <!-- 箱子明细 -->
              <el-card class="box-card" style="width: 100%">
                <div slot="header" class="clearfix">
                  <span>箱子明细</span>
                </div>
                <el-table
                  v-if="scope.row.boxItems.length"
                  :data="scope.row.boxItems"
                  border
                  style="width: 100%"
                >
                  <el-table-column
                    label="箱子条码"
                    prop="boxBarcode"
                    align="center"
                  ></el-table-column>
                  <el-table-column
                    label="数量"
                    prop="quantity"
                    align="center"
                  ></el-table-column>
                  <el-table-column label="扫描时间" align="center">
                    <template slot-scope="boxScope">
                      {{ formatDate(boxScope.row.scanTime) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" align="center">
                    <template slot-scope="boxScope">
                      <el-button
                        type="text"
                        style="color: red"
                        @click="
                          handleDelete(
                            scope.row.palletCode,
                            boxScope.row.boxBarcode
                          )
                        "
                        >解绑箱条码</el-button
                      >
                    </template>
                  </el-table-column>
                </el-table>
                <!-- 分割线 -->
                <el-divider content-position="left">托盘条码明细</el-divider>
                <!-- 条码明细 -->
                <el-table
                  :data="scope.row.palletBarcodes"
                  border
                  style="width: 100%"
                >
                  <el-table-column
                    label="条码"
                    prop="barcode"
                    align="center"
                  ></el-table-column>
                  <el-table-column label="扫描时间" align="center">
                    <template slot-scope="barcodeScope">
                      {{ formatDate(barcodeScope.row.scanTime) }}
                    </template>
                  </el-table-column>
                  <!-- 操作 -->
                  <el-table-column label="操作" align="center">
                    <template slot-scope="barcodeScope">
                      <el-button
                        type="text"
                        style="color: red"
                        @click="
                          handleDelete(
                            scope.row.palletCode,
                            barcodeScope.row.barcode
                          )
                        "
                        >解绑条码</el-button
                      >
                    </template>
                  </el-table-column>
                </el-table>
              </el-card>
            </el-form>
          </template>
        </el-table-column>
        <el-table-column label="托盘编号" align="center" prop="palletCode">
          <template slot-scope="scope">
            <el-link type="primary">{{ scope.row.palletCode }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="订单信息" align="center">
          <template slot-scope="scope">
            <div>销售单号: {{ scope.row.saleOrderNo || "--" }}</div>
            <div>生产单号: {{ scope.row.productionOrderNo || "--" }}</div>
            <div>工单号: {{ scope.row.workOrderNo || "--" }}</div>
          </template>
        </el-table-column>
        <el-table-column label="产线名称" prop="productLineName" align="center">
          <template slot-scope="scope">
            {{ scope.row.productLineName }}
            <el-tag
              size="mini"
              v-if="scope.row.productLineId && scope.row.productLineId.workshop"
              >{{ scope.row.productLineId.workshop }}</el-tag
            >
            <el-tag v-else>未记录生产车间</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="物料信息" align="center">
          <template slot-scope="scope">
            {{ scope.row.materialName }}
            <el-tag size="mini" v-if="scope.row.materialSpec">{{
              scope.row.materialSpec
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="组托状态" align="center">
          <template slot-scope="scope">
            <el-tag
              :type="scope.row.status === 'STACKED' ? 'success' : 'warning'"
            >
              {{ scope.row.status === "STACKED" ? "组托完成" : "组托中" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="抽检状态" align="center">
          <template slot-scope="scope">
            <el-tag
              :type="getInspectionStatusType(scope.row.inspectionStatus)"
              style="margin-top: 5px"
            >
              {{ getInspectionStatusText(scope.row.inspectionStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="出入库状态" align="center">
          <template slot-scope="scope">
            <el-tag :type="getWarehouseStatusType(scope.row.inWarehouseStatus)">
              {{ getWarehouseStatusText(scope.row.inWarehouseStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="数量信息" align="center">
          <template slot-scope="scope">
            <div>
              总数量: {{ scope.row.totalQuantity }} /
              {{ scope.row.palletBarcodes && scope.row.palletBarcodes.length }}
            </div>
            <div v-if="scope.row.boxCount">箱数: {{ scope.row.boxCount }}</div>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center">
          <template slot-scope="scope">
            {{ formatDate(scope.row.createAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center">
          <template slot-scope="scope">
            <el-button
              type="text"
              style="color: red"
              v-if="hasInitializeTrayDocumentsPermission"
              @click="handleAllDelete(scope.row)"
              >初始化单据</el-button
            >
            <el-button
              type="text"
              style="color: red"
              v-if="hasInitializeTrayDocumentsPermission"
              @click="Delete(scope.row)"
              >删除单据</el-button
            >
            <el-button
              type="text"
              style="color: #e6a23c"
              v-if="scope.row.status === 'STACKING'"
              @click="handleForceComplete(scope.row)"
            >
              强制完成
            </el-button>
            <el-button type="text" @click="handlePrint(scope.row)"
              >打印单据</el-button
            >
            <el-button
              type="text"
              style="color: orange"
              @click="showHistory(scope.row)"
              >解绑记录</el-button
            >
            <el-button
              type="text"
              style="color: #409eff"
              @click="showDetail(scope.row)"
              >查看详情</el-button
            >
            <el-button
              type="text"
              style="color: #67c23a"
              @click="handleSplitPallet(scope.row)"
              >拆分托盘</el-button
            >
            <el-button
              type="text"
              style="color: #67c23a"
              @click="handleInspectionReset(scope.row)"
              >抽检复位</el-button
            >
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

    <!-- 添加历史数据弹窗 -->
    <el-dialog
      title="解绑记录"
      :visible.sync="historyDialogVisible"
      width="80%"
    >
      <base-table
        ref="historyTable"
        :currentPage="historyCurrentPage"
        :highlight-current-row="true"
        :pageSize="historyPageSize"
        :tableData="historyTableList"
        :tableDataloading="historyListLoading"
        :total="historyTotal"
        @handleCurrentChange="historyTableHandleCurrentChange"
        @handleSizeChange="historyTableHandleSizeChange"
      >
        <template slot="law">
          <el-table-column type="expand">
            <template slot-scope="scope">
              <el-form label-position="left" inline class="table-expand">
                <el-card class="box-card" style="width: 100%">
                  <div slot="header" class="clearfix">
                    <span>影响的条码</span>
                  </div>
                  <el-table
                    :data="scope.row.affectedBarcodes"
                    border
                    style="width: 100%"
                  >
                    <el-table-column
                      label="条码"
                      prop="barcode"
                      align="center"
                    ></el-table-column>
                    <el-table-column label="条码类型" align="center">
                      <template slot-scope="barcodeScope">
                        <el-tag
                          :type="
                            barcodeScope.row.barcodeType === 'MAIN'
                              ? 'primary'
                              : 'success'
                          "
                        >
                          {{
                            barcodeScope.row.barcodeType === "MAIN"
                              ? "主条码"
                              : "箱条码"
                          }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column
                      label="所属箱码"
                      prop="boxBarcode"
                      align="center"
                    ></el-table-column>
                  </el-table>
                </el-card>
              </el-form>
            </template>
          </el-table-column>

          <el-table-column
            label="托盘编号"
            prop="palletCode"
            align="center"
          ></el-table-column>
          <el-table-column label="解绑类型" align="center">
            <template slot-scope="scope">
              <el-tag :type="getUnbindTypeTag(scope.row.unbindType)">
                {{ getUnbindTypeText(scope.row.unbindType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            label="解绑条码"
            prop="unbindBarcode"
            align="center"
          ></el-table-column>
          <el-table-column
            label="解绑原因"
            prop="reason"
            align="center"
          ></el-table-column>
          <el-table-column
            label="操作人"
            prop="createBy"
            align="center"
          ></el-table-column>
          <el-table-column label="操作时间" align="center">
            <template slot-scope="scope">
              {{ formatDate(scope.row.createAt) }}
            </template>
          </el-table-column>
        </template>
      </base-table>
    </el-dialog>

    <!-- 添加导出进度条对话框 -->
    <el-dialog
      title="导出进度"
      :visible.sync="exportDialogVisible"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      width="30%"
    >
      <el-progress
        :percentage="exportProgress"
        :status="exportProgress === 100 ? 'success' : ''"
        :stroke-width="18"
      >
      </el-progress>
      <div style="text-align: center; margin-top: 10px">
        {{ exportProgress === 100 ? "导出完成" : "正在导出数据，请稍候..." }}
      </div>
    </el-dialog>

    <!-- 添加详情弹窗 -->
    <el-dialog
      title="托盘组托详情"
      :visible.sync="detailDialogVisible"
      width="80%"
      class="pallet-detail-dialog"
    >
      <div v-if="detailData">
        <el-card class="box-card" style="margin-bottom: 20px">
          <div slot="header" class="clearfix">
            <span>基本信息</span>
          </div>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="托盘编号">{{
              detailData.palletCode
            }}</el-descriptions-item>
            <el-descriptions-item label="组托状态">
              <el-tag
                :type="detailData.status === 'STACKED' ? 'success' : 'warning'"
              >
                {{ detailData.status === "STACKED" ? "组托完成" : "组托中" }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{
              formatDate(detailData.createAt)
            }}</el-descriptions-item>
            <el-descriptions-item label="产线名称">
              {{ detailData.productLineName }}
              <el-tag
                size="mini"
                v-if="
                  detailData.productLineId && detailData.productLineId.workshop
                "
              >
                {{ detailData.productLineId.workshop }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="物料信息">
              {{ detailData.materialName }}
              <el-tag size="mini" v-if="detailData.materialSpec">{{
                detailData.materialSpec
              }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="数量信息">
              <div>
                总数量: {{ detailData.totalQuantity }} /
                {{
                  detailData.palletBarcodes && detailData.palletBarcodes.length
                }}
              </div>
              <div v-if="detailData.boxCount">
                箱数: {{ detailData.boxCount }}
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 订单信息 -->
        <el-card class="box-card" style="margin-bottom: 20px">
          <div slot="header" class="clearfix">
            <span>订单信息</span>
          </div>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="销售订单号">{{
              detailData.saleOrderNo || "--"
            }}</el-descriptions-item>
            <el-descriptions-item label="生产订单号">{{
              detailData.productionOrderNo || "--"
            }}</el-descriptions-item>
            <el-descriptions-item label="工单号">{{
              detailData.workOrderNo || "--"
            }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 箱子明细 -->
        <el-card class="box-card" style="margin-bottom: 20px">
          <div slot="header" class="clearfix">
            <span>箱子明细</span>
            <span
              class="box-count"
              v-if="detailData.boxItems && detailData.boxItems.length"
            >
              (共 {{ detailData.boxItems.length }} 箱)
            </span>
          </div>
          <el-table
            v-if="detailData.boxItems && detailData.boxItems.length"
            :data="detailData.boxItems"
            border
            style="width: 100%"
          >
            <el-table-column
              label="箱子条码"
              prop="boxBarcode"
              align="center"
            ></el-table-column>
            <el-table-column
              label="数量"
              prop="quantity"
              align="center"
            ></el-table-column>
            <el-table-column label="扫描时间" align="center">
              <template slot-scope="boxScope">
                {{ formatDate(boxScope.row.scanTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="120">
              <template slot-scope="boxScope">
                <el-button
                  type="text"
                  style="color: red"
                  @click="
                    handleDelete(detailData.palletCode, boxScope.row.boxBarcode)
                  "
                  >解绑箱条码</el-button
                >
              </template>
            </el-table-column>
          </el-table>
          <div v-else class="empty-data">暂无箱子数据</div>
        </el-card>

        <!-- 条码明细 -->
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span>托盘条码明细</span>
            <span
              class="barcode-count"
              v-if="
                detailData.palletBarcodes && detailData.palletBarcodes.length
              "
            >
              (共 {{ detailData.palletBarcodes.length }} 条)
            </span>
          </div>
          <el-table :data="paginatedBarcodes" border style="width: 100%">
            <el-table-column
              label="条码"
              prop="barcode"
              align="center"
            ></el-table-column>
            <el-table-column label="扫描时间" align="center">
              <template slot-scope="barcodeScope">
                {{ formatDate(barcodeScope.row.scanTime) }}
              </template>
            </el-table-column>
            <el-table-column label="抽检状态" align="center">
              <template slot-scope="barcodeScope">
                <el-tag
                  :type="
                    getInspectionStatusType(barcodeScope.row.inspectionStatus)
                  "
                >
                  {{
                    getInspectionStatusText(barcodeScope.row.inspectionStatus)
                  }}
                </el-tag>
                <div v-if="barcodeScope.row.inspectionStatus">
                  <div
                    class="inspection-time"
                    v-if="barcodeScope.row.inspectionResult"
                  >
                    抽检结果:
                    <el-tag
                      :type="
                        getInspectionResultType(
                          barcodeScope.row.inspectionResult
                        )
                      "
                    >
                      {{
                        getInspectionResultText(
                          barcodeScope.row.inspectionResult
                        )
                      }}
                    </el-tag>
                  </div>
                  <div
                    class="inspection-time"
                    v-if="barcodeScope.row.inspectionTime"
                  >
                    抽检时间: {{ formatDate(barcodeScope.row.inspectionTime) }}
                  </div>
                  <div
                    class="inspection-remarks"
                    v-if="barcodeScope.row.inspectionRemarks"
                  >
                    备注: {{ barcodeScope.row.inspectionRemarks }}
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="120">
              <template slot-scope="barcodeScope">
                <el-button
                  type="text"
                  style="color: red"
                  @click="
                    handleDelete(
                      detailData.palletCode,
                      barcodeScope.row.barcode
                    )
                  "
                  >解绑条码</el-button
                >
              </template>
            </el-table-column>
          </el-table>

          <!-- 添加分页控件 -->
          <div
            class="pagination-container"
            v-if="detailData.palletBarcodes && detailData.palletBarcodes.length"
          >
            <el-pagination
              @size-change="handleDetailSizeChange"
              @current-change="handleDetailCurrentChange"
              :current-page="detailCurrentPage"
              :page-sizes="[10, 20, 50, 100]"
              :page-size="detailPageSize"
              layout="total, sizes, prev, pager, next, jumper"
              :total="detailData.palletBarcodes.length"
            >
            </el-pagination>
          </div>

          <div
            v-if="
              !detailData.palletBarcodes || !detailData.palletBarcodes.length
            "
            class="empty-data"
          >
            暂无条码数据
          </div>
        </el-card>
      </div>
    </el-dialog>

    <!-- 添加拆分托盘弹窗 -->
    <split-pallet-dialog
      :visible.sync="splitPalletDialogVisible"
      :pallet="dataForm"
      @success="handleSplitSuccess"
    />

    <!-- 添加抽检复位对话框 -->
    <inspection-reset-dialog
      :visible.sync="inspectionResetDialogVisible"
      :pallet="dataForm"
      @success="handleInspectionResetSuccess"
    />

    <!-- 添加托盘扫描对话框 -->
    <el-dialog
      title="托盘抽检复位扫描"
      :visible.sync="scanDialogVisible"
      width="500px"
      :close-on-click-modal="false"
      @open="focusInput"
    >
      <el-form :model="scanForm" ref="scanForm">
        <el-form-item label="托盘编号" prop="palletCode">
          <el-input
            ref="scanInput"
            v-model="scanForm.palletCode"
            placeholder="请扫描托盘条码"
            clearable
            @keyup.enter.native="handleScan"
          ></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="scanDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleScan" :loading="scanLoading"
          >查 询</el-button
        >
      </span>
      <div v-if="scanResult" class="scan-result">
        <el-alert
          :title="scanResultMessage"
          :type="scanResultType"
          :closable="false"
          show-icon
        ></el-alert>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getData, addData, updateData, removeData } from "@/api/data";
import {
  unbindPalletBarcode,
  unbindPalletAllBarcode,
  updatePalletInspectionStatus,
} from "@/api/materialPalletizing";
import EditDialog from "./components/EditDialog";
import HirInput from "@/components/hirInput";
import SplitPalletDialog from "./components/SplitPalletDialog";
import InspectionResetDialog from "./components/InspectionResetDialog";
export default {
  name: "MaterialPalletizing",
  components: {
    EditDialog,
    HirInput,
    SplitPalletDialog,
    InspectionResetDialog,
  },
  data() {
    return {
      searchForm: {
        palletCode: "",
        saleOrderNo: "",
        productionOrderNo: "",
        workOrderNo: "",
        productLineId: "",
        status: "",
        dateRange: [],
        barcode: "",
        inWarehouseStatus: "",
      },
      tableList: [],
      total: 0,
      currentPage: 1,
      pageSize: 10,
      listLoading: true,
      dialogFormVisible: false,
      dialogStatus: "",
      selection: [],
      dataForm: {},
      historyDialogVisible: false,
      historyCurrentPage: 1,
      historyPageSize: 10,
      historyTableList: [],
      historyListLoading: true,
      historyTotal: 0,
      exportLoading: false,
      exportDetailsLoading: false,
      exportAllBarcodesLoading: false,
      exportProgress: 0,
      exportDialogVisible: false,
      printDialogVisible: false,
      printData: {},
      printTemplate: null,

      hasInitializeTrayDocumentsPermission: false,
      detailDialogVisible: false,
      detailData: null,
      splitPalletDialogVisible: false,
      inspectionResetDialogVisible: false,
      detailCurrentPage: 1,
      detailPageSize: 10,

      // 添加扫描对话框相关数据
      scanDialogVisible: false,
      scanForm: {
        palletCode: "",
      },
      scanLoading: false,
      scanResult: false,
      scanResultMessage: "",
      scanResultType: "info",
    };
  },
  computed: {
    localPrintTemplate: {
      get() {
        try {
          const savedTemplate = localStorage.getItem(
            "printTemplate_materialPalletizing"
          );
          return savedTemplate ? JSON.parse(savedTemplate) : null;
        } catch (error) {
          console.error("解析缓存模板失败:", error);
          return null;
        }
      },
      set(value) {
        try {
          localStorage.setItem(
            "printTemplate_materialPalletizing",
            JSON.stringify(value)
          );
        } catch (error) {
          console.error("保存模板到缓存失败:", error);
        }
      },
    },
    paginatedBarcodes() {
      if (!this.detailData || !this.detailData.palletBarcodes) {
        return [];
      }

      const start = (this.detailCurrentPage - 1) * this.detailPageSize;
      const end = start + this.detailPageSize;
      return this.detailData.palletBarcodes.slice(start, end);
    },
  },
  methods: {
    inspectionDataHandle(row) {
      let data = [];
      for (let inspectionFieldEnumKey in inspectionFieldEnum) {
        inspectionFieldEnumKey !== "error" &&
          !this.isBlank(row[inspectionFieldEnumKey]) &&
          data.push(
            `${inspectionFieldEnum[inspectionFieldEnumKey]}：${row[inspectionFieldEnumKey]}`
          );
      }
      return data;
    },
    isBlank(value) {
      return (
        value === null ||
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === "object" && Object.keys(value).length === 0)
      );
    },
    searchData() {
      let req = {
        query: {
          $and: [],
        },
      };
      const escapeRegex = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      };
      if (this.searchForm.palletCode) {
        req.query.$and.push({
          palletCode: {
            $regex: escapeRegex(this.searchForm.palletCode),
            $options: "i",
          },
        });
      }

      if (this.searchForm.saleOrderNo) {
        req.query.$and.push({
          saleOrderNo: {
            $regex: escapeRegex(this.searchForm.saleOrderNo),
            $options: "i",
          },
        });
      }

      if (this.searchForm.productionOrderNo) {
        req.query.$and.push({
          productionOrderNo: {
            $regex: escapeRegex(this.searchForm.productionOrderNo),
            $options: "i",
          },
        });
      }

      if (this.searchForm.workOrderNo) {
        req.query.$and.push({
          workOrderNo: {
            $regex: escapeRegex(this.searchForm.workOrderNo),
            $options: "i",
          },
        });
      }

      if (this.searchForm.barcode) {
        const barcode = escapeRegex(this.searchForm.barcode);
        req.query.$and.push({
          $or: [
            { "palletBarcodes.barcode": barcode },
            { "boxItems.boxBarcode": barcode },
          ],
        });
      }

      if (this.searchForm.productLineId) {
        req.query.$and.push({
          productLineId: this.searchForm.productLineId,
        });
      }

      if (this.searchForm.status) {
        req.query.$and.push({
          status: this.searchForm.status,
        });
      }

      if (this.searchForm.inWarehouseStatus) {
        req.query.$and.push({
          inWarehouseStatus: this.searchForm.inWarehouseStatus,
        });
      }

      if (this.searchForm.dateRange && this.searchForm.dateRange.length === 2) {
        const [startDate, endDate] = this.searchForm.dateRange;
        req.query.$and.push({
          createAt: {
            $gte: new Date(startDate).toISOString(),
            $lte: new Date(endDate + " 23:59:59.999").toISOString(),
          },
        });
      }

      if (!req.query.$and.length) {
        delete req.query.$and;
      }

      return req;
    },

    resetForm() {
      this.$refs.searchForm.resetFields();
      this.searchForm = {
        palletCode: "",
        saleOrderNo: "",
        productionOrderNo: "",
        workOrderNo: "",
        productLineId: "",
        status: "",
        dateRange: [],
        barcode: "",
        inWarehouseStatus: "",
      };
      this.currentPage = 1;
      this.fetchData();
    },

    async fetchData() {
      this.listLoading = true;
      try {
        let req = this.searchData();
        req.page = this.currentPage;
        req.skip = (this.currentPage - 1) * this.pageSize;
        req.limit = this.pageSize;
        req.sort = { _id: -1 };
        req.populate = JSON.stringify([
          { path: "productLineId" },
          { path: "productionOrderId" },
        ]);
        req.count = true;
        const result = await getData("material_palletizing", req);
        this.tableList = result.data;
        this.total = result.countnum;
      } catch (error) {
        console.error("获取数据失败:", error);
        this.$message.error("获取数据失败");
      } finally {
        this.listLoading = false;
      }
    },

    baseTableHandleCurrentChange(currentPage) {
      this.currentPage = currentPage;
      this.fetchData();
    },

    baseTableHandleSizeChange(pageSize) {
      this.pageSize = pageSize;
      this.fetchData();
    },

    formatDate(date) {
      if (!date) return "暂无数据";
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return "无效日期";
      }
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      const hours = String(dateObj.getHours()).padStart(2, "0");
      const minutes = String(dateObj.getMinutes()).padStart(2, "0");
      const seconds = String(dateObj.getSeconds()).padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },

    search() {
      this.currentPage = 1;
      this.fetchData();
    },

    handleSelectionChange(selection) {
      this.selection = selection;
    },

    handleView(row) {
      this.dataForm = JSON.parse(JSON.stringify(row));
      this.dialogStatus = "view";
      this.dialogFormVisible = true;
    },

    handleEdit(row) {
      this.dialogStatus = "edit";
      this.dataForm = JSON.parse(JSON.stringify(row));
      this.dialogFormVisible = true;
    },
    Delete(row) {
      this.$confirm("确认要删除该单据吗?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(async () => {
        await removeData("material_palletizing", { query: { _id: row._id } });
        this.$message.success("删除成功");
        this.fetchData();
      });
    },
    handleAllDelete(row) {
      this.$confirm("确认要初始化该单据吗?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(async () => {
        try {
          const response = await unbindPalletAllBarcode({
            palletCode: row.palletCode,
            userId: this.$store.state.user.id,
          });
          if (response.success) {
            this.$message.success("初始化成功");
            this.fetchData();
          } else {
            this.$message.error(response.message);
          }
        } catch (error) {
          console.error("初始化失败:", error);
          this.$message.error("初始化失败");
        }
      });
    },

    handleDelete(palletCode, barcode) {
      this.$confirm("确认要解绑该条码吗?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(async () => {
          try {
            const response = await unbindPalletBarcode({
              palletCode: palletCode,
              barcode: barcode,
              userId: this.$store.state.user.id,
            });

            if (response.success) {
              this.$message.success("解绑成功");
              this.fetchData();
            } else {
              this.$message.error(response.message);
            }
          } catch (error) {
            console.error("解绑失败:", error);
            this.$message.error("解绑失败");
          }
        })
        .catch(() => {
          this.$message.info("已取消解绑");
        });
    },

    handleAdd() {
      this.dialogStatus = "create";
      this.dataForm = {};
      this.dialogFormVisible = true;
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
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        }
      )
        .then(async () => {
          try {
            const ids = this.selection.map((item) => item._id);
            await removeData("InspectionLastData", {
              query: { _id: { $in: ids } },
            });
            this.$message.success("批量删除成功");
            this.fetchData();
          } catch (error) {
            console.error("批量删除失败:", error);
            this.$message.error("批量删除失败");
          }
        })
        .catch(() => {});
    },

    async handleSubmit(formData) {
      try {
        if (this.dialogStatus === "create") {
          await addData("InspectionLastData", formData);
          this.$message.success("新增成功");
        } else {
          await updateData("InspectionLastData", {
            query: { _id: formData._id },
            update: formData,
          });
          this.$message.success("更新成功");
        }
        this.dialogFormVisible = false;
        this.fetchData();
      } catch (error) {
        console.error("操作失败:", error);
        this.$message.error("操作失败");
      }
    },
    handlePrint(row) {
      let printData = row;
      printData.createAt = this.formatDate(row.createAt);
      printData.workshop =
        (row.productionOrderId && row.productionOrderId.FWorkShopID_FName) ||
        "未记录生产车间";
      printData.qrcode = `${row.palletCode}#${row.saleOrderNo}#${
        row.materialCode
      }#${row.totalQuantity}#${
        (row.productLineId && row.productLineId.lineCode) || "未记录生产线"
      }`;
      printData.palletBarcodes = row.palletBarcodes.map((item) => {
        item.scanTime = this.formatDate(item.scanTime);
        return item;
      });
      this.printData = printData;
      this.$nextTick(() => {
        this.$refs.hirInput.handlePrints();
      });
    },
    showHistory(row) {
      this.historyCurrentPage = 1;
      this.dataForm = row;
      
      this.fetchHistoryData(row.palletCode);
      this.historyDialogVisible = true;
    },

    getUnbindTypeTag(type) {
      const tags = {
        SINGLE: "info",
        BOX: "warning",
        PALLET: "danger",
      };
      return tags[type] || "info";
    },

    getUnbindTypeText(type) {
      const texts = {
        SINGLE: "单个解绑",
        BOX: "整箱解绑",
        PALLET: "整托解绑",
      };
      return texts[type] || type;
    },

    async fetchHistoryData(palletCode) {
      this.historyListLoading = true;
      try {
        const req = {
          query: {
            palletCode: palletCode,
          },
          page: this.historyCurrentPage,
          skip: (this.historyCurrentPage - 1) * this.historyPageSize,
          limit: this.historyPageSize,
          sort: { createAt: -1 },
          count: true,
        };

        const result = await getData("material_palletizing_unbind_log", req);
        this.historyTableList = result.data;
        this.historyTotal = result.countnum;
      } catch (error) {
        console.error("获取解绑记录失败:", error);
        this.$message.error("获取解绑记录失败");
      } finally {
        this.historyListLoading = false;
      }
    },

    historyTableHandleCurrentChange(currentPage) {
      this.historyCurrentPage = currentPage;
      this.fetchHistoryData(this.dataForm.palletCode);
    },

    historyTableHandleSizeChange(pageSize) {
      this.historyPageSize = pageSize;
      this.historyCurrentPage = 1;
      this.fetchHistoryData(this.dataForm.palletCode);
    },

    async handleExport() {
      this.exportLoading = true;
      this.exportProgress = 0;
      this.exportDialogVisible = true;

      try {
        // 构建查询条件
        let req = this.searchData();
        req.populate = JSON.stringify([
          { path: "productLineId" },
          { path: "productionOrderId" },
        ]);

        // 获取所有数据（不分页）
        const result = await getData("material_palletizing", req);
        const totalItems = result.data.length;

        if (totalItems === 0) {
          this.$message.warning("没有数据可导出");
          this.exportDialogVisible = false;
          this.exportLoading = false;
          return;
        }

        // 导入所需库
        const XLSX = (await import('xlsx')).default;
        const JSZip = (await import("jszip")).default;
        const FileSaver = await import("file-saver");
        
        const zip = new JSZip();
        const folder = zip.folder("托盘条码明细");
        
        // 处理每个托盘
        for (let i = 0; i < totalItems; i++) {
          const pallet = result.data[i];
          const palletCode = pallet.palletCode || `未知托盘_${i}`;
          
          // 创建工作簿
          const wb = XLSX.utils.book_new();
          
          // 基本信息数据
          const basicInfoData = [
            ["托盘编号", "销售订单号", "生产订单号", "工单号", "产线名称", "物料名称", "物料规格", "组托状态", "总数量", "箱数量", "创建时间"],
            [
              palletCode,
              pallet.saleOrderNo || "--",
              pallet.productionOrderNo || "--",
              pallet.workOrderNo || "--",
              pallet.productLineName || "--",
              pallet.materialName || "--",
              pallet.materialSpec || "--",
              pallet.status === "STACKED" ? "组托完成" : "组托中",
              pallet.totalQuantity || 0,
              pallet.boxCount || 0,
              this.formatDate(pallet.createAt)
            ]
          ];
          
          // 创建基本信息工作表
          const basicWs = XLSX.utils.aoa_to_sheet(basicInfoData);
          XLSX.utils.book_append_sheet(wb, basicWs, "基本信息");
          
          // 条码明细
          if (pallet.palletBarcodes && pallet.palletBarcodes.length > 0) {
            const barcodesData = [
              ["条码", "扫描时间", "抽检状态", "抽检结果", "抽检时间", "备注"],
              ...pallet.palletBarcodes.map(barcode => [
                barcode.barcode,
                this.formatDate(barcode.scanTime),
                this.getInspectionStatusText(barcode.inspectionStatus),
                this.getInspectionResultText(barcode.inspectionResult) || "--",
                barcode.inspectionTime ? this.formatDate(barcode.inspectionTime) : "--",
                barcode.inspectionRemarks || "--"
              ])
            ];
            
            const barcodesWs = XLSX.utils.aoa_to_sheet(barcodesData);
            XLSX.utils.book_append_sheet(wb, barcodesWs, "条码明细");
          }
          
          // 箱子明细
          if (pallet.boxItems && pallet.boxItems.length > 0) {
            const boxesData = [
              ["箱子条码", "数量", "扫描时间"],
              ...pallet.boxItems.map(box => [
                box.boxBarcode,
                box.quantity,
                this.formatDate(box.scanTime)
              ])
            ];
            
            const boxesWs = XLSX.utils.aoa_to_sheet(boxesData);
            XLSX.utils.book_append_sheet(wb, boxesWs, "箱子明细");
          }
          
          // 将工作簿写入二进制格式
          const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          
          // 添加到ZIP文件
          folder.file(`${palletCode}.xlsx`, excelBuffer);
          
          // 更新进度
          this.exportProgress = Math.round(((i + 1) / totalItems) * 100);
          
          // 给UI更新的机会
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        // 生成zip文件
        const zipContent = await zip.generateAsync({ type: 'blob' });
        
        // 保存文件
        FileSaver.saveAs(zipContent, `托盘条码明细_${new Date().getTime()}.zip`);
        
        this.exportProgress = 100;
        this.$message.success("导出成功");
        
        setTimeout(() => {
          this.exportDialogVisible = false;
          this.exportProgress = 0;
        }, 1000);
      } catch (error) {
        console.error("导出失败:", error);
        this.$message.error(`导出失败: ${error.message}`);
        this.exportDialogVisible = false;
      } finally {
        this.exportLoading = false;
      }
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

    handleForceComplete(row) {
      this.$confirm(
        "确认要强制完成该托盘的组托吗？此操作将修改当前数量为总数量。",
        "提示",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        }
      )
        .then(async () => {
          try {
            await updateData("material_palletizing", {
              query: { _id: row._id },
              update: {
                status: "STACKED",
                totalQuantity: row.palletBarcodes.length,
              },
            });
            this.$message.success("强制完成组托成功");
            this.fetchData();
          } catch (error) {
            console.error("强制完成组托失败:", error);
            this.$message.error("强制完成组托失败");
          }
        })
        .catch(() => {
          this.$message.info("已取消操作");
        });
    },

    showDetail(row) {
      this.detailData = JSON.parse(JSON.stringify(row));
      this.detailCurrentPage = 1; // 重置为第一页
      this.detailDialogVisible = true;
    },

    handleSplitPallet(row) {
      this.dataForm = JSON.parse(JSON.stringify(row));
      this.splitPalletDialogVisible = true;
    },

    handleSplitSuccess() {
      this.$message.success("托盘拆分成功");
      this.fetchData();
    },

    handleInspectionReset(row) {
      this.dataForm = JSON.parse(JSON.stringify(row));
      this.inspectionResetDialogVisible = true;
    },

    handleInspectionResetSuccess() {
      this.$message.success("托盘抽检复位成功");
      this.fetchData();
    },

    getInspectionStatusText(status) {
      const statusMap = {
        INSPECTING: "抽检中",
        INSPECTED: "抽检完成",
        PENDING: "未抽检",
        undefined: "未抽检",
        null: "未抽检",
      };
      return statusMap[status] || "未知状态";
    },

    getInspectionStatusType(status) {
      const typeMap = {
        INSPECTING: "warning",
        INSPECTED: "success",
        PENDING: "info",
        undefined: "info",
        null: "info",
      };
      return typeMap[status] || "info";
    },

    getInspectionResultType(result) {
      const typeMap = {
        PASS: "success",
        FAIL: "danger",
        PENDING: "info",
        PARTIAL: "warning",
        undefined: "info",
        null: "info",
      };
      return typeMap[result] || "info";
    },

    getInspectionResultText(result) {
      const resultMap = {
        PASS: "合格",
        FAIL: "不合格",
        PENDING: "待定",
      };
      return resultMap[result] || "未知状态";
    },

    getWarehouseStatusText(status) {
      const statusMap = {
        PENDING: "待入库",
        IN_WAREHOUSE: "已入库",
        OUT_WAREHOUSE: "已出库",
        undefined: "待入库",
        null: "待入库",
      };
      return statusMap[status] || "未知状态";
    },

    getWarehouseStatusType(status) {
      const typeMap = {
        PENDING: "info",
        IN_WAREHOUSE: "success",
        OUT_WAREHOUSE: "warning",
        undefined: "info",
        null: "info",
      };
      return typeMap[status] || "info";
    },

    handleDetailSizeChange(size) {
      this.detailPageSize = size;
      this.detailCurrentPage = 1;
    },

    handleDetailCurrentChange(page) {
      this.detailCurrentPage = page;
    },

    // 打开扫描对话框
    openScanDialog() {
      this.scanDialogVisible = true;
      this.scanForm.palletCode = "";
      this.scanResult = false;
    },

    // 聚焦输入框
    focusInput() {
      this.$nextTick(() => {
        this.$refs.scanInput.focus();
      });
    },

    // 处理扫描
    async handleScan() {
      if (!this.scanForm.palletCode) {
        this.$message.warning("请输入托盘编号");
        return;
      }

      this.scanLoading = true;
      this.scanResult = false;

      try {
        const [palletCode, saleOrderNo, materialCode, quantity, lineCode] =
          this.scanForm.palletCode.split("#");
        // 查询托盘数据
        const req = {
          query: {
            palletCode: palletCode,
          },
          limit: 1,
          populate: JSON.stringify([
            { path: "productLineId" },
            { path: "productionOrderId" },
          ]),
        };

        const result = await getData("material_palletizing", req);

        if (result.data && result.data.length > 0) {
          const palletData = result.data[0];
          this.scanResultMessage = `已找到托盘: ${palletData.palletCode}`;
          this.scanResultType = "success";
          this.scanResult = true;

          // 延迟关闭对话框并打开抽检复位组件
          setTimeout(() => {
            this.scanDialogVisible = false;
            this.handleInspectionReset(palletData);
          }, 1000);
        } else {
          this.scanResultMessage = `未找到托盘: ${this.scanForm.palletCode}`;
          this.scanResultType = "error";
          this.scanResult = true;
        }
      } catch (error) {
        console.error("查询托盘数据失败:", error);
        this.scanResultMessage = "查询托盘数据失败，请重试";
        this.scanResultType = "error";
        this.scanResult = true;
      } finally {
        this.scanLoading = false;
      }
    },

    async handleExportAllBarcodes() {
      this.exportAllBarcodesLoading = true;
      this.exportProgress = 0;
      this.exportDialogVisible = true;

      try {
        // 构建查询条件
        let req = this.searchData();
        req.populate = JSON.stringify([
          { path: "productLineId" },
          { path: "productionOrderId" },
        ]);

        // 获取所有数据（不分页）
        const result = await getData("material_palletizing", req);
        const totalItems = result.data.length;

        if (totalItems === 0) {
          this.$message.warning("没有数据可导出");
          this.exportDialogVisible = false;
          this.exportAllBarcodesLoading = false;
          return;
        }

        // 导入所需库
        const XLSX = (await import('xlsx')).default;
        const FileSaver = await import("file-saver");

        // 准备所有条码数据
        let allBarcodeData = [];
        
        // 处理每个托盘
        for (let i = 0; i < totalItems; i++) {
          const pallet = result.data[i];
          
          // 遍历托盘内的所有条码
          if (pallet.palletBarcodes && pallet.palletBarcodes.length > 0) {
            pallet.palletBarcodes.forEach(barcode => {
              allBarcodeData.push({
                "托盘编号": pallet.palletCode || "--",
                "条码": barcode.barcode || "--",
                "销售订单号": pallet.saleOrderNo || "--",
                "生产订单号": pallet.productionOrderNo || "--",
                "工单号": pallet.workOrderNo || "--",
                "产线名称": pallet.productLineName || "--",
                "物料名称": pallet.materialName || "--",
                "物料规格": pallet.materialSpec || "--",
                "组托状态": pallet.status === "STACKED" ? "组托完成" : "组托中",
                "抽检状态": this.getInspectionStatusText(barcode.inspectionStatus),
                "抽检结果": this.getInspectionResultText(barcode.inspectionResult) || "--",
                "抽检时间": barcode.inspectionTime ? this.formatDate(barcode.inspectionTime) : "--",
                "抽检备注": barcode.inspectionRemarks || "--",
                "扫描时间": this.formatDate(barcode.scanTime),
                "创建时间": this.formatDate(pallet.createAt)
              });
            });
          }
          
          // 更新进度
          this.exportProgress = Math.round(((i + 1) / totalItems) * 100);
          
          // 给UI更新的机会
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        // 创建工作簿
        const wb = XLSX.utils.book_new();
        
        // 创建工作表
        const ws = XLSX.utils.json_to_sheet(allBarcodeData);
        
        // 将工作表添加到工作簿
        XLSX.utils.book_append_sheet(wb, ws, "所有条码数据");
        
        // 生成Excel文件
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        
        // 创建Blob对象
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        // 保存文件
        FileSaver.saveAs(blob, `所有托盘条码数据_${new Date().getTime()}.xlsx`);
        
        this.exportProgress = 100;
        this.$message.success("导出所有条码数据成功");
        
        setTimeout(() => {
          this.exportDialogVisible = false;
          this.exportProgress = 0;
        }, 1000);
      } catch (error) {
        console.error("导出所有条码数据失败:", error);
        this.$message.error(`导出失败: ${error.message}`);
        this.exportDialogVisible = false;
      } finally {
        this.exportAllBarcodesLoading = false;
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

    const roles = this.$store.getters.roles;
    if (!roles || !roles.buttonList) {
      return false;
    }
    if (roles.buttonList.includes("Initialize_tray_documents")) {
      this.hasInitializeTrayDocumentsPermission = true;
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

  .box-card {
    margin-bottom: 15px;
  }

  .el-descriptions {
    margin: 10px 0;
  }
}

.order-info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding: 10px;

  .info-item {
    .label {
      color: #606266;
      font-weight: 500;
      margin-right: 8px;
    }

    .value {
      color: #333;
    }
  }
}

@media screen and (max-width: 768px) {
  .order-info-grid {
    grid-template-columns: 1fr;
  }
}

.pallet-detail-dialog {
  .box-card {
    margin-bottom: 20px;
  }

  .empty-data {
    text-align: center;
    color: #909399;
  }
}

.pagination-container {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.inspection-time {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.inspection-remarks {
  font-size: 12px;
  color: #606266;
  margin-top: 3px;
  word-break: break-all;
}
</style>