<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

import { EDITOR_CONFIG } from '../../src/game/config'
import { useStageEditor } from '../composables/useStageEditor'
import { GridEditor } from '../pixijs/GridEditor'

const { stageData, selectedTile, setTile, pickTile, stageSize } = useStageEditor()

const canvasRef = ref<HTMLDivElement>()
let editor: GridEditor | null = null

onMounted(async () => {
  editor = new GridEditor(20, 15)
  await editor.init(canvasRef.value!)
  canvasRef.value!.appendChild(editor.app.canvas as HTMLCanvasElement)

  // 初期データ読込
  if (stageData.value && stageData.value.length > 0) {
    editor.loadStage(stageData.value)
  }

  // クリックでタイル配置
  editor.on('tileClick', (canvasX: number, canvasY: number) => {
    console.log('[StageCanvas] tileClick:', { canvasX, canvasY, MARGIN: EDITOR_CONFIG.MARGIN })

    // Canvas座標 → Stage座標に変換
    const stageX = canvasX - EDITOR_CONFIG.MARGIN
    const stageY = canvasY - EDITOR_CONFIG.MARGIN

    console.log('[StageCanvas] converted to stage:', { stageX, stageY })

    // 負の座標も許可（useStageEditorが配列の先頭に挿入）

    // composableでタイル配置（自動拡張込み）
    console.log('[StageCanvas] calling setTile:', { stageX, stageY, tile: selectedTile.value })

    // 負の座標の場合、配列が拡張されるので全体を再描画
    const wasNegative = stageX < 0 || stageY < 0

    setTile(stageX, stageY, selectedTile.value)

    if (wasNegative) {
      // 配列が左上に拡張された場合は全体を再描画
      console.log('[StageCanvas] 負の座標により配列が拡張されたため、全体を再描画')
      editor!.loadStage(stageData.value)
    } else {
      // 正の座標の場合は部分的に更新
      editor!.setTile(stageX, stageY, selectedTile.value)
      editor!.updateStageSize(stageSize.value.width, stageSize.value.height)
    }

    console.log('[StageCanvas] after update, stageSize:', stageSize.value)
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

// 外部からステージ全体が変更された時のみ再描画（ステージ選択時など）
watch(
  () => stageData.value,
  (newData, oldData) => {
    // 配列の参照が変わった場合のみ再描画（新しいステージ読込時）
    if (newData !== oldData && newData && newData.length > 0 && editor) {
      editor.loadStage(newData)
    }
  }
)

// 外部からアクセス可能にする（App.vueから使用）
defineExpose({
  stageData,
  selectedTile,
  loadStage: (data: string[][]) => {
    stageData.value = data
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
