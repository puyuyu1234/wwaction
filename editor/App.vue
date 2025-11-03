<script setup lang="ts">
import { ref } from 'vue'
import TilePalette from './components/TilePalette.vue'
import StageCanvas from './components/StageCanvas.vue'

const stageData = ref<string[][]>([])
const selectedTile = ref<string>(' ')

const handleLoad = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const text = await file.text()
  const json = JSON.parse(text)
  stageData.value = json.tiles
}

const handleSave = () => {
  const json = JSON.stringify({ tiles: stageData.value }, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'stage.json'
  a.click()
  URL.revokeObjectURL(url)
}

const handleNew = () => {
  const width = 40
  const height = 22
  stageData.value = Array(height)
    .fill(null)
    .map(() => Array(width).fill(' '))
}
</script>

<template>
  <div class="editor">
    <div class="toolbar">
      <button @click="handleNew">New</button>
      <label class="file-btn">
        Load
        <input type="file" accept=".json" @change="handleLoad" style="display: none" />
      </label>
      <button @click="handleSave">Save</button>
    </div>
    <div class="main">
      <TilePalette v-model="selectedTile" />
      <StageCanvas v-model:stage-data="stageData" :selected-tile="selectedTile" />
    </div>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: monospace;
}

.toolbar {
  padding: 10px;
  background: #222;
  color: white;
  display: flex;
  gap: 10px;
}

button,
.file-btn {
  padding: 8px 16px;
  cursor: pointer;
  background: #444;
  color: white;
  border: none;
  border-radius: 4px;
}

button:hover,
.file-btn:hover {
  background: #555;
}

.main {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>
