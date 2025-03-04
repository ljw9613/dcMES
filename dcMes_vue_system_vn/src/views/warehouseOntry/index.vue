<template>
    <div class="app-container">
        <el-card class="filter-container">
            <div slot="header" class="clearfix">
                <span>筛选搜索</span>
            </div>

            <el-form :model="searchForm" ref="searchForm" class="demo-form-inline">
                <el-row :gutter="20">
                    <el-col :span="6">
                        <el-form-item label="出库单号">
                            <!-- <el-input v-model="searchForm.entryNo" placeholder="请输入出库单号" clearable></el-input> -->
                            <zr-select v-model="searchForm.entryNo" collection="warehouse_ontry"
                                :search-fields="['entryNo']" label-key="entryNo" value-key="entryNo"
                                 :multiple="false" placeholder="请输入出库单号" clearable
                                style="width: 100%">
                                <template #option="{ item }">
                                    <div class="select-option">
                                        <div class="option-main">
                                            <span class="option-label">{{ item.entryNo }}</span>
                                            <!-- <el-tag size="mini" type="info" class="option-tag">
                                                {{ item.entryNo }}
                                            </el-tag> -->
                                        </div>
                                    </div>
                                </template>
                            </zr-select>
                        </el-form-item>
                    
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="生产订单号">
                            <!-- <el-input v-model="searchForm.productionOrderNo" placeholder="请输入生产订单号"
                                clearable></el-input> -->
                                <zr-select v-model="searchForm.productionOrderNo" collection="warehouse_ontry"
                                :search-fields="['productionOrderNo']" label-key="productionOrderNo" value-key="productionOrderNo"
                                 :multiple="false" placeholder="请输入生产订单号" clearable
                                style="width: 100%">
                                <template #option="{ item }">
                                    <div class="select-option">
                                        <div class="option-main">
                                            <span class="option-label">{{ item.productionOrderNo }}</span>
                                            <!-- <el-tag size="mini" type="info" class="option-tag">
                                                {{ item.entryNo }}
                                            </el-tag> -->
                                        </div>
                                    </div>
                                </template>
                            </zr-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="销售订单号">
                            <!-- <el-input v-model="searchForm.saleOrderNo" placeholder="请输入销售订单号" clearable></el-input> -->
                            <zr-select v-model="searchForm.saleOrderNo" collection="warehouse_ontry"
                                :search-fields="['saleOrderNo']" label-key="saleOrderNo" value-key="saleOrderNo"
                                 :multiple="false" placeholder="请输入销售订单号" clearable
                                style="width: 100%">
                                <template #option="{ item }">
                                    <div class="select-option">
                                        <div class="option-main">
                                            <span class="option-label">{{ item.saleOrderNo }}</span>
                                            <!-- <el-tag size="mini" type="info" class="option-tag">
                                                {{ item.entryNo }}
                                            </el-tag> -->
                                        </div>
                                    </div>
                                </template>
                            </zr-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="托盘编号">
                            <!-- <el-input v-model="searchForm.palletCode" placeholder="请输入托盘编号" clearable></el-input> -->
                            <zr-select v-model="searchForm.palletCode" collection="material_palletizing"
                                :search-fields="['palletCode']" 
                                label-key="palletCode" 
                                value-key="palletCode"
                                :multiple="false" 
                                placeholder="请输入托盘编号" 
                                clearable
                                style="width: 100%">
                                <template #option="{ item }">
                                    <div class="select-option">
                                        <div class="option-main">
                                            <span class="option-label">{{ item.palletCode }}</span>
                                        </div>
                                    </div>
                                </template>
                            </zr-select>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="6">
                        <el-form-item label="出库状态">
                            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 100%">
                                <el-option label="待出库" value="PENDING"></el-option>
                                <el-option label="出库中" value="IN_PROGRESS"></el-option>
                                <el-option label="已完成" value="COMPLETED"></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="创建时间">
                            <el-date-picker v-model="searchForm.dateRange" type="daterange" range-separator="至"
                                start-placeholder="开始日期" end-placeholder="结束日期" value-format="yyyy-MM-dd"
                                style="width: 100%">
                            </el-date-picker>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item>
                    <el-button type="primary" @click="search">查询搜索</el-button>
                    <el-button @click="resetForm">重置</el-button>
                    <!-- 扫码出库 -->
                    <el-button type="primary" @click="handlePalletBarcodeOpen">新增</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <base-table ref="baseTable" :currentPage="currentPage" :highlight-current-row="true" :pageSize="pageSize"
            :tableData="tableList" :tableDataloading="listLoading" :total="total"
            @handleCurrentChange="baseTableHandleCurrentChange" @handleSizeChange="baseTableHandleSizeChange">
            <template slot="law">
                <el-table-column type="expand">
                    <template slot-scope="scope">
                        <el-form label-position="left" inline class="table-expand">
                            <!-- 托盘明细 -->
                            <el-card class="box-card" style="width: 100%">
                                <div slot="header" class="clearfix">
                                    <span>托盘出库明细</span>
                                </div>
                                <el-table :data="scope.row.entryItems" border style="width: 100%">
                                    <el-table-column label="托盘编号" prop="palletCode" align="center"></el-table-column>
                                    <el-table-column label="出库数量" prop="quantity" align="center"></el-table-column>
                                    <el-table-column label="扫描时间" align="center">
                                        <template slot-scope="itemScope">
                                            {{ formatDate(itemScope.row.scanTime) }}
                                        </template>
                                    </el-table-column>
                                </el-table>
                            </el-card>
                        </el-form>
                    </template>
                </el-table-column>

                <el-table-column label="出库单号" prop="entryNo" align="center">
                    <template slot-scope="scope">
                        <el-link type="primary" @click="handleView(scope.row)">{{ scope.row.entryNo }}</el-link>
                    </template>
                </el-table-column>

                <el-table-column label="订单信息" align="center">
                    <template slot-scope="scope">
                        <div>生产单号: {{ scope.row.productionOrderNo }}</div>
                        <div>销售单号: {{ scope.row.saleOrderNo }}</div>
                    </template>
                </el-table-column>

                <el-table-column label="物料信息" align="center">
                    <template slot-scope="scope">
                        {{ scope.row.materialName }}
                        <el-tag size="mini" v-if="scope.row.materialSpec">{{ scope.row.materialSpec }}</el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="数量信息" align="center">
                    <template slot-scope="scope">
                        <div>应出: {{ scope.row.outboundQuantity }}</div>
                        <div>已出: {{ scope.row.outNumber }}</div>
                        <div>托盘数: {{ scope.row.palletCount }}</div>
                    </template>
                </el-table-column>

                <el-table-column label="出库状态" align="center">
                    <template slot-scope="scope">
                        <el-tag :type="getStatusType(scope.row.status)">
                            {{ getStatusText(scope.row.status) }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="时间信息" align="center">
                    <template slot-scope="scope">
                        <div>创建: {{ formatDate(scope.row.createAt) }}</div>
                        <div v-if="scope.row.startTime">开始: {{ formatDate(scope.row.startTime) }}</div>
                        <div v-if="scope.row.endTime">完成: {{ formatDate(scope.row.endTime) }}</div>
                    </template>
                </el-table-column>

                <el-table-column label="操作" align="center" width="200">
                    <template slot-scope="scope">
                     
                        <el-button type="text" style="color: orange" @click="handleUpdateNumber(scope.row)">修改应出库数量</el-button>
                        <el-button type="text" style="color: green" @click="handleChuKu(scope.row)" v-if="scope.row.outboundQuantity>scope.row.outNumber&&scope.row.status=='IN_PROGRESS'">继续出库</el-button>
                        <el-button type="text" style="color: red" v-if="hasDeletePermission" @click="handleDelete(scope.row)">删除</el-button>
                        <!-- <el-button type="text" @click="handleSync(scope.row)">同步金蝶云</el-button> -->
                    </template>
                </el-table-column>
            </template>
        </base-table>

        <!-- 新增/编辑对话框 -->
        <el-dialog :title="dialogStatus === 'create' ? '新增出库单' : '查看出库单'" :visible.sync="dialogFormVisible">
            <el-form ref="dataForm" :model="dataForm" :rules="rules" label-width="120px">
                <el-form-item label="生产订单号" prop="productionOrderNo">
                    <el-input v-model="dataForm.productionOrderNo" placeholder="请输入生产订单号"
                        :disabled="dialogStatus === 'view'" @blur="handleOrderNoBlur"></el-input>
                </el-form-item>
                <el-form-item label="销售订单号">
                    <el-input v-model="dataForm.saleOrderNo" disabled></el-input>
                </el-form-item>
                <el-form-item label="物料信息">
                    <el-input v-model="dataForm.materialName" disabled>
                        <template slot="append">{{ dataForm.materialSpec }}</template>
                    </el-input>
                </el-form-item>
                <el-form-item label="计划出库数量">
                    <el-input v-model="dataForm.plannedQuantity" disabled></el-input>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="dialogFormVisible = false">取 消</el-button>
                <el-button type="primary" @click="handleSubmit" v-if="dialogStatus === 'create'">确 定</el-button>
            </div>
        </el-dialog>


        <!-- 应出库数量输入对话框 -->
        <el-dialog
            title="基础信息"
            :visible.sync="outboundQuantityDialog"
            width="30%"
            :close-on-click-modal="false"
        >
            <el-form>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="货柜号">
                            <el-input v-model="scanData.HuoGuiCode"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="发票号">
                            <el-input v-model="scanData.FaQIaoNo"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item label="应出库数量">
                    <el-input v-model="scanData.outboundQuantity" type="number"></el-input>
                </el-form-item>
            </el-form>
            <span slot="footer">
                <el-button @click="outboundQuantityDialog = false">取消</el-button>
                <el-button type="primary" @click="confirmOutboundQuantity">确定</el-button>
            </span>
        </el-dialog>

        <!-- 托盘扫描对话框 -->
        <el-dialog
            title="扫描托盘"
            :visible.sync="scanPalletDialog"
            width="80%"
            :close-on-click-modal="false"
        >
            <el-form>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="销售单号">
                            <el-input v-model="scanData.FBillNo" readonly></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="销售数量">
                            <el-input v-model="scanData.FQty" type="number" readonly></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="货柜号">
                            <el-input v-model="scanData.HuoGuiCode" readonly></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="发票号">
                            <el-input v-model="scanData.FaQIaoNo" readonly></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="产品名称">
                            <el-input v-model="scanData.materialName" readonly></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="产品型号">
                            <el-input v-model="scanData.materialSpec" readonly></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>


                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="应出库数量">
                            <el-input v-model="scanData.outboundQuantity" type="number"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24">
                        <el-form-item label="请扫描托盘条码">
                            <el-input v-model="palletBarcode" @keyup.enter.native="handlePalletScan">
                                <el-button slot="append" @click="handlePalletScan">确认</el-button>
                            </el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
            <!-- 托盘信息表格 -->
            <el-table :data="palletList">
                <el-table-column prop="palletCode" label="托盘编号" />
                <el-table-column prop="saleOrderId.FBillNo" label="销售订单" />
                <el-table-column prop="materialCode" label="物料编码" />
                <el-table-column prop="totalQuantity" label="数量" />
                <el-table-column prop="productLineName" label="产线" />
                <el-table-column prop="scanTime" label="扫描时间">
                    <template slot-scope="scope">
                        <div>{{ formatDate(scope.row.scanTime) }}</div>
                    </template>
                </el-table-column>
            </el-table>
        </el-dialog>


        <!-- 使用通用扫描弹窗 -->
        <scan-dialog :visible.sync="scanDialogVisible" title="托盘扫码出库" placeholder="请扫描托盘条码" @scan="handleScan" :scanData="scanData"
            @complete="handleScanComplete" @delete="handleScanDelete" />
    </div>
</template>

<script>
import { getData, addData, updateData, removeData } from "@/api/data";
import {  syncWarehouseOn } from "@/api/warehouse/entry";
import ScanDialog from './components/ScanDialog.vue';
import { query } from "quill";

export default {
    name: 'WarehouseEntry',
    components: {
        ScanDialog
    },
    data() {
        return {
            scanData:{
                FBillNo:null,
                FaQIaoNo:null,
                HuoGuiCode:null,
                materialSpec:null,
                materialName:null,
                outboundQuantity:0,
                FQty:0,
            },
            palletList:[],
            searchForm: {
                entryNo: '',
                productionOrderNo: '',
                saleOrderNo: '',
                palletCode: '',
                status: '',
                dateRange: []
            },
            tableList: [],
            total: 0,
            currentPage: 1,
            pageSize: 10,
            listLoading: false,
            dialogFormVisible: false,
            dialogStatus: '',
            dataForm: {},
            rules: {
                productionOrderNo: [
                    { required: true, message: '请输入生产订单号', trigger: 'blur' }
                ]
            },
            scanDialogVisible: false,
            scanForm: {
                palletCode: ''
            },
            scanRules: {
                palletCode: [
                    { required: true, message: '请扫描托盘编号', trigger: 'blur' }
                ]
            },
            exportLoading: false,
            exportProgress: 0,
            outboundQuantityDialog: false,
            outboundQuantity: '',
            scanPalletDialog: false,
            palletBarcode: '',
            hasDeletePermission: false,
        }
    },
    methods: {
        handleUpdateNumber(row) {
            this.$prompt('请修改应出库数量', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                inputValue: row.outboundQuantity
            }).then(({ value }) => {
                if (value >= row.outNumber) {  // 检查是否大于等于已出库数量
                    updateData('warehouse_ontry', {
                        query: { _id: row._id },
                        update: {
                            outboundQuantity: value
                        }
                    }).then(() => {
                        this.$message({
                            type: 'success',
                            message: '修改成功: ' + value
                        });
                        this.fetchData(); // 刷新数据
                    });
                } else {
                    this.$message({
                        type: 'error',
                        message: '应出库数量不能小于已出库数量：' + row.outNumber
                    });
                }
            }).catch(() => {
                this.$message({
                    type: 'info',
                    message: '取消输入'
                });       
            });
        },
        handleChuKu(row){
            this.scanData = row;
            this.scanDialogVisible = true;

        },
        handlePalletBarcodeOpen() {
            this.scanData ={
          FBillNo: null,
          HuoGuiCode: null,
          FaQIaoNo: null,
          materialName: null,
          materialSpec: null,
          plannedQuantity: null,
          outboundQuantity: null,
          outNumber: null,
          saleNumber: null,
          actualQuantity: 0,
          palletCount: 0,
          progress: 0,
          status:null,
          entryItems:[]
        }
            // this.outboundQuantityDialog = true;
            this.scanDialogVisible = true;
        },

        
        confirmOutboundQuantity() {
            if (!this.scanData.outboundQuantity) {
                this.$message.warning('请输入应出库数量')
                return
            }
            this.outboundQuantityDialog = false
            this.scanDialogVisible = true;
            // this.scanPalletDialog = true
        },
       async handlePalletScan() {
            console.log('palletBarcode',this.palletBarcode)
                const result = await getData("material_palletizing", {
                    query:{
                        palletCode:this.palletBarcode
                    },
                    populate: JSON.stringify([{ path: 'saleOrderId' }])
                });
                console.log('result',result)
                if(result.data.length>0){
                    this.scanData['FBillNo']=result.data[0].saleOrderId.FBillNo;
                    this.scanData['FQty']=result.data[0].saleOrderId.FQty;
                    this.scanData['palletCode']=result.data[0].palletCode;
                    this.scanData['materialName']=result.data[0].materialName;
                    this.scanData['materialSpec']=result.data[0].materialSpec;
                    this.palletList.push({...result.data[0],scanTime:new Date()})
                
                }
        },
        // 构建查询条件
        searchData() {
            let req = {
                query: {
                    $and: []
                }
            };
            const escapeRegex = (string) => {
                return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            };
            if (this.searchForm.entryNo) {
                req.query.$and.push({
                    entryNo: {
                        $regex: escapeRegex(this.searchForm.entryNo),
                        $options: 'i'
                    }
                });
            }

            if (this.searchForm.productionOrderNo) {
                req.query.$and.push({
                    productionOrderNo: {
                        $regex: escapeRegex(this.searchForm.productionOrderNo),
                        $options: 'i'
                    }
                });
            }

            if (this.searchForm.saleOrderNo) {
                req.query.$and.push({
                    saleOrderNo: {
                        $regex: escapeRegex(this.searchForm.saleOrderNo),
                        $options: 'i'
                    }
                });
            }

            if (this.searchForm.palletCode) {
                req.query.$and.push({
                    'entryItems.palletCode': {
                        $regex: escapeRegex(this.searchForm.palletCode),
                        $options: 'i'
                    }
                });
            }

            if (this.searchForm.status) {
                req.query.$and.push({
                    status: this.searchForm.status
                });
            }

            if (this.searchForm.dateRange && this.searchForm.dateRange.length === 2) {
                const [startDate, endDate] = this.searchForm.dateRange;
                req.query.$and.push({
                    createAt: {
                        $gte: new Date(startDate).toISOString(),
                        $lte: new Date(endDate + ' 23:59:59.999').toISOString()
                    }
                });
            }

            if (!req.query.$and.length) {
                delete req.query.$and;
            }

            return req;
        },

        // 获取数据
        async fetchData() {
            this.listLoading = true;
            try {
                let req = this.searchData();
                req.page = this.currentPage;
                req.skip = (this.currentPage - 1) * this.pageSize;
                req.limit = this.pageSize;
                req.sort = { createAt: -1 };
                req.count = true;
                const result = await getData("warehouse_ontry", req);
                this.tableList = result.data;
                this.total = result.countnum;
            } catch (error) {
                console.error('获取数据失败:', error);
                this.$message.error('获取数据失败');
            } finally {
                this.listLoading = false;
            }
        },

        // 获取生产订单信息
        async handleOrderNoBlur() {
            if (this.dataForm.productionOrderNo) {
                try {
                    const result = await getData("k3_PRD_MO", {
                        query: { FBillNo: this.dataForm.productionOrderNo }
                    });
                    if (result.data && result.data.length > 0) {
                        const orderData = result.data[0];
                        this.dataForm = {
                            ...this.dataForm,
                            saleOrderNo: orderData.FSaleOrderNo,
                            materialName: orderData.FMaterialName,
                            materialSpec: orderData.FSpecification,
                            plannedQuantity: orderData.FQty
                        };
                    } else {
                        this.$message.warning('未找到生产订单信息');
                    }
                } catch (error) {
                    this.$message.error('获取订单信息失败');
                }
            }
        },

        // 处理单个托盘扫描
        async handleScan() {
            try {
                this.fetchData();
            } catch (error) {
                this.$message.error(error.message || '扫描失败');
                throw error;
            }
        },

        // 处理扫描完成
        async handleScanComplete(palletCodes) {
            try {
                await this.fetchData(); // 刷新列表
                this.$message.success(`成功出库 ${palletCodes.length} 个托盘`);
            } catch (error) {
                this.$message.error('完成出库失败');
            }
        },

        // 处理扫描记录删除
        async handleScanDelete(palletCode) {
            try {
                await deletePallet(palletCode);
                this.$message.success('删除成功');
            } catch (error) {
                this.$message.error('删除失败');
            }
        },

        // 完成出库
        async handleComplete(row) {
            this.$confirm('确认完成出库？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(async () => {
                try {
                    await updateData("warehouse_ontry", {
                        query: { entryNo: row.entryNo },
                        update: { status: 'COMPLETED', endTime: new Date() }
                    });
                    this.$message.success('出库完成');
                    this.fetchData();
                } catch (error) {
                    this.$message.error('操作失败');
                }
            });
        },

        handleSync(row) {
            let req = {
                entryId: row._id
            }
            syncWarehouseOn(req).then(res => {
                if(res.code==200){
                    this.$message.success('同步成功');
                }else{
                    this.$message.error(res.message);
                }
            }).catch(error => {
                this.$message.error('同步失败');
            });
        },

        // 删除出库单
        async handleDelete(row) {
            this.$confirm('确认删除该出库单？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(async () => {
                try {
                    await removeData("warehouse_ontry", {
                        query: { _id: row._id }
                    });
                    this.$message.success('删除成功');
                    this.fetchData();
                } catch (error) {
                    this.$message.error('删除失败');
                }
            });
        },

        // 删除托盘
        async handleDeletePallet(entryNo, palletCode) {
            this.$confirm('确认删除该托盘记录？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(async () => {
                try {
                    await removeData("warehouse_ontry/pallet", {
                        query: {
                            entryNo: entryNo,
                            palletCode: palletCode
                        }
                    });
                    this.$message.success('删除成功');
                    this.fetchData();
                } catch (error) {
                    this.$message.error('删除失败');
                }
            });
        },

        // 其他通用方法保持不变
        getStatusType(status) {
            const types = {
                'PENDING': 'info',
                'IN_PROGRESS': 'warning',
                'COMPLETED': 'success'
            }
            return types[status] || 'info'
        },
        getStatusText(status) {
            const texts = {
                'PENDING': '待出库',
                'IN_PROGRESS': '出库中',
                'COMPLETED': '已完成'
            }
            return texts[status] || status
        },
        formatDate(date) {
            if (!date) return '暂无数据'
            return new Date(date).toLocaleString()
        },
        search() {
            this.currentPage = 1
            this.fetchData()
        },
        resetForm() {
            this.$refs.searchForm.resetFields()
            this.searchForm ={
                entryNo: '',
                productionOrderNo: '',
                saleOrderNo: '',
                palletCode: '',
                status: '',
                dateRange: []
            },
            this.search()
        },
        handleAdd() {
            this.dialogStatus = 'create'
            this.dataForm = {}
            this.dialogFormVisible = true
        },
        baseTableHandleCurrentChange(currentPage) {
            this.currentPage = currentPage;
            this.fetchData();
        },
        baseTableHandleSizeChange(pageSize) {
            this.pageSize = pageSize;
            this.fetchData();
        }
    },
    created() {
        this.fetchData()
        const roles = this.$store.getters.roles;
        if (!roles || !roles.buttonList) {
            return false;
        }
        if (roles.buttonList.includes("Delete_inbound_and_outbound_documents")) {
            this.hasDeletePermission = true;
        }
    }
}
</script>

<style lang="scss" scoped>
.app-container {
    padding: 20px;

    .filter-container {
        margin-bottom: 20px;
    }

    .table-expand {
        padding: 20px;

        .box-card {
            margin-bottom: 15px;
        }
    }
}
</style>