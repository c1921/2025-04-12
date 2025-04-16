<template>
  <div class="sidebar">
    <div class="sidebar-title">节点类型</div>
    <div class="dndnode-list">
      <div 
        v-for="nodeType in nodeTypes" 
        :key="nodeType.type"
        class="dndnode" 
        :class="nodeType.class"
        draggable="true"
        @dragstart="onDragStart($event, nodeType)"
      >
        {{ nodeType.label }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { NodeType } from '../types/node';

export default defineComponent({
  name: 'NodeSidebar',
  emits: ['node-drag-start'],
  setup(_, { emit }) {
    // 侧边栏可拖拽节点类型定义
    const nodeTypes = [
      { type: NodeType.INPUT, label: '输入节点', class: 'input-node', inputs: 0, outputs: 1 },
      { type: NodeType.PROCESS, label: '处理节点', class: 'process-node', inputs: 1, outputs: 1 },
      { type: NodeType.TRANSFORM, label: '转换节点', class: 'transform-node', inputs: 1, outputs: 1 },
      { type: NodeType.FILTER, label: '过滤节点', class: 'filter-node', inputs: 1, outputs: 1 },
      { type: NodeType.OUTPUT, label: '输出节点', class: 'output-node', inputs: 1, outputs: 0 },
      { type: NodeType.CUSTOM, label: '自定义节点', class: 'custom-node', inputs: 1, outputs: 1 },
      { type: 'multi-port', label: '多端口节点', class: 'process-node', inputs: 2, outputs: 2 },
      { type: 'typed-port', label: '类型端口节点', class: 'custom-node', typedPorts: true }
    ];

    // 拖拽开始事件处理
    const onDragStart = (event: DragEvent, nodeType: any) => {
      if (event.dataTransfer) {
        event.dataTransfer.setData('application/vueflow', JSON.stringify(nodeType));
        event.dataTransfer.effectAllowed = 'move';
      }
      emit('node-drag-start', { event, nodeType });
    };

    return {
      nodeTypes,
      onDragStart
    };
  }
});
</script>

<style scoped>
/* ------------------------------------
 * 2. 侧边栏
 * ------------------------------------ */
.sidebar {
  width: 180px;
  height: 100%;
  background-color: var(--bg-light);
  border-right: 1px solid var(--border-color);
  padding: 10px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  color: var(--text-dark);
  text-align: center;
}

.dndnode-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dndnode {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  border: 1px solid var(--gray-dark);
  border-radius: 5px;
  padding: 5px 10px;
  cursor: move;
  transition: all 0.2s;
  font-size: 12px;
  font-weight: 500;
  box-shadow: var(--shadow-sm);
}

.dndnode:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

/* 节点类型样式 */
.dndnode.input-node {
  background-color: var(--primary-light);
  border-color: var(--primary-color);
}

.dndnode.process-node {
  background-color: var(--secondary-light);
  border-color: var(--secondary-color);
}

.dndnode.transform-node {
  background-color: var(--purple-light);
  border-color: var(--purple-color);
}

.dndnode.filter-node {
  background-color: var(--orange-light);
  border-color: var(--orange-color);
}

.dndnode.output-node {
  background-color: var(--red-light);
  border-color: var(--red-color);
}

.dndnode.custom-node {
  background-color: var(--gray-light);
  border-color: var(--gray-color);
}
</style> 