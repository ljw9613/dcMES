<template>
    <div class="flow-level">
        <!-- 物料节点容器 -->
        <div class="node-container">
            <div class="material-node" 
                 :class="{ 
                     'root-node': !node.materialQuantity,
                     'completed': node.barcode || node.status === 'COMPLETED'
                 }">
                <div class="node-title">{{ node.materialName }}</div>
                <div v-if="node.craftName" class="node-subtitle">
                    工艺：{{ node.craftName }}
                </div>
                <div v-if="node.barcode" class="node-info">
                    条码：{{ node.barcode }}
                </div>
                <div v-if="node.materialCode" class="node-info">
                    编码：{{ node.materialCode }}
                </div>
                <div v-if="node.scanOperation" class="node-info">
                    扫码操作：{{ node.scanOperation ? '需要扫码' : '不需要扫码' }}
                </div>
                <div v-if="node.isComponent" class="node-info">
                    是否组件：{{ node.isComponent ? '是' : '否' }}
                </div>
                <div v-if="node.materialQuantity" class="node-info">
                    用量：{{ node.materialQuantity }}{{ node.unit || '个' }}
                </div>
            </div>
        </div>

        <template v-if="node.children && node.children.length">
            <div class="arrow-container">
                <div class="arrow-right"></div>
            </div>
            <div class="process-level">
                <div v-for="process in node.children" :key="process._id" class="process-container">
                    <div class="process-node">
                        <div class="node-title" :style="{ background: process.status === 'COMPLETED' ? '#67C23A' : '#ffa640' }">{{ process.processSort }}.{{ process.processName }}</div>
                        <div class="node-content">
                            <template v-if="process.children && process.children.length">
                                <div v-for="material in process.children" :key="material._id" class="sub-material">
                                    <flow-node :node="material" />
                                </div>
                            </template>
                            <div v-else class="no-materials">
                                暂无关联物料
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script>
export default {
    name: 'FlowNode',
    props: {
        node: {
            type: Object,
            required: true
        }
    }
}
</script>

<style lang="scss" scoped>
.flow-level {
    display: flex;
    align-items: flex-start;
}

.node-container {
    flex-shrink: 0;
}

.arrow-container {
    display: flex;
    align-items: flex-start;
    padding-top: 15px; // 调整箭头高度对齐节点顶部
    flex-shrink: 0;
}

.process-level {
    display: flex;
    flex-direction: column;
    gap: 30px;
}

.process-container {
    position: relative;
}

.sub-material {
    margin: 20px 0;
    display: flex;
    align-items: flex-start; // 改为顶部对齐
}

// 物料节点样式
.material-node {
    width: 200px;
    background: #ffffff;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    margin: 0 20px;
    position: relative;

    &.root-node {
        border: 2px solid #ffa640;
    }

    &.completed {
        border: 2px solid #67C23A;
        
        &::after {
            content: '✓';
            position: absolute;
            top: -10px;
            right: -10px;
            width: 20px;
            height: 20px;
            background: #67C23A;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
        }

        .node-title {
            background: #67C23A;
        }

        .node-subtitle,
        .node-info {
            color: #67C23A;
        }
    }
}

// 工序节点样式
.process-node {
    width: 250px;
    background: #ffffff;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

    .node-content {
        padding: 12px;
    }
}

// 通用节点样式
.node-title {
    font-size: 14px;
    font-weight: bold;
    color: #ffffff;
    padding: 8px 12px;
    border-radius: 4px 4px 0 0;
    background: #ffa640;
}

.node-subtitle {
    font-size: 12px;
    color: #ffa640;
    padding: 8px;
}

.node-info {
    font-size: 12px;
    color: #ffa640;
    padding: 8px;
    border-bottom: 1px solid #e1e8f5;
}

// 箭头样式
.arrow-right {
    position: relative;
    width: 40px;
    height: 2px;
    background: #ffa640;
    margin: 0 10px;

    &::after {
        content: '';
        position: absolute;
        right: 0;
        top: -4px;
        width: 8px;
        height: 8px;
        border-top: 2px solid #ffa640;
        border-right: 2px solid #ffa640;
        transform: rotate(45deg);
    }
}

.no-materials {
    text-align: center;
    padding: 10px;
    color: #ffa640;
    font-size: 12px;
}
</style>