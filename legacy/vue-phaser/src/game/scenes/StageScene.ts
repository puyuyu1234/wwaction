import Phaser from 'phaser'
import { STAGE_DATA } from '../data/stageData'
import { BLOCK_DATA } from '../data/blockData'
import { BLOCKSIZE } from '../types'
import { Player } from '../entities/Player'

export class StageScene extends Phaser.Scene {
  private stageNum: number = 0
  private player?: Player
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private tilemap?: Phaser.Tilemaps.Tilemap
  private collisionLayer?: Phaser.Tilemaps.TilemapLayer

  constructor() {
    super({ key: 'StageScene' })
  }

  preload() {
    // スプライトシートの読み込み
    // 6列 x 6行のスプライトシート (24x32ピクセル)
    this.load.spritesheet('player', '/assets/img/player.gif', {
      frameWidth: 24,
      frameHeight: 32
    })

    this.load.spritesheet('block', '/assets/img/tileset.gif', {
      frameWidth: 16,
      frameHeight: 16
    })

    this.load.spritesheet('entity', '/assets/img/entity.gif', {
      frameWidth: 16,
      frameHeight: 16
    })

    this.load.spritesheet('wind', '/assets/img/wind.gif', {
      frameWidth: 32,
      frameHeight: 32
    })

    // 音声の読み込み
    this.load.audio('jump', '/assets/sound/jump.mp3')
    this.load.audio('wind', '/assets/sound/wind.mp3')
    this.load.audio('heal', '/assets/sound/heal.mp3')
    this.load.audio('damage', '/assets/sound/gameover.mp3')
  }

  create() {
    // 背景色
    this.cameras.main.setBackgroundColor('#68a')

    // ステージデータ取得
    const stageData = STAGE_DATA[this.stageNum]
    if (!stageData) {
      console.error('ステージデータが見つかりません')
      return
    }

    // マップデータをレンダリング（Tilemapベース）
    const playerStartPos = this.renderMap(stageData.stages[0] ?? [])

    // プレイヤー作成
    if (playerStartPos) {
      this.player = new Player(this, playerStartPos.x, playerStartPos.y)

      // プレイヤーと衝突レイヤーの衝突設定
      if (this.collisionLayer) {
        this.physics.add.collider(this.player, this.collisionLayer)
      }
    }

    // キーボード入力設定
    this.cursors = this.input.keyboard?.createCursorKeys()

    // カメラをプレイヤーに追従
    if (this.player) {
      this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    }

    // デバッグ情報
    const debugText = this.add.text(10, 10, '[デバッグ情報]\nステージ: ' + stageData.name + '\nWASD: 移動 | Space: 風 | R: リトライ', {
      fontSize: '12px',
      fontFamily: '"MS Gothic", "ＭＳ ゴシック", monospace',
      color: '#ffffff',
      backgroundColor: '#000000cc',
      padding: { x: 5, y: 5 }
    })
    debugText.setScrollFactor(0)
  }

  private renderMap(mapData: string[]): { x: number; y: number } | null {
    const mapHeight = mapData.length
    const mapWidth = mapData[0]?.length ?? 0
    console.log('マップサイズ:', mapWidth, 'x', mapHeight)

    let playerStartPos: { x: number; y: number } | null = null

    // 動的にTilemapを作成
    this.tilemap = this.make.tilemap({
      tileWidth: BLOCKSIZE,
      tileHeight: BLOCKSIZE,
      width: mapWidth,
      height: mapHeight
    })

    // タイルセットを追加
    const tileset = this.tilemap.addTilesetImage('block', 'block', BLOCKSIZE, BLOCKSIZE, 0, 0)
    if (!tileset) {
      console.error('タイルセットの作成に失敗しました')
      return null
    }

    // レイヤーを作成（視覚用と衝突用）
    const visualLayer = this.tilemap.createBlankLayer('visual', tileset, 0, 0)
    const collisionLayer = this.tilemap.createBlankLayer('collision', tileset, 0, 0)

    if (!visualLayer || !collisionLayer) {
      console.error('レイヤーの作成に失敗しました')
      return null
    }

    this.collisionLayer = collisionLayer

    // 衝突レイヤーを不可視に
    this.collisionLayer.setVisible(false)

    // マップデータを解析してタイルを配置
    for (let y = 0; y < mapHeight; y++) {
      const row = mapData[y]
      if (!row) continue

      for (let x = 0; x < mapWidth; x++) {
        const char = row[x]
        if (!char || char === ' ') continue

        // ブロックデータを取得
        const blockData = BLOCK_DATA[char]
        if (!blockData) {
          console.warn(`ブロックデータが見つかりません: "${char}" at (${x}, ${y})`)
          continue
        }

        // 特殊エンティティの処理
        if (char === '0') {
          // プレイヤー開始位置（1ブロック上に配置）
          playerStartPos = { x: x * BLOCKSIZE, y: (y - 1) * BLOCKSIZE }
          continue
        }

        if (char === '1' || char === '2' || char === '3' || char === '4' || char === '5' || char === '*') {
          // エンティティ（後で実装）
          continue
        }

        // 通常ブロックの描画（frameがあるものは全て描画）
        if (blockData.frame.length > 0) {
          const tileIndex = blockData.frame[0]
          if (tileIndex === undefined) continue

          // 視覚レイヤーにタイルを配置
          const tile = visualLayer.putTileAt(tileIndex, x, y)

          // 透明度設定
          if (tile && blockData.param?.alpha !== undefined) {
            tile.setAlpha(blockData.param.alpha)
          }

          // 衝突レイヤーにも配置（platformまたはsolidタイプのみ）
          if (blockData.collision === 'platform' || blockData.collision === 'solid') {
            collisionLayer.putTileAt(tileIndex, x, y)
          }
        }
      }
    }

    // 衝突レイヤーの全タイルに衝突を設定
    this.collisionLayer.setCollisionByExclusion([-1])

    // カメラの設定
    const stageWidth = mapWidth * BLOCKSIZE
    const stageHeight = mapHeight * BLOCKSIZE

    console.log('ステージサイズ:', stageWidth, 'x', stageHeight)

    this.cameras.main.setBounds(0, 0, stageWidth, stageHeight)
    this.physics.world.setBounds(0, 0, stageWidth, stageHeight)

    return playerStartPos
  }

  update() {
    if (this.player) {
      this.player.update(this.cursors ?? null)
    }
  }
}
