<template>
    <div>
        <!-- 修改模板选择器,增加查询参数 -->
        <zr-select v-model="selectedTemplate" collection="printTemplate" :search-fields="['templateName']"
            :query-params="templateQueryParams" label-key="templateName" sub-key="FCustId" :multiple="false"
            :placeholder="placeholder" @select="handleTemplateChange">
            <template #option="{ item }">
                <div class="item-option">
                    <div class="item-info">
                        <span class="name">{{ item.templateName }}</span>
                        <el-tag size="mini" type="info">{{ item.templateCode }}</el-tag>
                    </div>
                    <div class="sub-info">
                        <small>{{ item.businessType }}</small>
                    </div>
                </div>
            </template>
        </zr-select>
        <el-button v-if="showPreview" type="primary" @click="handlePreview">模板预览</el-button>
        <el-button v-if="showBrowserPrint" type="primary" @click="handlePrints">浏览器打印</el-button>
        <el-button v-if="showSilentPrint" type="primary" @click="handlePrints2">静默打印</el-button>
        <!-- 添加弹窗包裹 -->
        <el-dialog title="打印预览" append-to-body :visible.sync="dialogVisible" width="240mm" :before-close="handleClose">
            <div>
                <div>
                    <div id="hiprint-printTemplate"></div>
                </div>
                <div class="dialog-footer">
                    <el-button @click="handleClose">取 消</el-button>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script>
// 这里和 vue-plugin-hiprint 使用方式一样。
import { autoConnect, disAutoConnect, hiprint, defaultElementTypeProvider } from "@sv-print/hiprint";


export default {
    name: 'HirInput',
    props: {
        // 添加控制弹窗显示的属性
        visible: {
            type: Boolean,
            default: false
        },
        printData: {
            type: Object,
            default: () => ({})
        },
        showPreview: {
            type: Boolean,
            default: true
        },
        showBrowserPrint: {
            type: Boolean,
            default: true
        },
        showSilentPrint: {
            type: Boolean,
            default: true
        },
        // 修改 defaultTemplate 的类型定义
        defaultTemplate: {
            type: Object,
            default: null
        },
        // 新增模板查询参数
        templateParams: {
            type: Object,
            default: () => ({})
        },
        // 新增placeholder自定义
        placeholder: {
            type: String,
            default: '请选择打印模板'
        },
        printDataList: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            dialogVisible: false,
            hiprintTemplate: null,
            selectedTemplate: null,
            templateData: null,
            isTemplateInitialized: false,
            // 新增模板查询参数
            templateQueryParams: {
                query: {}
            }
        }
    },
    watch: {
        // 优化 defaultTemplate 的监听
        defaultTemplate: {
            immediate: true,
            handler(template) {
                if (template && typeof template === 'object') {
                    this.selectedTemplate = template._id;
                    this.handleTemplateChange(template);
                }
            }
        },
        // 监听模板查询参数变化
        templateParams: {
            immediate: true,
            deep: true,
            handler(newParams) {
                if (newParams && Object.keys(newParams).length > 0) {
                    console.log("newParams", newParams);
                    // 构建查询条件
                    this.templateQueryParams = {
                        query: {
                          ...newParams
                        }
                    };
                } else {
                    this.templateQueryParams = { query: {} };
                }
            }
        }
    },
    created() {
        // 切换 直接 "打印客户端" 主机
        hiprint.hiwebSocket.setHost(process.env.VUE_APP_HIPRINT_WS_ADDRESS);
        // 查看是否 已连接 "直接打印客户端"
        hiprint.hiwebSocket.opened; // true 或 false
        // 刷新获取 打印机列表 !! 需要已连接 "直接打印客户端"
        hiprint.refreshPrinterList((list) => {
            console.log("打印机列表", list);
        });
    },
    methods: {
        // 添加关闭弹窗方法
        handleClose() {
            this.dialogVisible = false;
        },
        initTemplate(template) {
            // 初始化 provider , 才能让 "可拖拽元素" 可正常拖拽 【因为要先去处理 provider 中的 "tid"】
            hiprint.init({
                providers: [new defaultElementTypeProvider()],
            });
            // 渲染 "可拖拽元素" 方式2, 指定 "可拖拽元素" 容器
            $(".hiprintEpContainer2").empty(); // // 有时可能是第二次进入此页面, 所以需要先清空 "可拖拽元素" 容器
            // hiprintEpContainer2 => "可拖拽元素" 容器
            // defaultModule => provider 对应的 ElementTypes --> context.addPrintElementTypes("defaultModule",[])
            // 有时如果你发现你页面出现重复的 "可拖拽元素" 元素, 那么你需要 先移除"旧"的 ElementTypes --> context.removePrintElementTypes("defaultModule");
            hiprint.PrintElementTypeManager.build(".hiprintEpContainer2", "defaultModule");
            // 有时可能是第二次进入此页面, 所以需要先清空 "拖拽设计器" 容器
            $("#hiprint-printTemplate").empty();
            // 创建模板对象
            this.hiprintTemplate = new hiprint.PrintTemplate({
                // "初始模板 json"
                template: template,
                // "元素参数设置" 容器
                settingContainer: "#PrintElementOptionSetting",
                // "多面板" 容器
                // 实现多面板， 需要在页面添加一个 <div class="hiprint-printPagination"/>
                // 不添加, 可不用下方代码, 如果没有对应 容器 写了也没用
                paginationContainer: ".hiprint-printPagination",
            });


        },
        handlePreview() {
            this.dialogVisible = true;
            this.$nextTick(() => {
                // 将模板渲染到 "拖拽设计器" 容器 中
                this.hiprintTemplate.design("#hiprint-printTemplate");
            })
        },
        // 优化模板变更处理方法
        handleTemplateChange(template) {
            if (!template || !template.content) {
                this.isTemplateInitialized = false;
                return;
            }

            try {
                const printTemplate = JSON.parse(template.content);
                this.templateData = template;

                // 初始化模板
                this.initTemplate(printTemplate);
                this.isTemplateInitialized = true;
                this.selectedTemplate = template._id;

                // 触发选择改变事件，传递完整模板对象
                this.$emit('template-change', template);
            } catch (error) {
                console.error('模板初始化失败:', error);
                this.$message.error('模板初始化失败');
                this.isTemplateInitialized = false;
            }
        },

        // 修改打印方法
        handlePrints() {
            if (!this.isTemplateInitialized || !this.hiprintTemplate) {
                this.$message.warning('请先选择打印模板');
                return;
            }

            try {
                hiprint.print({
                    templates: [
                        { template: this.hiprintTemplate, data: this.printData },
                    ],
                });
            } catch (error) {
                console.error('打印失败:', error);
                this.$message.error('打印失败');
            }
        },

        // 修改静默打印方法
        handlePrints2() {
            if (!this.isTemplateInitialized || !this.hiprintTemplate) {
                this.$message.warning('请先选择打印模板');
                return;
            }

            try {
                hiprint.print2({
                    templates: [
                        { template: this.hiprintTemplate, data: this.printData },
                    ],
                });
            } catch (error) {
                console.error('静默打印失败:', error);
                this.$message.error('静默打印失败');
            }
        },

        // 添加批量打印方法
        handleBatchPrint() {
            if (!this.isTemplateInitialized || !this.hiprintTemplate) {
                this.$message.warning('请先选择打印模板');
                return;
            }

            try {
                if (!Array.isArray(this.printDataList) || this.printDataList.length === 0) {
                    this.$message.warning('打印数据列表为空');
                    return;
                }

                hiprint.print({
                    templates: this.printDataList.map(data => ({
                        template: this.hiprintTemplate,
                        data: data
                    }))
                });
            } catch (error) {
                console.error('批量打印失败:', error);
                this.$message.error('批量打印失败');
            }
        },

        // 添加批量静默打印方法
        handleBatchSilentPrint() {
            if (!this.isTemplateInitialized || !this.hiprintTemplate) {
                this.$message.warning('请先选择打印模板');
                return;
            }

            try {
                if (!Array.isArray(this.printDataList) || this.printDataList.length === 0) {
                    this.$message.warning('打印数据列表为空');
                    return;
                }

                hiprint.print2({
                    templates: this.printDataList.map(data => ({
                        template: this.hiprintTemplate,
                        data: data
                    }))
                });
            } catch (error) {
                console.error('批量静默打印失败:', error);
                this.$message.error('批量静默打印失败');
            }
        }
    },
}
</script>

<style scoped>
.dialog-footer {
    margin-top: 20px;
    text-align: right;
}
</style>
