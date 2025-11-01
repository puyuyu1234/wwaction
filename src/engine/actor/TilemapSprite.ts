import { AssetLoader } from '@core/AssetLoader'
import { BLOCKDATA, BLOCKSIZE } from '@game/config'
import { Container, Sprite } from 'pixi.js'

/**
 * タイルマップをスプライトで描画するクラス
 * - 初期化時に一度だけスプライトを作成
 * - 毎フレーム再描画しない（パフォーマンス最適化）
 * - BLOCKDATAの frame 値を使用してスプライトシート上のフレームを参照
 */
export class TilemapSprite {
  private stage: string[][]
  private tilemapContainer: Container

  constructor(stage: string[][], parent: Container) {
    this.stage = stage
    this.tilemapContainer = new Container()
    parent.addChild(this.tilemapContainer)

    this.renderTilemap()
  }

  /**
   * タイルマップを初期化時に一度だけ描画
   */
  private renderTilemap() {
    const loader = AssetLoader.getInstance()
    const spritesheet = loader.getSpritesheet('tileset')

    if (!spritesheet) {
      console.error('Tileset spritesheet not loaded')
      return
    }

    console.log('[TilemapSprite] Spritesheet loaded:', spritesheet)
    console.log('[TilemapSprite] Available textures:', Object.keys(spritesheet.textures))

    let spriteCount = 0

    for (let y = 0; y < this.stage.length; y++) {
      for (let x = 0; x < this.stage[y].length; x++) {
        const blockKey = this.stage[y][x]

        // 空白やプレイヤー配置はスキップ
        if (blockKey === ' ' || blockKey === '0') continue

        const blockData = BLOCKDATA[blockKey]
        if (!blockData?.frame || blockData.frame.length === 0) {
          console.log(`[TilemapSprite] No block data for "${blockKey}" at (${x}, ${y})`)
          continue
        }

        // frame[0] を使用（アニメーションは後で実装）
        const frameIndex = blockData.frame[0]
        const frameName = `frame_${frameIndex}`

        // スプライトシートから直接テクスチャを取得
        const texture = spritesheet.textures[frameName]

        if (!texture) {
          console.warn(`[TilemapSprite] Frame "${frameName}" not found for block "${blockKey}" (index: ${frameIndex})`)
          console.log('[TilemapSprite] Available texture keys:', Object.keys(spritesheet.textures).slice(0, 10))
          continue
        }

        const sprite = new Sprite(texture)
        sprite.x = x * BLOCKSIZE
        sprite.y = y * BLOCKSIZE
        sprite.width = BLOCKSIZE
        sprite.height = BLOCKSIZE

        // パラメータ処理（透明度など）
        if (blockData.param?.alpha !== undefined) {
          sprite.alpha = blockData.param.alpha
        }

        // レイヤー処理（TODO: 将来実装）
        // if (blockData.param?.layer === 'top') { ... }

        this.tilemapContainer.addChild(sprite)
        spriteCount++
      }
    }

    console.log(`[TilemapSprite] Created ${spriteCount} tile sprites`)
    console.log('[TilemapSprite] Container children:', this.tilemapContainer.children.length)
  }

  /**
   * タイルマップを破棄
   */
  destroy() {
    this.tilemapContainer.destroy({ children: true })
  }
}
