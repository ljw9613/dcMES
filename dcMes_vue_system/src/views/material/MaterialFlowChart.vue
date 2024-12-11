<template>
    <el-dialog title="物料工艺流程图" :visible.sync="dialogVisible" width="90%" class="material-flow-dialog"
        :append-to-body="true" :modal-append-to-body="true" :close-on-click-modal="false" :destroy-on-close="true"
        @closed="handleDialogClosed">
        <div class="flow-chart-container">
            <div v-loading="loading" class="flow-container">
                <div v-if="!flowData || flowData.length === 0" class="empty-data">
                    暂无流程图数据
                </div>
                <template v-else>
                    <flow-node :node="flowData[0]" />
                </template>
            </div>
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
            text-align: center;
            padding: 20px;
            color: #409EFF;
            font-size: 14px;
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
</style>