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
        
        <!-- 使用独立的验证面板组件 -->
        <ValidationPanel 
          :show="showValidationInfo" 
          :is-valid="isValidInfo" 
          :message="validationMessage" 
        />
      </VueFlow>
    </div>
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
import { ConnectionValidator } from '../services/ConnectionValidator';

// 导入组件
import UnifiedNode from './UnifiedNode.vue';
import NodeSidebar from './NodeSidebar.vue';
import FlowToolbar from './FlowToolbar.vue';
import ValidationPanel from './ValidationPanel.vue';

// 导入样式
import '../assets/styles/variables.css';
import '../assets/styles/flow-node.css';

export default defineComponent({
  components: {
    VueFlow,
    Background,
    MiniMap,
    Controls,
    UnifiedNode,
    NodeSidebar,
    FlowToolbar,
    ValidationPanel
  },
  setup() {
    // 初始化节点和边，使用 FlowInitializer 
    const initialNodes = FlowInitializer.createInitialNodes();
    const initialEdges = FlowInitializer.createInitialEdges();

    // 使用vueFlow组合API
    const vueFlowInstance = useVueFlow();
    const { getEdges, getNodes, setEdges, addEdges, addNodes, project } = vueFlowInstance;
    
    // 使用改进的布局API
    const { layout, getCurrentDirection } = useLayout();
    
    // 当前布局方向
    const currentDirection = ref(LayoutDirection.VERTICAL);
    
    // 创建连接验证器实例
    const connectionValidator = new ConnectionValidator();

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
    
    // 显示验证消息回调
    const showValidationMessage = (message: string, isValid: boolean) => {
      validationMessage.value = message;
      isValidInfo.value = isValid;
      showValidationInfo.value = true;
    };
    
    // 隐藏验证消息回调
    const hideValidationMessage = () => {
      showValidationInfo.value = false;
    };

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

      // 获取当前布局方向并添加到数据中
      const direction = getCurrentDirection();
      const isHorizontal = direction === LayoutDirection.HORIZONTAL;
      
      // 使用 FlowInitializer 创建新节点，并传入当前布局方向
      const newNode = FlowInitializer.createNewNodeWithDirection(
        data, 
        position, 
        getNodes.value.length,
        isHorizontal
      );

      // 添加节点到流程图
      addNodes([newNode]);
      console.log('新节点已创建:', newNode, '方向:', direction);
    };

    // 验证连接是否有效 - 使用ConnectionValidator
    const isValidConnection = (connection: Connection): boolean => {
      const validationResult = connectionValidator.validateConnection(
        connection, 
        getNodes.value,
        {
          showValidationMessage,
          hideValidationMessage
        }
      );
      
      return validationResult.isValid;
    };
    
    // 开始连接事件
    const onConnectStart = () => {
      // 清除之前的验证信息
      connectionValidator.clearValidation({ hideValidationMessage });
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
        console.log('连接被拒绝：验证未通过');
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
        console.log('更新被拒绝：验证未通过');
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
      // 更新当前布局方向
      currentDirection.value = direction;
      
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
        // 设置初始布局方向
        currentDirection.value = LayoutDirection.VERTICAL;
        
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