<template>
    <div title="物料工艺流程图" class="flow-chart-dialog" custom-class="material-flow-dialog">
        <div class="zoom-controls">
            <el-button-group>
                <el-button size="small" icon="el-icon-zoom-in" @click="zoomIn"></el-button>
                <el-button size="small" icon="el-icon-zoom-out" @click="zoomOut"></el-button>
                <el-button size="small" icon="el-icon-refresh" @click="resetZoom">重置</el-button>
            </el-button-group>
        </div>
        <div v-loading="loading" class="flow-container" @mousedown="startDrag" @mousemove="onDrag" @mouseup="stopDrag"
            @mouseleave="stopDrag">

            <div class="zoom-wrapper" :style="{
                transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                cursor: isDragging ? 'grabbing' : 'grab'
            }">
                <div v-if="!flowData || flowData.length === 0" class="empty-data">
                    暂无流程图数据
                </div>
                <template v-else>
                    <flow-node :node="flowData[0]" />
                </template>
            </div>
        </div>
    </div>
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
    data() {
        return {
            scale: 1,
            minScale: 0.5,
            maxScale: 2,
            scaleStep: 0.1,
            position: { x: 0, y: 0 },
            isDragging: false,
            dragStart: { x: 0, y: 0 },
            lastPosition: { x: 0, y: 0 }
        }
    },
    methods: {
        zoomIn() {
            if (this.scale < this.maxScale) {
                this.scale = Math.min(this.scale + this.scaleStep, this.maxScale);
            }
        },
        zoomOut() {
            if (this.scale > this.minScale) {
                this.scale = Math.max(this.scale - this.scaleStep, this.minScale);
            }
        },
        resetZoom() {
            this.scale = 1;
            this.position = { x: 0, y: 0 };
        },
        handleWheel(e) {
            if (e.ctrlKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                    this.zoomIn();
                } else {
                    this.zoomOut();
                }
            }
        },
        startDrag(e) {
            this.isDragging = true;
            this.dragStart = {
                x: e.clientX - this.position.x,
                y: e.clientY - this.position.y
            };
            this.lastPosition = { ...this.position };
        },
        onDrag(e) {
            if (!this.isDragging) return;
            e.preventDefault();

            this.position = {
                x: e.clientX - this.dragStart.x,
                y: e.clientY - this.dragStart.y
            };
        },
        stopDrag() {
            this.isDragging = false;
        }
    },
    mounted() {
        const container = this.$el.querySelector('.flow-container');
        container.addEventListener('wheel', this.handleWheel, { passive: false });
    },
    beforeDestroy() {
        const container = this.$el.querySelector('.flow-container');
        container.removeEventListener('wheel', this.handleWheel);
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
    position: relative;
    .flow-container {
        position: relative;
        overflow: auto;
        padding: 20px;
        height: calc(85vh - 100px);
        background: #f6f8fb;
        user-select: none;
    }

    .empty-data {
        text-align: center;
        padding: 20px;
        color: #409EFF;
        font-size: 14px;
    }

    .zoom-controls {
        position: absolute;
        top: 20px;
        right: 20px;
        z-index: 1;
    }

    .zoom-wrapper {
        transform-origin: center center;
        transition: transform 0.1s ease;
        min-height: 100%;
        padding: 20px;
        will-change: transform;
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