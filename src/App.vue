<script setup lang="ts">
import { Game } from '@core/Game'
import { onMounted, ref } from 'vue'

import { StageScene } from '@/engine/scene/StageScene'

const audioEnabled = ref(false)

onMounted(async () => {
  const game = new Game('gameCanvas', 320, 240)
  await game.init()

  const stage = new StageScene(1, game.getInput(), game.getBaseWidth(), game.getBaseHeight())
  game.changeScene(stage)

  game.start()
  console.log('Game started (audio disabled until canvas focus)')

  // 🎵 Canvas Focus時に音響初期化（一度だけ）
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
  canvas.tabIndex = 0 // Tabキーでフォーカス可能にする

  canvas.addEventListener(
    'focus',
    async () => {
      if (!game.getAudioManager().isReady()) {
        await game.startAudio()

        // BGM開始（Scene側の責務）
        stage.startBGM()

        audioEnabled.value = true
        console.log('🎵 Audio enabled!')
      }
    },
    { once: true }
  )
})
</script>

<template>
  <canvas id="gameCanvas"></canvas>

  <!-- 🔊 音が有効化されていないことを通知 -->
  <div v-if="!audioEnabled" class="audio-hint">Click or Tab to enable sound</div>
</template>

<style scoped>
canvas {
  max-width: 100%;
  max-height: 100%;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  outline: 2px solid rgba(255, 255, 255, 0.2);
}

canvas:focus {
  outline: 2px solid rgba(255, 255, 255, 0.6);
}

.audio-hint {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.5);
  font-family: 'MS Gothic', monospace;
  font-size: 10px;
  pointer-events: none;
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#app {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
