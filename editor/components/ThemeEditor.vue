<script setup lang="ts">
import { Application, Sprite, Graphics, Spritesheet, Texture } from 'pixi.js'
import { ref, onMounted, computed, watch } from 'vue'

import { BASE_BLOCKDATA, BLOCKSIZE } from '../../src/game/config'
import { CollisionType } from '../../src/game/types'
import type { BlockData, StageTheme } from '../../src/game/types'
import { useAssets } from '../composables/useAssets'

// 利用可能なテーマ
const themes: StageTheme[] = ['plain', 'forest']
const selectedTheme = ref<StageTheme>('forest')

// オーバーライドデータ
interface Override {
  key: string
  frame: number[]
  type: CollisionType
}
const overrides = ref<Override[]>([])

// 選択中のベースブロック（オーバーライド追加用）
const selectedBaseBlock = ref<string | null>(null)
// 選択中のフレーム番号（タイルシートから選択）
const selectedFrame = ref<number | null>(null)

// タイルシート表示用
let pixiApp: Application | null = null
let tilesetSheet: Spritesheet | null = null
const tilesetCanvas = ref<HTMLDivElement>()
const tilesetFrameCount = ref(0)

// タイルプレビュー画像キャッシュ
const tilePreviewCache = ref<Record<number, string>>({})

// ベースブロック一覧
const baseBlocks = computed(() => {
  return Object.entries(BASE_BLOCKDATA)
    .filter(([_, data]) => data?.frame && data.frame.length > 0)
    .map(([key, data]) => ({ key, frame: data!.frame, type: data!.type }))
})

// CollisionTypeの選択肢
const collisionTypes = [
  { value: CollisionType.NONE, label: 'NONE' },
  { value: CollisionType.SOLID, label: 'SOLID' },
  { value: CollisionType.PLATFORM, label: 'PLATFORM' },
  { value: CollisionType.DAMAGE, label: 'DAMAGE' },
]

onMounted(async () => {
  // PixiJSアプリ初期化
  pixiApp = new Application()
  await pixiApp.init({
    width: 256,
    height: 256,
    backgroundColor: 0x1a1a1a,
  })

  if (tilesetCanvas.value) {
    tilesetCanvas.value.appendChild(pixiApp.canvas as HTMLCanvasElement)
  }

  // タイルシート読み込み
  const { loadTilesetSpritesheet } = useAssets()
  tilesetSheet = await loadTilesetSpritesheet()

  // フレーム数を取得
  if (tilesetSheet) {
    tilesetFrameCount.value = Object.keys(tilesetSheet.textures).length
    renderTilesetGrid()
    // プレビュー画像を生成
    await generateTilePreviews()
  }

  // 初期テーマのオーバーライドを読み込み
  await loadThemeOverrides()
})

// テーマ変更時にオーバーライドを再読み込み
watch(selectedTheme, async () => {
  await loadThemeOverrides()
})

async function loadThemeOverrides() {
  try {
    const response = await fetch(`/themes/${selectedTheme.value}.json`)
    if (response.ok) {
      const data = await response.json()
      overrides.value = Object.entries(data.blocks || {}).map(([key, block]) => ({
        key,
        frame: (block as BlockData).frame,
        type: (block as BlockData).type,
      }))
    }
  } catch (e) {
    console.error('Failed to load theme:', e)
    overrides.value = []
  }
}

async function generateTilePreviews() {
  if (!pixiApp || !tilesetSheet) return

  const previewApp = new Application()
  await previewApp.init({
    width: BLOCKSIZE * 2,
    height: BLOCKSIZE * 2,
    backgroundAlpha: 0,
  })

  const cache: Record<number, string> = {}

  for (let i = 0; i < tilesetFrameCount.value; i++) {
    const texture = tilesetSheet.textures[`frame_${i}`]
    if (texture) {
      cache[i] = await renderTileToDataUrl(previewApp, texture)
    }
  }

  tilePreviewCache.value = cache
  previewApp.destroy(true)
}

async function renderTileToDataUrl(app: Application, texture: Texture): Promise<string> {
  app.stage.removeChildren()

  // チェッカーボード背景
  const bg = new Graphics()
  bg.rect(0, 0, BLOCKSIZE, BLOCKSIZE).fill(0x333333)
  bg.rect(BLOCKSIZE, 0, BLOCKSIZE, BLOCKSIZE).fill(0x444444)
  bg.rect(0, BLOCKSIZE, BLOCKSIZE, BLOCKSIZE).fill(0x444444)
  bg.rect(BLOCKSIZE, BLOCKSIZE, BLOCKSIZE, BLOCKSIZE).fill(0x333333)
  app.stage.addChild(bg)

  // スプライト
  const sprite = new Sprite(texture)
  sprite.width = BLOCKSIZE * 2
  sprite.height = BLOCKSIZE * 2
  app.stage.addChild(sprite)

  app.renderer.render(app.stage)

  const canvas = app.renderer.extract.canvas(app.stage)
  if (canvas && 'toDataURL' in canvas) {
    return (canvas as HTMLCanvasElement).toDataURL()
  }
  return ''
}

function getTilePreview(frameIndex: number): string {
  return tilePreviewCache.value[frameIndex] || ''
}

function getBaseBlockPreview(key: string): string {
  const block = BASE_BLOCKDATA[key]
  if (block?.frame?.[0] !== undefined) {
    return getTilePreview(block.frame[0])
  }
  return ''
}

function renderTilesetGrid() {
  if (!pixiApp || !tilesetSheet) return

  pixiApp.stage.removeChildren()

  const cols = 16
  const rows = Math.ceil(tilesetFrameCount.value / cols)

  // キャンバスサイズを調整
  pixiApp.renderer.resize(cols * BLOCKSIZE, rows * BLOCKSIZE)

  // グリッド背景
  const bg = new Graphics()
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const color = (x + y) % 2 === 0 ? 0x333333 : 0x2a2a2a
      bg.rect(x * BLOCKSIZE, y * BLOCKSIZE, BLOCKSIZE, BLOCKSIZE).fill(color)
    }
  }
  pixiApp.stage.addChild(bg)

  // タイルを配置
  for (let i = 0; i < tilesetFrameCount.value; i++) {
    const texture = tilesetSheet.textures[`frame_${i}`]
    if (texture) {
      const sprite = new Sprite(texture)
      sprite.x = (i % cols) * BLOCKSIZE
      sprite.y = Math.floor(i / cols) * BLOCKSIZE
      sprite.eventMode = 'static'
      sprite.cursor = 'pointer'

      sprite.on('pointerdown', () => {
        selectedFrame.value = i
      })

      pixiApp.stage.addChild(sprite)
    }
  }

  // 選択枠を描画
  renderSelectionHighlight()
}

function renderSelectionHighlight() {
  if (!pixiApp) return

  // 既存のハイライトを削除
  const existing = pixiApp.stage.getChildByName('highlight')
  if (existing) {
    pixiApp.stage.removeChild(existing)
  }

  if (selectedFrame.value === null) return

  const cols = 16
  const x = (selectedFrame.value % cols) * BLOCKSIZE
  const y = Math.floor(selectedFrame.value / cols) * BLOCKSIZE

  const highlight = new Graphics()
  highlight.name = 'highlight'
  highlight.rect(x, y, BLOCKSIZE, BLOCKSIZE).stroke({ width: 2, color: 0x00ff00 })
  pixiApp.stage.addChild(highlight)
}

watch(selectedFrame, () => {
  renderSelectionHighlight()
})

function addOverride() {
  if (!selectedBaseBlock.value || selectedFrame.value === null) return

  // 既存のオーバーライドがあれば更新
  const existing = overrides.value.find((o) => o.key === selectedBaseBlock.value)
  if (existing) {
    existing.frame = [selectedFrame.value]
  } else {
    // ベースブロックのtypeを引き継ぐ
    const baseBlock = BASE_BLOCKDATA[selectedBaseBlock.value]
    overrides.value.push({
      key: selectedBaseBlock.value,
      frame: [selectedFrame.value],
      type: baseBlock?.type ?? CollisionType.NONE,
    })
  }

  selectedBaseBlock.value = null
  selectedFrame.value = null
}

function removeOverride(key: string) {
  overrides.value = overrides.value.filter((o) => o.key !== key)
}

async function saveTheme() {
  const blocks: Record<string, BlockData> = {}
  for (const override of overrides.value) {
    blocks[override.key] = {
      frame: override.frame,
      type: override.type,
    }
  }

  try {
    const response = await fetch('/api/save-theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        theme: selectedTheme.value,
        data: { blocks, entities: {} },
      }),
    })

    if (response.ok) {
      alert(`Theme "${selectedTheme.value}" saved!`)
    } else {
      alert('Failed to save theme')
    }
  } catch (e) {
    console.error('Save error:', e)
    alert('Failed to save theme')
  }
}
</script>

<template>
  <div class="theme-editor">
    <div class="header">
      <h2>Theme Override Editor</h2>
      <div class="theme-select">
        <label>Theme:</label>
        <select v-model="selectedTheme">
          <option v-for="theme in themes" :key="theme" :value="theme">
            {{ theme }}
          </option>
        </select>
        <button class="save-btn" @click="saveTheme">Save</button>
      </div>
    </div>

    <div class="main-content">
      <!-- 左カラム: タイルシート -->
      <div class="left-column">
        <div class="tileset-section">
          <h3>Tileset (click to select override target)</h3>
          <div ref="tilesetCanvas" class="tileset-canvas"></div>
          <div v-if="selectedFrame !== null" class="selected-info">
            <img v-if="getTilePreview(selectedFrame)" :src="getTilePreview(selectedFrame)" class="preview-img" />
            <span>Frame {{ selectedFrame }}</span>
          </div>
        </div>
      </div>

      <!-- 右カラム: ベースブロック + オーバーライド -->
      <div class="right-column">
        <!-- ベースブロック選択 -->
        <div class="base-blocks-section">
          <h3>Base Blocks (select which block to override)</h3>
          <div class="base-blocks">
            <div
              v-for="block in baseBlocks"
              :key="block.key"
              class="base-block"
              :class="{ selected: selectedBaseBlock === block.key }"
              :title="`${block.key} (frame ${block.frame?.[0]})`"
              @click="selectedBaseBlock = block.key"
            >
              <img v-if="getBaseBlockPreview(block.key)" :src="getBaseBlockPreview(block.key)" class="block-preview" />
              <span class="block-key">{{ block.key }}</span>
            </div>
          </div>

          <div v-if="selectedBaseBlock && selectedFrame !== null" class="add-override">
            <div class="override-preview">
              <div class="preview-item">
                <img v-if="getBaseBlockPreview(selectedBaseBlock)" :src="getBaseBlockPreview(selectedBaseBlock)" class="preview-img" />
                <span>{{ selectedBaseBlock }}</span>
              </div>
              <span class="arrow">→</span>
              <div class="preview-item">
                <img v-if="getTilePreview(selectedFrame)" :src="getTilePreview(selectedFrame)" class="preview-img" />
                <span>#{{ selectedFrame }}</span>
              </div>
            </div>
            <button @click="addOverride">Add Override</button>
          </div>
        </div>

        <!-- 現在のオーバーライド -->
        <div class="overrides-section">
          <h3>Current Overrides for "{{ selectedTheme }}"</h3>
          <div v-if="overrides.length === 0" class="no-overrides">
            No overrides defined
          </div>
          <div v-else class="overrides-list">
            <div v-for="override in overrides" :key="override.key" class="override-item">
              <div class="override-visual">
                <div class="preview-item">
                  <img v-if="getBaseBlockPreview(override.key)" :src="getBaseBlockPreview(override.key)" class="preview-img" />
                  <span class="override-key">{{ override.key }}</span>
                </div>
                <span class="arrow">→</span>
                <div class="preview-item">
                  <img v-if="getTilePreview(override.frame[0])" :src="getTilePreview(override.frame[0])" class="preview-img" />
                  <span>#{{ override.frame[0] }}</span>
                </div>
              </div>
              <select v-model="override.type" class="override-type">
                <option v-for="ct in collisionTypes" :key="ct.value" :value="ct.value">
                  {{ ct.label }}
                </option>
              </select>
              <button class="remove-btn" @click="removeOverride(override.key)">×</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.theme-editor {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #1a1a1a;
  color: #fff;
  font-family: monospace;
}

.header {
  padding: 12px 16px;
  background: #222;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #333;
  flex-shrink: 0;
}

.header h2 {
  margin: 0;
  font-size: 16px;
}

.theme-select {
  display: flex;
  align-items: center;
  gap: 8px;
}

.theme-select select {
  padding: 6px 10px;
  background: #333;
  color: #fff;
  border: 1px solid #444;
  border-radius: 4px;
  font-family: inherit;
}

.save-btn {
  padding: 6px 14px;
  background: #0a0;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
}

.save-btn:hover {
  background: #0c0;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.left-column {
  width: 300px;
  flex-shrink: 0;
  border-right: 1px solid #333;
  display: flex;
  flex-direction: column;
}

.right-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tileset-section {
  padding: 12px;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.base-blocks-section {
  padding: 12px;
  border-bottom: 1px solid #333;
}

.overrides-section {
  padding: 12px;
  flex: 1;
  overflow-y: auto;
}

h3 {
  margin: 0 0 10px 0;
  font-size: 12px;
  color: #888;
  text-transform: uppercase;
}

.tileset-canvas {
  flex: 1;
  overflow: auto;
  border: 1px solid #333;
  background: #111;
}

.tileset-canvas :deep(canvas) {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.selected-info {
  margin-top: 8px;
  padding: 8px;
  background: #252;
  border: 1px solid #4a4;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-img {
  width: 24px;
  height: 24px;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  border: 1px solid #555;
}

.base-blocks {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.base-block {
  padding: 4px;
  background: #2a2a2a;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.base-block:hover {
  background: #333;
  border-color: #555;
}

.base-block.selected {
  background: #234;
  border-color: #48f;
}

.block-preview {
  width: 20px;
  height: 20px;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.block-key {
  font-size: 11px;
  color: #aaa;
}

.add-override {
  margin-top: 12px;
  padding: 10px;
  background: #252;
  border: 1px solid #4a4;
  border-radius: 4px;
}

.add-override button {
  width: 100%;
  margin-top: 8px;
  padding: 8px 16px;
  background: #0a0;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.add-override button:hover {
  background: #0c0;
}

.override-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.preview-item span {
  font-size: 11px;
  color: #aaa;
}

.arrow {
  font-size: 20px;
  color: #4a4;
}

.no-overrides {
  color: #555;
  font-style: italic;
  padding: 20px;
  text-align: center;
}

.overrides-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.override-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  background: #2a2a2a;
  border-radius: 4px;
}

.override-visual {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.override-visual .preview-item {
  flex-direction: row;
  gap: 6px;
}

.override-visual .preview-img {
  width: 24px;
  height: 24px;
}

.override-visual .arrow {
  font-size: 16px;
  color: #666;
}

.override-key {
  font-weight: bold;
  color: #fff;
}

.override-type {
  padding: 4px 8px;
  background: #333;
  color: #fff;
  border: 1px solid #444;
  border-radius: 4px;
  font-family: inherit;
  font-size: 11px;
}

.remove-btn {
  padding: 4px 10px;
  background: #522;
  color: #faa;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.remove-btn:hover {
  background: #733;
}
</style>
