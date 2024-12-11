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
                            <zr-select v-if="!mainMaterialId" v-model="formData.productModel" collection="k3_BD_MATERIAL"
                                :disabled="!!mainMaterialId && !!processStepId" :search-fields="['FNumber', 'FName']"
                                label-key="FName" sub-key="FMATERIALID" :multiple="false" placeholder="请输入物料编码/名称搜索"
                                @select="handleProductChange">
                                <template #option="{ item }">
                                    <div class="item-option">
                                        <div class="item-info">
                                            <span>{{ item.FNumber }} - {{ item.FName }}</span>
                                            <el-tag size="mini" type="info">{{ item.FMATERIALID }} -{{ item.FUseOrgId
                                                }}</el-tag>
                                        </div>
                                    </div>
                                </template>
                            </zr-select>
                            <el-input v-else v-model="formData.productName" placeholder="请输入物料编码/名称搜索"
                                :disabled="!!mainMaterialId && !!processStepId" />
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

                        <el-form-item label="产线编码">
                            <zr-select :disabled="!!mainMaterialId && !!processStepId" v-model="formData.productLine"
                                collection="production_line" :search-fields="['lineCode', 'lineName']"
                                label-key="lineName" tag-key="lineCode" sub-key="workshop" :multiple="false"
                                placeholder="请输入产线信息搜索" @select="handleProductionLineSelect" />
                        </el-form-item>
                    </div>

                    <!-- 按钮部分 -->
                    <div class="button-group" v-if="hasEditPermission">
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
                        <div class="section-header">
                            <i class="el-icon-camera"></i>
                            <span>统一扫描区域</span>
                        </div>
                        <div class="scan-input-section">
                            <el-input v-model="unifiedScanInput" placeholder="请扫描条码" @input="handleUnifiedScan"
                                ref="scanInput" clearable @clear="focusInput">
                            </el-input>
                        </div>
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
                                        :class="{ 'valid-input': validateStatus['mainBarcode'] }" readonly>
                                        <template slot="prefix">
                                            <i class="el-icon-full-screen"></i>
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
                            <el-row :gutter="20">
                                <el-col :span="12" v-for="material in processMaterials" :key="material._id">
                                    <el-form-item :label="`编号：${material.materialCode}  名称：${material.materialName}  `"
                                        class="vertical-form-item">
                                        <div class="input-with-status">
                                            <el-input v-model="scanForm.barcodes[material._id]"
                                                :placeholder="`请扫描子物料条码`"
                                                :class="{ 'valid-input': validateStatus[material._id] }" readonly>
                                                <template slot="prefix">
                                                    <i class="el-icon-full-screen"></i>

                                                </template>
                                                <template slot="suffix" v-if="material.isBatch">
                                                    <el-tag type="warning">批次物料</el-tag>
                                                </template>
                                            </el-input>
                                            <div class="status-indicator"
                                                :class="{ 'valid': validateStatus[material._id] }">
                                                <i :class="getValidateIcon(material._id)"></i>
                                            </div>
                                        </div>
                                    </el-form-item>
                                </el-col>
                            </el-row>

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
//01012345678912391020240600122Q03UB001Z0K7
// (01)01234567891231(10)202407001(21)R12UB001Z0K2
// 1101103001-24120701
// 1101103004-24120702
// 1101103005-24120703
// 1101103007-23920

//FW300XXXK22UL309Z0Z100046MLQ6MLQ

//1303203003-24120701
//1305103003-24120702
import { getData, addData, updateData, removeData } from "@/api/data";
import { createFlow, scanComponents } from "@/api/materialProcessFlowService";
import ZrSelect from '@/components/ZrSelect'
import {
    tone
} from "@/utils/tone.js";
import smcg from "@/assets/tone/smcg.mp3";
import tmyw from "@/assets/tone/tmyw.mp3";
import bdcg from "@/assets/tone/bdcg.mp3";
export default {
    name: 'ScanBarCode',
    components: {
        ZrSelect
    },
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
            unifiedScanInput: '', // 新增统一扫描输入框的值
            hasEditPermission: false, // 添加权限控制状态
            scanTimer: null, // 添加定时器属性
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
        },
        productLineId: {
            get() {
                return localStorage.getItem('productLineId') || ''
            },
            set(value) {
                localStorage.setItem('productLineId', value)
            }
        },
        productLineName: {
            get() {
                return localStorage.getItem('productLineName') || ''
            },
            set(value) {
                localStorage.setItem('productLineName', value)
            }
        },

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
        },
        // 添加对validateStatus的深度监听
        validateStatus: {
            handler(newStatus) {
                // 检查是否所有条码都已扫描成功

            },
            deep: true // 深度监听对象的变化
        }
    },

    methods: {
        handleProductionLineSelect(item) {
            if (item) {
                this.formData.lineName = item.lineName;
                this.formData.productLine = item._id;
            }
        },
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
        async getAllProcessSteps(materialId, processSteps = new Set(), processedMaterials = new Set()) {
            try {
                // 检查材料是否已处理过（检测循环依赖）
                if (processedMaterials.has(materialId)) {
                    console.warn(`检测到循环依赖, 材料ID: ${materialId}`);
                    return processSteps;
                }

                // 添加当前材料到已处理集合
                processedMaterials.add(materialId);

                const craft = await this.getCraftByMaterialId(materialId);
                if (!craft || !craft.processSteps) return processSteps;

                for (const stepId of craft.processSteps) {
                    if (!processSteps.has(stepId)) {
                        const step = await this.getProcessStepById(stepId);
                        if (step) {
                            processSteps.add(step);

                            // 获取工序关联的物料
                            const processMaterialsResponse = await getData('processMaterials', {
                                query: { processStepId: stepId }
                            });

                            if (processMaterialsResponse.data) {
                                for (const material of processMaterialsResponse.data) {
                                    // 递归调用时传入已处理材料集合
                                    await this.getAllProcessSteps(
                                        material.materialId,
                                        processSteps,
                                        processedMaterials
                                    );
                                }
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
        async handleProductChange(material) {
            const materialId = material._id;
            this.processStepOptions = [];
            this.formData.processStep = '';
            this.mainMaterialId = '';

            if (!materialId) return;

            try {
                // 只需要传入初始的 Set 集合
                const processSteps = await this.getAllProcessSteps(materialId, new Set(), new Set());
                console.log("获取到的工序:", processSteps);
                this.processStepOptions = Array.from(processSteps);
                this.formData.productModel = materialId;
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
            this.formData.processStep = processId;
            // this.processStepId = processId; // 缓存选中的工序ID
        },

        // 保存按钮处理
        async handleSave() {
            if (!this.formData.productModel || !this.formData.processStep || !this.formData.productLine) {
                this.$message.warning('请选择产品型号、工序和产线');
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
                this.productLineId = this.formData.productLine;

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
                console.log('正在获取工序信息，ID:', this.processStepId);

                // 获取工序信息
                const stepResponse = await getData('processStep', {
                    query: { _id: this.processStepId },
                    page: 1,
                    limit: 1
                });

                if (!stepResponse.data || !stepResponse.data.length === 0) {
                    throw new Error('未找到工序信息');
                }

                const processStep = stepResponse.data[0];

                // 获取该工序所属的工艺信息
                const craftResponse = await getData('craft', {
                    query: { processSteps: this.processStepId },
                    page: 1,
                    limit: 1
                });

                if (!craftResponse.data || !craftResponse.data.length === 0) {
                    throw new Error('未找到工艺信息');
                }

                const craft = craftResponse.data[0];

                // 获取工艺对应的物料信息
                const material = await this.getMaterialById(craft.materialId);

                if (!material) {
                    throw new Error('未找到物料信息');
                }

                // 更新主物料信息为工艺对应的物料
                this.mainMaterialName = material.FName;
                this.mainMaterialCode = material.FNumber;

                // 获取工序关联的物料
                if (processStep.materials && processStep.materials.length > 0) {
                    const materialPromises = processStep.materials.map(materialId =>
                        getData('processMaterials', {
                            query: { _id: materialId },
                            page: 1,
                            limit: 1
                        })
                    );

                    const materialsResponses = await Promise.all(materialPromises);

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
                    this.processMaterials = [];
                    this.validateStatus = { mainBarcode: false };
                    this.scanForm.barcodes = {};
                }
            } catch (error) {
                console.error('获取工序物料失败:', error);
                this.$message.error(error.message || '获取工序物料失败');
                this.processMaterials = [];
                this.validateStatus = { mainBarcode: false };
                this.scanForm.barcodes = {};
            }
        },
        async validateDICode(diCode) {
            try {
                // 获取DI码对应的物料信息
                const response = await getData('productDiNum', {
                    query: { diNum: diCode },
                    populate: JSON.stringify([{ path: 'productId', model: 'k3_BD_MATERIAL' }])
                });

                if (response.data.length === 0) {
                    this.$message.error('该DI编码不存在本系统');
                    return { isValid: false };
                }

                // 返回验证结果和关联的物料编码
                return {
                    isValid: true,
                    materialCode: response.data[0].productId.FNumber
                };
            } catch (error) {
                console.error('DI码验证失败:', error);
                this.$message.error('DI码验证失败');
                return { isValid: false };
            }
        },

        // 修改验证条码的方法
        async validateBarcode(barcode) {
            console.log('validateBarcode', barcode);
            if (!barcode) return false;

            let materialCode;
            let relatedBill = "";


            let valid = false;
            //检测条码是否包含-
            if (barcode.includes('-') && barcode.length != 34) {
                materialCode = barcode.split('-')[0];
                relatedBill = barcode.split('-')[1];
                valid = true;
            }

            if (!valid) {
                // 根据不同长度判断不同类型的条码
                switch (barcode.length) {
                    case 47: // 成品码
                        const productDI = barcode.substring(4, 18);
                        console.log('productDI', productDI);
                        const productResult = await this.validateDICode(productDI);
                        if (!productResult.isValid) return false;
                        materialCode = productResult.materialCode;
                        break;

                    case 34: // 电风扇与制冷片组件
                        const fanDI = barcode.substring(7, 19);
                        console.log('fanDI', fanDI);
                        const fanResult = await this.validateDICode(fanDI);
                        if (!fanResult.isValid) return false;
                        materialCode = fanResult.materialCode;
                        break;

                    case 48: // 灯板组件
                        const lightDI = barcode.substring(0, 5);
                        console.log('lightDI', lightDI);
                        const lightResult = await this.validateDICode(lightDI);
                        if (!lightResult.isValid) return false;
                        materialCode = lightResult.materialCode;
                        break;

                    case 32: // 遥控器组件
                        const remoteDI = barcode.substring(0, 8);
                        console.log('remoteDI', remoteDI);
                        const remoteResult = await this.validateDICode(remoteDI);
                        if (!remoteResult.isValid) return false;
                        materialCode = remoteResult.materialCode;
                        break;

                    case 20: // 批次虚拟条码
                        const batchDI = barcode.substring(0, 11);
                        console.log('batchDI', batchDI);
                        const batchResult = await this.validateDICode(batchDI);
                        if (!batchResult.isValid) return false;
                        materialCode = batchResult.materialCode;
                        break;

                    default:
                        // 处理普通条码格式
                        this.$message.error('条码格式不正确，应为：物料编号-序号');
                        tone(tmyw)
                        return false;
                }

            }

            // 验证物料编码是否匹配当前工序需求
            if (materialCode === this.mainMaterialCode) {
                return { materialCode: materialCode, isValid: true, relatedBill: relatedBill };
            }

            // 检查是否为子物料
            const matchedMaterial = this.processMaterials.find(m => m.materialCode === materialCode);
            if (matchedMaterial) {
                return { materialCode: materialCode, isValid: true, relatedBill: relatedBill };
            }

            this.$message.error('该条码对应的物料与当前工序所需物料不匹配');
            return { materialCode: materialCode, isValid: false };
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
                    const mainMaterialId = this.mainMaterialId;

                    // 调用创建流程的API
                    const createResponse = await createFlow({
                        mainMaterialId,
                        materialCode,
                        barcode
                    });

                    if (createResponse.code === 200) {
                        this.$message.success('成品条码追溯记录创建成功');
                    } else {
                        throw new Error(createResponse.msg || '创建成品条码追溯记录失败');
                    }
                }
            } catch (error) {
                console.error('处理主条码失败:', error);
                tone(tmyw)
                throw error;
            }
        },

        // 处理子物��条码
        async handleSubBarcode(materialId, materialCode) {
            try {
                // 验证主条码是否已扫描
                // if (!this.scanForm.mainBarcode || !this.validateStatus.mainBarcode) {
                //     throw new Error('请先扫描主条码');
                // }

                // 获取对应的物料信息
                const material = this.processMaterials.find(m => m._id === materialId);
                if (!material) {
                    throw new Error('未找到对应的物料信息');
                }

                //对比物料编码是否一致
                if (material.materialCode !== materialCode) {
                    throw new Error('物料编码不一致');
                }

                this.validateStatus[materialId] = true;
                this.$message.success('扫码成功');

            } catch (error) {
                console.error('处理子物料条码失败:', error);
                tone(tmyw)
                throw error;
            }
        },

        // 新增方法：根据ID获取产品型号和工序名称
        async fillFormData() {
            if (this.mainMaterialId && this.materialName) {
                this.formData.productName = this.materialName;
            }

            if (this.processStepId && this.processName) {
                this.formData.processStep = this.processName;
            }

            if (this.productLineId) {
                this.formData.productLine = this.productLineId;
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
                localStorage.removeItem('productLineId');
                localStorage.removeItem('productLineName');

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

            // 创建新的条码对象，保留批次物料的条码
            const newBarcodes = {};

            // 遍历处理所有物料
            this.processMaterials.forEach(material => {
                if (material.isBatch && this.scanForm.barcodes[material._id]) {
                    // 保留批次物料的条码和验证状态
                    newBarcodes[material._id] = this.scanForm.barcodes[material._id];
                    this.$set(this.validateStatus, material._id, true);
                } else {
                    // 重置非批次物料的条码和验证状态
                    newBarcodes[material._id] = '';
                    this.$set(this.validateStatus, material._id, false);
                }
            });

            // 更新条码对象
            this.scanForm.barcodes = newBarcodes;

            // 重置主条码的验证状态
            this.$set(this.validateStatus, 'mainBarcode', false);

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



                let componentScans = [];
                this.processMaterials.forEach(material => {
                    componentScans.push({
                        materialId: material.materialId,
                        barcode: this.scanForm.barcodes[material._id]
                    })
                })
                console.log("🚀 ~ handleConfirm ~ componentScans:", componentScans)
                let scanReq = {
                    mainBarcode: this.scanForm.mainBarcode,
                    processStepId: this.processStepId,
                    componentScans: componentScans,
                    userId: this.$store.getters.id
                }

                console.log("🚀 ~ handleConfirm ~ scanReq:", scanReq)

                const scanResponse = await scanComponents(scanReq);

                if (scanResponse.code !== 200) {
                    // this.resetScanForm();
                    throw new Error(scanResponse.message || '扫码失败');
                }

                //TODO成功后播放提示音
                tone(bdcg)
                // 6. 重置表单
                this.resetScanForm();

            } catch (error) {
                console.error('确认失败:', error);
                tone(tmyw)
                if (error.message.includes("该主物料条码对应工序节点已完成或处于异常状态")) {
                    this.$message.warning(error.message);
                } else {
                    this.$message.error('确认失败:' + error.message);
                }
            }
        },



        // 修改统一扫描处理方法
        async handleUnifiedScan(value) {
            if (!value) return;

            if (this.scanTimer) {
                clearTimeout(this.scanTimer);
            }

            this.scanTimer = setTimeout(async () => {
                try {
                    const cleanValue = value.trim().replace(/[\r\n]/g, '');
                    if (!cleanValue) return;

                    const isValidResult = await this.validateBarcode(cleanValue);
                    if (!isValidResult.isValid) {
                        tone(tmyw); // 播放错误提示音
                        this.$notify({
                            title: '条码验证失败',
                            message: '条码格式不正确或未在系统中注册',
                            type: 'error',
                            duration: 3000,
                            position: 'top-right'
                        });
                        this.unifiedScanInput = '';
                        this.$refs.scanInput.focus();
                        return;
                    }

                    const materialCode = isValidResult.materialCode;
                    let matched = false;

                    // 检查主物料
                    if (materialCode === this.mainMaterialCode) {
                        this.scanForm.mainBarcode = value;
                        await this.handleMainBarcode(value);
                        this.validateStatus.mainBarcode = true;
                        tone(smcg); // 播放扫描成功提示音
                        this.$notify({
                            title: '主物料扫描成功',
                            dangerouslyUseHTMLString: true,
                            message: `
                                <div style="line-height: 1.5">
                                    <div>物料名称: ${this.mainMaterialName}</div>
                                    <div>物料编码: ${materialCode}</div>
                                    <div>条码: ${value}</div>
                                </div>
                            `,
                            type: 'success',
                            duration: 3000,
                            position: 'top-right'
                        });
                        matched = true;
                    }

                    // 检查子物料
                    if (!matched) {
                        for (const material of this.processMaterials) {
                            if (material.materialCode === materialCode) {
                                this.$set(this.scanForm.barcodes, material._id, value);
                                await this.handleSubBarcode(material._id, materialCode);
                                tone(smcg); // 播放扫描成功提示音
                                
                                this.$notify({
                                    title: '子物料扫描成功',
                                    dangerouslyUseHTMLString: true,
                                    message: `
                                        <div style="line-height: 1.5">
                                            <div>物料名称: ${material.materialName}</div>
                                            <div>物料编码: ${material.materialCode}</div>
                                            <div>条码: ${value}</div>
                                            ${isValidResult.relatedBill ? `<div>关联单号: ${isValidResult.relatedBill}</div>` : ''}
                                        </div>
                                    `,
                                    type: 'success',
                                    duration: 3000,
                                    position: 'top-right'
                                });
                                matched = true;
                                break;
                            }
                        }
                    }

                    if (!matched) {
                        tone(tmyw); // 播放错误提示音
                        this.$notify({
                            title: '未匹配成功',
                            dangerouslyUseHTMLString: true,
                            message: `
                                <div style="line-height: 1.5">
                                    <div>条码: ${value}</div>
                                    <div>物料编码: ${materialCode}</div>
                                    <div style="color: #F56C6C">该物料与当前工序不匹配</div>
                                </div>
                            `,
                            type: 'warning',
                            duration: 3000,
                            position: 'top-right'
                        });
                        return;
                    }

                    const allScanned = Object.values(this.validateStatus).every(status => status === true);

                    if (allScanned) {
                        tone(bdcg); // 播放绑定成功提示音
                        this.$notify({
                            title: '扫描完成',
                            dangerouslyUseHTMLString: true,
                            message: `
                                <div style="line-height: 1.5">
                                    <div>所有物料已扫描完成</div>
                                    <div style="color: #67C23A">正在发起确认提交...</div>
                                </div>
                            `,
                            type: 'success',
                            duration: 3000,
                            position: 'top-right'
                        });

                        this.handleConfirm();
                    } else {
                        // 显示还需要扫描的物料
                        const remainingMaterials = this.processMaterials
                            .filter(material => !this.validateStatus[material._id])
                            .map(material => `${material.materialName}(${material.materialCode})`)
                            .join('\n');
                        
                        if (remainingMaterials) {
                            this.$notify({
                                title: '继续扫描',
                                dangerouslyUseHTMLString: true,
                                message: `
                                    <div style="line-height: 1.5">
                                        <div>请继续扫描以下物料：</div>
                                        <div style="color: #E6A23C; white-space: pre-line">${remainingMaterials}</div>
                                    </div>
                                `,
                                type: 'info',
                                duration: 3000,
                                position: 'top-right'
                            });
                        }
                    }

                } catch (error) {
                    console.error('扫描处理失败:', error);
                    tone(tmyw); // 播放错误提示音
                    this.$notify({
                        title: '扫描失败',
                        message: error.message || '扫描处理失败',
                        type: 'error',
                        duration: 3000,
                        position: 'top-right'
                    });
                } finally {
                    this.unifiedScanInput = '';
                    this.$refs.scanInput.focus();
                }
            }, 1000);
        },

        // 新增获取焦点方法
        focusInput() {
            this.$refs.scanInput.focus();
        },
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
    },
    mounted() {
        console.log("🚀 ~ mounted ~ this.$store.getters.id:", this.$store.getters)
        // 页面加载时自动获取焦点
        if (this.mainMaterialId && this.processStepId) {
            this.$refs.scanInput.focus();
        }


        console.log("Complete roles data:", this.$store.getters.roles);
        const roles = this.$store.getters.roles;
        if (!roles || !roles.buttonList) {
            return false;
        }
        if (roles.buttonList.includes("scan_edit_configuration")) {
            this.hasEditPermission = true;
        }
    },
    // 组件销毁时清除定时器
    beforeDestroy() {
        if (this.scanTimer) {
            clearTimeout(this.scanTimer);
        }
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

.scan-input-section {
    margin-bottom: 20px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 2px solid #409EFF;
}

.scan-input-section .el-input {
    margin-top: 10px;
}

.scan-input-section .el-input__inner {
    height: 50px;
    font-size: 18px;
}
</style>