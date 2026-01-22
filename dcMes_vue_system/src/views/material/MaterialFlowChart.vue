<template>
    <el-dialog title="物料工艺流程图" :visible.sync="dialogVisible" width="90%" class="material-flow-dialog"
        :append-to-body="true" :modal-append-to-body="true" :close-on-click-modal="false" :destroy-on-close="true"
        @closed="handleDialogClosed">
        <div class="flow-chart-container">
            <div v-loading="loading" class="flow-container">
                <div v-if="!flowData || flowData.length === 0" class="empty-data">
                    <el-empty description="暂无流程图数据" :image-size="100">
                        <template #description>
                            <p>该物料暂无完整流程图数据</p>
                        </template>
                    </el-empty>
                </div>
                <template v-else>
                    <!-- 调试信息 -->
                    <div class="debug-info" v-if="showDebugInfo">
                        <pre>{{ JSON.stringify(flowData, null, 2) }}</pre>
                    </div>
                    <!-- 流程图节点 -->
                    <flow-node :node="flowData[0]" />
                </template>
            </div>
        </div>

        <!-- 调试工具栏 -->
        <div slot="footer" class="dialog-footer">
            <el-button @click="toggleDebug" size="small" type="info">
                {{ showDebugInfo ? '隐藏调试信息' : '显示调试信息' }}
            </el-button>
            <el-button @click="dialogVisible = false">关闭</el-button>
        </div>
    </el-dialog>
</template>


<script>
import FlowNode from './FlowNode.vue'

export default {
    name: 'MaterialFlowChart',
    components: {
        FlowNode
    },
    props: {
        visible: {
            type: Boolean,
            default: false
        },
        loading: {
            type: Boolean,
            default: false
        },
        flowData: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            showDebugInfo: false,
            internalFlowData: null
        }
    },
    watch: {
        flowData: {
            handler(newVal) {
                console.log('FlowChart组件接收到数据:', newVal);
                this.internalFlowData = newVal;
            },
            immediate: true,
            deep: true
        },
        visible(val) {
            if (val) {
                // 当对话框显示时，确保数据已正确加载
                console.log('流程图对话框打开，数据状态:', this.flowData);
                this.$nextTick(() => {
                    // 强制重新渲染视图
                    this.$forceUpdate();
                });
            }
        }
    },
    computed: {
        dialogVisible: {
            get() {
                return this.visible;
            },
            set(val) {
                this.$emit('update:visible', val);
            }
        }
    },
    methods: {
        handleDialogClosed() {
            this.$emit('update:visible', false);
        },
        toggleDebug() {
            this.showDebugInfo = !this.showDebugInfo;
        }
    }
}
</script>

<style lang="scss" scoped>
.material-flow-dialog {
    ::v-deep .el-dialog {
        margin-top: 5vh !important;
        display: flex;
        flex-direction: column;

        .el-dialog__body {
            padding: 10px;
            height: calc(90vh - 120px);
            overflow: hidden;
        }

        .el-dialog__header {
            padding: 15px 20px;
            border-bottom: 1px solid #e4e7ed;
        }
    }

    .flow-chart-container {
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: auto;
        width: 100%;
        height: 100%;

        .flow-container {
            width: 100%;
            height: 70vh;
            overflow: auto;
            padding: 20px;
            background: #f6f8fb;

            // Webkit浏览器 (Chrome, Safari等)
            &::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }

            &::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 4px;
            }

            &::-webkit-scrollbar-thumb {
                background: #409EFF;
                border-radius: 4px;
            }

            &::-webkit-scrollbar-thumb:hover {
                background: #337ecc;
            }

            // Firefox
            scrollbar-width: thin;
            scrollbar-color: #409EFF #f1f1f1;

            // IE
            -ms-overflow-style: -ms-autohiding-scrollbar;

            // 通用滚动条属性
            overflow: auto;

            // 平滑滚动效果
            scroll-behavior: smooth;

            // 触摸设备的滚动
            -webkit-overflow-scrolling: touch;
        }

        // 可选：如果要隐藏IE下的滚动条
        @media screen and (-ms-high-contrast: active), (-ms-high-contrast: none) {
            .flow-container {
                -ms-overflow-style: none;
            }
        }

        .empty-data {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
            text-align: center;
            color: #909399;
        }
    }
}

// 滚动条样式
.flow-container::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

.flow-container::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
}

.flow-container::-webkit-scrollbar-thumb {
    background: #409EFF;
    border-radius: 4px;
}

.flow-container::-webkit-scrollbar-thumb:hover {
    background: #337ecc;
}

// 调试信息样式
.debug-info {
    margin-bottom: 20px;
    padding: 10px;
    background: #f8f8f8;
    border: 1px dashed #dcdfe6;
    border-radius: 4px;
    max-height: 300px;
    overflow: auto;

    pre {
        margin: 0;
        white-space: pre-wrap;
        font-family: Consolas, Monaco, 'Andale Mono', monospace;
        font-size: 12px;
        color: #333;
    }
}
</style>
