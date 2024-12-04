<template>
    <div class="scan-container">
        <div class="left-form">
            <el-form :model="formData">
                <h3>工序初始化设置</h3>

                <el-form-item label="产品型号">
                    <el-select v-model="formData.productModel" placeholder="请选择产品型号" @change="handleProductChange"
                        filterable remote :remote-method="getMaterialList" :loading="materialLoading">
                        <el-option v-for="item in productOptions" :key="item._id"
                            :label="`${item.FNumber} - ${item.FName}`" :value="item._id">
                            <span>{{ item.FNumber }} - {{ item.FName }}</span>
                            <span style="float: right; color: #8492a6; font-size: 13px">
                                {{ item.FSpecification || '无规格' }}
                            </span>
                        </el-option>
                    </el-select>
                </el-form-item>

                <!-- 暂时注释产线编码
        <el-form-item label="产线编码">
          <el-select v-model="formData.productLine" placeholder="请选择产线编码">
            <el-option />
          </el-select>
        </el-form-item>
        -->

                <el-form-item label="产品工序">
                    <el-select v-model="formData.processStep" placeholder="请选择产品工序" @change="handleProcessChange">
                        <el-option v-for="item in processStepOptions" :key="item._id" :label="item.processName"
                            :value="item._id" />
                    </el-select>
                </el-form-item>

                <!-- 暂时注释组件名称
        <el-form-item label="组件名称">
          <el-select v-model="formData.componentName" placeholder="请选择组件名称">
            <el-option />
          </el-select>
        </el-form-item>
        -->

                <el-form-item>
                    <el-button type="primary" @click="handleSave">保存</el-button>
                </el-form-item>
            </el-form>
        </div>
        <div class="right-content">
            <template v-if="mainMaterialId && processStepId">
                <el-form :model="scanForm" ref="scanForm" label-width="280px">
                    <h3>条码扫描</h3>

                    <!-- 主物料条码输入 -->
                    <el-form-item :label="mainMaterialName">
                        <el-input v-model="scanForm.mainBarcode" placeholder="请扫描主物料条码"
                            @input="validateInput('mainBarcode')">
                        </el-input>
                        <i :class="getValidateIcon('mainBarcode')" :style="getValidateStyle('mainBarcode')">
                        </i>
                    </el-form-item>

                    <!-- 其他物料条码输入 -->
                    <el-form-item v-for="material in processMaterials" :key="material._id"
                        :label="material.materialName">
                        <el-input v-model="scanForm.barcodes[material._id]" :placeholder="`请扫描子物料条码`"
                            @input="validateInput(material._id)">
                        </el-input>
                        <i :class="getValidateIcon(material._id)" :style="getValidateStyle(material._id)">
                        </i>
                    </el-form-item>

                    <!-- 按钮组 -->
                    <el-form-item>
                        <el-button @click="resetScanForm">重置</el-button>
                        <el-button type="primary" @click="handleConfirm">确认</el-button>
                    </el-form-item>
                </el-form>
            </template>
            <template v-else>
                <div class="init-tip">
                    <i class="el-icon-warning-outline"></i>
                    <p>请先初始化工序设置</p>
                </div>
            </template>
        </div>
    </div>
</template>

<script>
import { getData, addData, updateData, removeData } from "@/api/data";

export default {
    name: 'ScanBarCode',
    data() {
        return {
            formData: {
                productModel: '',
                productLine: '',
                processStep: '',
                componentName: ''
            },
            productOptions: [],
            processStepOptions: [],
            materialOptions: [],
            materialLoading: false,
            mainMaterialName: '',
            processMaterials: [],
            scanForm: {
                mainBarcode: '',
                barcodes: {}
            },
            validateStatus: {
                mainBarcode: false
            }
        }
    },
    computed: {
        mainMaterialId: {
            get() {
                return localStorage.getItem('mainMaterialId') || ''
            },
            set(value) {
                localStorage.setItem('mainMaterialId', value)
            }
        },
        processStepId: {
            get() {
                return localStorage.getItem('processStepId') || ''
            },
            set(value) {
                localStorage.setItem('processStepId', value)
            }
        },
        materialName: {
            get() {
                return localStorage.getItem('materialName') || ''
            },
            set(value) {
                localStorage.setItem('materialName', value)
            }
        },
        processName: {
            get() {
                return localStorage.getItem('processName') || ''
            },
            set(value) {
                localStorage.setItem('processName', value)
            }
        }
    },
    watch: {
        // 监听缓存ID变化，获取相关数据
        async mainMaterialId(newVal) {
            if (newVal) {
                await this.getMainMaterialInfo();
            } else {
                this.mainMaterialName = '';
            }
        },
        async processStepId(newVal) {
            if (newVal) {
                await this.getProcessMaterials();
            } else {
                this.processMaterials = [];
                this.scanForm.barcodes = {};
                this.validateStatus = { mainBarcode: false };
            }
        }
    },
    methods: {
        // API 调用方法
        async getMaterialById(id) {
            const response = await getData('k3_BD_MATERIAL', { query: { _id: id } });
            return response.data[0];
        },

        async getCraftByMaterialId(materialId) {
            const response = await getData('craft', { query: { materialId } });
            return response.data[0];
        },

        async getProcessStepById(id) {
            const response = await getData('processStep', { query: { _id: id } });
            return response.data[0];
        },

        async getProcessMaterialById(id) {
            const response = await getData('processMaterials', { query: { _id: id } });
            return response.data[0];
        },

        // 获取产品型号列表（使用远程搜索）
        async getMaterialList(query) {
            if (query !== '') {
                this.materialLoading = true;
                try {
                    const result = await getData('k3_BD_MATERIAL', {
                        query: {
                            $or: [
                                { FNumber: { $regex: query, $options: 'i' } },
                                { FName: { $regex: query, $options: 'i' } }
                            ]
                        },
                        page: 1,
                        limit: 20
                    });
                    this.productOptions = result.data;
                } catch (error) {
                    console.error('获取产品型号失败:', error);
                    this.$message.error('获取产品型号失败');
                } finally {
                    this.materialLoading = false;
                }
            } else {
                this.productOptions = [];
            }
        },

        // 递归获取所有相关工序
        async getAllProcessSteps(materialId, processSteps = new Set()) {
            try {
                // 获取工艺信息
                const craft = await this.getCraftByMaterialId(materialId);
                if (!craft || !craft.processSteps) return processSteps;

                // 处理工序信息
                for (const stepId of craft.processSteps) {
                    const step = await this.getProcessStepById(stepId);
                    if (step) {
                        processSteps.add(step);

                        // 获取工序关联的物料
                        const processMaterialsResponse = await getData('processMaterials', { query: { processStepId: stepId } });
                        if (processMaterialsResponse.data) {
                            for (const material of processMaterialsResponse.data) {
                                // 递归获取关联工序
                                await this.getAllProcessSteps(material.materialId, processSteps);
                            }
                        }
                    }
                }
                return processSteps;
            } catch (error) {
                console.error('获取工序失败:', error);
                return processSteps;
            }
        },

        // 产品型号变化处理
        async handleProductChange(materialId) {
            this.processStepOptions = [];
            this.formData.processStep = '';
            this.mainMaterialId = ''; // 清空缓存的主物料ID

            if (!materialId) return;

            try {
                const processSteps = await this.getAllProcessSteps(materialId);
                this.processStepOptions = Array.from(processSteps);
                this.mainMaterialId = materialId; // 缓存选中的产品型号ID
            } catch (error) {
                console.error('获取工序列表失败:', error);
                this.$message.error('获取工序列表失败');
            }
        },

        // 工序选择变化处理
        handleProcessChange(processId) {
            if (!processId) {
                this.processStepId = '';
                return;
            }
            this.processStepId = processId; // 缓存选中的工序ID
        },

        // 保存按钮处理
        async handleSave() {
            if (!this.formData.productModel || !this.formData.processStep) {
                this.$message.warning('请选择产品型号和工序');
                return;
            }

            try {
                // 先设置缓存ID
                this.mainMaterialId = this.formData.productModel;
                this.processStepId = this.formData.processStep;

                // 获取并保存物料名称
                const material = await this.getMaterialById(this.formData.productModel);
                if (material) {
                    this.materialName = `${material.FNumber} - ${material.FName}`;
                }

                // 获取并保存工序名称
                const processStep = await this.getProcessStepById(this.formData.processStep);
                if (processStep) {
                    this.processName = processStep.processName;
                }

                this.$message.success('保存成功');

                // 渲染右侧区域内容
                await this.getMainMaterialInfo();
                await this.getProcessMaterials();
            } catch (error) {
                console.error('保存失败:', error);
                this.$message.error('保存失败');
            }
        },

        // 获取主物料信息
        async getMainMaterialInfo() {
            try {
                const response = await getData('k3_BD_MATERIAL', {
                    query: { _id: this.mainMaterialId }
                });
                if (response.data && response.data[0]) {
                    this.mainMaterialName = response.data[0].FName;
                }
            } catch (error) {
                console.error('获取主物料信息失败:', error);
                this.$message.error('获取主物料信息失败');
            }
        },

        // 获取工序相关物料
        async getProcessMaterials() {
            try {
                // 获取工序信息
                const stepResponse = await getData('processStep', {
                    query: { _id: this.processStepId }
                });

                if (stepResponse.data && stepResponse.data[0] && stepResponse.data[0].materials) {
                    // 获取物料关系信息
                    const materialPromises = stepResponse.data[0].materials.map(materialId =>
                        getData('processMaterials', { query: { _id: materialId } })
                    );

                    const materialsResponses = await Promise.all(materialPromises);
                    this.processMaterials = materialsResponses
                        .map(response => response.data[0]) // 确保获取到的是数组中的第一个元素
                        .filter(material => material); // 过滤掉未定义的值

                    // 初始化验证状态
                    this.processMaterials.forEach(material => {
                        this.validateStatus[material._id] = false;
                        this.$set(this.scanForm.barcodes, material._id, '');
                    });
                }
            } catch (error) {
                console.error('获取工序物料失败:', error);
                this.$message.error('获取工序物料失败');
            }
        },

        // 验证输入
        validateInput(key) {
            const value = key === 'mainBarcode' ?
                this.scanForm.mainBarcode :
                this.scanForm.barcodes[key];
            this.validateStatus[key] = !!value;
        },

        // 获取验证图标
        getValidateIcon(key) {
            return this.validateStatus[key] ?
                'el-icon-check' :
                'el-icon-close';
        },

        // 获取验证样式
        getValidateStyle(key) {
            return {
                color: this.validateStatus[key] ? '#67C23A' : '#F56C6C',
                marginLeft: '10px',
                fontSize: '20px'
            }
        },

        // 重置扫描表单
        resetScanForm() {
            this.scanForm.mainBarcode = '';
            Object.keys(this.scanForm.barcodes).forEach(key => {
                this.scanForm.barcodes[key] = '';
            });
            Object.keys(this.validateStatus).forEach(key => {
                this.validateStatus[key] = false;
            });
        },

        // 确认按钮处理
        async handleConfirm() {
            try {
                // 1. 验证所有条码是否已扫描
                const allBarcodesFilled = Object.values(this.validateStatus).every(status => status === true);
                if (!allBarcodesFilled) {
                    this.$message.warning('请完成所有条码扫描');
                    return;
                }

                // 2. 获取工序信息
                const processStep = await this.getProcessStepById(this.processStepId);
                if (!processStep) {
                    this.$message.error('获取工序信息失败');
                    return;
                }

                // 3. 构建产品条码数组
                const productBarcodes = await Promise.all(
                    this.processMaterials.map(async (material) => {
                        const processMaterial = await this.getProcessMaterialById(material._id);
                        return {
                            barcode: this.scanForm.barcodes[material._id],
                            materialId: material._id,
                            materialCode: processMaterial.materialCode,
                            materialName: processMaterial.materialName,
                            quantity: processMaterial.quantity
                        };
                    })
                );

                // 4. 构建扫描记录数据
                const scanRecord = {
                    mainBarcode: this.scanForm.mainBarcode,
                    mainMaterialId: this.mainMaterialId,
                    craftId: processStep.craftId,
                    processStepId: this.processStepId,
                    processStepName: processStep.processName,
                    sort: processStep.sort || 0,
                    mainMaterialName: this.mainMaterialName,
                    productBarcodes: productBarcodes,
                    scanType: "IN",
                    createBy: this.$store.state.user.name,
                    updateBy: this.$store.state.user.name
                };

                // 5. 调用API创建扫描记录
                const response = await addData('scanRecord', scanRecord);

                if (response.code === 200) {
                    this.$message.success('扫描记录保存成功');
                    // 重置扫描表单
                    this.resetScanForm();
                } else {
                    this.$message.error(response.msg || '扫描记录保存失败');
                }

            } catch (error) {
                console.error('保存扫描记录失败:', error);
                this.$message.error('保存扫描记录失败');
            }
        },

        // 新增方法：根据ID获取产品型号和工序名称
        async fillFormData() {
            if (this.mainMaterialId && this.materialName) {
                this.formData.productModel = this.materialName;
            }

            if (this.processStepId && this.processName) {
                this.formData.processStep = this.processName;
            }
        }
    },
    async created() {
        // 检查缓存并获取数据
        if (this.mainMaterialId) {
            await this.getMainMaterialInfo();
        }
        if (this.processStepId) {
            await this.getProcessMaterials();
        }
        // 自动填充表单数据
        await this.fillFormData();
    }
}
</script>

<style scoped>
.scan-container {
    display: flex;
    padding: 20px;
}

.left-form {
    width: 400px;
    padding: 20px;
    border-right: 1px solid #dcdfe6;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.right-content {
    flex: 1;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.left-form .el-form,
.right-content .el-form {
    width: 90%;
    text-align: center;
}

.el-form-item {
    width: 100%;
    text-align: left;
    display: flex;
    justify-content: center;
}

.el-form-item {
    position: relative;
    display: flex;
    align-items: center;
}

>>>.el-form-item__content {
    margin-left: 0 !important;
}

.el-form-item .el-input {
    flex: 1;
}

.el-form-item i {
    position: absolute;
    right: -30px;
    top: 50%;
    transform: translateY(-50%);
}

/* 覆盖 Element UI 的默认边距 */
:deep(.el-form-item__content) {
    margin-left: 0 !important;
}

.init-tip {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #909399;
}

.init-tip i {
    font-size: 48px;
    margin-bottom: 20px;
}

.init-tip p {
    font-size: 16px;
}
</style>