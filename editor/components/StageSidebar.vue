<script setup lang="ts">

const selectedStage = defineModel<number>()

// ステージ番号のリスト（0-12まで）
const stages = Array.from({ length: 13 }, (_, i) => i)
</script>

<template>
  <div class="sidebar">
    <h3>Stages</h3>
    <div class="stage-list">
      <button
        v-for="stage in stages"
        :key="stage"
        :class="{ active: selectedStage === stage }"
        @click="selectedStage = stage"
      >
        {{ stage.toString().padStart(2, '0') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  width: 80px;
  background: #2a2a2a;
  color: #fff;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

h3 {
  margin: 0;
  padding: 10px;
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  border-bottom: 1px solid #444;
}

.stage-list {
  display: flex;
  flex-direction: column;
  padding: 5px;
  gap: 4px;
}

button {
  padding: 10px;
  background: #1a1a1a;
  border: 2px solid #444;
  color: #ccc;
  cursor: pointer;
  font-family: monospace;
  font-size: 14px;
  font-weight: bold;
  border-radius: 4px;
  transition: all 0.2s;
  text-align: center;
}

button.active {
  background: #0056b3;
  border-color: #007bff;
  color: white;
  box-shadow: 0 0 8px rgba(0, 123, 255, 0.6);
}

button:hover:not(.active) {
  background: #333;
  border-color: #666;
}
</style>
