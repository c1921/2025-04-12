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
      :connect-on-click="true"
      :snap-to-grid="true"
      :snap-grid="[20, 20]"
      :editable="true"
      :deletable="true"
      @connect="onConnect"
      @edge-update="onEdgeUpdate"
      @edge-update-start="onEdgeUpdateStart"
      @edge-update-end="onEdgeUpdateEnd"
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
import { 
  VueFlow, 
  useVueFlow,
  updateEdge 
} from '@vue-flow/core';
import type { 
  Connection, 
  Edge, 
  EdgeMouseEvent, 
  EdgeUpdateEvent
} from '@vue-flow/core';
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
    const multiPortId = 'multi-port-1';

    const initialNodes = [
      NodeFactory.createNode(NodeType.INPUT, '输入节点 1', { x: 0, y: 0 }, undefined, input1Id),
      NodeFactory.createNode(NodeType.PROCESS, '处理节点 1', { x: 250, y: 0 }, undefined, process1Id),
      NodeFactory.createNode(NodeType.TRANSFORM, '转换节点 1', { x: 500, y: 0 }, undefined, transform1Id),
      NodeFactory.createNode(NodeType.OUTPUT, '输出节点 1', { x: 750, y: 0 }, undefined, output1Id),
      
      // 多端口节点示例
      NodeFactory.createMultiPortNode(
        NodeType.PROCESS, 
        '多端口节点', 
        { x: 250, y: 200 }, 
        3,  // 3个输入端口
        2,  // 2个输出端口
        { duration: 4000 },  // 其他数据
        multiPortId
      )
    ];

    // 创建初始连接线
    const initialEdges = [
      EdgeFactory.createDataFlowEdge(input1Id, process1Id, 'edge-1'),
      EdgeFactory.createDataFlowEdge(process1Id, transform1Id, 'edge-2'),
      EdgeFactory.createDataFlowEdge(transform1Id, output1Id, 'edge-3'),
      
      // 多端口节点的连接线
      EdgeFactory.createDataFlowEdge(input1Id, `${multiPortId}__input_1`, 'edge-4'),
      EdgeFactory.createDataFlowEdge(process1Id, `${multiPortId}__input_2`, 'edge-5'),
      EdgeFactory.createDataFlowEdge(`${multiPortId}__output_1`, output1Id, 'edge-6')
    ];

    // 使用vueFlow组合API
    const vueFlowInstance = useVueFlow();
    const { getEdges, getNodes, setEdges, addEdges } = vueFlowInstance;
    
    // 使用改进的布局API
    const { layout } = useLayout();

    // 工作流执行状态
    const isRunning = ref(false);

    // 用于边更新暂存
    const edgeUpdateSuccessful = ref(true);
    const edgeUpdateElement = ref<Edge | null>(null);

    // 连接节点事件处理
    const onConnect = (connection: Connection) => {
      // 创建一个新的边
      const newEdge = EdgeFactory.createDataFlowEdge(
        connection.source, 
        connection.target, 
        `edge-${Date.now()}`
      );
      
      // 保留连接的sourceHandle和targetHandle (多端口节点)
      if (connection.sourceHandle) {
        newEdge.sourceHandle = connection.sourceHandle;
      }
      if (connection.targetHandle) {
        newEdge.targetHandle = connection.targetHandle;
      }
      
      // 添加新边
      addEdges([newEdge]);
      console.log('新连接已创建:', newEdge);
    };

    // 更新边开始
    const onEdgeUpdateStart = (event: EdgeMouseEvent) => {
      console.log('开始更新边:', event.edge);
      edgeUpdateElement.value = event.edge;
      edgeUpdateSuccessful.value = true;
    };

    // 更新边
    const onEdgeUpdate = (updateEvent: EdgeUpdateEvent) => {
      const { edge: oldEdge, connection: newConnection } = updateEvent;
      console.log('更新边:', oldEdge, '->', newConnection);
      edgeUpdateSuccessful.value = true;
      
      // 创建一个新的边
      const newEdge = {
        ...oldEdge,
        source: newConnection.source,
        target: newConnection.target,
        sourceHandle: newConnection.sourceHandle,
        targetHandle: newConnection.targetHandle
      };
      
      // 使用类型断言解决类型问题
      setEdges((es) => updateEdge(oldEdge, newEdge, es) as any);
    };

    // 更新边结束
    const onEdgeUpdateEnd = (_: EdgeMouseEvent) => {
      console.log('完成边更新, 成功状态:', edgeUpdateSuccessful.value);
      
      if (!edgeUpdateSuccessful.value && edgeUpdateElement.value) {
        // 如果更新不成功，则删除这条边
        setEdges((es) => es.filter(e => e.id !== (edgeUpdateElement.value as Edge).id));
      }
      
      edgeUpdateElement.value = null;
    };

    // 运行工作流
    const runWorkflow = async () => {
      if (isRunning.value) return;
      isRunning.value = true;
      
      try {
        console.log('开始执行工作流');
        console.log('当前节点:', getNodes.value);
        console.log('当前边:', getEdges.value);
        
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
      onConnect,
      onEdgeUpdate,
      onEdgeUpdateStart,
      onEdgeUpdateEnd
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