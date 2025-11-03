<script setup lang="ts">
import { ref, watch } from 'vue'
import StageSidebar from './components/StageSidebar.vue'
import TilePalette from './components/TilePalette.vue'
import StageCanvas from './components/StageCanvas.vue'

const stageData = ref<string[][]>([])
const selectedTile = ref<string>(' ')
const selectedStage = ref<number>(0)

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

const handleSave = async () => {
  const numStr = selectedStage.value.toString().padStart(2, '0')
  try {
    const response = await fetch('/api/save-stage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stageNumber: numStr,
        data: stageData.value
      })
    })
    if (!response.ok) throw new Error('Save failed')
    alert(`Stage ${numStr} saved successfully!`)
  } catch (error) {
    console.error('Failed to save stage:', error)
    alert('Failed to save stage')
  }
}

const handlePickTile = (tile: string) => {
  selectedTile.value = tile
}
</script>

<template>
  <div class="editor">
    <div class="toolbar">
      <button @click="handleSave">Save</button>
    </div>
    <div class="main">
      <StageSidebar v-model="selectedStage" />
      <StageCanvas
        v-model:stage-data="stageData"
        :selected-tile="selectedTile"
        @pick-tile="handlePickTile"
      />
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
