<template>
    <div>
        <!-- 添加模板选择 -->
        <zr-select v-model="selectedTemplate" collection="printTemplate" :search-fields="['templateName']"
            label-key="templateName" sub-key="FCustId" :multiple="false" placeholder="请选择打印模板"
            @select="handleTemplateChange">
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
        <el-dialog title="打印预览" :visible.sync="dialogVisible" width="240mm" :before-close="handleClose">
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
        enableTemplateCache: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            dialogVisible: false,
            hiprintTemplate: null,
            selectedTemplate: null,
            templateData: null,
            isTemplateInitialized: false
        }
    },
    created() {
        // 添加初始化缓存模板的逻辑
        if (this.enableTemplateCache) {
            // 分别获取模板ID和模板数据
            const cachedTemplateId = localStorage.getItem('hirInputTemplateId')
            const cachedTemplateData = localStorage.getItem('hirInputTemplateData')
            
            if (cachedTemplateId && cachedTemplateData) {
                try {
                    this.selectedTemplate = cachedTemplateId
                    this.templateData = JSON.parse(cachedTemplateData)
                    // 初始化打印模板
                    const printTemplate = JSON.parse(this.templateData.content)
                    this.initTemplate(printTemplate)
                } catch (error) {
                    console.error('缓存模板解析失败:', error)
                    this.clearTemplateCache()
                }
            }
        }
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
        // 处理模板选择变化
        handleTemplateChange(val) {
            if (!val) {
                this.isTemplateInitialized = false;
                return;
            }
            
            try {
                let printTemplate = JSON.parse(val.content);
                // 缓存处理
                if (this.enableTemplateCache) {
                    localStorage.setItem('hirInputTemplateId', val._id);
                    localStorage.setItem('hirInputTemplateData', JSON.stringify(val));
                    this.templateData = val;
                }
                
                // 初始化模板
                this.initTemplate(printTemplate);
                this.isTemplateInitialized = true; // 标记模板已初始化
                this.selectedTemplate = val;
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
        // 新增清除缓存方法
        clearTemplateCache() {
            localStorage.removeItem('hirInputTemplateId')
            localStorage.removeItem('hirInputTemplateData')
            this.selectedTemplate = null
            this.templateData = null
        },
    },
    // 组件销毁时清理缓存（如果未启用缓存）
    beforeDestroy() {
        if (!this.enableTemplateCache) {
            this.clearTemplateCache()
        }
    }
}
</script>

<style scoped>
.dialog-footer {
    margin-top: 20px;
    text-align: right;
}
</style>
