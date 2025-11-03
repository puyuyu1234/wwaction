<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { GridEditor } from '../pixijs/GridEditor'

const props = defineProps<{
  selectedTile: string
}>()

const stageData = defineModel<string[][]>('stageData')

const canvasRef = ref<HTMLDivElement>()
let editor: GridEditor | null = null

onMounted(async () => {
  editor = new GridEditor(40, 22)
  await editor.init()
  canvasRef.value!.appendChild(editor.app.canvas as HTMLCanvasElement)

  // 初期データ読込
  if (stageData.value && stageData.value.length > 0) {
    editor.loadStage(stageData.value)
  }

  // クリックでタイル配置
  editor.on('tileClick', (x: number, y: number) => {
    if (!stageData.value || stageData.value.length === 0) return

    stageData.value[y][x] = props.selectedTile
    editor!.setTile(x, y, props.selectedTile)
  })
})

// stageData更新時に再描画
watch(
  stageData,
  (newData) => {
    if (newData && newData.length > 0 && editor) {
      editor.loadStage(newData)
    }
  },
  { deep: true }
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
  justify-content: center;
  align-items: center;
  overflow: auto;
}
</style>
