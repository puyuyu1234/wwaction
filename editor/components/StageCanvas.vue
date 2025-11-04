<script setup lang="ts">
import { ref, onMounted } from 'vue'

import { EDITOR_CONFIG } from '../../src/game/config'
import { useStageEditor } from '../composables/useStageEditor'
import { useStageLoader } from '../composables/useStageLoader'
import { GridEditor } from '../pixijs/GridEditor'

const { stageData, selectedTile, setTile, pickTile, stageSize } = useStageEditor()

const canvasRef = ref<HTMLDivElement>()
let editor: GridEditor | null = null

onMounted(async () => {
  editor = new GridEditor(20, 15)
  await editor.init(canvasRef.value!)
  canvasRef.value!.appendChild(editor.app.canvas as HTMLCanvasElement)

  // 初期ステージデータを読み込み
  const { loadStage } = useStageLoader()
  const data = await loadStage(0)
  stageData.value = data
  editor.loadStage(data)

  // クリックでタイル配置
  editor.on('tileClick', (canvasX: number, canvasY: number) => {
    // Canvas座標 → Stage座標に変換
    const stageX = canvasX - EDITOR_CONFIG.MARGIN
    const stageY = canvasY - EDITOR_CONFIG.MARGIN

    // 負の座標の場合、配列が拡張されるので全体を再描画
    const wasNegative = stageX < 0 || stageY < 0

    setTile(stageX, stageY, selectedTile.value)

    if (wasNegative) {
      // 配列が左上に拡張された場合は全体を再描画
      editor!.loadStage(stageData.value)
    } else {
      // 正の座標の場合は部分的に更新
      editor!.setTile(stageX, stageY, selectedTile.value)
      editor!.updateStageSize(stageSize.value.width, stageSize.value.height)
    }
  })

  // 右クリックでスポイト
  editor.on('tilePick', (canvasX: number, canvasY: number) => {
    // Canvas座標 → Stage座標に変換
    const stageX = canvasX - EDITOR_CONFIG.MARGIN
    const stageY = canvasY - EDITOR_CONFIG.MARGIN

    // マージン範囲外は無視
    if (stageX < 0 || stageY < 0) return

    // composableでスポイト
    pickTile(stageX, stageY)
  })
})

// 外部からアクセス可能にする（App.vueから使用）
defineExpose({
  stageData,
  selectedTile,
  loadStageData: (data: string[][]) => {
    if (editor && editor.app) {
      stageData.value = data
      editor.loadStage(data)
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
