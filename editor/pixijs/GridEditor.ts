import { Application, Container, Sprite, Graphics, Spritesheet, Assets, SCALE_MODES, Text } from 'pixi.js'
import { BLOCKDATA, BLOCKSIZE, ENTITYDATA, EDITOR_CONFIG } from '../../src/game/config'
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
  private isDragging = false
  private container?: HTMLElement
  private stageBorder?: Graphics // ステージ境界線
  private actualStageWidth = 0 // 実際のステージ幅（空白除く）
  private actualStageHeight = 0 // 実際のステージ高さ（空白除く）

  constructor(width: number, height: number) {
    super()
    this.width = width
    this.height = height
    this.tiles = []
    this.sprites = []
    this.grid = new Container()
  }

  async init(container?: HTMLElement) {
    this.container = container
    this.app = new Application()
    await this.app.init({
      width: this.width * BLOCKSIZE,
      height: this.height * BLOCKSIZE,
      backgroundColor: 0x1a1a1a,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
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
    const canvas = this.app.canvas as HTMLCanvasElement

    // 右クリックメニューを無効化
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault()
    })

    // ドラッグ開始
    this.grid.on('pointerdown', (event) => {
      const x = Math.floor(event.globalX / BLOCKSIZE)
      const y = Math.floor(event.globalY / BLOCKSIZE)

      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        // 右クリック（button: 2）でスポイト
        if (event.button === 2) {
          const tile = this.tiles[y]?.[x]
          if (tile) {
            this.emit('tilePick', tile)
          }
          return
        }

        // 左クリックでタイル配置
        this.isDragging = true
        this.emit('tileClick', x, y)
      }
    })

    // ドラッグ中
    this.grid.on('pointermove', (event) => {
      if (!this.isDragging) return

      const x = Math.floor(event.globalX / BLOCKSIZE)
      const y = Math.floor(event.globalY / BLOCKSIZE)

      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        this.emit('tileClick', x, y)
      }
    })

    // ドラッグ終了
    this.grid.on('pointerup', () => {
      this.isDragging = false
    })
    this.grid.on('pointerupoutside', () => {
      this.isDragging = false
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
    // マージン分のオフセットを考慮
    const posX = (x + EDITOR_CONFIG.MARGIN) * BLOCKSIZE
    const posY = (y + EDITOR_CONFIG.MARGIN) * BLOCKSIZE

    // エンティティチェック（'0'=Player も含む）
    const entityData = ENTITYDATA[tile as keyof typeof ENTITYDATA]
    const isEntity = entityData || tile === '0'
    if (isEntity) {
      // エンティティはプレースホルダーで描画（仮）
      const placeholder = new Graphics()
        .rect(posX, posY, BLOCKSIZE, BLOCKSIZE)
        .fill(0xff00ff)

      // 文字ラベル追加
      const text = new Text({
        text: tile,
        style: {
          fontFamily: 'monospace',
          fontSize: 12,
          fill: 0xffffff,
        },
      })
      text.x = posX + BLOCKSIZE / 2
      text.y = posY + BLOCKSIZE / 2
      text.anchor.set(0.5, 0.5)
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
    // 実際のステージサイズを計算（空白を除く最大範囲）
    this.calculateActualStageSize(data)

    // キャンバスサイズを動的に設定
    const canvasWidth = this.actualStageWidth + EDITOR_CONFIG.MARGIN * 2
    const canvasHeight = this.actualStageHeight + EDITOR_CONFIG.MARGIN * 2
    this.width = canvasWidth
    this.height = canvasHeight

    // PixiJSアプリのサイズを更新
    this.app.renderer.resize(canvasWidth * BLOCKSIZE, canvasHeight * BLOCKSIZE)

    this.tiles = data
    this.sprites = Array(this.height)
      .fill(null)
      .map(() => [])
    this.grid.removeChildren()

    // グリッド背景描画
    this.drawGridBackground()

    // ステージ境界線描画
    this.drawStageBorder()

    // タイル配置（ステージデータのみ、マージンは空）
    for (let y = 0; y < data.length; y++) {
      const row = data[y]
      if (!row) continue
      for (let x = 0; x < row.length; x++) {
        const tile = row[x] ?? ' '
        this.setTile(x, y, tile)
      }
    }
  }

  /**
   * 実際のステージサイズを計算（空白を除く）
   */
  private calculateActualStageSize(data: string[][]) {
    let maxX = 0
    let maxY = 0

    for (let y = 0; y < data.length; y++) {
      const row = data[y]
      if (!row) continue

      for (let x = 0; x < row.length; x++) {
        const tile = row[x]
        if (tile && tile !== ' ') {
          maxX = Math.max(maxX, x + 1)
          maxY = Math.max(maxY, y + 1)
        }
      }
    }

    // 最低サイズを保証（20x15）
    this.actualStageWidth = Math.max(maxX, 20)
    this.actualStageHeight = Math.max(maxY, 15)
  }

  /**
   * ステージ境界線を描画
   */
  private drawStageBorder() {
    // 既存の境界線を削除
    if (this.stageBorder) {
      this.grid.removeChild(this.stageBorder)
      this.stageBorder.destroy()
    }

    // 新規境界線作成
    this.stageBorder = new Graphics()
    const borderX = EDITOR_CONFIG.MARGIN * BLOCKSIZE
    const borderY = EDITOR_CONFIG.MARGIN * BLOCKSIZE
    const borderWidth = this.actualStageWidth * BLOCKSIZE
    const borderHeight = this.actualStageHeight * BLOCKSIZE

    this.stageBorder
      .rect(borderX, borderY, borderWidth, borderHeight)
      .stroke({
        width: EDITOR_CONFIG.STAGE_BORDER_WIDTH,
        color: EDITOR_CONFIG.STAGE_BORDER_COLOR,
      })

    this.stageBorder.zIndex = 1000 // 最前面に表示
    this.grid.addChild(this.stageBorder)
    this.grid.sortableChildren = true
  }

  /**
   * ステージサイズを更新してリロード
   */
  updateStageSize(width: number, height: number) {
    this.actualStageWidth = Math.max(width, 20)
    this.actualStageHeight = Math.max(height, 15)

    // キャンバスサイズを再計算
    const canvasWidth = this.actualStageWidth + EDITOR_CONFIG.MARGIN * 2
    const canvasHeight = this.actualStageHeight + EDITOR_CONFIG.MARGIN * 2
    this.width = canvasWidth
    this.height = canvasHeight

    // PixiJSアプリのサイズを更新
    this.app.renderer.resize(canvasWidth * BLOCKSIZE, canvasHeight * BLOCKSIZE)

    // 境界線を再描画
    this.drawStageBorder()

    // グリッド背景を再描画
    this.grid.removeChildren()
    this.drawGridBackground()
    this.drawStageBorder()

    // スプライトを再配置
    for (let y = 0; y < this.tiles.length; y++) {
      for (let x = 0; x < (this.tiles[y]?.length ?? 0); x++) {
        const tile = this.tiles[y][x]
        if (tile) {
          this.setTile(x, y, tile)
        }
      }
    }
  }

  private drawGridBackground() {
    const bg = new Graphics()
    const marginStart = EDITOR_CONFIG.MARGIN
    const marginEnd = marginStart + this.actualStageWidth
    const marginEndY = marginStart + this.actualStageHeight

    for (let y = 0; y <= this.height; y++) {
      // ステージ内かマージンかで色を変える
      const isInStage = y >= marginStart && y <= marginEndY
      const color = isInStage ? EDITOR_CONFIG.STAGE_GRID_COLOR : EDITOR_CONFIG.MARGIN_GRID_COLOR
      bg.moveTo(0, y * BLOCKSIZE).lineTo(this.width * BLOCKSIZE, y * BLOCKSIZE).stroke({ width: 1, color })
    }
    for (let x = 0; x <= this.width; x++) {
      // ステージ内かマージンかで色を変える
      const isInStage = x >= marginStart && x <= marginEnd
      const color = isInStage ? EDITOR_CONFIG.STAGE_GRID_COLOR : EDITOR_CONFIG.MARGIN_GRID_COLOR
      bg.moveTo(x * BLOCKSIZE, 0).lineTo(x * BLOCKSIZE, this.height * BLOCKSIZE).stroke({ width: 1, color })
    }
    bg.zIndex = -1
    this.grid.addChild(bg)
    this.grid.sortableChildren = true
  }
}
