<script setup lang="ts">
import { ref, watch, computed } from 'vue'

import StageCanvas from './components/StageCanvas.vue'
import StageSidebar from './components/StageSidebar.vue'
import TilePalette from './components/TilePalette.vue'
import { useStageLoader } from './composables/useStageLoader'

const { selectedStage, loadStage, saveStage } = useStageLoader()

// StageCanvas の参照を取得（defineExpose で公開されたAPIにアクセス）
const stageCanvasRef = ref<InstanceType<typeof StageCanvas>>()

// v-model用のcomputed（オプショナルチェーン回避）
const selectedTile = computed({
  get: () => stageCanvasRef.value?.selectedTile ?? ' ',
  set: (value) => {
    if (stageCanvasRef.value) {
      stageCanvasRef.value.selectedTile = value
    }
  }
})

// ステージ選択時に自動読み込み（初回以外）
watch(selectedStage, async (newStage) => {
  try {
    const data = await loadStage(newStage)
    stageCanvasRef.value?.loadStageData(data)
  } catch {
    // エラーは composable 内で処理済み
  }
})

// 初期ロードはStageCanvas側で実行

const handleSave = async () => {
  if (!stageCanvasRef.value) return

  try {
    await saveStage(selectedStage.value, stageCanvasRef.value.stageData)
    const numStr = selectedStage.value.toString().padStart(2, '0')
    alert(`Stage ${numStr} saved successfully!`)
  } catch {
    alert('Failed to save stage')
  }
}
</script>

<template>
  <div class="editor">
    <div class="toolbar">
      <button @click="handleSave">Save</button>
    </div>
    <div class="main">
      <StageSidebar v-model="selectedStage" />
      <StageCanvas ref="stageCanvasRef" />
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
