<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

import { Game } from '@/engine/core/Game'
import { StageScene } from '@/engine/scene/StageScene'
import { TitleScene } from '@/engine/scene/TitleScene'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const audioEnabled = ref(false)
let game: Game | null = null

onMounted(async () => {
  if (!canvasRef.value) return

  // ゲームインスタンス作成
  game = new Game('gameCanvas', 320, 240)
  await game.init()

  // TitleSceneを最初のシーンとして設定
  const titleScene = new TitleScene(game.getInput(), game.getBaseWidth(), game.getBaseHeight())

  // キー入力でStageSceneに遷移
  titleScene.setOnStartGame(() => {
    // StageSceneに遷移（AudioManagerは既に初期化済み）
    const stageScene = new StageScene(0, game!.getInput(), game!.getBaseWidth(), game!.getBaseHeight())
    game!.changeScene(stageScene)
  })

  game.changeScene(titleScene)
  game.start()
  console.log('Game started (TitleScene - audio disabled until canvas focus)')

  // Tabキーでフォーカス可能にする
  canvasRef.value.tabIndex = 0

  // Canvas focus時にAudioManager初期化（一度だけ）
  canvasRef.value.addEventListener(
    'focus',
    async () => {
      if (game && !game.getAudioManager().isReady()) {
        await game.startAudio()
        audioEnabled.value = true
        console.log('🎵 Audio enabled!')
      }
    },
    { once: true }
  )
})

onUnmounted(() => {
  if (game) {
    game.stop()
  }
})
</script>

<template>
  <canvas id="gameCanvas" ref="canvasRef"></canvas>

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
