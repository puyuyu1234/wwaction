import { Camera } from '@core/Camera'
import { Input } from '@core/Input'
import { Entity } from '@entity/Entity'
import { Gurasan } from '@entity/Gurasan'
import { GurasanNotFall } from '@entity/GurasanNotFall'
import { Nasake } from '@entity/Nasake'
import { Nuefu } from '@entity/Nuefu'
import { Player } from '@entity/Player'
import { Potion } from '@entity/Potion'
import { Wind } from '@entity/Wind'
import { STAGEDATA, BLOCKSIZE, FONT, DEBUG, AUDIO_ASSETS, ENTITYDATA, Z_INDEX } from '@game/config'
import { Graphics, Container, Text } from 'pixi.js'

import { Scene } from './Scene'

import { AudioManager } from '@/audio/AudioManager'
import { Actor } from '@/engine/actor/Actor'
import { HPBar } from '@/engine/actor/HPBar'
import { TilemapSprite } from '@/engine/actor/TilemapSprite'
import { TutorialUI } from '@/engine/actor/TutorialUI'

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
  private tilemapSprite!: TilemapSprite // タイルマップスプライト描画
  private cameraContainer: Container
  private camera: Camera
  private debugText!: Text
  private hpBar!: HPBar // HP表示（通常UI）
  private tutorialUI?: TutorialUI // チュートリアルUI（ステージ0のみ）
  private input: Input
  private audio = AudioManager.getInstance()
  // private stageIndex: number // 将来的にステージ別BGMで使用予定
  private stageWidth: number // ステージ幅（ピクセル）
  private stageHeight: number // ステージ高さ（ピクセル）

  // 風プール管理（legacy実装に合わせて2個のWindを使いまわす）
  private windPool: Wind[] = []
  private windPoolIndex = 0
  private vanishingWinds: Array<{ wind: Wind; timer: number }> = [] // 消滅エフェクト管理

  private stageIndex: number // リトライ時に必要
  private viewportWidth: number
  private viewportHeight: number

  constructor(stageIndex: number, input: Input, viewportWidth = 320, viewportHeight = 240) {
    super()
    this.input = input
    this.stageIndex = stageIndex
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
    this.cameraContainer = new Container()
    this.cameraContainer.sortableChildren = true // z-index による描画順制御を有効化
    this.container.addChild(this.cameraContainer)

    // カメラ制御
    this.camera = new Camera(this.cameraContainer, viewportWidth, viewportHeight)

    // タイルマップスプライト描画（スプライトシート使用）
    this.tilemapSprite = new TilemapSprite(this.stage, this.cameraContainer)
    this.tilemapSprite.tilemapContainer.zIndex = Z_INDEX.TILEMAP

    // チュートリアルUI（ステージ0のみ - タイルマップの上、エンティティの下に描画）
    if (stageIndex === 0) {
      this.tutorialUI = new TutorialUI(this.input)
    }

    // ステージ描画用Graphics（TilemapSprite実装後は不要）
    this.stageGraphics = new Graphics()
    this.stageGraphics.zIndex = Z_INDEX.STAGE_DEBUG
    this.cameraContainer.addChild(this.stageGraphics)

    // エンティティ描画用Graphics
    this.entitiesGraphics = new Graphics()
    this.entitiesGraphics.zIndex = Z_INDEX.ENTITY_DEBUG
    this.cameraContainer.addChild(this.entitiesGraphics)

    // プレイヤー生成（ステージ内の '0' を探す）
    let playerX = 0
    let playerY = 0
    for (let y = 0; y < this.stage.length; y++) {
      for (let x = 0; x < this.stage[y].length; x++) {
        if (this.stage[y][x] === '0') {
          playerX = x * BLOCKSIZE
          playerY = y * BLOCKSIZE - 16
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

    // プレイヤーの風生成イベントをリッスン
    this.player.on('createWind', (data: { x: number; y: number; vx: number }) => {
      this.createWind(data.x, data.y, data.vx)
    })

    // プレイヤーの死亡イベントをリッスン
    this.player.on('death', () => {
      this.onPlayerDeath()
    })

    // プレイヤーのリトライイベントをリッスン
    this.player.on('reset', () => {
      // 新しいStageSceneインスタンスを生成してシーン遷移
      const newScene = new StageScene(
        this.stageIndex,
        this.input,
        this.viewportWidth,
        this.viewportHeight
      )
      this.dispatch('changeScene', newScene)
    })

    // 風プールを初期化（legacy実装に合わせて2個）
    // 画面外に配置して非表示状態にする
    this.windPool = [new Wind(-100, -100, 0, this.stage), new Wind(-100, -100, 0, this.stage)]
    this.windPool.forEach((wind) => this.addEntity(wind))

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

    // チュートリアルUI更新（ステージ0のみ）
    if (this.tutorialUI) {
      this.tutorialUI.update()
      this.tutorialUI.render(this.cameraContainer, Z_INDEX.TUTORIAL_UI) // camera内 = ステージと一緒にスクロール
    }

    // 消滅エフェクト更新（12フレーム後に削除）
    this.updateVanishingWinds()

    // デバッグ情報更新（開発時のみ）
    if (DEBUG) {
      this.updateDebugInfo()
    }
  }

  /**
   * 消滅エフェクトの更新と削除
   */
  private updateVanishingWinds() {
    // タイマーを更新して、12フレーム経過したら削除
    this.vanishingWinds = this.vanishingWinds.filter((entry) => {
      entry.timer++
      if (entry.timer >= 12) {
        entry.wind.destroy()
        return false // 配列から削除
      }
      return true // 配列に残す
    })
  }

  /**
   * カメラ追従処理
   * プレイヤーを画面中央に配置し、ステージ境界でカメラを停止
   */
  private updateCamera() {
    this.camera.follow(
      this.player.x,
      this.player.y,
      this.player.width,
      this.player.height,
      this.stageWidth,
      this.stageHeight
    )
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
   * 風エンティティを生成（legacy実装：プール方式）
   * プレイヤーからのイベントで呼ばれる
   */
  private createWind(x: number, y: number, vx: number) {
    // 音声再生
    // this.audio.playSound(SFX_KEYS.WIND) // 将来的に実装

    // 風プールから次の風を取得（交互に使いまわす）
    this.windPoolIndex = (this.windPoolIndex + 1) % this.windPool.length
    const wind = this.windPool[this.windPoolIndex]

    // 古い風の位置に消滅エフェクトを生成（vanishアニメーション）
    const vanishingWind = new Wind(wind.x, wind.y, 0, this.stage)
    vanishingWind.vx = wind.vx
    vanishingWind.vy = wind.vy
    vanishingWind.playAnimation('vanish')
    this.addEntity(vanishingWind)

    // 消滅エフェクト管理リストに追加（12フレーム後に削除）
    this.vanishingWinds.push({ wind: vanishingWind, timer: 0 })

    // 風を再配置（プレイヤーの中心座標）
    wind.x = x
    wind.y = y
    wind.vy = 0

    // 風を6フレーム分前進させて初期位置を決定（衝突判定あり）
    // 引数vxで指定された速度で前進させる（しゃがみ時は0）
    wind.vx = vx
    for (let i = 0; i < 6; i++) {
      wind.update()
    }
    // updateで得られた速度をそのまま使う（壁で跳ね返った場合、速度が反転している）
  }

  /**
   * BGM再生開始
   * コンストラクタから呼ばれる（AudioManager初期化済みの場合のみ再生）
   * 初期化前なら無音のまま（シーンが変わるまで無音で問題なし）
   */
  startBGM(): void {
    if (this.audio.isReady()) {
      const midiPath = AUDIO_ASSETS.midi.test
      const trackSynthMap = AUDIO_ASSETS.midiTracks.test
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
   * プレイヤー死亡時の処理
   * legacy実装：カメラ揺れ + 30フレーム後にオートリトライ
   */
  private onPlayerDeath() {
    // カメラ揺れエフェクト（10フレーム）
    // legacy: stage.js:56-69
    const cameraX = this.cameraContainer.x
    const cameraY = this.cameraContainer.y
    const cameraShakeActor = new Actor(0, 0)
    cameraShakeActor.update = () => {
      if (cameraShakeActor.time < 10) {
        // ランダムに-5〜+5ピクセル揺らす
        const randomOffset = () => Math.random() * 10 - 5
        this.cameraContainer.x = cameraX + randomOffset()
        this.cameraContainer.y = cameraY + randomOffset()
      } else {
        // 元の位置に戻す
        this.cameraContainer.x = cameraX
        this.cameraContainer.y = cameraY
        this.remove(cameraShakeActor)
      }
    }
    this.add(cameraShakeActor)

    // オートリトライ（30フレーム後）
    // legacy: stage.js:72-77
    const retryActor = new Actor(0, 0)
    retryActor.update = () => {
      if (retryActor.time === 30) {
        this.player.dispatch('reset')
      }
    }
    this.add(retryActor)
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
   * TilemapSprite実装後は使用しない（デバッグ用に残してある）
   */
  // private renderStage() {
  //   this.stageGraphics.clear()

  //   for (let y = 0; y < this.stage.length; y++) {
  //     for (let x = 0; x < this.stage[y].length; x++) {
  //       const block = this.stage[y][x]
  //       if (block === ' ' || block === '0') continue

  //       // デバッグ用: 壁を白で描画
  //       this.stageGraphics.rect(x * BLOCKSIZE, y * BLOCKSIZE, BLOCKSIZE, BLOCKSIZE)
  //       this.stageGraphics.fill(0xffffff)
  //     }
  //   }
  // }

  /**
   * 全エンティティ描画（プレイヤー含む）
   */
  private renderEntities() {
    this.entitiesGraphics.clear()

    this.entities.forEach((entity) => {
      // エンティティ自身に描画を委譲（z-index指定）
      entity.render(this.cameraContainer, Z_INDEX.ENTITY)

      // デバッグ用ヒットボックス表示
      if (DEBUG) {
        this.renderDebugHitbox(entity)
      }
    })
  }

  /**
   * デバッグ用ヒットボックス描画
   */
  private renderDebugHitbox(entity: Entity) {
    const hitbox = entity.currentHitbox
    this.entitiesGraphics.rect(hitbox.x, hitbox.y, hitbox.width, hitbox.height)

    // プレイヤーは緑、その他は黄色
    const strokeColor = entity.imageKey === 'player' ? 0x00ff00 : 0xffff00
    this.entitiesGraphics.stroke({ width: 1, color: strokeColor })
  }

  /**
   * シーン終了時の処理
   */
  end() {
    this.audio.stopMusic()
    this.tilemapSprite.destroy() // タイルマップスプライトの破棄
    super.end()
  }
}
