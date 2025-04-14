<template>
  <div class="node-flow">
    <div class="toolbar">
      <button @click="runWorkflow" :disabled="isRunning">{{ isRunning ? '正在运行...' : '运行工作流' }}</button>
      <div class="layout-buttons">
        <button @click="handleLayoutClick(LayoutDirection.VERTICAL)" class="layout-btn">纵向布局</button>
        <button @click="handleLayoutClick(LayoutDirection.HORIZONTAL)" class="layout-btn horizontal">横向布局</button>
      </div>
    </div>
    <VueFlow 
      :nodes="initialNodes" 
      :edges="initialEdges" 
      :default-zoom="1.5" 
      :min-zoom="0.2" 
      :max-zoom="4"
      class="vue-flow-wrapper"
    >
      <template #node-custom="nodeProps">
        <UnifiedNode v-bind="nodeProps" />
      </template>
      <template #node-process="nodeProps">
        <UnifiedNode v-bind="nodeProps" />
      </template>
      <template #node-transform="nodeProps">
        <UnifiedNode v-bind="nodeProps" />
      </template>
      <template #node-filter="nodeProps">
        <UnifiedNode v-bind="nodeProps" />
      </template>
      <template #node-input="nodeProps">
        <UnifiedNode v-bind="nodeProps" />
      </template>
      <template #node-output="nodeProps">
        <UnifiedNode v-bind="nodeProps" />
      </template>
      
      <Background :pattern-color="'#aaa'" :gap="8" />
      <MiniMap />
      <Controls />
    </VueFlow>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { VueFlow, useVueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { MiniMap } from '@vue-flow/minimap';
import { Controls } from '@vue-flow/controls';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/minimap/dist/style.css';
import '@vue-flow/controls/dist/style.css';
import { NodeType } from '../types/node';
import { NodeFactory } from '../factories/NodeFactory';
import { EdgeFactory } from '../factories/EdgeFactory';
import { WorkflowService } from '../services/WorkflowService';
import { useLayout, LayoutDirection } from '../services/LayoutService';
import UnifiedNode from './UnifiedNode.vue';

export default defineComponent({
  components: {
    VueFlow,
    Background,
    MiniMap,
    Controls,
    UnifiedNode
  },
  setup() {
    // 创建初始节点和边
    const input1Id = 'input-1';
    const process1Id = 'process-1';
    const transform1Id = 'transform-1';
    const output1Id = 'output-1';

    const initialNodes = [
      NodeFactory.createNode(NodeType.INPUT, '输入节点 1', { x: 0, y: 0 }, undefined, input1Id),
      NodeFactory.createNode(NodeType.PROCESS, '处理节点 1', { x: 250, y: 0 }, undefined, process1Id),
      NodeFactory.createNode(NodeType.TRANSFORM, '转换节点 1', { x: 500, y: 0 }, undefined, transform1Id),
      NodeFactory.createNode(NodeType.OUTPUT, '输出节点 1', { x: 750, y: 0 }, undefined, output1Id)
    ];

    // 创建初始连接线
    const initialEdges = [
      EdgeFactory.createDataFlowEdge(input1Id, process1Id, 'edge-1'),
      EdgeFactory.createDataFlowEdge(process1Id, transform1Id, 'edge-2'),
      EdgeFactory.createDataFlowEdge(transform1Id, output1Id, 'edge-3')
    ];

    // 使用vueFlow组合API
    const vueFlowInstance = useVueFlow();
    
    // 使用改进的布局API
    const { layout } = useLayout();

    // 工作流执行状态
    const isRunning = ref(false);

    // 运行工作流
    const runWorkflow = async () => {
      if (isRunning.value) return;
      isRunning.value = true;
      
      try {
        console.log('开始执行工作流');
        console.log('当前节点:', vueFlowInstance.getNodes.value);
        console.log('当前边:', vueFlowInstance.getEdges.value);
        
        // 通过服务类执行工作流
        const workflowService = new WorkflowService(vueFlowInstance);
        console.log('工作流执行前...');
        await workflowService.runWorkflow();
        console.log('工作流执行后...');
        
        console.log('工作流执行完成');
      } catch (error) {
        console.error('工作流执行失败:', error);
      } finally {
        isRunning.value = false;
      }
    };

    // 布局处理
    const handleLayoutClick = (direction: LayoutDirection) => {
      layout(direction, { 
        padding: 0.2,
        nodesep: 100,
        ranksep: 120
      });
    };

    onMounted(() => {
      console.log('NodeFlow 组件已挂载');
      console.log('初始节点:', initialNodes);
      console.log('初始边:', initialEdges);
      
      // 自动应用布局，带有事件回调
      setTimeout(() => {
        layout(LayoutDirection.VERTICAL, {
          padding: 0.2,
          onLayoutStart: () => console.log('布局开始...'),
          onLayoutEnd: () => console.log('布局完成!')
        });
      }, 100);
    });

    return {
      initialNodes,
      initialEdges,
      runWorkflow,
      isRunning,
      LayoutDirection,
      handleLayoutClick,
    };
  }
});
</script>

<style>
/* 全局样式 - 解决节点尺寸问题 */
.vue-flow__node {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  width: 180px !important; 
}

.vue-flow__node > div {
  width: 100% !important;
}
</style>

<style scoped>
.node-flow {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.toolbar {
  padding: 10px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: center;
  gap: 10px;
}

.layout-buttons {
  display: flex;
  gap: 8px;
}

.toolbar button {
  padding: 8px 16px;
  background-color: var(--primary-color, #3498db);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.toolbar button.layout-btn {
  background-color: var(--secondary-color, #2ecc71);
}

.toolbar button.layout-btn.horizontal {
  background-color: #9b59b6;
}

.toolbar button.layout-btn:hover {
  background-color: #27ae60;
}

.toolbar button.layout-btn.horizontal:hover {
  background-color: #8e44ad;
}

.toolbar button:hover {
  background-color: #2980b9;
}

.toolbar button:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.vue-flow-wrapper {
  flex: 1;
  width: 100%;
}

:deep(.vue-flow__node) {
  width: auto;
  display: flex;
  justify-content: center;
  align-items: center;
}

:deep(.vue-flow__node.running) {
  box-shadow: 0 0 10px #ff9800;
}

:deep(.vue-flow__node.completed) {
  box-shadow: 0 0 10px #4caf50;
}
</style> 