<script setup lang="ts">
import { loadAllSfx } from '@game/audio/sfx'
import { SCREEN } from '@game/config'
import { GameSession } from '@game/GameSession'
import { StageScene } from '@game/scenes/StageScene'
import { TitleScene } from '@game/scenes/TitleScene'
import { AudioService } from '@ptre/audio/AudioService'
import { GameFactory } from '@ptre/core/GameFactory'
import type { Input } from '@ptre/core/Input'
import { onMounted, ref, shallowRef } from 'vue'

import VirtualController from './components/VirtualController.vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const inputRef = shallowRef<Input | null>(null)
const showController = ref(false)
const isDev = import.meta.env.DEV

const toggleController = () => {
  showController.value = !showController.value
}

// 最初のユーザーインタラクションで音声を初期化
const initAudioOnce = async () => {
  const audio = AudioService.getInstance()
  if (!audio.isReady()) {
    await audio.init()

    // 効果音をロード
    await loadAllSfx(import.meta.env.BASE_URL)

    console.log('AudioService initialized!')
  }
}

// キー入力またはクリックで初期化
const handleUserInteraction = () => {
  initAudioOnce()
}

onMounted(async () => {
  if (!canvasRef.value) return

  // ユーザーインタラクション検知（一度だけ）
  // HTML仕様のactivation triggering events + iOS Safari対応
  window.addEventListener('keydown', handleUserInteraction, { once: true })
  window.addEventListener('mousedown', handleUserInteraction, { once: true })
  window.addEventListener('touchend', handleUserInteraction, { once: true })

  // ゲーム初期化
  const { game, assetLoader } = await GameFactory.createGame('game', SCREEN.WIDTH, SCREEN.HEIGHT)
  inputRef.value = game.getInput()

  // アセット読み込み
  await assetLoader.loadSpritesheet('tileset', 'spritesheets/tileset.json')
  await assetLoader.loadSpritesheet('player', 'spritesheets/player.json')
  await assetLoader.loadSpritesheet('entity', 'spritesheets/entity.json')
  await assetLoader.loadSpritesheet('deka', 'spritesheets/deka.json')
  await assetLoader.loadSpritesheet('wind', 'spritesheets/wind.json')
  await assetLoader.loadSpritesheet('space', 'spritesheets/space.json')
  await assetLoader.loadImage('ui', 'img/ui.png')

  // DEV: 特定ステージを直接開始 / PROD: タイトルから
  const DEBUG_STAGE: number | null = 2 // nullならタイトルから開始
  if (import.meta.env.DEV && DEBUG_STAGE !== null) {
    const session = new GameSession(1, DEBUG_STAGE)
    game.changeScene(new StageScene(session, game.getInput(), SCREEN.WIDTH, SCREEN.HEIGHT))
  } else {
    game.changeScene(new TitleScene(game.getInput()))
  }
  game.start()

  console.log('Game started!')
})
</script>

<template>
  <div class="game-container">
    <canvas id="game" ref="canvasRef"></canvas>
    <div class="top-links">
      <button class="controller-toggle" @click="toggleController">
        {{ showController ? 'Pad OFF' : 'Pad ON' }}
      </button>
      <a v-if="isDev" href="editor/" class="editor-link">Editor</a>
    </div>
    <VirtualController v-if="showController && inputRef" :input="inputRef" />
  </div>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  touch-action: manipulation;
}

html,
body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;
}
</style>

<style scoped>
.game-container {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-bottom: env(safe-area-inset-bottom, 0);
  background: #000;
  box-sizing: border-box;
}

#game {
  width: 100vw;
  height: 100vh;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

#game:focus {
  outline: 2px solid rgba(255, 255, 255, 0.6);
}

.top-links {
  position: fixed;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 8px;
}

.controller-toggle {
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: none;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
}

.controller-toggle:hover {
  background: rgba(255, 255, 255, 0.4);
}

.editor-link {
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  text-decoration: none;
  font-size: 12px;
  border-radius: 4px;
}

.editor-link:hover {
  background: rgba(255, 255, 255, 0.4);
}
</style>
