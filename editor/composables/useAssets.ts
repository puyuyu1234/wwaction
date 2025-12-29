import { Assets, Spritesheet, SCALE_MODES } from 'pixi.js'

/**
 * PixiJS アセット管理用 composable
 * - Assets.init は1回のみ実行
 * - スプライトシートのキャッシュ管理
 * - 各コンポーネントから共通利用
 */

let isInitialized = false
let tilesetSpritesheet: Spritesheet | null = null
let entitySpritesheet: Spritesheet | null = null

export function useAssets() {
  /**
   * Assets を初期化（初回のみ）
   */
  async function initAssets() {
    if (isInitialized) {
      return
    }

    await Assets.init({ basePath: '/assets/' })
    isInitialized = true
  }

  /**
   * タイルセットスプライトシートを読み込み（キャッシュあり）
   */
  async function loadTilesetSpritesheet(): Promise<Spritesheet> {
    if (tilesetSpritesheet) {
      return tilesetSpritesheet
    }

    tilesetSpritesheet = await Assets.load<Spritesheet>({
      src: 'spritesheets/tileset.json',
      alias: 'tileset',
      data: { cachePrefix: 'tileset_' },
    })

    // ピクセルアート用にNEARESTスケール設定
    Object.values(tilesetSpritesheet.textures).forEach((texture) => {
      if (texture.source) {
        texture.source.scaleMode = SCALE_MODES.NEAREST
      }
    })

    return tilesetSpritesheet
  }

  /**
   * エンティティスプライトシートを読み込み（キャッシュあり）
   */
  async function loadEntitySpritesheet(): Promise<Spritesheet> {
    if (entitySpritesheet) {
      return entitySpritesheet
    }

    entitySpritesheet = await Assets.load<Spritesheet>({
      src: 'spritesheets/entity.json',
      alias: 'entity',
      data: { cachePrefix: 'entity_' },
    })

    // ピクセルアート用にNEARESTスケール設定
    Object.values(entitySpritesheet.textures).forEach((texture) => {
      if (texture.source) {
        texture.source.scaleMode = SCALE_MODES.NEAREST
      }
    })

    return entitySpritesheet
  }

  /**
   * すべてのスプライトシートを読み込み
   */
  async function loadAllSpritesheets() {
    await initAssets()

    const [tileset, entity] = await Promise.all([
      loadTilesetSpritesheet(),
      loadEntitySpritesheet(),
    ])

    return { tileset, entity }
  }

  return {
    initAssets,
    loadTilesetSpritesheet,
    loadEntitySpritesheet,
    loadAllSpritesheets,
    isInitialized: () => isInitialized,
  }
}
