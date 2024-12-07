<template>
    <el-dialog title="物料工艺流程图" :visible.sync="dialogVisible" width="95%" class="flow-chart-dialog" :append-to-body="false"
        :modal-append-to-body="false" custom-class="material-flow-dialog">
        <div v-loading="loading" class="flow-container">
            <div v-if="!flowData || flowData.length === 0" class="empty-data">
                暂无流程图数据
            </div>
            <template v-else>
                <flow-node :node="flowData[0]" />
            </template>
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
    }
}
</script>

<style lang="scss">
/* 注意：这里移除了 scoped，因为需要覆盖 el-dialog 的默认样式 */
.material-flow-dialog {
    margin-top: 8vh !important; // 调整顶部距离
    height: 85vh; // 设置弹窗高度
    overflow: hidden;
    display: flex;
    flex-direction: column;
    // position: absolute !important;
    // left: 60% !important;
    // transform: translateX(-50%) !important;
    // width: calc(100% - 300px) !important; // 左右各留 200px 的间距
    // max-width: 1500px !important; // 设置最大宽度，避免在大屏上过宽

    .el-dialog__body {
        padding: 0;
        flex: 1;
        overflow: hidden;
    }

    .el-dialog__header {
        padding: 15px 20px;
        border-bottom: 1px solid #e4e7ed;
    }
}

.flow-chart-dialog {
    .flow-container {
        overflow-x: auto;
        overflow-y: auto;
        padding: 20px;
        height: calc(85vh - 100px); // 减去头部高度
        background: #f6f8fb;
    }

    .empty-data {
        text-align: center;
        padding: 20px;
        color: #409EFF;
        font-size: 14px;
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