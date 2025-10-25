<script setup lang="ts">
import { onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  if (!canvasRef.value) return

  const ctx = canvasRef.value.getContext('2d')
  if (!ctx) return

  // TODO: ゲームエンジンの初期化
  ctx.fillStyle = '#68a'
  ctx.fillRect(0, 0, 320, 240)

  ctx.fillStyle = '#fff'
  ctx.font = '16px monospace'
  ctx.fillText('Game Canvas Ready', 80, 120)
})
</script>

<template>
  <canvas
    ref="canvasRef"
    width="320"
    height="240"
    style="border: 2px solid #444; image-rendering: pixelated; image-rendering: crisp-edges;"
  />
</template>
