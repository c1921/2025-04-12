<template>
  <div class="toolbar">
    <button @click="runWorkflow" :disabled="isRunning">{{ isRunning ? '正在运行...' : '运行工作流' }}</button>
    <div class="layout-buttons">
      <button @click="handleLayoutClick(LayoutDirection.VERTICAL)" class="layout-btn">纵向布局</button>
      <button @click="handleLayoutClick(LayoutDirection.HORIZONTAL)" class="layout-btn horizontal">横向布局</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { LayoutDirection } from '../services/LayoutService';

export default defineComponent({
  name: 'FlowToolbar',
  props: {
    isRunning: {
      type: Boolean,
      default: false
    }
  },
  emits: ['run-workflow', 'layout-change'],
  setup(_, { emit }) {
    // 运行工作流
    const runWorkflow = () => {
      emit('run-workflow');
    };

    // 布局处理
    const handleLayoutClick = (direction: LayoutDirection) => {
      emit('layout-change', direction);
    };

    return {
      runWorkflow,
      handleLayoutClick,
      LayoutDirection
    };
  }
});
</script>

<style scoped>
/* ------------------------------------
 * 工具栏样式
 * ------------------------------------ */
.toolbar {
  padding: 10px;
  background-color: var(--gray-light);
  border-bottom: 1px solid var(--border-color);
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
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}

.toolbar button.layout-btn {
  background-color: var(--secondary-color);
}

.toolbar button.layout-btn.horizontal {
  background-color: var(--purple-color);
}

.toolbar button.layout-btn:hover {
  background-color: var(--secondary-dark);
}

.toolbar button.layout-btn.horizontal:hover {
  background-color: var(--purple-dark);
}

.toolbar button:hover {
  background-color: var(--primary-dark);
}

.toolbar button:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}
</style> 