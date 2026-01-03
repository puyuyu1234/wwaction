<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { GameFactory } from '@ptre/core/GameFactory'
import { SCREEN } from '@game/config'
import { GameSession } from '@game/GameSession'
import { StageScene } from '@game/scenes/StageScene'
import { AudioService } from '@ptre/audio/AudioService'

const canvasRef = ref<HTMLCanvasElement | null>(null)

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

  // ゲーム初期化
  const { game, assetLoader } = await GameFactory.createGame('game', SCREEN.WIDTH, SCREEN.HEIGHT)

  // アセット読み込み
  await assetLoader.loadSpritesheet('tileset', 'spritesheets/tileset.json')
  await assetLoader.loadSpritesheet('player', 'spritesheets/player.json')
  await assetLoader.loadSpritesheet('entity', 'spritesheets/entity.json')
  await assetLoader.loadSpritesheet('wind', 'spritesheets/wind.json')
  await assetLoader.loadSpritesheet('space', 'spritesheets/space.json')
  await assetLoader.loadImage('ui', 'img/ui.png')

  // ゲームセッション作成（難易度: NORMAL=1, 開始ステージ: 0）
  const session = new GameSession(1, 13)

  // シーン作成
  const scene = new StageScene(
    session,
    game.getInput(),
    SCREEN.WIDTH,
    SCREEN.HEIGHT,
    false // isRetry
  )

  game.changeScene(scene)
  game.start()

  console.log('Game started!')
})
</script>

<template>
  <div class="game-container">
    <canvas id="game" ref="canvasRef"></canvas>
    <a href="editor/" class="editor-link">Editor</a>
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

.editor-link {
  position: fixed;
  top: 8px;
  right: 8px;
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
