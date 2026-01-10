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
let playerSpritesheet: Spritesheet | null = null

export function useAssets() {
  /**
   * Assets を初期化（初回のみ）
   */
  async function initAssets() {
    if (isInitialized) {
      return
    }

    await Assets.init({ basePath: `${import.meta.env.BASE_URL}assets/` })
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
   * プレイヤースプライトシートを読み込み（キャッシュあり）
   */
  async function loadPlayerSpritesheet(): Promise<Spritesheet> {
    if (playerSpritesheet) {
      return playerSpritesheet
    }

    playerSpritesheet = await Assets.load<Spritesheet>({
      src: 'spritesheets/player.json',
      alias: 'player',
      data: { cachePrefix: 'player_' },
    })

    // ピクセルアート用にNEARESTスケール設定
    Object.values(playerSpritesheet.textures).forEach((texture) => {
      if (texture.source) {
        texture.source.scaleMode = SCALE_MODES.NEAREST
      }
    })

    return playerSpritesheet
  }

  /**
   * すべてのスプライトシートを読み込み
   */
  async function loadAllSpritesheets() {
    await initAssets()

    const [tileset, entity, player] = await Promise.all([
      loadTilesetSpritesheet(),
      loadEntitySpritesheet(),
      loadPlayerSpritesheet(),
    ])

    return { tileset, entity, player }
  }

  return {
    initAssets,
    loadTilesetSpritesheet,
    loadEntitySpritesheet,
    loadPlayerSpritesheet,
    loadAllSpritesheets,
    isInitialized: () => isInitialized,
  }
}
