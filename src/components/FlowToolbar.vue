<template>
  <div class="toolbar">
    <button @click="runWorkflow" :disabled="isRunning">{{ isRunning ? '正在运行...' : '运行工作流' }}</button>
    <div class="layout-buttons">
      <button @click="handleLayoutClick(LayoutDirection.VERTICAL)" class="layout-btn">纵向布局</button>
      <button @click="handleLayoutClick(LayoutDirection.HORIZONTAL)" class="layout-btn horizontal">横向布局</button>
    </div>
    <div class="export-buttons">
      <button @click="handleExportClick" class="export-btn">导出工作流</button>
      <button @click="handleImportClick" class="import-btn">导入工作流</button>
      <input 
        type="file" 
        ref="fileInput" 
        style="display: none" 
        accept=".json" 
        @change="onFileSelected"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { LayoutDirection } from '../services/LayoutService';

export default defineComponent({
  name: 'FlowToolbar',
  props: {
    isRunning: {
      type: Boolean,
      default: false
    }
  },
  emits: ['run-workflow', 'layout-change', 'export-workflow', 'import-workflow'],
  setup(_, { emit }) {
    // 文件输入引用
    const fileInput = ref<HTMLInputElement | null>(null);
    
    // 运行工作流
    const runWorkflow = () => {
      emit('run-workflow');
    };

    // 布局处理
    const handleLayoutClick = (direction: LayoutDirection) => {
      emit('layout-change', direction);
    };
    
    // 导出工作流
    const handleExportClick = () => {
      emit('export-workflow');
    };
    
    // 导入工作流 - 触发文件选择
    const handleImportClick = () => {
      if (fileInput.value) {
        fileInput.value.click();
      }
    };
    
    // 文件选择处理
    const onFileSelected = (event: Event) => {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files.length > 0) {
        const file = input.files[0];
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const workflow = JSON.parse(content);
            
            // 发送导入事件和工作流数据
            emit('import-workflow', workflow);
            
            // 重置文件输入
            if (input) {
              input.value = '';
            }
          } catch (error) {
            console.error('导入工作流失败:', error);
            // 这里可以添加错误处理，例如显示错误消息
          }
        };
        
        reader.readAsText(file);
      }
    };

    return {
      fileInput,
      runWorkflow,
      handleLayoutClick,
      handleExportClick,
      handleImportClick,
      onFileSelected,
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

.layout-buttons, .export-buttons {
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

.toolbar button.export-btn {
  background-color: var(--orange-color);
}

.toolbar button.import-btn {
  background-color: var(--purple-color);
}

.toolbar button.layout-btn:hover {
  background-color: var(--secondary-dark);
}

.toolbar button.layout-btn.horizontal:hover {
  background-color: var(--purple-dark);
}

.toolbar button.export-btn:hover {
  background-color: var(--orange-color);
  opacity: 0.9;
}

.toolbar button.import-btn:hover {
  background-color: var(--purple-color);
  opacity: 0.9;
}

.toolbar button:hover {
  background-color: var(--primary-dark);
}

.toolbar button:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}
</style> 