<template>
  <div class="app-container">
    <div class="flow-container">
      <NodeFlow />
    </div>
  </div>
</template>

<script setup lang="ts">
import NodeFlow from './components/NodeFlow.vue';
</script>

<style>
.app-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.flow-container {
  flex: 1;
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 8px;
  overflow: hidden;
}

h1 {
  margin-top: 0;
  margin-bottom: 20px;
}
</style>
