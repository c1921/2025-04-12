<template>
  <div 
    class="unified-node" 
    :class="[
      nodeTypeClass, 
      { 'running-node': data?.status === 'running' },
      { 'completed-node': data?.status === 'completed' }
    ]"
  >
    <div class="unified-node-header" :class="nodeTypeHeaderClass">
      <div class="unified-node-header-title">{{ label }}</div>
    </div>
    <div class="unified-node-body">
      <!-- 节点图标区域 -->
      <div class="node-icon">
        <component :is="nodeIcon" />
      </div>
      
      <!-- 节点信息 -->
      <div class="node-info">
        <div class="node-type">{{ nodeTypeName }}</div>
        <div class="node-description">ID: {{ id }}</div>
        <div class="node-status">
          状态: {{ getStatusText }}
          <div v-if="data?.status === 'running'" class="spinner"></div>
        </div>
        <div class="node-time">处理时间: {{ data?.duration ? (data.duration / 1000) + '秒' : '未知' }}</div>
      </div>
      
      <!-- 端口标签区域 -->
      <div v-if="hasCustomPorts" class="port-labels">
        <!-- 输入端口标签 -->
        <div v-if="data.ports?.inputs?.length" class="input-port-labels">
          <div v-for="input in data.ports.inputs" :key="`label-${input.id}`" class="port-label input-label">
            {{ input.label || `输入 ${input.id}` }}
          </div>
        </div>
        
        <!-- 输出端口标签 -->
        <div v-if="data.ports?.outputs?.length" class="output-port-labels">
          <div v-for="output in data.ports.outputs" :key="`label-${output.id}`" class="port-label output-label">
            {{ output.label || `输出 ${output.id}` }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- 默认连接点 (当没有自定义端口时使用) -->
    <template v-if="!hasCustomPorts">
      <Handle 
        v-if="!isHorizontalLayout"
        type="target"
        :position="Position.Top"
        class="handle target-top"
      />
      <Handle 
        v-if="!isHorizontalLayout"
        type="source"
        :position="Position.Bottom"
        class="handle source-bottom"
      />
      <Handle 
        v-if="isHorizontalLayout"
        type="target"
        :position="Position.Left"
        class="handle target-left"
      />
      <Handle 
        v-if="isHorizontalLayout"
        type="source"
        :position="Position.Right"
        class="handle source-right"
      />
    </template>
    
    <!-- 自定义输入端口 -->
    <template v-if="data.ports?.inputs">
      <Handle 
        v-for="(input, index) in data.ports.inputs"
        :key="`input-${input.id}`"
        :id="`${id}__${input.id}`"
        type="target"
        :position="getInputPortPosition(input, index)"
        :style="getPortStyle(input, index, data.ports.inputs.length, 'input')"
        class="handle custom-input"
      />
    </template>
    
    <!-- 自定义输出端口 -->
    <template v-if="data.ports?.outputs">
      <Handle 
        v-for="(output, index) in data.ports.outputs"
        :key="`output-${output.id}`"
        :id="`${id}__${output.id}`"
        type="source"
        :position="getOutputPortPosition(output, index)"
        :style="getPortStyle(output, index, data.ports.outputs.length, 'output')"
        class="handle custom-output"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue';
import { type NodeProps, Position, Handle } from '@vue-flow/core';
import { NodeType } from '../types/node';

// 接收所有节点属性
const props = defineProps<NodeProps>();

// 从节点数据中获取标签
const label = computed(() => props.data?.label || props.label || '未命名节点');

// 判断是否为横向布局
const isHorizontalLayout = computed(() => {
  return props.sourcePosition === Position.Right || 
         props.targetPosition === Position.Left;
});

// 获取状态文本
const getStatusText = computed(() => {
  if (!props.data?.status) return '待执行';
  
  switch (props.data.status) {
    case 'idle': return '待执行';
    case 'running': return '执行中';
    case 'completed': return '已完成';
    default: return '未知';
  }
});

// 获取节点类型名称
const nodeTypeName = computed(() => {
  switch (props.type) {
    case NodeType.INPUT: return '输入节点';
    case NodeType.PROCESS: return '处理节点';
    case NodeType.TRANSFORM: return '转换节点';
    case NodeType.FILTER: return '过滤节点';
    case NodeType.CUSTOM: return '自定义节点';
    case NodeType.OUTPUT: return '输出节点';
    default: return '未知节点';
  }
});

// 根据节点类型获取对应的CSS类
const nodeTypeClass = computed(() => {
  switch (props.type) {
    case NodeType.INPUT: return 'input-node';
    case NodeType.PROCESS: return 'process-node';
    case NodeType.TRANSFORM: return 'transform-node';
    case NodeType.FILTER: return 'filter-node';
    case NodeType.OUTPUT: return 'output-node';
    case NodeType.CUSTOM: 
    default: return 'custom-node';
  }
});

// 根据节点类型获取对应的头部CSS类
const nodeTypeHeaderClass = computed(() => {
  switch (props.type) {
    case NodeType.INPUT: return 'input-header';
    case NodeType.PROCESS: return 'process-header';
    case NodeType.TRANSFORM: return 'transform-header';
    case NodeType.FILTER: return 'filter-header';
    case NodeType.OUTPUT: return 'output-header';
    case NodeType.CUSTOM: 
    default: return 'custom-header';
  }
});

// 检查是否有自定义端口
const hasCustomPorts = computed(() => {
  return !!(props.data?.ports?.inputs?.length || props.data?.ports?.outputs?.length);
});

// 获取输入端口位置
const getInputPortPosition = (input: any, index: number): Position => {
  if (input.position) return input.position;
  return isHorizontalLayout.value ? Position.Left : Position.Top;
};

// 获取输出端口位置
const getOutputPortPosition = (output: any, index: number): Position => {
  if (output.position) return output.position;
  return isHorizontalLayout.value ? Position.Right : Position.Bottom;
};

// 计算端口位置样式
const getPortStyle = (port: any, index: number, total: number, type: 'input' | 'output') => {
  if (port.style) return port.style;
  
  // 计算端口位置百分比
  const position = isHorizontalLayout.value
    ? { top: `${(index + 1) * 100 / (total + 1)}%` }
    : { left: `${(index + 1) * 100 / (total + 1)}%` };
    
  // 端口颜色
  const backgroundColor = type === 'input' 
    ? 'var(--secondary-color, #2ecc71)' 
    : 'var(--primary-color, #3498db)';
    
  return {
    ...position,
    backgroundColor
  };
};

// 获取节点图标
const nodeIcon = computed(() => {
  switch (props.type) {
    case NodeType.INPUT:
      return h('svg', { viewBox: '0 0 24 24', width: 24, height: 24 }, [
        h('path', { fill: 'currentColor', d: 'M14,12L10,8V11H2V13H10V16M20,18V6C20,4.89 19.1,4 18,4H6A2,2 0 0,0 4,6V9H6V6H18V18H6V15H4V18A2,2 0 0,0 6,20H18A2,2 0 0,0 20,18Z' })
      ]);
    case NodeType.PROCESS:
      return h('svg', { viewBox: '0 0 24 24', width: 24, height: 24 }, [
        h('path', { fill: 'currentColor', d: 'M17,17H7V7H17M21,5V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19V5A2,2 0 0,1 5,3H19A2,2 0 0,1 21,5M19,5H5V19H19V5Z' })
      ]);
    case NodeType.TRANSFORM:
      return h('svg', { viewBox: '0 0 24 24', width: 24, height: 24 }, [
        h('path', { fill: 'currentColor', d: 'M12,16A3,3 0 0,1 9,13C9,11.88 9.61,10.9 10.5,10.39L20.21,4.77L14.68,14.35C14.18,15.33 13.17,16 12,16M12,3C13.81,3 15.5,3.5 16.97,4.32L14.87,5.53C14,5.19 13,5 12,5A8,8 0 0,0 4,13C4,15.21 4.89,17.21 6.34,18.65H6.35C6.74,19.04 6.74,19.67 6.35,20.06C5.96,20.45 5.32,20.45 4.93,20.07V20.07C3.12,18.26 2,15.76 2,13A10,10 0 0,1 12,3M22,13C22,15.76 20.88,18.26 19.07,20.07V20.07C18.68,20.45 18.05,20.45 17.66,20.06C17.27,19.67 17.27,19.04 17.66,18.65V18.65C19.11,17.2 20,15.21 20,13C20,12 19.81,11 19.46,10.1L20.67,8C21.5,9.5 22,11.18 22,13Z' })
      ]);
    case NodeType.FILTER:
      return h('svg', { viewBox: '0 0 24 24', width: 24, height: 24 }, [
        h('path', { fill: 'currentColor', d: 'M14,12V19.88C14.04,20.18 13.94,20.5 13.71,20.71C13.32,21.1 12.69,21.1 12.3,20.71L10.29,18.7C10.06,18.47 9.96,18.16 10,17.87V12H9.97L4.21,4.62C3.87,4.19 3.95,3.56 4.38,3.22C4.57,3.08 4.78,3 5,3V3H19V3C19.22,3 19.43,3.08 19.62,3.22C20.05,3.56 20.13,4.19 19.79,4.62L14.03,12H14Z' })
      ]);
    case NodeType.OUTPUT:
      return h('svg', { viewBox: '0 0 24 24', width: 24, height: 24 }, [
        h('path', { fill: 'currentColor', d: 'M14,16H10V7H14M16,2H8A2,2 0 0,0 6,4V20A2,2 0 0,0 8,22H16A2,2 0 0,0 18,20V4A2,2 0 0,0 16,2Z' })
      ]);
    case NodeType.CUSTOM:
    default:
      return h('svg', { viewBox: '0 0 24 24', width: 24, height: 24 }, [
        h('path', { fill: 'currentColor', d: 'M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.79,6.79 21,7.12 21,7.5V16.5M12,4.15L5,8.09V15.91L12,19.85L19,15.91V8.09L12,4.15Z' })
      ]);
  }
});
</script>

<style>
/* 全局样式覆盖 */
.vue-flow__node {
  padding: 0 !important;
  background: transparent !important;
  border: none !important;
}

.vue-flow__node-input,
.vue-flow__node-output,
.vue-flow__node-process,
.vue-flow__node-transform,
.vue-flow__node-filter,
.vue-flow__node-custom {
  background-color: transparent !important;
  padding: 0 !important;
  border: none !important;
}
</style>

<style scoped>
.unified-node {
  border: 1px solid #1a192b;
  border-radius: 3px;
  background: white;
  color: #222;
  font-size: 12px;
  text-align: center;
  width: 180px;
  position: relative;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

/* 节点类型样式 */
.unified-node.input-node {
  background-color: #e3f2fd;
}

.unified-node.process-node {
  background-color: #e8f5e9;
}

.unified-node.transform-node {
  background-color: #f3e5f5;
}

.unified-node.filter-node {
  background-color: #fff3e0;
}

.unified-node.output-node {
  background-color: #ffebee;
}

.unified-node.custom-node {
  background-color: #f5f5f5;
}

/* 头部样式 */
.unified-node-header {
  padding: 8px;
  border-bottom: 1px solid #e2e2e2;
  width: 100%;
}

.unified-node-header.input-header {
  background-color: #bbdefb;
}

.unified-node-header.process-header {
  background-color: #c8e6c9;
}

.unified-node-header.transform-header {
  background-color: #e1bee7;
}

.unified-node-header.filter-header {
  background-color: #ffe0b2;
}

.unified-node-header.output-header {
  background-color: #ffcdd2;
}

.unified-node-header.custom-header {
  background-color: #f8f8f8;
}

.unified-node-header-title {
  font-weight: bold;
}

.unified-node-body {
  padding: 10px;
}

/* 节点状态样式 */
.running-node {
  box-shadow: 0 0 0 3px rgba(253, 203, 110, 0.8), 0 0 0 6px rgba(253, 203, 110, 0.4);
  animation: pulse 1.5s infinite;
}

.completed-node {
  box-shadow: 0 0 0 2px rgba(46, 204, 113, 0.8);
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 3px rgba(253, 203, 110, 0.8), 0 0 0 6px rgba(253, 203, 110, 0.4);
  }
  50% {
    box-shadow: 0 0 0 5px rgba(253, 203, 110, 0.8), 0 0 0 10px rgba(253, 203, 110, 0.4);
  }
  100% {
    box-shadow: 0 0 0 3px rgba(253, 203, 110, 0.8), 0 0 0 6px rgba(253, 203, 110, 0.4);
  }
}

/* 图标样式 */
.node-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.input-node .node-icon {
  color: #1976d2;
}

.process-node .node-icon {
  color: #388e3c;
}

.transform-node .node-icon {
  color: #7b1fa2;
}

.filter-node .node-icon {
  color: #e65100;
}

.output-node .node-icon {
  color: #d32f2f;
}

.custom-node .node-icon {
  color: #546e7a;
}

/* 节点内容样式 */
.node-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.node-type {
  font-weight: 500;
  font-size: 11px;
}

.node-description {
  font-size: 10px;
  color: #777;
}

.node-status {
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.node-time {
  font-size: 11px;
  color: #666;
}

/* 端口标签样式 */
.port-labels {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.input-port-labels, .output-port-labels {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.port-label {
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 3px;
}

.input-label {
  background-color: rgba(46, 204, 113, 0.2);
  color: #2c3e50;
}

.output-label {
  background-color: rgba(52, 152, 219, 0.2);
  color: #2c3e50;
}

.spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: #09f;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 连接点样式 */
.handle {
  width: 10px !important;
  height: 10px !important;
}

.handle.target-top, .handle.custom-input {
  background-color: var(--secondary-color, #2ecc71) !important;
}

.handle.source-bottom, .handle.custom-output {
  background-color: var(--primary-color, #3498db) !important;
}

.handle.target-left {
  background-color: var(--secondary-color, #2ecc71) !important;
}

.handle.source-right {
  background-color: var(--primary-color, #3498db) !important;
}
</style> 