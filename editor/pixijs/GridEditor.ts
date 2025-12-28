import { EventEmitter } from 'eventemitter3'
import { Application, Container, Sprite, Graphics, Spritesheet, Text } from 'pixi.js'

import { BLOCKDATA, BLOCKSIZE, ENTITYDATA } from '../../src/game/config'
import { EDITOR_CONFIG } from '../config'
import { useAssets } from '../composables/useAssets'

/**
 * ステージエディタのグリッド描画とインタラクション
 */
export class GridEditor extends EventEmitter {
  public app!: Application
  private grid: Container
  private tiles: string[][] // 現在のレイヤーのタイルデータ
  private allLayers: string[][][] = [] // 全レイヤーデータ
  private currentLayerIndex = 0 // 現在編集中のレイヤー
  private layerContainers: Container[] = [] // 各レイヤーのコンテナ
  private sprites: (Sprite | Graphics)[][]
  private width: number
  private height: number
  private tilesetSpritesheet?: Spritesheet
  private entitySpritesheet?: Spritesheet
  private isDragging = false
  private stageBorder?: Graphics // ステージ境界線（黄色）
  private marginBorder?: Graphics // マージン境界線（赤）
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

  async init(_container?: HTMLElement) {
    // containerは将来的な拡張用に残している
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
    // useAssets composable を使用してアセット読込
    const { loadAllSpritesheets } = useAssets()
    const { tileset, entity } = await loadAllSpritesheets()

    this.tilesetSpritesheet = tileset
    this.entitySpritesheet = entity
  }

  private setupInteraction() {
    this.grid.eventMode = 'static'
    this.grid.hitArea = this.app.screen
    const canvas = this.app.canvas as HTMLCanvasElement

    // 右クリックメニューを無効化
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault()
    })

    // ドラッグ開始
    this.grid.on('pointerdown', (event) => {
      const canvasX = Math.floor(event.globalX / BLOCKSIZE)
      const canvasY = Math.floor(event.globalY / BLOCKSIZE)
      // マージンを引いてステージ座標に変換
      const stageX = canvasX - EDITOR_CONFIG.MARGIN
      const stageY = canvasY - EDITOR_CONFIG.MARGIN

      // 右クリック（button: 2）でスポイト
      if (event.button === 2) {
        const tile = this.tiles[stageY]?.[stageX] ?? ' '
        this.emit('tilePick', tile)
        return
      }

      // 左クリックでタイル配置（Canvas座標のまま渡す）
      this.isDragging = true
      this.emit('tileClick', canvasX, canvasY)
    })

    // ドラッグ中
    this.grid.on('pointermove', (event) => {
      if (!this.isDragging) return

      const x = Math.floor(event.globalX / BLOCKSIZE)
      const y = Math.floor(event.globalY / BLOCKSIZE)

      // 範囲チェック削除（無制限に対応）
      this.emit('tileClick', x, y)
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

  /**
   * 全レイヤーを読み込んで描画
   */
  loadAllLayers(layers: string[][][], currentLayer: number) {
    if (!this.app) {
      console.error('[GridEditor.loadAllLayers] Application未初期化')
      return
    }

    this.allLayers = layers
    this.currentLayerIndex = currentLayer
    this.tiles = layers[currentLayer] || []

    // 全レイヤーからステージサイズを計算
    this.calculateActualStageSizeFromAllLayers(layers)

    // キャンバスサイズを動的に設定
    const canvasWidth = this.actualStageWidth + EDITOR_CONFIG.MARGIN * 2
    const canvasHeight = this.actualStageHeight + EDITOR_CONFIG.MARGIN * 2
    this.width = canvasWidth
    this.height = canvasHeight

    // PixiJSアプリのサイズを更新
    this.app.renderer.resize(canvasWidth * BLOCKSIZE, canvasHeight * BLOCKSIZE)
    this.grid.hitArea = this.app.screen

    // 既存のコンテンツをクリア
    this.grid.removeChildren()
    this.layerContainers = []
    this.sprites = Array(this.height).fill(null).map(() => [])

    // グリッド背景描画
    this.drawGridBackground()

    // 全レイヤーを描画（下から順に）
    for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
      const layerContainer = new Container()
      layerContainer.zIndex = layerIndex
      layerContainer.sortableChildren = true

      // 現在のレイヤー以外は半透明
      if (layerIndex !== currentLayer) {
        layerContainer.alpha = 0.4
      }

      const layerData = layers[layerIndex] || []
      this.renderLayerToContainer(layerData, layerContainer, layerIndex === currentLayer)

      this.layerContainers.push(layerContainer)
      this.grid.addChild(layerContainer)
    }

    // ステージ境界線描画
    this.drawStageBorder()
  }

  /**
   * レイヤーをコンテナに描画
   */
  private renderLayerToContainer(data: string[][], container: Container, isCurrentLayer: boolean) {
    for (let y = 0; y < data.length; y++) {
      const row = data[y]
      if (!row) continue
      for (let x = 0; x < row.length; x++) {
        const tile = row[x] ?? ' '
        const sprite = this.createTileSprite(tile, x, y)
        container.addChild(sprite)

        // 現在のレイヤーならsprites配列にも保持
        if (isCurrentLayer) {
          if (!this.sprites[y]) this.sprites[y] = []
          this.sprites[y][x] = sprite
        }
      }
    }
  }

  /**
   * 全レイヤーからステージサイズを計算
   */
  private calculateActualStageSizeFromAllLayers(layers: string[][][]) {
    let maxX = 0
    let maxY = 0

    for (const layer of layers) {
      for (let y = 0; y < layer.length; y++) {
        const row = layer[y]
        if (!row) continue
        for (let x = 0; x < row.length; x++) {
          const tile = row[x]
          if (tile && tile !== ' ') {
            maxX = Math.max(maxX, x + 1)
            maxY = Math.max(maxY, y + 1)
          }
        }
      }
    }

    this.actualStageWidth = Math.max(maxX, 20)
    this.actualStageHeight = Math.max(maxY, 15)
  }

  /**
   * 後方互換用: 単一レイヤーを読み込み
   */
  loadStage(data: string[][]) {
    this.loadAllLayers([data], 0)
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
    if (this.marginBorder) {
      this.grid.removeChild(this.marginBorder)
      this.marginBorder.destroy()
    }

    // ステージ境界線（黄色）
    this.stageBorder = new Graphics()
    const stageX = EDITOR_CONFIG.MARGIN * BLOCKSIZE
    const stageY = EDITOR_CONFIG.MARGIN * BLOCKSIZE
    const stageWidth = this.actualStageWidth * BLOCKSIZE
    const stageHeight = this.actualStageHeight * BLOCKSIZE

    this.stageBorder
      .rect(stageX, stageY, stageWidth, stageHeight)
      .stroke({
        width: EDITOR_CONFIG.STAGE_BORDER_WIDTH,
        color: EDITOR_CONFIG.STAGE_BORDER_COLOR,
      })

    this.stageBorder.zIndex = 1000 // 最前面に表示
    this.grid.addChild(this.stageBorder)

    // マージン境界線（赤）- キャンバス全体の外枠
    this.marginBorder = new Graphics()
    const marginWidth = (this.actualStageWidth + EDITOR_CONFIG.MARGIN * 2) * BLOCKSIZE
    const marginHeight = (this.actualStageHeight + EDITOR_CONFIG.MARGIN * 2) * BLOCKSIZE

    this.marginBorder
      .rect(0, 0, marginWidth, marginHeight)
      .stroke({
        width: 2,
        color: 0xff0000, // 赤
      })

    this.marginBorder.zIndex = 1001 // ステージ境界線より前面
    this.grid.addChild(this.marginBorder)

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
    this.grid.hitArea = this.app.screen

    // 全レイヤーを再描画（サイズ変更時は完全再描画）
    this.loadAllLayers(this.allLayers, this.currentLayerIndex)
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
