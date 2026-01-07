<script setup lang="ts">
import { Application, Sprite, Graphics, Spritesheet } from 'pixi.js'
import { ref, onMounted, computed, watch } from 'vue'

import { BASE_ENTITYDATA, BLOCKSIZE } from '../../src/game/config'
import { useAssets } from '../composables/useAssets'
import { useEditorState } from '../composables/useEditorState'

const modelValue = defineModel<string>()

const { blockData } = useEditorState()

// タイルとエンティティを統合
const blockTiles = computed(() => Object.keys(blockData.value))
const entityTiles = ['0', ...Object.keys(BASE_ENTITYDATA)] // 0: Player を追加

const tileCanvases = ref<Record<string, string>>({})

// タイルプレビュー生成用の状態
let pixiApp: Application | null = null
let tilesetSheet: Spritesheet | null = null

onMounted(async () => {
  // PixiJSアプリ初期化（オフスクリーン）
  pixiApp = new Application()
  await pixiApp.init({
    width: BLOCKSIZE * 2,
    height: BLOCKSIZE * 2,
    backgroundAlpha: 0,
  })

  // アセット読込（useAssets composable を使用）
  const { loadTilesetSpritesheet } = useAssets()
  tilesetSheet = await loadTilesetSpritesheet()

  // 初回生成
  await generateTilePreviews()

  // エンティティ用プレースホルダー（テーマ非依存）
  for (const tile of entityTiles) {
    tileCanvases.value[tile] = createEntityPlaceholder(tile)
  }
})

// テーマ変更時にプレビューを再生成
watch(blockData, async () => {
  if (pixiApp && tilesetSheet) {
    await generateTilePreviews()
  }
})

async function generateTilePreviews() {
  if (!pixiApp || !tilesetSheet) return

  const newCanvases: Record<string, string> = {}

  for (const tile of blockTiles.value) {
    const block = blockData.value[tile]
    if (!block?.frame || block.frame.length === 0) {
      newCanvases[tile] = createEmptyTileCanvas()
      continue
    }

    const frameIndex = block.frame[0]
    const frameName = `frame_${frameIndex}`
    const texture = tilesetSheet.textures[frameName]

    if (texture) {
      newCanvases[tile] = await renderSpriteToCanvas(pixiApp, texture, block.param?.alpha)
    }
  }

  // エンティティは維持
  for (const tile of entityTiles) {
    newCanvases[tile] = tileCanvases.value[tile] || createEntityPlaceholder(tile)
  }

  tileCanvases.value = newCanvases
}

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
  if (!canvas || !canvas.toDataURL) {
    console.warn('Failed to extract canvas from container')
    return ''
  }
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
  ctx.fillStyle = '#fff'
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
          :title="tile === ' ' ? '(空)' : tile"
          @click="modelValue = tile"
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
          :title="tile"
          @click="modelValue = tile"
        >
          <img v-if="tileCanvases[tile]" :src="tileCanvases[tile]" alt="" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.palette {
  min-width: 200px;
  max-width: 400px;
  flex: 1 1 300px;
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
  grid-template-columns: repeat(10, minmax(0, 1fr));
  gap: 2px;
}

button {
  padding: 2px;
  background: #1a1a1a;
  border: 1px solid #444;
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
