<script setup lang="ts">
import { ref, watch, computed } from 'vue'

import StageCanvas from './components/StageCanvas.vue'
import StageSidebar from './components/StageSidebar.vue'
import TilePalette from './components/TilePalette.vue'
import { useEditorState } from './composables/useEditorState'
import { useStageLoader } from './composables/useStageLoader'

const { selectedStage, loadStage, saveStage } = useStageLoader()
const { setTheme } = useEditorState()

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

// レイヤー関連のcomputed
const currentLayer = computed(() => stageCanvasRef.value?.currentLayer ?? 0)
const layerCount = computed(() => stageCanvasRef.value?.layerCount ?? 1)

// レイヤー切り替え
function handleLayerChange(layerIndex: number) {
  stageCanvasRef.value?.setCurrentLayer(layerIndex)
}

// レイヤー追加
function handleAddLayer() {
  stageCanvasRef.value?.addLayer()
}

// レイヤー削除
function handleRemoveLayer() {
  if (layerCount.value > 1) {
    stageCanvasRef.value?.removeLayer(currentLayer.value)
  }
}

// ステージ選択時に自動読み込み（初回以外）
watch(selectedStage, async (newStage) => {
  try {
    const { layers, theme } = await loadStage(newStage)
    setTheme(theme)
    stageCanvasRef.value?.loadStageData(layers)
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
      <div class="layer-controls">
        <span class="layer-label">Layer:</span>
        <button
          v-for="i in layerCount"
          :key="i - 1"
          :class="{ active: currentLayer === i - 1 }"
          @click="handleLayerChange(i - 1)"
        >
          {{ i - 1 }}
        </button>
        <button class="layer-add" @click="handleAddLayer">+</button>
        <button
          class="layer-remove"
          :disabled="layerCount <= 1"
          @click="handleRemoveLayer"
        >
          -
        </button>
      </div>
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

.layer-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 20px;
}

.layer-label {
  color: #aaa;
  margin-right: 4px;
}

.layer-controls button {
  padding: 4px 10px;
  min-width: 32px;
}

.layer-controls button.active {
  background: #0a0;
  color: white;
}

.layer-add {
  background: #060 !important;
}

.layer-remove {
  background: #600 !important;
}

.layer-remove:disabled {
  background: #333 !important;
  cursor: not-allowed;
}

.main {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>
