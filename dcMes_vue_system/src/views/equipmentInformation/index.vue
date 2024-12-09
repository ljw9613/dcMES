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
                        <el-form-item label="设备名称">
                            <el-input v-model="searchForm.equipmentName" placeholder="请输入设备名称" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="设备编码">
                            <el-input v-model="searchForm.equipmentCode" placeholder="请输入设备编码" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="设备状态">
                            <el-select v-model="searchForm.status" placeholder="请选择设备状态" clearable style="width: 100%">
                                <el-option label="运行中" value="运行中" />
                                <el-option label="停机" value="停机" />
                                <el-option label="故障" value="故障" />
                                <el-option label="离线" value="离线" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="厂区名称">
                            <el-input v-model="searchForm.factoryName" placeholder="请输入厂区名称" clearable></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="20" v-show="showAdvanced">
                    <el-col :span="6">
                        <el-form-item label="设备IP">
                            <el-input v-model="searchForm.equipmentIp" placeholder="请输入设备IP" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        {{ "就爱上了的距离喀什家里的事" }}
                        <el-form-item label="设备类型">
                            <el-select v-model="searchForm.equipmentType" placeholder="请选择设备类型" clearable
                                style="width: 100%" :popper-append-to-body="true">
                                <el-option label="检测设备" value="检测设备" />
                                <el-option label="打印设备" value="打印设备" />
                                <el-option label="一体机" value="一体机" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="采集方式">
                            <el-select v-model="searchForm.collectionMethod" placeholder="请选择采集方式" clearable
                                style="width: 100%">
                                <el-option label="OPC" value="OPC" />
                                <el-option label="ModbusTCP" value="ModbusTCP" />
                                <el-option label="TCP/IP" value="TCP/IP" />
                                <el-option label="其他" value="其他" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="产线名称">
                            <el-input v-model="searchForm.productionLineName" placeholder="请输入产线名称"
                                clearable></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item>
                    <el-button type="primary" @click="search">查询搜索</el-button>
                    <el-button @click="resetForm">重置</el-button>
                    <el-button type="success" @click="exportData">导出数据</el-button>
                    <el-button type="primary" icon="el-icon-plus" @click="handleAdd">新增设备</el-button>
                    <el-button type="danger" icon="el-icon-delete" :disabled="!selection.length"
                        @click="handleBatchDelete">
                        批量删除
                    </el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <div class="screen1">
            <div class="screen_content">
                <div class="screen_content_first">
                    <i class="el-icon-tickets">设备信息列表</i>
                </div>
            </div>
        </div>

        <base-table ref="baseTable" :currentPage="currentPage" :highlight-current-row="true" :pageSize="pageSize"
            :tableData="tableList" :tableDataloading="listLoading" :total="total"
            @selection-change="handleSelectionChange" @handleCurrentChange="baseTableHandleCurrentChange"
            @handleSizeChange="baseTableHandleSizeChange">
            <template slot="law">
                <el-table-column type="selection" width="55" />

                <el-table-column label="设备名称" prop="equipmentName" width="150" />

                <el-table-column label="设备状态" width="100">
                    <template slot-scope="scope">
                        <el-tag :type="getStatusType(scope.row.status)">
                            {{ scope.row.status }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="设备编码" prop="equipmentCode" width="150" />

                <el-table-column label="设备IP" prop="equipmentIp" width="150" />

                <el-table-column label="设备类型" width="120">
                    <template slot-scope="scope">
                        <el-tag>{{ scope.row.equipmentType }}</el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="采集方式" prop="collectionMethod" width="120" />

                <el-table-column label="厂区名称" prop="factoryName" width="150" />

                <el-table-column label="产线名称" prop="productionLineName" width="150" />

                <el-table-column label="创建时间" width="180">
                    <template slot-scope="scope">
                        {{ formatDate(scope.row.createTime) }}
                    </template>
                </el-table-column>

                <el-table-column label="操作" width="180" fixed="right">
                    <template slot-scope="scope">
                        <el-button type="text" size="small" @click="handleEdit(scope.row)">
                            <i class="el-icon-edit"></i> 编辑
                        </el-button>
                        <el-button type="text" size="small" class="delete-btn" @click="handleDelete(scope.row)">
                            <i class="el-icon-delete"></i> 删除
                        </el-button>
                    </template>
                </el-table-column>
            </template>
        </base-table>

        <edit-dialog :visible.sync="dialogFormVisible" :dialog-status="dialogStatus" :row-data="dataForm"
            @submit="handleSubmit" />

    </div>
</template>

<script>
import { getData, addData, updateData, removeData } from "@/api/data";
import EditDialog from './components/EditDialog'

export default {
    name: 'EquipmentInformation',
    components: {
        EditDialog
    },
    data() {
        return {
            searchForm: {
                equipmentName: '',
                equipmentCode: '',
                equipmentIp: '',
                equipmentType: '',
                collectionMethod: '',
                factoryName: '',
                productionLineName: '',
                status: ''
            },
            tableList: [],
            total: 0,
            currentPage: 1,
            pageSize: 10,
            listLoading: true,
            showAdvanced: false,
            dialogFormVisible: false,
            dialogStatus: '',
            selection: [],
            dataForm: {}
        }
    },
    methods: {
        getStatusType(status) {
            const statusMap = {
                '运行中': 'success',
                '停机': 'warning',
                '故障': 'danger',
                '离线': 'info'
            }
            return statusMap[status] || 'info'
        },

        searchData() {
            let req = {
                query: {
                    $and: []
                }
            };

            Object.keys(this.searchForm).forEach(key => {
                if (this.searchForm[key]) {
                    req.query.$and.push({
                        [key]: { $regex: this.searchForm[key], $options: 'i' }
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
                req.page = this.currentPage;
                req.skip = (this.currentPage - 1) * this.pageSize;
                req.limit = this.pageSize;
                req.count = true;
                const result = await getData("equipmentInformation", req);
                this.tableList = result.data;
                this.total = result.countnum;
            } catch (error) {
                console.error('获取数据失败:', error);
                this.$message.error('获取数据失败');
            } finally {
                this.listLoading = false;
            }
        },

        formatDate(date) {
            if (!date) return '暂无数据';
            return new Date(date).toLocaleString();
        },

        resetForm() {
            this.searchForm = {
                equipmentName: '',
                equipmentCode: '',
                equipmentIp: '',
                equipmentType: '',
                collectionMethod: '',
                factoryName: '',
                productionLineName: '',
                status: ''
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
            this.dialogStatus = 'create'
            this.dataForm = {}  // 清空表单数据
            this.dialogFormVisible = true  // 显示对话框
        },

        handleEdit(row) {
            this.dialogStatus = 'edit'
            this.dataForm = JSON.parse(JSON.stringify(row))  // 深拷贝避免直接修改数据
            this.dialogFormVisible = true
        },

        handleDelete(row) {
            this.$confirm('确认删除该设备信息吗?', '提示', {
                type: 'warning'
            }).then(async () => {
                try {
                    await removeData('equipmentInformation', { query: { _id: row._id } });
                    this.$message.success('删除成功');
                    this.fetchData();
                } catch (error) {
                    console.error('删除失败:', error);
                    this.$message.error('删除失败');
                }
            }).catch(() => { });
        },

        handleBatchDelete() {
            if (!this.selection.length) {
                this.$message.warning('请选择要删除的记录');
                return;
            }

            this.$confirm(`确认删除选中的 ${this.selection.length} 条记录吗？`, '提示', {
                type: 'warning'
            }).then(async () => {
                try {
                    const ids = this.selection.map(item => item._id);
                    await removeData('equipmentInformation', ids);
                    this.$message.success('批量删除成功');
                    this.fetchData();
                } catch (error) {
                    console.error('批量删除失败:', error);
                    this.$message.error('批量删除失败');
                }
            }).catch(() => { });
        },

        async handleSubmit(formData) {
            try {
                if (this.dialogStatus === 'create') {
                    await addData('equipmentInformation', formData);
                    this.$message.success('添加成功');
                } else {
                    await updateData('equipmentInformation', {
                        query: { _id: formData._id },
                        update: formData
                    });
                    this.$message.success('更新成功');
                }
                this.fetchData();
            } catch (error) {
                console.error('操作失败:', error);
                this.$message.error('操作失败');
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
                equipmentName: '设备名称',
                status: '设备状态',
                equipmentCode: '设备编码',
                equipmentIp: '设备IP',
                equipmentType: '设备类型',
                collectionMethod: '采集方式',
                factoryName: '厂区名称',
                productionLineName: '产线名称',
                createTime: '创建时间'
            };

            // 处理导出数据
            const exportData = data.map(item => {
                const row = {};
                for (const key in headers) {
                    if (key === 'createTime') {
                        row[headers[key]] = this.formatDate(item[key]);
                    } else {
                        row[headers[key]] = item[key];
                    }
                }
                return row;
            });

            // 导出Excel
            import('@/vendor/Export2Excel').then(excel => {
                excel.export_json_to_excel({
                    header: Object.values(headers),
                    data: exportData.map(item => Object.values(item)),
                    filename: '设备信息列表',
                    autoWidth: true,
                    bookType: 'xlsx'
                });
            });
        }
    },
    created() {
        this.fetchData();
    }
}
</script>
