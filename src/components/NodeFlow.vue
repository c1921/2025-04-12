<template>
  <div class="node-flow">
    <NodeSidebar @node-drag-start="onDragStart" />
    <div class="workflow-area">
      <FlowToolbar 
        :is-running="isRunning"
        @run-workflow="runWorkflow"
        @layout-change="handleLayoutChange" 
      />
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
        :is-valid-connection="isValidConnection"
        @connect="onConnect"
        @edge-update="onEdgeUpdate"
        @edge-update-start="onEdgeUpdateStart"
        @edge-update-end="onEdgeUpdateEnd"
        @drop="onDrop"
        @dragover="onDragOver"
        @connectStart="onConnectStart"
        @connectEnd="onConnectEnd"
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
        
        <!-- 验证提示 -->
        <Panel v-if="showValidationInfo" position="top-center" class="validation-panel">
          <div class="validation-info" :class="{ 'valid': isValidInfo, 'invalid': !isValidInfo }">
            {{ validationMessage }}
          </div>
        </Panel>
      </VueFlow>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { 
  VueFlow, 
  useVueFlow,
  updateEdge,
  Panel
} from '@vue-flow/core';
import type { 
  Connection, 
  Edge, 
  EdgeMouseEvent, 
  EdgeUpdateEvent,
  XYPosition
} from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { MiniMap } from '@vue-flow/minimap';
import { Controls } from '@vue-flow/controls';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/minimap/dist/style.css';
import '@vue-flow/controls/dist/style.css';
import { EdgeFactory } from '../factories/EdgeFactory';
import { WorkflowService } from '../services/WorkflowService';
import { useLayout, LayoutDirection } from '../services/LayoutService';
import { FlowInitializer } from '../services/FlowInitializer';
import UnifiedNode from './UnifiedNode.vue';
import NodeSidebar from './NodeSidebar.vue';
import FlowToolbar from './FlowToolbar.vue';

export default defineComponent({
  components: {
    VueFlow,
    Background,
    MiniMap,
    Controls,
    UnifiedNode,
    Panel,
    NodeSidebar,
    FlowToolbar
  },
  setup() {
    // 初始化节点和边，使用 FlowInitializer 
    const initialNodes = FlowInitializer.createInitialNodes();
    const initialEdges = FlowInitializer.createInitialEdges();

    // 使用vueFlow组合API
    const vueFlowInstance = useVueFlow();
    const { getEdges, getNodes, setEdges, addEdges, addNodes, project } = vueFlowInstance;
    
    // 使用改进的布局API
    const { layout } = useLayout();

    // 工作流执行状态
    const isRunning = ref(false);

    // 用于边更新暂存
    const edgeUpdateSuccessful = ref(true);
    const edgeUpdateElement = ref<Edge | null>(null);

    // 连接验证状态
    const showValidationInfo = ref(false);
    const isValidInfo = ref(false);
    const validationMessage = ref('');
    
    // 当前正在连接的端口信息
    const currentConnectionInfo = ref<{
      sourceNode?: any;
      sourceHandle?: string;
      sourcePort?: any;
    }>({});

    // 拖拽开始事件处理 - 从子组件接收事件
    const onDragStart = ({ nodeType }: { nodeType: any }) => {
      // 子组件已经设置了dataTransfer，这里不需要重复设置
      console.log('从NodeSidebar接收到拖拽事件:', nodeType);
    };

    // 拖拽悬停事件处理
    const onDragOver = (event: DragEvent) => {
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
    };

    // 放置事件处理
    const onDrop = (event: DragEvent) => {
      if (!event.dataTransfer) return;

      event.preventDefault();

      // 获取拖拽的节点类型
      const data = JSON.parse(event.dataTransfer.getData('application/vueflow'));
      
      // 获取放置位置相对于视口的坐标
      const reactFlowBounds = (event.target as Element).getBoundingClientRect();
      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      }) as XYPosition;

      // 使用 FlowInitializer 创建新节点
      const newNode = FlowInitializer.createNewNode(data, position, getNodes.value.length);

      // 添加节点到流程图
      addNodes([newNode]);
      console.log('新节点已创建:', newNode);
    };

    // 验证连接是否有效
    const isValidConnection = (connection: Connection): boolean => {
      // 没有源或目标，或者没有句柄标识符，不能验证
      if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) {
        return false;
      }
      
      // 查找源节点和目标节点
      const sourceNode = getNodes.value.find(node => node.id === connection.source);
      const targetNode = getNodes.value.find(node => node.id === connection.target);
      
      if (!sourceNode || !targetNode) {
        return false;
      }
      
      // 检查连接方向是否正确（只能从输出连接到输入）
      const isSourceOutput = connection.sourceHandle.includes('__') 
        ? connection.sourceHandle.startsWith(`${connection.source}__output_`)
        : true; // 默认端口默认为输出
      
      const isTargetInput = connection.targetHandle.includes('__')
        ? connection.targetHandle.startsWith(`${connection.target}__input_`)
        : true; // 默认端口默认为输入
      
      if (!isSourceOutput || !isTargetInput) {
        validationMessage.value = '❌ 连接失败：只能从输出端口连接到输入端口';
        isValidInfo.value = false;
        showValidationInfo.value = true;
        
        // 3秒后隐藏错误消息
        setTimeout(() => {
          showValidationInfo.value = false;
        }, 3000);
        
        return false;
      }
      
      // 提取端口ID
      const sourceHandleId = connection.sourceHandle.split('__')[1];
      const targetHandleId = connection.targetHandle.split('__')[1];
      
      if (!sourceHandleId || !targetHandleId) {
        return true; // 如果不是自定义端口，允许连接
      }
      
      // 查找源端口和目标端口
      const sourceOutputs = sourceNode.data?.ports?.outputs || [];
      const targetInputs = targetNode.data?.ports?.inputs || [];
      
      const sourcePort = sourceOutputs.find((port: any) => port.id === sourceHandleId);
      const targetPort = targetInputs.find((port: any) => port.id === targetHandleId);
      
      // 如果端口没有类型定义，允许连接
      if (!sourcePort?.type || !targetPort?.type) {
        return true;
      }
      
      // 检查端口类型是否匹配
      const isTypeMatch = sourcePort.type === targetPort.type;
      
      // 只在类型不匹配时显示错误消息
      if (!isTypeMatch) {
        validationMessage.value = `❌ 连接失败：${sourcePort.type}型输出 ≠ ${targetPort.type}型输入（需类型相同）`;
        isValidInfo.value = false;
        showValidationInfo.value = true;
        
        // 3秒后隐藏错误消息
        setTimeout(() => {
          showValidationInfo.value = false;
        }, 3000);
      }
      
      return isTypeMatch;
    };
    
    // 开始连接事件
    const onConnectStart = () => {
      // 清除之前的验证信息
      showValidationInfo.value = false;
      validationMessage.value = '';
      isValidInfo.value = false;
    };
    
    // 结束连接事件
    const onConnectEnd = () => {
      // 清除连接信息
      currentConnectionInfo.value = {};
    };

    // 连接节点事件处理
    const onConnect = (connection: Connection) => {
      // 验证连接是否有效
      if (!isValidConnection(connection)) {
        console.log('连接被拒绝：类型不匹配');
        return;
      }
      
      // 获取源节点
      const sourceNode = getNodes.value.find(node => node.id === connection.source);
      
      // 创建一个新的边
      const newEdge = EdgeFactory.createDataFlowEdge(
        connection.source, 
        connection.target, 
        `edge-${Date.now()}`,
        sourceNode,
        connection.sourceHandle || undefined
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
      
      // 验证连接是否有效
      if (!isValidConnection(newConnection)) {
        console.log('更新被拒绝：类型不匹配');
        edgeUpdateSuccessful.value = false;
        return;
      }
      
      console.log('更新边:', oldEdge, '->', newConnection);
      edgeUpdateSuccessful.value = true;
      
      // 获取源节点
      const sourceNode = getNodes.value.find(node => node.id === newConnection.source);
      
      // 创建一个新的边
      const newEdge = {
        ...oldEdge,
        source: newConnection.source,
        target: newConnection.target,
        sourceHandle: newConnection.sourceHandle,
        targetHandle: newConnection.targetHandle,
        style: {
          ...(oldEdge.style || {}),
          stroke: sourceNode && newConnection.sourceHandle 
            ? EdgeFactory.createDataFlowEdge(
                newConnection.source,
                newConnection.target,
                undefined,
                sourceNode,
                newConnection.sourceHandle || undefined
              ).style?.stroke
            : (oldEdge.style as any)?.stroke
        }
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

    // 布局处理 - 从子组件接收事件
    const handleLayoutChange = (direction: LayoutDirection) => {
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
      handleLayoutChange,
      onConnect,
      onEdgeUpdate,
      onEdgeUpdateStart,
      onEdgeUpdateEnd,
      onDragStart,
      onDragOver,
      onDrop,
      isValidConnection,
      onConnectStart,
      onConnectEnd,
      showValidationInfo,
      isValidInfo,
      validationMessage
    };
  }
});
</script>

<style>
/* 全局节点样式 */
:root {
  --primary-color: #3498db;
  --primary-light: #e3f2fd;
  --primary-dark: #2980b9;
  
  --secondary-color: #2ecc71;
  --secondary-light: #e8f5e9;
  --secondary-dark: #27ae60;
  
  --purple-color: #9b59b6;
  --purple-light: #f3e5f5;
  --purple-dark: #8e44ad;
  
  --orange-color: #e65100;
  --orange-light: #fff3e0;
  
  --red-color: #d32f2f;
  --red-light: #ffebee;
  
  --gray-color: #546e7a;
  --gray-light: #f5f5f5;
  --gray-dark: #1a192b;
  
  --border-color: #ddd;
  --bg-light: #f8f8f8;
  --text-dark: #333;
  
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12);
  --shadow-md: 0 4px 15px rgba(0, 0, 0, 0.2);
  --shadow-hover: 0 3px 5px rgba(0, 0, 0, 0.2);
  
  --success-color: #4caf50;
  --success-dark: #2e7d32;
  --warning-color: #ff9800;
  --error-color: #f44336;
  --error-dark: #c62828;
}

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
/* ------------------------------------
 * 1. 基础布局
 * ------------------------------------ */
.node-flow {
  width: 100%;
  height: 100%;
  display: flex;
}

.workflow-area {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.vue-flow-wrapper {
  flex: 1;
  width: 100%;
}

/* ------------------------------------
 * 4. 节点样式
 * ------------------------------------ */
:deep(.vue-flow__node) {
  width: auto;
  display: flex;
  justify-content: center;
  align-items: center;
}

:deep(.vue-flow__node.running) {
  box-shadow: 0 0 10px var(--warning-color);
}

:deep(.vue-flow__node.completed) {
  box-shadow: 0 0 10px var(--success-color);
}

/* ------------------------------------
 * 5. 验证提示
 * ------------------------------------ */
.validation-panel {
  padding: 10px;
  display: flex;
  justify-content: center;
  pointer-events: none;
  position: absolute;
  z-index: 10000; /* 确保在最上层显示 */
  top: 0;
  left: 0;
  right: 0;
}

.validation-info {
  padding: 10px 20px;
  border-radius: 4px;
  background-color: var(--bg-light);
  font-size: 14px;
  font-weight: 500;
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
  margin-top: 15px;
  animation: fadeInDown 0.3s ease-out;
  min-width: 300px;
  text-align: center;
}

.validation-info.valid {
  background-color: var(--secondary-light);
  color: var(--success-dark);
  border-left: 4px solid var(--success-color);
}

.validation-info.invalid {
  background-color: var(--red-light);
  color: var(--error-dark);
  border-left: 4px solid var(--error-color);
}

/* ------------------------------------
 * 6. 动画
 * ------------------------------------ */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 