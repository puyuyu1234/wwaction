<script setup lang="ts">
import { BLOCKDATA, ENTITYDATA } from '../../src/game/config'

const modelValue = defineModel<string>()

// タイルとエンティティを統合
const allTiles = [
  ...Object.keys(BLOCKDATA),
  ...Object.keys(ENTITYDATA),
]
</script>

<template>
  <div class="palette">
    <h3>Palette</h3>
    <div class="tiles">
      <button
        v-for="tile in allTiles"
        :key="tile"
        :class="{ active: modelValue === tile }"
        @click="modelValue = tile"
      >
        {{ tile === ' ' ? '(空)' : tile }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.palette {
  width: 120px;
  padding: 10px;
  background: #f0f0f0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

h3 {
  margin-bottom: 10px;
  font-size: 14px;
}

.tiles {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

button {
  padding: 8px;
  text-align: center;
  background: white;
  border: 1px solid #ccc;
  cursor: pointer;
  font-family: monospace;
  font-size: 14px;
}

button.active {
  background: #007bff;
  color: white;
  border-color: #0056b3;
}

button:hover:not(.active) {
  background: #e9ecef;
}
</style>
