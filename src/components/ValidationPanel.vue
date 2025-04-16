<template>
  <Panel v-if="show" position="top-center" class="validation-panel">
    <div class="validation-info" :class="{ 'valid': isValid, 'invalid': !isValid }">
      {{ message }}
    </div>
  </Panel>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Panel } from '@vue-flow/core';

export default defineComponent({
  name: 'ValidationPanel',
  components: {
    Panel
  },
  props: {
    show: {
      type: Boolean,
      default: false
    },
    isValid: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      default: ''
    }
  }
});
</script>

<style scoped>
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