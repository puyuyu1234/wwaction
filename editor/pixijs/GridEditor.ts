import { Application, Container, Sprite, Graphics, Spritesheet, Assets, SCALE_MODES } from 'pixi.js'
import { BLOCKDATA, BLOCKSIZE, ENTITYDATA } from '../../src/game/config'
import { EventEmitter } from 'eventemitter3'

/**
 * ステージエディタのグリッド描画とインタラクション
 */
export class GridEditor extends EventEmitter {
  public app!: Application
  private grid: Container
  private tiles: string[][]
  private sprites: (Sprite | Graphics)[][]
  private width: number
  private height: number
  private tilesetSpritesheet?: Spritesheet
  private entitySpritesheet?: Spritesheet

  constructor(width: number, height: number) {
    super()
    this.width = width
    this.height = height
    this.tiles = []
    this.sprites = []
    this.grid = new Container()
  }

  async init() {
    this.app = new Application()
    await this.app.init({
      width: this.width * BLOCKSIZE,
      height: this.height * BLOCKSIZE,
      backgroundColor: 0x1a1a1a,
    })

    // アセット読込
    await this.loadAssets()

    this.app.stage.addChild(this.grid)
    this.setupInteraction()
  }

  private async loadAssets() {
    // PixiJS Assets を初期化
    await Assets.init({ basePath: '/assets/' })

    // タイルセットスプライトシート読込
    this.tilesetSpritesheet = await Assets.load<Spritesheet>({
      src: 'spritesheets/tileset.json',
      alias: 'tileset',
      data: { cachePrefix: 'tileset_' },
    })

    // エンティティスプライトシート読込
    this.entitySpritesheet = await Assets.load<Spritesheet>({
      src: 'spritesheets/entity.json',
      alias: 'entity',
      data: { cachePrefix: 'entity_' },
    })

    // ピクセルアート用にNEARESTスケール設定
    const setNearestScale = (sheet?: Spritesheet) => {
      if (!sheet) return
      Object.values(sheet.textures).forEach((texture) => {
        if (texture.source) {
          texture.source.scaleMode = SCALE_MODES.NEAREST
        }
      })
    }

    setNearestScale(this.tilesetSpritesheet)
    setNearestScale(this.entitySpritesheet)
  }

  private setupInteraction() {
    this.grid.eventMode = 'static'
    this.grid.on('pointerdown', (event) => {
      const x = Math.floor(event.globalX / BLOCKSIZE)
      const y = Math.floor(event.globalY / BLOCKSIZE)
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        this.emit('tileClick', x, y)
      }
    })
  }

  setTile(x: number, y: number, tile: string) {
    if (!this.tiles[y]) return
    this.tiles[y][x] = tile

    // 既存スプライト削除
    if (this.sprites[y]?.[x]) {
      this.grid.removeChild(this.sprites[y][x])
      this.sprites[y][x].destroy()
    }

    // 新規スプライト作成
    const sprite = this.createTileSprite(tile, x, y)
    if (!this.sprites[y]) {
      this.sprites[y] = []
    }
    this.sprites[y][x] = sprite
    this.grid.addChild(sprite)
  }

  private createTileSprite(tile: string, x: number, y: number): Sprite | Graphics {
    const posX = x * BLOCKSIZE
    const posY = y * BLOCKSIZE

    // エンティティチェック
    const entityData = ENTITYDATA[tile as keyof typeof ENTITYDATA]
    if (entityData) {
      // エンティティはプレースホルダーで描画（仮）
      const placeholder = new Graphics()
        .rect(posX, posY, BLOCKSIZE, BLOCKSIZE)
        .fill(0xff00ff)

      // ラベル追加
      const text = new Graphics()
        .rect(posX + 2, posY + 2, 12, 12)
        .fill(0x000000)
      placeholder.addChild(text)

      return placeholder
    }

    // タイルブロックチェック
    const blockData = BLOCKDATA[tile]
    if (!blockData?.frame || blockData.frame.length === 0) {
      // 空タイルはグリッド線のみ
      return new Graphics()
        .rect(posX, posY, BLOCKSIZE, BLOCKSIZE)
        .stroke({ width: 1, color: 0x333333 })
    }

    // スプライト作成
    const frameIndex = blockData.frame[0]
    const frameName = `frame_${frameIndex}`
    const texture = this.tilesetSpritesheet?.textures[frameName]

    if (!texture) {
      console.warn(`Texture not found: ${frameName}`)
      return new Graphics()
        .rect(posX, posY, BLOCKSIZE, BLOCKSIZE)
        .fill(0xff0000)
    }

    const sprite = new Sprite(texture)
    sprite.x = posX
    sprite.y = posY
    sprite.width = BLOCKSIZE
    sprite.height = BLOCKSIZE

    // 透明度設定
    if (blockData.param?.alpha !== undefined) {
      sprite.alpha = blockData.param.alpha
    }

    return sprite
  }

  loadStage(data: string[][]) {
    this.tiles = data
    this.sprites = Array(this.height)
      .fill(null)
      .map(() => [])
    this.grid.removeChildren()

    // グリッド背景描画
    this.drawGridBackground()

    // タイル配置
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = data[y]?.[x] ?? ' '
        this.setTile(x, y, tile)
      }
    }
  }

  private drawGridBackground() {
    const bg = new Graphics()
    for (let y = 0; y <= this.height; y++) {
      bg.moveTo(0, y * BLOCKSIZE).lineTo(this.width * BLOCKSIZE, y * BLOCKSIZE).stroke({ width: 1, color: 0x333333 })
    }
    for (let x = 0; x <= this.width; x++) {
      bg.moveTo(x * BLOCKSIZE, 0).lineTo(x * BLOCKSIZE, this.height * BLOCKSIZE).stroke({ width: 1, color: 0x333333 })
    }
    bg.zIndex = -1
    this.grid.addChild(bg)
    this.grid.sortableChildren = true
  }
}
