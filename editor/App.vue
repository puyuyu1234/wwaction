<script setup lang="ts">
import { ref, watch } from 'vue'
import StageSidebar from './components/StageSidebar.vue'
import TilePalette from './components/TilePalette.vue'
import StageCanvas from './components/StageCanvas.vue'

const stageData = ref<string[][]>([])
const selectedTile = ref<string>(' ')
const selectedStage = ref<number>(0)

const handleLoad = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const text = await file.text()
  const json = JSON.parse(text)
  stageData.value = json.tiles
}

const loadStageByNumber = async (num: number) => {
  const numStr = num.toString().padStart(2, '0')
  try {
    const response = await fetch(`/stages/stage-${numStr}.json`)
    if (!response.ok) throw new Error('Stage not found')
    const json = await response.json()
    stageData.value = json.map((row: string) => row.split(''))
  } catch (error) {
    console.error(`ステージ ${numStr} が見つかりません`, error)
  }
}

// ステージ選択時に自動読み込み
watch(selectedStage, (newStage) => {
  loadStageByNumber(newStage)
})

// 初期ロード
loadStageByNumber(0)

const handleSave = () => {
  const json = JSON.stringify({ tiles: stageData.value }, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `stage-${selectedStage.value.toString().padStart(2, '0')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const handleNew = () => {
  const width = 20
  const height = 15
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
        Load File
        <input type="file" accept=".json" @change="handleLoad" style="display: none" />
      </label>
      <button @click="handleSave">Save</button>
    </div>
    <div class="main">
      <StageSidebar v-model="selectedStage" />
      <StageCanvas v-model:stage-data="stageData" :selected-tile="selectedTile" />
      <TilePalette v-model="selectedTile" />
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
