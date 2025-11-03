<script setup lang="ts">
import { Application, Assets, Spritesheet, Sprite, Graphics } from 'pixi.js'
import { ref, onMounted } from 'vue'

import { BLOCKDATA, ENTITYDATA, BLOCKSIZE } from '../../src/game/config'

const modelValue = defineModel<string>()

// タイルとエンティティを統合
const blockTiles = Object.keys(BLOCKDATA)
const entityTiles = Object.keys(ENTITYDATA)

const tileCanvases = ref<Record<string, string>>({})

onMounted(async () => {
  // PixiJSアプリ初期化（オフスクリーン）
  const app = new Application()
  await app.init({
    width: BLOCKSIZE * 2,
    height: BLOCKSIZE * 2,
    backgroundAlpha: 0,
  })

  // アセット読込
  await Assets.init({ basePath: '/assets/' })

  const tilesetSheet = await Assets.load<Spritesheet>({
    src: 'spritesheets/tileset.json',
    alias: 'tileset-palette',
    data: { cachePrefix: 'palette_tileset_' },
  })

  // ピクセルアート用設定
  Object.values(tilesetSheet.textures).forEach((texture) => {
    if (texture.source) {
      texture.source.scaleMode = 'nearest'
    }
  })

  // 各タイルのプレビュー画像を生成
  for (const tile of blockTiles) {
    const blockData = BLOCKDATA[tile]
    if (!blockData?.frame || blockData.frame.length === 0) {
      // 空タイル
      tileCanvases.value[tile] = createEmptyTileCanvas()
      continue
    }

    const frameIndex = blockData.frame[0]
    const frameName = `frame_${frameIndex}`
    const texture = tilesetSheet.textures[frameName]

    if (texture) {
      tileCanvases.value[tile] = await renderSpriteToCanvas(app, texture, blockData.param?.alpha)
    }
  }

  // エンティティ用プレースホルダー
  for (const tile of entityTiles) {
    tileCanvases.value[tile] = createEntityPlaceholder(tile)
  }

  // アプリ破棄
  app.destroy(true)
})

async function renderSpriteToCanvas(
  app: Application,
  texture: any,
  alpha?: number
): Promise<string> {
  // 背景作成
  const bg = new Graphics()
  bg.rect(0, 0, BLOCKSIZE * 2, BLOCKSIZE * 2).fill('#333')
  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < 2; x++) {
      if ((x + y) % 2 === 0) {
        bg.rect(x * BLOCKSIZE, y * BLOCKSIZE, BLOCKSIZE, BLOCKSIZE).fill('#444')
      }
    }
  }

  // スプライト作成
  const sprite = new Sprite(texture)
  sprite.width = BLOCKSIZE * 2
  sprite.height = BLOCKSIZE * 2
  sprite.alpha = alpha ?? 1

  // コンテナにまとめる
  const container = new Graphics()
  container.addChild(bg)
  container.addChild(sprite)

  // レンダリングしてBase64取得
  app.stage.addChild(container)
  app.renderer.render(app.stage)

  const canvas = app.renderer.extract.canvas(container)
  const dataUrl = canvas.toDataURL()

  app.stage.removeChild(container)
  container.destroy({ children: true })

  return dataUrl
}

function createEmptyTileCanvas(): string {
  const canvas = document.createElement('canvas')
  canvas.width = BLOCKSIZE * 2
  canvas.height = BLOCKSIZE * 2
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = '#333'
  ctx.strokeRect(0, 0, canvas.width, canvas.height)

  return canvas.toDataURL()
}

function createEntityPlaceholder(tile: string): string {
  const canvas = document.createElement('canvas')
  canvas.width = BLOCKSIZE * 2
  canvas.height = BLOCKSIZE * 2
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#ff00ff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#000'
  ctx.font = '20px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(tile, canvas.width / 2, canvas.height / 2)

  return canvas.toDataURL()
}
</script>

<template>
  <div class="palette">
    <h3>Palette</h3>

    <div class="section">
      <h4>Tiles</h4>
      <div class="tiles">
        <button
          v-for="tile in blockTiles"
          :key="tile"
          :class="{ active: modelValue === tile }"
          @click="modelValue = tile"
          :title="tile === ' ' ? '(空)' : tile"
        >
          <img v-if="tileCanvases[tile]" :src="tileCanvases[tile]" alt="" />
        </button>
      </div>
    </div>

    <div class="section">
      <h4>Entities</h4>
      <div class="tiles">
        <button
          v-for="tile in entityTiles"
          :key="tile"
          :class="{ active: modelValue === tile }"
          @click="modelValue = tile"
          :title="tile"
        >
          <img v-if="tileCanvases[tile]" :src="tileCanvases[tile]" alt="" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.palette {
  width: 600px;
  padding: 10px;
  background: #2a2a2a;
  color: #fff;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

h3 {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

h4 {
  margin: 0;
  font-size: 12px;
  color: #aaa;
  text-transform: uppercase;
}

.tiles {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 6px;
}

button {
  padding: 4px;
  background: #1a1a1a;
  border: 2px solid #444;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  aspect-ratio: 1;
}

button img {
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

button.active {
  background: #0056b3;
  border-color: #007bff;
  box-shadow: 0 0 8px rgba(0, 123, 255, 0.6);
}

button:hover:not(.active) {
  background: #333;
  border-color: #666;
}
</style>
