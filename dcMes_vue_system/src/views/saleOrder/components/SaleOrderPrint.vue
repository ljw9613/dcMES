<template>
    <div class="sale-order-print">
        <hir-input ref="hirInput" :printData="printData" :default-template="localPrintTemplate"
            @template-change="handleTemplateChange" :html-print-data="htmlPrintData" />
        <!-- 打印区域 -->
        <div ref="printArea" class="print-area">
            <table class="print-table" border="1" cellspacing="0" cellpadding="5">
                <tr>
                    <td>产品名称：</td>
                    <td>{{ orderData.FMaterialName || '-' }}</td>
                    <td>客户型号：</td>
                    <td>{{ orderData.FMaterialModel || '-' }}</td>
                    <td>客户代码：</td>
                    <td>{{ orderData.FCustId_FNumber || '-' }}</td>
                </tr>
                <tr>
                    <td>数量：</td>
                    <td>{{ orderData.FQty || '0' }}</td>
                    <td>客户PO单号：</td>
                    <td>{{ orderData.F_TFQJ_khpo || '-' }}</td>
                    <td>交货日期：</td>
                    <td>{{ formatDate(orderData.FDate) }}</td>
                </tr>
                <tr>
                    <td>认证要求：</td>
                    <td colspan="5">{{ extData.FCertification || '-' }}</td>
                </tr>
                <tr>
                    <td>产品颜色：</td>
                    <td colspan="5">{{ extData.FProductColor || '-' }}</td>
                </tr>
                <tr>
                    <td>电压功率：</td>
                    <td colspan="5">{{ extData.FVoltageRatio || '-' }}</td>
                </tr>
                <tr>
                    <td>铭牌：</td>
                    <td colspan="5">
                        {{ extData.FMinSpec || '-' }}
                        <div v-if="extData.FMinSpecImage" class="image-preview">
                            <img :src="extData.FMinSpecImage" alt="铭牌图片">
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>商标：</td>
                    <td colspan="5">{{ extData.FTrademark || '-' }}</td>
                </tr>
                <tr>
                    <td>印刷位置：</td>
                    <td colspan="2">{{ extData.FPrintPosition || '-' }}</td>
                    <td>印刷颜色：</td>
                    <td colspan="2">{{ extData.FPrintColor || '-' }}</td>
                </tr>
                <tr>
                    <td>备损件：</td>
                    <td colspan="5">{{ extData.FAccessories || '-' }}</td>
                </tr>
                <tr>
                    <td>PE袋：</td>
                    <td colspan="5">{{ extData.FPEBagReq || '-' }}</td>
                </tr>
                <tr>
                    <td>说明书：</td>
                    <td colspan="2">{{ extData.FManual || '-' }}</td>
                    <td>自封袋：</td>
                    <td colspan="2">{{ extData.FSelfSeal || '-' }}</td>
                </tr>
                <tr>
                    <td>彩盒标贴：</td>
                    <td colspan="2">
                        {{ extData.FColorLabel || '-' }}
                        <div v-if="extData.FColorLabelImage" class="image-preview">
                            <img :src="extData.FColorLabelImage" alt="彩盒标贴图片">
                        </div>
                    </td>
                    <td>格数：</td>
                    <td colspan="2">{{ extData.FGrids || '-' }}</td>
                </tr>
                <tr>
                    <td>UDI码：</td>
                    <td colspan="5">{{ extData.FUDI || '-' }}</td>
                </tr>
                <tr>
                    <td>彩盒：</td>
                    <td colspan="5">{{ extData.FColorBox || '-' }}</td>
                </tr>
                <tr>
                    <td>序列号规则：</td>
                    <td colspan="5">{{ extData.FSerialRule || '-' }}</td>
                </tr>
                <tr>
                    <td>形制：</td>
                    <td colspan="5">{{ extData.FShape || '-' }}</td>
                </tr>
                <tr>
                    <td>托盘标贴：</td>
                    <td colspan="5">
                        {{ extData.FBoxLabel || '-' }}
                        <div v-if="extData.FBoxLabelImage" class="image-preview">
                            <img :src="extData.FBoxLabelImage" alt="托盘标贴图片">
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>托盘标贴及包装方式：</td>
                    <td colspan="5">{{ extData.FBoxLabelPackage || '-' }}</td>
                </tr>
                <tr style="height: 200px;">
                    <td>其他要求：</td>
                    <td colspan="5">{{ extData.FOtherReq || '-' }}</td>
                </tr>
                <tr>
                    <td>批准：</td>
                    <td>{{ orderData.FApprover || '-' }}</td>
                    <td>审核：</td>
                    <td>{{ orderData.FReviewer || '-' }}</td>
                    <td>确认：</td>
                    <td>{{ orderData.FConfirmer || '-' }}</td>
                </tr>
                <tr style="height: 200px;">
                    <td>技术部确认：</td>
                    <td colspan="5">
                        <div>对应BOM：{{ extData.FBOM || '-' }}</div>
                        <div>其他：{{ extData.FOtherTechConfirm || '-' }}</div>
                    </td>
                </tr>
                <tr>
                    <td>批准：</td>
                    <td>{{ '-' }}</td>
                    <td>审核：</td>
                    <td>{{ '-' }}</td>
                    <td>确认：</td>
                    <td>{{ '-' }}</td>
                </tr>
                <tbody>
                    <tr style="height: 200px;">
                        <td>满足适用的法规要求：</td>
                        <td colspan="5">{{ extData.FRegulationReq || '-' }}</td>
                    </tr>
                </tbody>
            </table>
            <div class="signature-line">
                <span>法规负责人日期：________________</span>
                <span>管理者代表日期：________________</span>
            </div>
        </div>

        <!-- 打印按钮 -->
        <div class="print-actions">
            <el-button type="primary" @click="handlePrint">打印</el-button>
        </div>
    </div>
</template>

<script>
import { getData } from '@/api/data'
import HirInput from '@/components/hirInput'

export default {
    name: 'SaleOrderPrint',
    components: {
        HirInput
    },
    computed: {
        localPrintTemplate: {
            get() {
                try {
                    const savedTemplate = localStorage.getItem('printTemplate_saleOrder');
                    return savedTemplate ? JSON.parse(savedTemplate) : null;
                } catch (error) {
                    console.error('解析缓存模板失败:', error);
                    return null;
                }
            },
            set(value) {
                try {
                    localStorage.setItem('printTemplate_saleOrder', JSON.stringify(value));
                } catch (error) {
                    console.error('保存模板到缓存失败:', error);
                }
            }
        }
    },
    props: {
        saleOrderId: {
            type: String,
            required: true
        },
        orderData: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            extData: {},
            printData: {},
            printTemplate: null,
            htmlPrintData: {

            }
        }
    },
    created() {
        this.getExtData()

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
    methods: {
        handleTemplateChange(template) {
            if (!template) return;
            try {
                this.printTemplate = template;
                this.localPrintTemplate = template;
                this.$message.success('打印模板已保存到本地');
            } catch (error) {
                console.error('保存打印模板失败:', error);
                this.$message.error('保存打印模板失败');
            }
        },
        // 获取拓展数据
        async getExtData() {
            try {
                const result = await getData('k3_SAL_SaleOrderExt', {
                    query: { FSaleOrderId: this.saleOrderId }
                })
                if (result.code === 200 && result.data.length > 0) {
                    this.extData = result.data[0]
                }
            } catch (error) {
                console.error('获取拓展数据失败:', error)
                this.$message.error('获取拓展数据失败')
            }
        },

        // 格式化日期
        formatDate(date) {
            if (!date) return '-'
            return new Date(date).toLocaleDateString('zh-CN')
        },

        // 处理打印
        handlePrint() {
            // 组合打印数据
            this.printData = {
                materialName: this.orderData.FMaterialName || '-',
                materialModel: this.orderData.FMaterialModel || '-',
                custCode: this.orderData.FCustId_FNumber || '-',
                quantity: this.orderData.FQty || '0',
                customerPO: this.orderData.F_TFQJ_khpo || '-',
                deliveryDate: this.formatDate(this.orderData.FDate),
                certification: this.extData.FCertification || '-',
                productColor: this.extData.FProductColor || '-',
                voltageRatio: this.extData.FVoltageRatio || '-',
                minSpec: this.extData.FMinSpec || '-',
                minSpecImage: this.extData.FMinSpecImage,
                trademark: this.extData.FTrademark || '-',
                printPosition: this.extData.FPrintPosition || '-',
                printColor: this.extData.FPrintColor || '-',
                accessories: this.extData.FAccessories || '-',
                peBag: this.extData.FPEBagReq || '-',
                manual: this.extData.FManual || '-',
                selfSeal: this.extData.FSelfSeal || '-',
                colorLabel: this.extData.FColorLabel || '-',
                colorLabelImage: this.extData.FColorLabelImage,
                grids: this.extData.FGrids || '-',
                udi: this.extData.FUDI || '-',
                colorBox: this.extData.FColorBox || '-',
                serialRule: this.extData.FSerialRule || '-',
                shape: this.extData.FShape || '-',
                boxLabel: this.extData.FBoxLabel || '-',
                boxLabelImage: this.extData.FBoxLabelImage,
                boxLabelPackage: this.extData.FBoxLabelPackage || '-',
                otherReq: this.extData.FOtherReq || '-',
                approver: this.orderData.FApprover || '-',
                reviewer: this.orderData.FReviewer || '-',
                confirmer: this.orderData.FConfirmer || '-',
                bom: this.extData.FBOM || '-',
                otherTechConfirm: this.extData.FOtherTechConfirm || '-',
                regulationReq: this.extData.FRegulationReq || '-'
            }

            console.log(JSON.stringify(this.printData))

            // 使用浏览器打印功能
        }
    }
}
</script>

<style lang="scss" scoped>
.sale-order-print {
    padding: 20px;

    .print-area {
        background: white;
        padding: 20px;
        margin-bottom: 20px;
    }

    .print-table {
        width: 100%;
        border-collapse: collapse;

        td {
            padding: 8px;
            border: 1px solid #000;

            &:first-child {
                width: 120px;
                background-color: #f5f7fa;
                font-weight: bold;
            }
        }
    }

    .signature-line {
        margin-top: 20px;
        display: flex;
        justify-content: space-between;

        span {
            margin: 0 20px;
        }
    }

    .print-actions {
        text-align: center;
        margin-top: 20px;
    }

    .image-preview {
        margin-top: 10px;

        img {
            max-width: 200px;
            max-height: 200px;
            object-fit: contain;
        }
    }
}

@media print {
    .print-actions {
        display: none;
    }

    .image-preview img {
        max-width: 150px;
        max-height: 150px;
    }
}
</style>