import { BLOCKSIZE } from '@game/config'
import { BlockDataMap } from '@game/types'
import { AssetLoader } from '@ptre/core/AssetLoader'
import { Container, Sprite } from 'pixi.js'

export interface TilemapRendererConfig {
  /** ステージデータ（文字列配列の配列、レイヤーごと） */
  stages: string[][]
  /** ブロックデータマップ */
  blockData: BlockDataMap
}

/**
 * タイルマップを描画するクラス
 * - 全レイヤーをパースしてスプライトを配置
 * - レイヤーごとにzIndexを設定
 */
export class TilemapRenderer {
  readonly container: Container

  constructor(config: TilemapRendererConfig) {
    const { stages, blockData } = config

    this.container = new Container()
    this.container.sortableChildren = true

    this.renderAllLayers(stages, blockData)
  }

  /**
   * 全レイヤーを描画
   */
  private renderAllLayers(stages: string[][], blockData: BlockDataMap) {
    for (let layerIndex = 0; layerIndex < stages.length; layerIndex++) {
      const layerData = stages[layerIndex].map((row) => row.split(''))
      this.renderLayer(layerData, layerIndex, blockData)
    }
  }

  /**
   * 単一レイヤーを描画
   */
  private renderLayer(layerData: string[][], layerIndex: number, blockData: BlockDataMap) {
    const tileset = AssetLoader.getInstance().getSpritesheet('tileset')
    if (!tileset) {
      console.error('Tileset not loaded')
      return
    }

    const layerContainer = new Container()
    layerContainer.zIndex = layerIndex

    for (let y = 0; y < layerData.length; y++) {
      for (let x = 0; x < layerData[y].length; x++) {
        const char = layerData[y][x]
        if (char === ' ' || char === '0') continue

        // blockDataからフレーム番号を取得
        const block = blockData[char]
        if (!block || block.frame[0] === 0) continue

        // フレーム番号でテクスチャを取得
        const frameIndex = block.frame[0]
        const texture = tileset.textures[`frame_${frameIndex}`]
        if (texture) {
          const sprite = new Sprite(texture)
          sprite.x = x * BLOCKSIZE
          sprite.y = y * BLOCKSIZE
          layerContainer.addChild(sprite)
        }
      }
    }

    this.container.addChild(layerContainer)
  }

  destroy() {
    this.container.destroy({ children: true })
  }
}
