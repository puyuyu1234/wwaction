<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

import { EDITOR_CONFIG } from '../config'
import { useStageEditor } from '../composables/useStageEditor'
import { useStageLoader } from '../composables/useStageLoader'
import { GridEditor } from '../pixijs/GridEditor'

const {
  stageData,
  currentLayer,
  currentLayerData,
  layerCount,
  selectedTile,
  setTile,
  pickTile,
  stageSize,
  addLayer,
  removeLayer,
  setCurrentLayer,
} = useStageEditor()

const canvasRef = ref<HTMLDivElement>()
let editor: GridEditor | null = null

// 全レイヤーを再描画
function refreshAllLayers() {
  if (editor && editor.app) {
    editor.loadAllLayers(stageData.value, currentLayer.value)
  }
}

onMounted(async () => {
  editor = new GridEditor(20, 15)
  await editor.init(canvasRef.value!)
  canvasRef.value!.appendChild(editor.app.canvas as HTMLCanvasElement)

  // 初期ステージデータを読み込み
  const { loadStage } = useStageLoader()
  const data = await loadStage(0)
  stageData.value = data
  refreshAllLayers()

  // クリックでタイル配置
  editor.on('tileClick', (canvasX: number, canvasY: number) => {
    // Canvas座標 → Stage座標に変換
    const stageX = canvasX - EDITOR_CONFIG.MARGIN
    const stageY = canvasY - EDITOR_CONFIG.MARGIN

    // タイルを配置（stageData更新）
    setTile(stageX, stageY, selectedTile.value)

    // 常に最新のstageDataで全レイヤーを再描画
    refreshAllLayers()
  })

  // 右クリックでスポイト（GridEditorからタイル文字が渡される）
  editor.on('tilePick', (tile: string) => {
    selectedTile.value = tile
  })
})

// レイヤー変更時に再描画
watch(currentLayer, () => {
  refreshAllLayers()
})

// 外部からアクセス可能にする（App.vueから使用）
defineExpose({
  stageData,
  selectedTile,
  currentLayer,
  layerCount,
  addLayer,
  removeLayer,
  setCurrentLayer,
  loadStageData: (data: string[][][]) => {
    if (editor && editor.app) {
      stageData.value = data
      refreshAllLayers()
    } else {
      console.error('[StageCanvas.loadStageData] editor未初期化')
    }
  }
})
</script>

<template>
  <div ref="canvasRef" class="canvas-container"></div>
</template>

<style scoped>
.canvas-container {
  flex: 1;
  background: #333;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  overflow: auto;
  padding: 20px;
}

.canvas-container :deep(canvas) {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
</style>
