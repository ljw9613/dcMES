<template>
    <div class="scan-container" v-loading="loading">
        <div class="left-form">
            <el-card class="init-card">
                <!-- 标题部分 -->
                <div class="card-header">
                    <i class="el-icon-setting"></i>
                    <span>工序初始化设置</span>
                </div>

                <el-form :model="formData" label-width="100px">
                    <!-- 产品型号 -->
                    <div class="form-section">
                        <div class="section-header">
                            <i class="el-icon-goods"></i>
                            <span>基础信息</span>
                        </div>

                        <el-form-item label="产品型号">
                            <el-select v-model="formData.productModel" placeholder="请选择产品型号"
                                @change="handleProductChange" filterable remote :remote-method="getMaterialList"
                                :loading="materialLoading" class="custom-select"
                                :disabled="!!mainMaterialId && !!processStepId">
                                <el-option v-for="item in productOptions" :key="item._id"
                                    :label="`${item.FNumber} - ${item.FName}`" :value="item._id">
                                    <div class="option-content">
                                        <span class="option-main">{{ item.FNumber }} - {{ item.FName }}</span>
                                        <span class="option-sub">{{ item.FSpecification || '无规格' }}</span>
                                    </div>
                                </el-option>
                            </el-select>
                        </el-form-item>

                        <el-form-item label="产线编码">
                            <el-select v-model="formData.productLine" placeholder="请选择产线编码" class="custom-select"
                                :disabled="!!mainMaterialId && !!processStepId">
                                <el-option v-for="item in productLineOptions" :key="item._id" :label="item.FName"
                                    :value="item._id">
                                    <div class="option-content">
                                        <span class="option-main">{{ item.FNumber }} - {{ item.FName }}</span>
                                    </div>
                                </el-option>
                            </el-select>
                        </el-form-item>

                        <el-form-item label="产品工序">
                            <el-select v-model="formData.processStep" placeholder="请选择产品工序"
                                @change="handleProcessChange" class="custom-select"
                                :disabled="!!mainMaterialId && !!processStepId">
                                <el-option v-for="item in processStepOptions" :key="item._id" :label="item.processName"
                                    :value="item._id">
                                    <div class="option-content">
                                        <span class="option-main">{{ `${item.sort}.${item.processName}` }}</span>
                                        <span class="option-sub">{{ item.processCode }}</span>
                                    </div>
                                </el-option>
                            </el-select>
                        </el-form-item>
                    </div>

                    <!-- 按钮部分 -->
                    <div class="button-group">
                        <el-button type="danger" @click="handleCancelSave" icon="el-icon-close"
                            v-if="mainMaterialId && processStepId">
                            取消设置
                        </el-button>
                        <el-button type="primary" v-else @click="handleSave" icon="el-icon-check">
                            保存设置
                        </el-button>
                    </div>
                </el-form>
            </el-card>
        </div>
        <div class="right-content">
            <template v-if="mainMaterialId && processStepId">
                <el-card class="scan-card">
                    <!-- 标题部分 -->
                    <div class="card-header">
                        <i class="el-icon-scan"></i>
                        <span>条码扫描</span>
                    </div>

                    <el-form :model="scanForm" ref="scanForm" label-width="100%">
                        <!-- 主物料部分 -->
                        <div class="section-header">
                            <i class="el-icon-goods"></i>
                            <span>主物料</span>
                        </div>
                        <div class="material-section">
                            <el-form-item :label="`编号：${mainMaterialCode}  名称：${mainMaterialName}`" label-width="100%"
                                class="vertical-form-item">
                                <div class="input-with-status">
                                    <el-input v-model="scanForm.mainBarcode" placeholder="请扫描主物料条码"
                                        @input="validateInput('mainBarcode')"
                                        :class="{ 'valid-input': validateStatus['mainBarcode'] }">
                                        <template slot="prefix">
                                            <i class="el-icon-barcode"></i>
                                        </template>
                                    </el-input>
                                    <div class="status-indicator" :class="{ 'valid': validateStatus['mainBarcode'] }">
                                        <i :class="getValidateIcon('mainBarcode')"></i>
                                    </div>
                                </div>
                            </el-form-item>
                        </div>

                        <!-- 子物料部分 -->
                        <div class="section-header">
                            <i class="el-icon-box"></i>
                            <span>子物料</span>
                        </div>
                        <div class="material-section">
                            <el-form-item v-for="material in processMaterials" :key="material._id"
                                :label="`编号：${material.materialCode}  名称：${material.materialName}`"
                                class="vertical-form-item">
                                <div class="input-with-status">
                                    <el-input v-model="scanForm.barcodes[material._id]" :placeholder="`请扫描子物料条码`"
                                        @input="validateInput(material._id)"
                                        :class="{ 'valid-input': validateStatus[material._id] }">
                                        <template slot="prefix">
                                            <i class="el-icon-barcode"></i>
                                        </template>
                                    </el-input>
                                    <div class="status-indicator" :class="{ 'valid': validateStatus[material._id] }">
                                        <i :class="getValidateIcon(material._id)"></i>
                                    </div>
                                </div>
                            </el-form-item>
                        </div>

                        <!-- 按钮组 -->
                        <div class="button-group">
                            <el-button plain @click="resetScanForm" icon="el-icon-refresh">重置</el-button>
                            <el-button type="primary" @click="handleConfirm" icon="el-icon-check">确认</el-button>
                        </div>
                    </el-form>
                </el-card>
            </template>
            <template v-else>
                <div class="init-tip">
                    <div class="overlay">
                        <i class="el-icon-warning-outline pulse"></i>
                        <p>请先初始化工序设置</p>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<script>
import { getData, addData, updateData, removeData } from "@/api/data";
import { createFlow } from "@/api/materialProcessFlowService";
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
            mainMaterialCode: '',
            processMaterials: [],
            scanForm: {
                mainBarcode: '',
                barcodes: {}
            },
            productLineOptions: [{
                _id: '1',
                FNumber: '1',
                FName: '产线1'
            }, {
                _id: '2',
                FNumber: '2',
                FName: '产线2'
            },
            ],
            validateStatus: {
                mainBarcode: false
            },
            loading: false, // 加载状态
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

            // 创建全屏加载
            const loading = this.$loading({
                lock: true,
                text: '保存中...',
                spinner: 'el-icon-loading',
                background: 'rgba(0, 0, 0, 0.7)'
            });

            try {
                // 重置之前的数据
                this.resetScanForm();

                // 设置缓存ID
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

                // 模拟延迟以显示加载图标
                setTimeout(() => {
                    // 关闭加载动画（虽然页面会刷新，但这是一个好习惯）
                    loading.close();
                    // 强制刷新页面
                    window.location.reload();
                }, 500);

            } catch (error) {
                console.error('保存失败:', error);
                this.$message.error('保存失败');
                loading.close(); // 确保在错误情况下关闭加载动画
            }
        },

        // 获取主物料信息
        async getMainMaterialInfo() {
            try {
                console.log('正在获取主物料信息，ID:', this.mainMaterialId); // 调试日志
                const response = await getData('k3_BD_MATERIAL', {
                    query: { _id: this.mainMaterialId },
                    page: 1,
                    limit: 1
                });

                if (response.data && response.data[0]) {
                    console.log('获取到的主物料信息:', response.data[0]); // 调试日志
                    this.mainMaterialName = response.data[0].FName;
                    this.mainMaterialCode = response.data[0].FNumber;
                } else {
                    console.log('未找到主物料信息'); // 调试日志
                    this.mainMaterialName = '';
                    this.mainMaterialCode = '';
                }
            } catch (error) {
                console.error('获取主物料信息失败:', error);
                this.$message.error('获取主物料信息失败');
                this.mainMaterialName = '';
                this.mainMaterialCode = '';
            }
        },

        // 获取工序相关物料
        async getProcessMaterials() {
            try {
                console.log('正在获取工序信息，ID:', this.processStepId); // 调试日志
                // 获取工序信息
                const stepResponse = await getData('processStep', {
                    query: { _id: this.processStepId },
                    page: 1,
                    limit: 1
                });

                console.log('获取到的工序信息:', stepResponse.data); // 调试日志

                if (stepResponse.data && stepResponse.data[0] && stepResponse.data[0].materials) {
                    // 重置物料数组
                    this.processMaterials = [];

                    // 获取物料关系信息
                    const materialPromises = stepResponse.data[0].materials.map(materialId =>
                        getData('processMaterials', {
                            query: { _id: materialId },
                            page: 1,
                            limit: 1
                        })
                    );

                    const materialsResponses = await Promise.all(materialPromises);
                    console.log('获取到的物料信息:', materialsResponses); // 调试日志

                    this.processMaterials = materialsResponses
                        .map(response => response.data[0])
                        .filter(material => material);

                    // 重置并初始化验证状态
                    this.validateStatus = { mainBarcode: false };
                    this.scanForm.barcodes = {};

                    this.processMaterials.forEach(material => {
                        this.validateStatus[material._id] = false;
                        this.$set(this.scanForm.barcodes, material._id, '');
                    });
                } else {
                    console.log('未找到工序相关物料'); // 调试日志
                    this.processMaterials = [];
                    this.validateStatus = { mainBarcode: false };
                    this.scanForm.barcodes = {};
                }
            } catch (error) {
                console.error('获取工序物料失败:', error);
                this.$message.error('获取工序物料失败');
                this.processMaterials = [];
                this.validateStatus = { mainBarcode: false };
                this.scanForm.barcodes = {};
            }
        },
        async validateMainBarcode(barcode) {
            if (!barcode) return false;
            console.log("🚀 ~ validateMainBarcode ~ barcode:", barcode.length)
            // 根据不同长度判断不同类型的条码
            switch (barcode.length) {
                case 41: // 成品码
                    const productDI = barcode.substring(2, 18);
                    return await this.validateDICode(productDI);

                case 34: // 电风扇与制冷片组件
                    const fanDI = barcode.substring(7, 19);
                    return await this.validateDICode(fanDI);

                case 48: // 灯板组件
                    const lightDI = barcode.substring(0, 5);
                    return await this.validateDICode(lightDI);

                case 32: // 遥控器组件
                    const remoteDI = barcode.substring(0, 8);
                    return await this.validateDICode(remoteDI);

                default:
                    this.$message.error('UDI条码格式不正确');
                    return false;
            }
        },

        // 新增辅助方法验证DI码
        async validateDICode(diCode) {
            console.log("🚀 ~ validateDICode ~ diCode:", diCode)
            // 这里可以添加具体的DI码验证逻辑
            const response = await getData('productDiNum', { query: { diNum: diCode }, populate: JSON.stringify([{ path: 'productId', model: 'k3_BD_MATERIAL' }]) });
            console.log('验证DI码结果:', response.data);
            if (response.data.length > 0) {
                //校验对应di码绑定的物料是否时当前工序所需物料编码
                if (response.data[0].productId.FNumber === this.mainMaterialCode) {
                    return true;
                } else {
                    this.$message.error('该DI编码绑定的物料与当前工序所需物料不一致');
                    return false;
                }
            } else {
                this.$message.error('该DI编码不存在本系统');
                return false;
            }
        },

        // 验证条码格式
        validateBarcode(barcode) {
            // 条码格式：物料编号_序号
            const pattern = /^[A-Za-z0-9]+_[0-9]+$/;
            return pattern.test(barcode);
        },

        // 验证输入并处理主条码
        async validateInput(key) {
            try {
                const value = key === 'mainBarcode' ?
                    this.scanForm.mainBarcode :
                    this.scanForm.barcodes[key];

                if (!value) {
                    this.validateStatus[key] = false;
                    return;
                }

                if (key === 'mainBarcode') {
                    // 验证条码格式
                    if (!await this.validateMainBarcode(value)) {
                        this.validateStatus[key] = false;
                        return;
                    }
                } else {
                    // 验证条码格式
                    if (!this.validateBarcode(value)) {
                        this.$message.error('条码格式不正确，应为：物料编号_序号');
                        this.validateStatus[key] = false;
                        return;
                    }
                }



                if (key === 'mainBarcode') {
                    // 处理主条码
                    await this.handleMainBarcode(value);
                } else {
                    // 处理子物料条码
                    await this.handleSubBarcode(key, value);
                }

                this.validateStatus[key] = true;
            } catch (error) {
                console.error('条码验证处理失败:', error);
                this.$message.error(error.message || '条码验证处理失败');
                this.validateStatus[key] = false;
            }
        },

        // 处理主条码
        async handleMainBarcode(barcode) {
            try {
                // 查询条码是否存在
                const response = await getData('material_process_flow', {
                    query: { barcode: barcode }
                });

                if (response.data && response.data.length > 0) {
                    // 条码已存在，获取流程信息
                    const flowData = response.data[0];
                    this.$message.success('扫描成功');

                    // TODO: 可以在这里添加额外的处理逻辑，比如显示当前流程状态等

                } else {
                    // 条码不存在，创建新的流程记录
                    const materialCode = this.mainMaterialCode;

                    // 调用创建流程的API
                    const createResponse = await createFlow({
                        materialCode,
                        barcode
                    });

                    if (createResponse.code === 200) {
                        this.$message.success('工艺流程记录创建成功');
                    } else {
                        throw new Error(createResponse.msg || '创建工艺流程记录失败');
                    }
                }
            } catch (error) {
                console.error('处理主条码失败:', error);
                throw error;
            }
        },

        // 处理子物料条码
        async handleSubBarcode(materialId, barcode) {
            try {
                // 验证主条码是否已扫描
                if (!this.scanForm.mainBarcode || !this.validateStatus.mainBarcode) {
                    throw new Error('请先扫描主条码');
                }

                // 获取对应的物料信息
                const material = this.processMaterials.find(m => m._id === materialId);
                if (!material) {
                    throw new Error('未找到对应的物料信息');
                }

                // 获取产线名称
                const productLine = this.productLineOptions.find(p => p._id === this.formData.productLine);
                const stationName = productLine ? productLine.FName : '';

                // 创建扫码记录
                const scanRecord = {
                    flowId: this.currentFlowId,
                    processStepId: this.processStepId,
                    stationId: this.formData.productLine,
                    stationName: stationName,
                    materialBarcode: barcode,
                    materialId: material.materialId,
                    materialCode: material.materialCode,
                    materialName: material.materialName,
                    quantity: material.quantity,
                    status: 'COMPLETED',
                    scanTime: new Date(),
                    operator: this.$store.state.user.name
                };

                // 保存扫码记录
                const response = await addData('process_scan_record', scanRecord);

                if (response.code !== 200) {
                    throw new Error(response.msg || '保存扫码记录失败');
                }

                this.$message.success('扫码记录保存成功');
            } catch (error) {
                console.error('处理子物料条码失败:', error);
                throw error;
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
        },

        // 添加取消保存设置的方法
        async handleCancelSave() {
            try {
                await this.$confirm('确认取消当前工序设置？', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                });

                // 创建全屏加载
                const loading = this.$loading({
                    lock: true,
                    text: '取消设置中...',
                    spinner: 'el-icon-loading',
                    background: 'rgba(0, 0, 0, 0.7)'
                });

                // 清空所有相关的localStorage
                localStorage.removeItem('mainMaterialId');
                localStorage.removeItem('processStepId');
                localStorage.removeItem('materialName');
                localStorage.removeItem('processName');

                // 重置表单数据
                this.formData = {
                    productModel: '',
                    productLine: '',
                    processStep: '',
                    componentName: ''
                };

                this.$message.success('已取消工序设置');

                // 模拟延迟以显示加载图标
                setTimeout(() => {
                    loading.close();
                    // 强制刷新页面
                    window.location.reload();
                }, 500);

            } catch (error) {
                if (error !== 'cancel') {
                    console.error('取消设置失败:', error);
                    this.$message.error('取消设置失败');
                }
            }
        },

        // 获取验证状态图标
        getValidateIcon(key) {
            return this.validateStatus[key]
                ? 'el-icon-check success-icon'
                : 'el-icon-close error-icon';
        },

        // 重置扫码表单
        resetScanForm() {
            // 重置主条码
            this.scanForm.mainBarcode = '';

            // 重置子物料条码
            this.scanForm.barcodes = {};

            // 重置验证状态
            this.validateStatus = { mainBarcode: false };

            // 重置子物料的验证状态和条码
            if (this.processMaterials && this.processMaterials.length > 0) {
                this.processMaterials.forEach(material => {
                    // 使用 Vue.$set 确保响应式更新
                    this.$set(this.validateStatus, material._id, false);
                    this.$set(this.scanForm.barcodes, material._id, '');
                });
            }

            // 重置当前流程ID
            this.currentFlowId = null;
        },

        // 确认按钮处理方法
        async handleConfirm() {
            try {
                // 1. 验证所有条码是否已扫描
                const allBarcodesFilled = Object.values(this.validateStatus).every(status => status === true);
                if (!allBarcodesFilled) {
                    this.$message.warning('请完成所有条码扫描');
                    return;
                }

                // 2. 获取主流程记录
                const response = await getData('material_process_flow', {
                    query: { barcode: this.scanForm.mainBarcode }
                });

                if (!response.data || !response.data.length === 0) {
                    throw new Error('未找到对应的工艺流程记录');
                }

                const flowData = response.data[0];
                this.currentFlowId = flowData._id;

                // 3. 更新工艺流程中当前工序的状态
                const updatedNodes = flowData.processNodes.map(node => {
                    if (node.processStepId === this.processStepId) {
                        return {
                            ...node,
                            status: 'COMPLETED',
                            endTime: new Date()
                        };
                    }
                    return node;
                });

                // 4. 更新主流程记录
                await updateData('material_process_flow', flowData._id, {
                    processNodes: updatedNodes,
                    updateBy: this.$store.state.user.name,
                    updateAt: new Date()
                });

                // 5. 检查是否所有工序都已完成
                const allProcessesCompleted = updatedNodes.every(node =>
                    node.nodeType === 'PROCESS_STEP' ? node.status === 'COMPLETED' : true
                );

                if (allProcessesCompleted) {
                    // 更新整体流程状态为已完成
                    await updateData('material_process_flow', flowData._id, {
                        status: 'COMPLETED',
                        endTime: new Date()
                    });
                    this.$message.success('所有工序已完成！');
                } else {
                    this.$message.success('当前工序扫码完成');
                }

                // 6. 重置表单
                this.resetScanForm();

            } catch (error) {
                console.error('确认失败:', error);
                this.$message.error('确认失败: ' + error.message);
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
    min-height: 100vh;
    background-color: #f5f7fa;
    padding: 20px;
}

.scan-card {
    max-width: 1000px;
    margin: 0 auto;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.card-header {
    display: flex;
    align-items: center;
    font-size: 20px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 30px;
    padding-bottom: 15px;
    border-bottom: 2px solid #ebeef5;
}

.card-header i {
    margin-right: 10px;
    color: #409EFF;
    font-size: 24px;
}

.section-header {
    display: flex;
    align-items: center;
    margin: 20px 0;
    padding: 10px;
    background: #f5f7fa;
    border-radius: 6px;
}

.section-header i {
    color: #409EFF;
    margin-right: 8px;
}

.section-header span {
    font-weight: 500;
    color: #606266;
}

.input-with-status {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
}

.valid-input>>>.el-input__inner {
    border-color: #67C23A;
    transition: all 0.3s ease;
}

.status-indicator {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #f56c6c;
    color: white;
    transition: all 0.3s ease;
}

.status-indicator.valid {
    background: #67C23A;
}

.button-group {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 30px;
}

.button-group .el-button {
    min-width: 120px;
    padding: 12px 30px;
}

.el-button {
    padding: 12px 30px;
    border-radius: 6px;
    transition: all 0.3s ease;
}

.init-tip {
    position: relative;
    height: 100%;
    min-height: 400px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(2px);
    border-radius: 8px;
    z-index: 1;
}

.overlay i {
    font-size: 60px;
    color: #e6a23c;
    margin-bottom: 20px;
}

.overlay p {
    font-size: 18px;
    color: #606266;
    margin: 0;
}

.pulse {
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% {
        transform: scale(1);
        opacity: 0.8;
    }

    50% {
        transform: scale(1.1);
        opacity: 1;
    }

    100% {
        transform: scale(1);
        opacity: 0.8;
    }
}

/* 输入框动画效果 */
.el-input>>>.el-input__inner:focus {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 左侧表单样式 */
.left-form {
    margin-right: 20px;
    width: 400px;
}

.init-card {
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.form-section {
    margin-bottom: 20px;
}

/* 下拉选择框样式 */
.custom-select {
    width: 100%;
}

.custom-select>>>.el-input__inner {
    border-radius: 6px;
    transition: all 0.3s ease;
}

.custom-select>>>.el-input__inner:hover {
    border-color: #409EFF;
}

.custom-select>>>.el-input__inner:focus {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 选项内容样式 */
.option-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 0;
}

.option-main {
    font-size: 14px;
    color: #303133;
}

.option-sub {
    font-size: 13px;
    color: #8492a6;
}

/* 加载状态样式 */
.el-select>>>.el-input.is-loading .el-input__inner {
    padding-right: 30px;
}

/* 按钮组样式 */
.button-group {
    margin-top: 30px;
    text-align: center;
}

.button-group .el-button {
    padding: 12px 30px;
    border-radius: 6px;
    transition: all 0.3s ease;
}

.button-group .el-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 布局调整 */
.scan-container {
    display: flex;
    gap: 20px;
    padding: 20px;
}

.right-content {
    flex: 1;
}

.vertical-form-item {
    display: flex;
    flex-direction: column;
}

.vertical-form-item>>>.el-form-item__label {
    text-align: left;
    padding: 0 0 10px 0;
    line-height: 1.4;
    white-space: normal;
    /* 允许标签文字换行 */
}

.vertical-form-item>>>.el-form-item__content {
    margin-left: 0 !important;
}
</style>