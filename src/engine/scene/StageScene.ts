import { Input } from '@core/Input'
import { Entity } from '@entity/Entity'
import { Gurasan } from '@entity/Gurasan'
import { GurasanNotFall } from '@entity/GurasanNotFall'
import { Nasake } from '@entity/Nasake'
import { Nuefu } from '@entity/Nuefu'
import { Player } from '@entity/Player'
import { Potion } from '@entity/Potion'
import { STAGEDATA, BLOCKSIZE, FONT, DEBUG, AUDIO_ASSETS, ENTITYDATA } from '@game/config'
import { Graphics, Container, Text } from 'pixi.js'

import { Scene } from './Scene'

import { AudioManager } from '@/audio/AudioManager'
import { HPBar } from '@/engine/actor/HPBar'

/**
 * ステージシーン
 * プレイヤーとステージを管理（PixiJS版）
 */
export class StageScene extends Scene {
  private stage: string[][]
  private player: Player // デバッグ情報用に参照を保持
  private entities: Entity[] = [] // プレイヤーを含む全エンティティ
  private stageGraphics: Graphics
  private entitiesGraphics: Graphics
  private camera: Container
  private debugText!: Text
  private hpBar!: HPBar // HP表示（通常UI）
  private input: Input
  private audio = AudioManager.getInstance()
  // private stageIndex: number // 将来的にステージ別BGMで使用予定
  private stageWidth: number // ステージ幅（ピクセル）
  private stageHeight: number // ステージ高さ（ピクセル）
  private viewportWidth: number // ビューポート幅（Game.tsのbaseWidthから取得）
  private viewportHeight: number // ビューポート高さ（Game.tsのbaseHeightから取得）

  constructor(stageIndex: number, input: Input, viewportWidth = 320, viewportHeight = 240) {
    super()
    this.input = input
    // this.stageIndex = stageIndex // 将来的にステージ別BGMで使用予定
    this.viewportWidth = viewportWidth
    this.viewportHeight = viewportHeight

    // ステージデータ取得
    const stageData = STAGEDATA[stageIndex]
    if (!stageData?.stages?.[0]) {
      throw new Error(`Stage ${stageIndex} not found`)
    }

    // stages[0] は string[] の配列なので、それを文字の2次元配列に変換
    this.stage = stageData.stages[0].map((row) => row.split(''))

    // ステージサイズを計算
    this.stageWidth = this.stage[0].length * BLOCKSIZE
    this.stageHeight = this.stage.length * BLOCKSIZE

    // カメラコンテナ（スクロール用）
    this.camera = new Container()
    this.container.addChild(this.camera)

    // ステージ描画用Graphics
    this.stageGraphics = new Graphics()
    this.camera.addChild(this.stageGraphics)
    this.renderStage()

    // エンティティ描画用Graphics
    this.entitiesGraphics = new Graphics()
    this.camera.addChild(this.entitiesGraphics)

    // プレイヤー生成（ステージ内の '0' を探す）
    let playerX = 0
    let playerY = 0
    for (let y = 0; y < this.stage.length; y++) {
      for (let x = 0; x < this.stage[y].length; x++) {
        if (this.stage[y][x] === '0') {
          playerX = x * BLOCKSIZE
          playerY = y * BLOCKSIZE
        }
      }
    }

    // プレイヤーもentitiesリストに追加（HP: 5/5で初期化）
    this.player = new Player(playerX, playerY, this.stage, input, 5, 5)
    this.entities.push(this.player)
    this.add(this.player)

    // ステージデータからエンティティを生成
    this.spawnEntitiesFromStage()

    // 固定UI（HPBar/debugText）はカメラ外に配置
    // HP表示（通常UI - 常に表示）
    this.hpBar = new HPBar(this.player, 10, 220)
    this.container.addChild(this.hpBar.container) // camera外 = スクロールしない

    // プレイヤーのダメージイベントをリッスン
    this.player.on('playerDamage', (damage: number) => {
      this.hpBar.onDamage(damage)
    })

    // デバッグテキスト（開発時のみ表示）
    if (DEBUG) {
      this.debugText = new Text({
        text: '',
        style: {
          fontFamily: FONT,
          fontSize: 10,
          fill: 0xffffff,
        },
        resolution: 1, // ピクセルフォント用に解像度を1に固定
      })
      this.debugText.x = 5
      this.debugText.y = 25 // HP表示の下に配置
      this.debugText.roundPixels = true // ピクセル境界に配置
      this.container.addChild(this.debugText) // camera外 = スクロールしない
    }

    // コンストラクタでBGM開始を試みる（初期化済みの場合のみ再生）
    this.startBGM()
  }

  update() {
    super.update()

    // カメラ追従処理
    this.updateCamera()

    // エンティティ間の衝突判定
    this.checkCollisions()

    // エンティティ描画更新
    this.renderEntities()

    // HP表示更新
    this.hpBar.update()

    // デバッグ情報更新（開発時のみ）
    if (DEBUG) {
      this.updateDebugInfo()
    }
  }

  /**
   * カメラ追従処理
   * プレイヤーを画面中央に配置し、ステージ境界でカメラを停止
   */
  private updateCamera() {
    // プレイヤーの中心座標を基準にカメラ位置を計算
    const playerCenterX = this.player.x + this.player.width / 2
    const playerCenterY = this.player.y + this.player.height / 2

    // カメラ位置（プレイヤーを画面中央に配置）
    let cameraX = playerCenterX - this.viewportWidth / 2
    let cameraY = playerCenterY - this.viewportHeight / 2

    // ステージ境界でカメラを制限
    cameraX = Math.max(0, Math.min(cameraX, this.stageWidth - this.viewportWidth))
    cameraY = Math.max(0, Math.min(cameraY, this.stageHeight - this.viewportHeight))

    // PixiJSではカメラ移動は Container.position をマイナス値で設定
    this.camera.x = -Math.floor(cameraX)
    this.camera.y = -Math.floor(cameraY)
  }

  /**
   * ステージデータからエンティティを生成
   */
  private spawnEntitiesFromStage() {
    // エンティティファクトリー（クラス名 → コンストラクタのマッピング）
    const entityFactory = {
      Nasake: (x: number, y: number) => new Nasake(x, y, this.stage),
      Gurasan: (x: number, y: number) => new Gurasan(x, y, this.stage),
      Potion: (x: number, y: number) => new Potion(x, y, this.stage),
      GurasanNotFall: (x: number, y: number) => new GurasanNotFall(x, y, this.stage),
      Nuefu: (x: number, y: number) => new Nuefu(x, y, this.stage),
    } as const

    // ステージを走査してエンティティを配置
    for (let y = 0; y < this.stage.length; y++) {
      for (let x = 0; x < this.stage[y].length; x++) {
        const char = this.stage[y][x]

        // ENTITYDATAに定義されているキーか確認
        if (char in ENTITYDATA) {
          const entityKey = char as keyof typeof ENTITYDATA
          const entityData = ENTITYDATA[entityKey]
          const entityName = entityData.entityClass

          // ファクトリーからエンティティを生成
          const entity = entityFactory[entityName](x * BLOCKSIZE, y * BLOCKSIZE)
          this.addEntity(entity)
        }
      }
    }
  }

  /**
   * エンティティをシーンに追加
   * destroyイベントをリッスンして自動削除を設定
   */
  private addEntity(entity: Entity) {
    this.entities.push(entity)
    this.add(entity)

    // destroyイベントをリッスン
    entity.on('destroy', () => {
      this.removeEntity(entity)
    })
  }

  /**
   * BGM再生開始
   * コンストラクタから呼ばれる（AudioManager初期化済みの場合のみ再生）
   * 初期化前なら無音のまま（シーンが変わるまで無音で問題なし）
   */
  startBGM(): void {
    if (this.audio.isReady()) {
      // test.midを各トラック専用の音源設定で再生（6トラック対応）
      const midiPath = AUDIO_ASSETS.midi.test

      const trackSynthMap = {
        // Track 0: Noise, sine, 0.001, 0.5, 0, 0.001, -22dB
        0: {
          synthType: 'noise' as const,
          waveform: 'sine' as const, // NoiseSynthではwaveformは使われないが型のために必要
          envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.001 },
          volume: -22,
        },
        // Track 1: Basic, square, 0.001, 0.15, 0, 0.001, -10dB
        1: {
          synthType: 'synth' as const,
          waveform: 'square' as const,
          envelope: { attack: 0.001, decay: 0.5, sustain: 0.15, release: 0.001 },
          volume: -10,
        },
        // Track 2: Basic, sawtooth, 0.001, 1, 0.3, 1, -10dB
        2: {
          synthType: 'synth' as const,
          waveform: 'sawtooth' as const,
          envelope: { attack: 0.001, decay: 0.7, sustain: 0.1, release: 1 },
          volume: -10,
        },
        // Track 3: Basic, square, 0, 0.4, 0.001, 0.6, -15dB
        3: {
          synthType: 'synth' as const,
          waveform: 'square' as const,
          envelope: { attack: 0.4, decay: 0.001, sustain: 1, release: 0.6 },
          volume: -15,
        },
        // Track 4: Basic, sawtooth, 0.001, 0.5, 0.1, 0.001, -10dB
        4: {
          synthType: 'synth' as const,
          waveform: 'sawtooth' as const,
          envelope: { attack: 0.001, decay: 0.5, sustain: 0.1, release: 0.001 },
          volume: -10,
        },
        // Track 5: Basic, square, デフォルト設定
        5: {
          synthType: 'synth' as const,
          waveform: 'square' as const,
          envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.8 },
        },
      }

      void this.audio.playMidi(midiPath, trackSynthMap, true) // 非同期だが待たない（失敗時はwarnのみ）
    }
  }

  /**
   * エンティティをシーンから削除
   */
  private removeEntity(entity: Entity) {
    const index = this.entities.indexOf(entity)
    if (index !== -1) {
      this.entities.splice(index, 1)
    }
    this.remove(entity)

    // すべてのイベントリスナーをクリーンアップしてメモリリークを防止
    entity.clearAllEvents()
  }

  /**
   * エンティティ間の衝突判定
   * CollisionReactionComponent を使った衝突処理
   */
  private checkCollisions() {
    // 全エンティティ同士の衝突チェック（N^2だが、エンティティ数が少ないので問題なし）
    for (let i = 0; i < this.entities.length; i++) {
      for (let j = i + 1; j < this.entities.length; j++) {
        const entityA = this.entities[i]
        const entityB = this.entities[j]

        // Rectangle.hitTest() を使用
        if (entityA.currentHitbox.hitTest(entityB.currentHitbox)) {
          // CollisionReactionComponent による双方向の反応処理
          entityA.handleCollision(entityB)
          entityB.handleCollision(entityA)
        }
      }
    }
  }

  /**
   * デバッグ情報更新
   */
  private updateDebugInfo() {
    const debug = this.player.getDebugInfo()
    const pressedKeys = this.input.getPressedKeys()
    const keyW = this.input.getKey('KeyW')
    const keyA = this.input.getKey('KeyA')
    const keyD = this.input.getKey('KeyD')

    this.debugText.text = [
      `HP: ${debug.hp}/${debug.maxHp} ${debug.invincible ? '[無敵]' : ''} ${debug.isDead ? '[死亡]' : ''}`,
      `x: ${debug.x}  y: ${debug.y}`,
      `vx: ${debug.vx}  vy: ${debug.vy}`,
      `coyoteTime: ${debug.coyoteTime}/${debug.coyoteTimeMax}`,
      `onGround: ${debug.onGround}`,
      `KeyW:${keyW} KeyA:${keyA} KeyD:${keyD}`,
      `Keys: ${pressedKeys.join(', ') || 'none'}`,
    ].join('\n')
  }

  /**
   * ステージ（タイルマップ）描画
   */
  private renderStage() {
    this.stageGraphics.clear()

    for (let y = 0; y < this.stage.length; y++) {
      for (let x = 0; x < this.stage[y].length; x++) {
        const block = this.stage[y][x]
        if (block === ' ' || block === '0') continue

        // デバッグ用: 壁を白で描画
        this.stageGraphics.rect(x * BLOCKSIZE, y * BLOCKSIZE, BLOCKSIZE, BLOCKSIZE)
        this.stageGraphics.fill(0xffffff)
      }
    }
  }

  /**
   * 全エンティティ描画（プレイヤー含む）
   */
  private renderEntities() {
    this.entitiesGraphics.clear()

    this.entities.forEach((entity) => {
      const sprite = entity.getAnimatedSprite()

      if (sprite) {
        // AnimatedSprite で描画
        sprite.x = entity.x
        sprite.y = entity.y
        sprite.scale.x = entity.scaleX // 向きを反映

        // まだ追加されていなければ追加
        if (!sprite.parent) {
          this.camera.addChild(sprite)
        }
      } else {
        // スプライトがない場合は従来の色付き矩形で描画
        let color = 0xaaaaaa // デフォルト: グレー
        if (entity.imageKey === 'player') {
          color = 0xff0000 // プレイヤー: 赤
        } else if (entity.imageKey === 'wind') {
          color = 0x00ffff // 風: シアン
        } else if (entity.imageKey === 'nasake') {
          color = 0xff00ff // Nasake: マゼンタ
        } else if (entity.imageKey === 'potion') {
          color = 0x00ff00 // Potion: 緑
        } else if (entity.imageKey === 'nuefu') {
          color = 0xffaa00 // Nuefu: オレンジ
        } else if (entity.imageKey === 'gurasan') {
          color = 0xff6600 // Gurasan: 赤オレンジ
        } else if (entity.imageKey === 'gurasanNotFall') {
          color = 0xff3300 // GurasanNotFall: 濃い赤オレンジ
        }

        // エンティティ本体
        this.entitiesGraphics.rect(entity.x, entity.y, entity.width, entity.height)
        this.entitiesGraphics.fill(color)
      }

      // ヒットボックス表示（デバッグ用）
      if (DEBUG) {
        const hitbox = entity.currentHitbox
        this.entitiesGraphics.rect(hitbox.x, hitbox.y, hitbox.width, hitbox.height)

        // プレイヤーは緑、その他は黄色
        const strokeColor = entity.imageKey === 'player' ? 0x00ff00 : 0xffff00
        this.entitiesGraphics.stroke({ width: 1, color: strokeColor })
      }
    })
  }

  /**
   * シーン終了時の処理
   */
  end() {
    this.audio.stopMusic()
    super.end()
  }
}
