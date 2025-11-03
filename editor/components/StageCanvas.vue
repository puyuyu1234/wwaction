<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { GridEditor } from '../pixijs/GridEditor'
import { EDITOR_CONFIG } from '../../src/game/config'

const props = defineProps<{
  selectedTile: string
}>()

const stageData = defineModel<string[][]>('stageData')
const emit = defineEmits<{
  pickTile: [tile: string]
}>()

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
  editor.on('tileClick', (x: number, y: number) => {
    if (!stageData.value || stageData.value.length === 0) return

    // マージンを考慮した実際のステージ座標に変換
    const stageX = x - EDITOR_CONFIG.MARGIN
    const stageY = y - EDITOR_CONFIG.MARGIN

    // マージン範囲外は無視
    if (stageX < 0 || stageY < 0) return

    // ステージデータを自動拡張
    let needsResize = false

    // Y方向の拡張
    while (stageData.value.length <= stageY) {
      const currentWidth = stageData.value.length > 0
        ? Math.max(...stageData.value.map(row => row.length))
        : 20
      stageData.value.push(new Array(currentWidth).fill(' '))
      needsResize = true
    }

    // X方向の拡張
    if (!stageData.value[stageY]) {
      stageData.value[stageY] = []
    }
    while (stageData.value[stageY].length <= stageX) {
      stageData.value[stageY].push(' ')
      needsResize = true
    }

    // タイル配置
    stageData.value[stageY][stageX] = props.selectedTile
    editor!.setTile(stageX, stageY, props.selectedTile)

    // ステージサイズが変わった場合は再計算
    if (needsResize) {
      const maxX = Math.max(...stageData.value.map(row => row.length))
      const maxY = stageData.value.length
      editor!.updateStageSize(maxX, maxY)
    }
  })

  // 右クリックでスポイト
  editor.on('tilePick', (tile: string) => {
    emit('pickTile', tile)
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
