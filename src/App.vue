<script setup lang="ts">
import { SCREEN } from '@game/config'
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
    const base = import.meta.env.BASE_URL
    await audio.loadSounds({
      jump: `${base}assets/sound/sfx/jump.mp3`,
      heal: `${base}assets/sound/sfx/heal.mp3`,
      wind: `${base}assets/sound/sfx/wind.mp3`,
      damage: `${base}assets/sound/sfx/damage.mp3`,
      semi: `${base}assets/sound/sfx/semi.ogg`,
    })

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
  window.addEventListener('keydown', handleUserInteraction, { once: true })
  window.addEventListener('click', handleUserInteraction, { once: true })
  window.addEventListener('touchstart', handleUserInteraction, { once: true })

  // ゲーム初期化
  const { game, assetLoader } = await GameFactory.createGame('game', SCREEN.WIDTH, SCREEN.HEIGHT)
  inputRef.value = game.getInput()

  // アセット読み込み
  await assetLoader.loadSpritesheet('tileset', 'spritesheets/tileset.json')
  await assetLoader.loadSpritesheet('player', 'spritesheets/player.json')
  await assetLoader.loadSpritesheet('entity', 'spritesheets/entity.json')
  await assetLoader.loadSpritesheet('wind', 'spritesheets/wind.json')
  await assetLoader.loadSpritesheet('space', 'spritesheets/space.json')
  await assetLoader.loadImage('ui', 'img/ui.png')

  // タイトルシーンから開始
  const scene = new TitleScene(game.getInput())

  game.changeScene(scene)
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
  display: flex;
  justify-content: center;
  align-items: center;
  background: #000;
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
