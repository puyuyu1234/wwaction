import { Camera } from '@core/Camera'
import { GameSettings } from '@core/GameSettings'
import { Input } from '@core/Input'
import { Rectangle } from '@core/Rectangle'
import { Entity } from '@entity/Entity'
import { Goal } from '@entity/Goal'
import { Gurasan } from '@entity/Gurasan'
import { GurasanNotFall } from '@entity/GurasanNotFall'
import { Nasake } from '@entity/Nasake'
import { Nuefu } from '@entity/Nuefu'
import { Player } from '@entity/Player'
import { Potion } from '@entity/Potion'
import { Wind } from '@entity/Wind'
import { STAGEDATA, BLOCKSIZE, FONT, DEBUG, AUDIO_ASSETS, ENTITYDATA, Z_INDEX, HPDATA } from '@game/config'
import { Graphics, Container, Text } from 'pixi.js'

import { Scene } from './Scene'

import { AudioManager } from '@/audio/AudioManager'
import { Actor } from '@/engine/actor/Actor'
import { HPBar } from '@/engine/actor/HPBar'
import { ParallaxBackground } from '@/engine/actor/ParallaxBackground'
import { SceneTransition } from '@/engine/actor/SceneTransition'
import { StageName } from '@/engine/actor/StageName'
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
  private parallaxBackground?: ParallaxBackground // 視差スクロール背景
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
  private isRetry: boolean // リトライ時はステージ名表示を省略
  private stageData: (typeof STAGEDATA)[number] // BGM参照用にステージデータを保持

  // 演出関連
  private openingTransition?: SceneTransition // シーン開始時の画面遷移演出
  private closingTransition?: SceneTransition // シーン終了時の画面遷移演出
  private stageName?: StageName // ステージ名表示演出
  private isTransitioning = false // 画面遷移中フラグ（重複遷移を防ぐ）

  constructor(
    stageIndex: number,
    input: Input,
    viewportWidth = 320,
    viewportHeight = 240,
    isRetry = false
  ) {
    super()
    this.input = input
    this.stageIndex = stageIndex
    this.viewportWidth = viewportWidth
    this.viewportHeight = viewportHeight
    this.isRetry = isRetry

    // ステージデータ取得
    this.stageData = STAGEDATA[stageIndex]
    if (!this.stageData?.stages?.[0]) {
      throw new Error(`Stage ${stageIndex} not found`)
    }

    // stages[0] は string[] の配列なので、それを文字の2次元配列に変換
    this.stage = this.stageData.stages[0].map((row) => row.split(''))

    // ステージサイズを計算
    this.stageWidth = this.stage[0].length * BLOCKSIZE
    this.stageHeight = this.stage.length * BLOCKSIZE

    // カメラコンテナ（スクロール用）
    this.cameraContainer = new Container()
    this.cameraContainer.sortableChildren = true // z-index による描画順制御を有効化
    this.container.addChild(this.cameraContainer)

    // カメラ制御
    this.camera = new Camera(this.cameraContainer, viewportWidth, viewportHeight)

    // 視差スクロール背景（ステージデータのbg設定から生成）
    if (this.stageData.bg && this.stageData.bg.length > 0) {
      this.parallaxBackground = new ParallaxBackground(
        this.stageData.bg,
        this.stageWidth,
        this.stageHeight,
        0.5, // X軸視差レート（legacy実装に合わせて0.5倍速）
        1.0 // Y軸視差レート（カメラと同じ速度）
      )
      this.parallaxBackground.container.zIndex = Z_INDEX.BACKGROUND
      this.cameraContainer.addChild(this.parallaxBackground.container)
    }

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

    // 難易度設定からプレイヤーのHPを決定
    const settings = GameSettings.getInstance()
    const difficulty = settings.getDifficulty()
    const maxHp = HPDATA[difficulty] // EASY=7, NORMAL=5, HARD=3, LUNATIC=1

    // プレイヤーもentitiesリストに追加
    this.player = new Player(playerX, playerY, this.stage, input, maxHp, maxHp)
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
      // 新しいStageSceneインスタンスを生成してシーン遷移（リトライフラグをtrue）
      const newScene = new StageScene(
        this.stageIndex,
        this.input,
        this.viewportWidth,
        this.viewportHeight,
        true // リトライ = ステージ名表示を省略
      )
      // Scene.changeScene() を呼ぶ（演出後に Game にシーン切り替えを通知）
      this.changeScene(newScene)
    })

    // プレイヤーのゴール到達イベントをリッスン
    this.player.on('nextStage', () => {
      // 次のステージに遷移
      const newScene = new StageScene(
        this.stageIndex + 1,
        this.input,
        this.viewportWidth,
        this.viewportHeight,
        false // 通常遷移 = ステージ名表示あり
      )
      // Scene.changeScene() を呼ぶ（演出後に Game にシーン切り替えを通知）
      this.changeScene(newScene)
    })

    // 風プールを初期化（legacy実装に合わせて2個）
    // 画面外に配置して非表示状態にする
    this.windPool = [new Wind(-100, -100, 0, this.stage), new Wind(-100, -100, 0, this.stage)]
    this.windPool.forEach((wind) => this.addEntity(wind))

    // ゴールエンティティを追加（ステージ右端の縦長領域）
    // legacy実装: new Rectangle(this.stageWidth - 1, 0, 3, this.stageHeight)
    const goalRect = new Rectangle(this.stageWidth - 1, 0, 3, this.stageHeight)
    const goal = new Goal(goalRect, this.stage)
    this.addEntity(goal)

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

    // ステージ名表示演出（リトライ時は省略）
    // 開く演出より先に作成しておくが、z-indexで画面遷移演出を上にする
    if (!this.isRetry && this.stageData.name) {
      this.stageName = new StageName(this.stageData.name, this.stageData.engName, viewportWidth)
      this.stageName.addToContainer(this.container, Z_INDEX.STAGE_NAME)
    }

    // 画面遷移演出（開く）- ステージ名より上に表示
    this.openingTransition = new SceneTransition(true)
    this.openingTransition.addToContainer(this.container, Z_INDEX.SCENE_TRANSITION)

    // BGM開始（リトライ時は引き継ぐため再生しない）
    if (!this.isRetry) {
      this.startBGM()
    }
  }

  update() {
    super.update()

    // 画面遷移演出の更新
    if (this.openingTransition) {
      if (!this.openingTransition.isFinished()) {
        this.openingTransition.update()
      } else {
        // 演出完了後に破棄
        this.openingTransition.destroy()
        this.openingTransition = undefined
      }
    }

    if (this.closingTransition && !this.closingTransition.isFinished()) {
      this.closingTransition.update()
    }

    // ステージ名表示演出の更新
    if (this.stageName) {
      if (!this.stageName.isFinished()) {
        this.stageName.update()
      } else {
        // 演出完了後に破棄
        this.stageName.destroy()
        this.stageName = undefined
      }
    }

    // 画面遷移中は更新を停止（背景が破棄される可能性があるため）
    if (this.isTransitioning) {
      return
    }

    // カメラ追従処理
    this.updateCamera()

    // 背景スクロール更新（視差効果）
    if (this.parallaxBackground) {
      this.parallaxBackground.updateScroll(this.camera.x, this.camera.y)
    }

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
    // wind.x, wind.y は中心座標なので、Windコンストラクタ(左上座標を期待)用に変換
    const vanishingWind = new Wind(wind.x - 8, wind.y - 8, 0, this.stage)
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
    // legacy実装に合わせて、初期6フレームは「壁で止まる」モード
    wind.setWallBehavior('stop')
    // 初期速度はプレイヤーの向きで決定（this.player.scaleX）
    wind.vx = this.player.scaleX > 0 ? 2 : -2
    for (let i = 0; i < 6; i++) {
      wind.update()
    }

    // 最終速度を設定（引数vxで上書き: 通常は±2、しゃがみ時は0）
    wind.vx = vx

    // 以降は「壁で跳ね返る」モード（legacy実装の backAtLRWall() に対応）
    wind.setWallBehavior('bounce')
  }

  /**
   * BGM再生開始
   * コンストラクタから呼ばれる（AudioManager初期化済みの場合のみ再生）
   * 初期化前なら無音のまま（シーンが変わるまで無音で問題なし）
   */
  startBGM(): void {
    // stageData.bgm が undefined の場合は前のBGMを引き継ぐ（何もしない）
    if (!this.stageData.bgm) {
      return
    }

    if (this.audio.isReady()) {
      // bgm名からMIDIアセットを取得
      const bgmKey = this.stageData.bgm as keyof typeof AUDIO_ASSETS.midi
      const midiPath = AUDIO_ASSETS.midi[bgmKey]
      const trackSynthMap = AUDIO_ASSETS.midiTracks[bgmKey]

      if (midiPath && trackSynthMap) {
        void this.audio.playMidi(midiPath, trackSynthMap, true) // 非同期だが待たない（失敗時はwarnのみ）
      }
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
   * シーン遷移をリクエスト（オーバーライド）
   * 画面遷移演出を行ってから Game にシーン切り替えを通知
   */
  changeScene(newScene: Scene): void {
    // 既に遷移中なら無視（重複遷移を防ぐ）
    if (this.isTransitioning) {
      return
    }
    this.isTransitioning = true

    // 画面遷移演出（閉じる）- 最前面に表示
    this.closingTransition = new SceneTransition(false)
    this.closingTransition.addToContainer(this.container, Z_INDEX.SCENE_TRANSITION)
    this.closingTransition.onComplete(() => {
      // 閉じる演出が完了したら Game にシーン切り替えを通知
      super.changeScene(newScene)
    })
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
    // BGMは停止しない（次のシーンでbgmが指定されている場合は自動的に切り替わる）
    // this.audio.stopMusic() を削除
    this.parallaxBackground?.destroy() // 背景の破棄
    this.tilemapSprite.destroy() // タイルマップスプライトの破棄
    super.end()
  }
}
