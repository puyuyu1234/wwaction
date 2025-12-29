import { Camera } from '@ptre/core/Camera'
import { Input } from '@ptre/core/Input'
import { Scene } from '@ptre/scene/Scene'
import { TutorialUI } from '@ptre/actor/TutorialUI'
import { Entity } from '@game/entity/Entity'
import { Goal } from '@game/entity/Goal'
import { Gurasan } from '@game/entity/Gurasan'
import { GurasanNotFall } from '@game/entity/GurasanNotFall'
import { Nasake } from '@game/entity/Nasake'
import { Nuefu } from '@game/entity/Nuefu'
import { Player } from '@game/entity/Player'
import { Potion } from '@game/entity/Potion'
import { Wind } from '@game/entity/Wind'
import { CloudBackground } from '@game/ui/CloudBackground'
import { FogEffect } from '@game/ui/FogEffect'
import { HPBar } from '@game/ui/HPBar'
import { LeafEffect } from '@game/ui/LeafEffect'
import { ParallaxBackground } from '@game/ui/ParallaxBackground'
import { SceneTransition } from '@game/ui/SceneTransition'
import { StageName } from '@game/ui/StageName'
import { GameSession } from '@game/GameSession'
import { STAGEDATA } from '@game/stages'
import {
  BLOCKSIZE,
  BLOCKDATA,
  DEBUG,
  FONT,
  ENTITYDATA,
  Z_INDEX,
} from '@game/config'
import { Graphics, Container, Text, Sprite } from 'pixi.js'
import { AssetLoader } from '@ptre/core/AssetLoader'
import { AudioService } from '@ptre/audio/AudioService'

/**
 * ステージシーン
 * プレイヤーとステージを管理
 */
export class StageScene extends Scene {
  private stage: string[][]
  private player!: Player
  private entities: Entity[] = []
  private stageGraphics: Graphics
  private tilemapContainer: Container
  private cameraContainer: Container
  private camera: Camera
  private debugText?: Text
  private hpBar!: HPBar
  private input: Input
  private stageWidth: number
  private stageHeight: number

  // 風プール管理
  private windPool: Wind[] = []
  private windPoolIndex = 0
  private vanishingWinds: Array<{ wind: Wind; timer: number }> = []

  private session: GameSession
  private viewportWidth: number
  private viewportHeight: number
  private isRetry: boolean
  private stageData: (typeof STAGEDATA)[number]

  // 演出関連
  private openingTransition?: SceneTransition
  private closingTransition?: SceneTransition
  private stageName?: StageName
  private isTransitioning = false

  // 死亡演出関連
  private cameraShakeTimer = 0
  private cameraShakeBaseX = 0
  private cameraShakeBaseY = 0
  private retryTimer = 0
  private isPlayerDead = false

  // 背景・前景
  private parallaxBackground?: ParallaxBackground
  private parallaxForeground?: ParallaxBackground

  // チュートリアルUI（ステージ0のみ）
  private tutorialUI?: TutorialUI

  // 雲の背景演出
  private cloudBackground: CloudBackground

  // 霧エフェクト（森テーマ用）
  private fogEffect?: FogEffect

  // 葉っぱエフェクト（森テーマ用）
  private leafEffect?: LeafEffect

  constructor(
    session: GameSession,
    input: Input,
    viewportWidth = 320,
    viewportHeight = 240,
    isRetry = false
  ) {
    super()
    this.input = input
    this.session = session
    this.viewportWidth = viewportWidth
    this.viewportHeight = viewportHeight
    this.isRetry = isRetry

    // ステージデータ取得
    this.stageData = STAGEDATA[session.stageIndex]
    if (!this.stageData?.stages?.[0]) {
      throw new Error(`Stage ${session.stageIndex} not found`)
    }

    // stages[0]（レイヤー0）を衝突判定用に使用
    this.stage = this.stageData.stages[0].map((row) => row.split(''))

    // ステージサイズを計算
    this.stageWidth = this.stage[0].length * BLOCKSIZE
    this.stageHeight = this.stage.length * BLOCKSIZE

    // sortableChildren を有効化（zIndex順で描画）
    this.container.sortableChildren = true

    // テーマに応じた背景処理
    const isForest = this.stageData.theme === 'forest'

    if (isForest) {
      // 森テーマ: グラデーション背景（上が明るく、下が暗い）
      const forestBg = new Graphics()
      const steps = 32 // グラデーションの段階数
      const stepHeight = Math.ceil(viewportHeight / steps)

      for (let i = 0; i < steps; i++) {
        // 上（明るい緑 #3a654a）から下（暗い緑 #0a2310）へ
        const t = i / (steps - 1)
        const r = Math.floor(0x3a + (0x0a - 0x3a) * t)
        const g = Math.floor(0x65 + (0x23 - 0x65) * t)
        const b = Math.floor(0x4a + (0x10 - 0x4a) * t)
        const color = (r << 16) | (g << 8) | b

        forestBg.rect(0, i * stepHeight, viewportWidth, stepHeight + 1)
        forestBg.fill(color)
      }

      forestBg.zIndex = Z_INDEX.BACKGROUND
      this.container.addChild(forestBg)
    }

    // 雲の背景演出（草原テーマのみ）
    this.cloudBackground = new CloudBackground(viewportWidth, viewportHeight, 90)
    this.cloudBackground.container.zIndex = Z_INDEX.BACKGROUND + 5 // 背景より手前
    if (!isForest) {
      this.container.addChild(this.cloudBackground.container)
    }

    // カメラコンテナ（スクロール用）
    this.cameraContainer = new Container()
    this.cameraContainer.sortableChildren = true
    this.cameraContainer.zIndex = Z_INDEX.TILEMAP
    this.container.addChild(this.cameraContainer)

    // カメラ制御
    this.camera = new Camera(this.cameraContainer, viewportWidth, viewportHeight)

    // 背景描画（bgフィールドがある場合のみ）
    if (this.stageData.bg && this.stageData.bg.length > 0) {
      this.parallaxBackground = new ParallaxBackground(
        this.stageData.bg,
        this.stageWidth,
        this.stageHeight,
        0.5, // X軸視差レート（0.5 = カメラの半分の速度）
        1.0  // Y軸視差レート（1.0 = カメラと同じ速度）
      )
      this.parallaxBackground.container.zIndex = Z_INDEX.BACKGROUND
      this.cameraContainer.addChild(this.parallaxBackground.container)
    }

    // 葉っぱエフェクト（森テーマのみ、視差1.0）
    if (isForest) {
      const tileCount = this.stage[0].length
      this.leafEffect = new LeafEffect(this.stageWidth, this.stageHeight, tileCount, 1.0, 1.0, 1.0)
      this.leafEffect.container.zIndex = Z_INDEX.BACKGROUND + 1
      this.cameraContainer.addChild(this.leafEffect.container)
    }

    // タイルマップ描画（全レイヤー）
    this.tilemapContainer = new Container()
    this.tilemapContainer.sortableChildren = true
    this.tilemapContainer.zIndex = Z_INDEX.TILEMAP
    this.cameraContainer.addChild(this.tilemapContainer)
    this.renderAllLayers()

    // ステージ描画用Graphics（デバッグ用）
    this.stageGraphics = new Graphics()
    this.stageGraphics.zIndex = Z_INDEX.ENTITY
    this.cameraContainer.addChild(this.stageGraphics)

    // プレイヤー生成（ステージ内の '0' を探す）
    this.spawnPlayer()

    // ステージデータからエンティティを生成
    this.spawnEntitiesFromStage()

    // 前景描画（fgフィールドがある場合のみ）
    if (this.stageData.fg && this.stageData.fg.length > 0) {
      this.parallaxForeground = new ParallaxBackground(
        this.stageData.fg,
        this.stageWidth,
        this.stageHeight,
        -0.5, // X軸視差レート（1.5 = カメラより速く動く）
        1.0  // Y軸視差レート（1.0 = カメラと同じ速度）
      )
      this.parallaxForeground.container.zIndex = Z_INDEX.FOREGROUND
      this.cameraContainer.addChild(this.parallaxForeground.container)
    }

    // 霧エフェクト（森テーマのみ、ステージ全域に配置）
    if (isForest) {
      const tileCount = this.stage[0].length
      this.fogEffect = new FogEffect(this.stageWidth, this.stageHeight, tileCount) // 1マスあたり0.8個
      this.fogEffect.container.zIndex = Z_INDEX.FOG
      this.cameraContainer.addChild(this.fogEffect.container)
    }

    // HPBar（player.healthはIHPProviderを実装）
    this.hpBar = new HPBar(this.player.health, 10, 220)
    this.hpBar.container.zIndex = Z_INDEX.UI
    this.container.addChild(this.hpBar.container)

    // プレイヤーイベントのリッスン
    this.setupPlayerEvents()

    // 風プールを初期化（2個）
    this.windPool = [new Wind(-100, -100, 0, this.stage), new Wind(-100, -100, 0, this.stage)]
    this.windPool.forEach((wind) => this.addEntity(wind))

    // ゴールエンティティを追加（ステージ右端）
    const goal = new Goal(this.stageWidth - 1, 0, 3, this.stageHeight)
    this.addEntity(goal)

    // チュートリアルUI（ステージ0のみ）
    if (session.stageIndex === 0) {
      this.tutorialUI = new TutorialUI(input)
      this.tutorialUI.zIndex = Z_INDEX.TUTORIAL_UI
      this.cameraContainer.addChild(this.tutorialUI)
    }

    // デバッグテキスト
    if (DEBUG) {
      this.debugText = new Text({
        text: '',
        style: {
          fontFamily: FONT,
          fontSize: 10,
          fill: 0xffffff,
        },
        resolution: 1,
      })
      this.debugText.x = 5
      this.debugText.y = 25
      this.debugText.roundPixels = true
      this.container.addChild(this.debugText)
    }

    // ステージ名表示演出（リトライ時は省略）
    if (!this.isRetry && this.stageData.name) {
      this.stageName = new StageName(this.stageData.name, this.stageData.engName, viewportWidth)
      this.stageName.addToContainer(this.container, Z_INDEX.UI + 1)
    }

    // 画面遷移演出（開く）
    this.openingTransition = new SceneTransition(true)
    this.openingTransition.addToContainer(this.container, Z_INDEX.UI + 2)
  }

  /**
   * シーン開始時の処理
   */
  start() {
    super.start()

    // BGM再生（設定がある場合のみ）
    if (this.stageData.bgm) {
      const audio = AudioService.getInstance()
      audio.play({
        type: 'audio',
        path: `${import.meta.env.BASE_URL}assets/sound/music/${this.stageData.bgm}.ogg`,
        loop: true,
      })
    }
  }

  /**
   * プレイヤー生成
   */
  private spawnPlayer() {
    let playerCenterX = 0
    let playerCenterY = 0

    // 全レイヤーから主人公の位置を探す
    for (const layerData of this.stageData.stages) {
      for (let y = 0; y < layerData.length; y++) {
        const row = layerData[y]
        for (let x = 0; x < row.length; x++) {
          if (row[x] === '0') {
            playerCenterX = x * BLOCKSIZE + 12
            playerCenterY = y * BLOCKSIZE
          }
        }
      }
    }

    // セッションからHP情報を取得
    this.player = new Player(
      playerCenterX,
      playerCenterY,
      this.input,
      this.stage,
      this.session.maxHp,
      this.session.hp
    )
    this.entities.push(this.player)
    this.add(this.player)
  }

  /**
   * プレイヤーイベントのセットアップ
   */
  private setupPlayerEvents() {
    // 風生成イベント
    this.player.behavior.on('createWind', (data: { x: number; y: number; vx: number }) => {
      this.createWind(data.x, data.y, data.vx)
    })

    // ゴール到達イベント
    this.player.behavior.on('nextStage', () => {
      // 現在のHPを引き継いで次のステージへ
      this.session.advanceStage(this.player.health.hp)
      const newScene = new StageScene(
        this.session,
        this.input,
        this.viewportWidth,
        this.viewportHeight,
        false
      )
      this.changeScene(newScene)
    })

    // リトライイベント
    this.player.behavior.on('reset', () => {
      // HPをリセットしてリトライ
      this.session.retry()
      const newScene = new StageScene(
        this.session,
        this.input,
        this.viewportWidth,
        this.viewportHeight,
        true
      )
      this.changeScene(newScene)
    })

    // 死亡イベント
    this.player.behavior.on('death', () => {
      this.onPlayerDeath()
    })

    // ダメージイベント（HPBar演出用）
    this.player.behavior.on('playerDamage', (damage: number) => {
      this.hpBar.onDamage(damage)
    })
  }

  /**
   * プレイヤー死亡時の処理
   * カメラシェイク + 30フレーム後にオートリトライ
   */
  private onPlayerDeath() {
    this.isPlayerDead = true
    // カメラシェイク開始
    this.cameraShakeTimer = 10
    this.cameraShakeBaseX = this.cameraContainer.x
    this.cameraShakeBaseY = this.cameraContainer.y
    // リトライタイマー開始
    this.retryTimer = 30
  }

  /**
   * 全レイヤーを描画
   */
  private renderAllLayers() {
    const layers = this.stageData.stages
    for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
      const layerData = layers[layerIndex].map((row) => row.split(''))
      this.renderLayer(layerData, layerIndex)
    }
  }

  /**
   * 単一レイヤーを描画
   */
  private renderLayer(layerData: string[][], layerIndex: number) {
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

        // BLOCKDATAからフレーム番号を取得
        const blockData = BLOCKDATA[char]
        if (!blockData || blockData.frame[0] === 0) continue

        // フレーム番号でテクスチャを取得
        const frameIndex = blockData.frame[0]
        const texture = tileset.textures[`frame_${frameIndex}`]
        if (texture) {
          const sprite = new Sprite(texture)
          sprite.x = x * BLOCKSIZE
          sprite.y = y * BLOCKSIZE
          layerContainer.addChild(sprite)
        }
      }
    }

    this.tilemapContainer.addChild(layerContainer)
  }

  /**
   * ステージデータからエンティティを生成
   */
  private spawnEntitiesFromStage() {
    const entityFactory: Record<string, (x: number, y: number) => Entity> = {
      Nasake: (x, y) => new Nasake(x + 8, y + 8, this.stage),
      Gurasan: (x, y) => new Gurasan(x + 8, y + 8, this.stage),
      GurasanNotFall: (x, y) => new GurasanNotFall(x + 8, y + 8, this.stage),
      Potion: (x, y) => new Potion(x + 8, y + 8, this.stage),
      Nuefu: (x, y) => new Nuefu(x + 8, y + 8, this.stage),
    }

    for (let y = 0; y < this.stage.length; y++) {
      for (let x = 0; x < this.stage[y].length; x++) {
        const char = this.stage[y][x]

        if (char in ENTITYDATA) {
          const entityKey = char as keyof typeof ENTITYDATA
          const entityData = ENTITYDATA[entityKey]
          const entityName = entityData.entityClass

          const factory = entityFactory[entityName]
          if (factory) {
            const entity = factory(x * BLOCKSIZE, y * BLOCKSIZE)
            this.addEntity(entity)
          }
        }
      }
    }
  }

  /**
   * アクターを追加（Sceneのオーバーライド）
   * Entity型の場合はentities配列にも追加
   */
  add(actor: Entity) {
    this.entities.push(actor)
    super.add(actor)

    // destroyイベントでentities配列からも削除
    actor.behavior.on('destroy', () => {
      this.removeEntity(actor)
    })
  }

  /**
   * エンティティをシーンに追加（add()のエイリアス）
   */
  private addEntity(entity: Entity) {
    this.add(entity)
  }

  /**
   * 風エンティティを生成（プール方式）
   */
  private createWind(x: number, y: number, vx: number) {
    this.windPoolIndex = (this.windPoolIndex + 1) % this.windPool.length
    const wind = this.windPool[this.windPoolIndex]

    // 古い風の位置に消滅エフェクトを生成
    const vanishingWind = new Wind(wind.x, wind.y, 0, this.stage)
    vanishingWind.vx = wind.vx
    vanishingWind.vy = wind.vy
    vanishingWind.playAnimation('vanish')
    this.addEntity(vanishingWind)
    this.vanishingWinds.push({ wind: vanishingWind, timer: 0 })

    // 風を再配置
    wind.x = x
    wind.y = y
    wind.vy = 0
    wind.setWallBehavior('stop')
    wind.vx = this.player.scale.x > 0 ? 2 : -2
    for (let i = 0; i < 6; i++) {
      wind.tick()
    }
    wind.vx = vx
    wind.setWallBehavior('bounce')
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
    entity.behavior.clearAllEvents()
  }

  /**
   * シーン遷移をリクエスト（オーバーライド）
   */
  changeScene(newScene: Scene): void {
    if (this.isTransitioning) return
    this.isTransitioning = true

    this.closingTransition = new SceneTransition(false)
    this.closingTransition.addToContainer(this.container, Z_INDEX.UI + 2)
    this.closingTransition.onComplete(() => {
      super.changeScene(newScene)
    })
  }

  tick() {
    super.tick()

    // 画面遷移演出の更新
    if (this.openingTransition) {
      if (!this.openingTransition.isFinished()) {
        this.openingTransition.tick()
      } else {
        this.openingTransition.destroy()
        this.openingTransition = undefined
      }
    }

    if (this.closingTransition && !this.closingTransition.isFinished()) {
      this.closingTransition.tick()
    }

    // ステージ名表示演出の更新
    if (this.stageName) {
      if (!this.stageName.isFinished()) {
        this.stageName.tick()
      } else {
        this.stageName.destroy()
        this.stageName = undefined
      }
    }

    if (this.isTransitioning) return

    // カメラ追従
    this.camera.follow(
      this.player.x,
      this.player.y,
      this.player.width,
      this.player.height,
      this.stageWidth,
      this.stageHeight
    )

    // 背景スクロール（視差効果）
    if (this.parallaxBackground) {
      this.parallaxBackground.updateScroll(this.camera.x, this.camera.y)
    }

    // 葉っぱエフェクト更新（森テーマのみ）
    if (this.leafEffect) {
      this.leafEffect.tick()
      this.leafEffect.updateScroll(this.camera.x, this.camera.y)
    }

    // 前景スクロール（視差効果）
    if (this.parallaxForeground) {
      this.parallaxForeground.updateScroll(this.camera.x, this.camera.y)
    }

    // 雲の背景演出更新
    this.cloudBackground.tick()

    // 霧エフェクト更新（森テーマのみ）
    if (this.fogEffect) {
      this.fogEffect.tick()
    }

    // カメラシェイク演出
    this.updateCameraShake()

    // オートリトライタイマー
    this.updateRetryTimer()

    // エンティティ間の衝突判定
    this.checkCollisions()

    // エンティティ描画更新
    this.renderEntities()

    // チュートリアルUI更新
    if (this.tutorialUI) {
      this.tutorialUI.tick()
    }

    // HP表示更新
    this.hpBar.tick()

    // 消滅エフェクト更新
    this.updateVanishingWinds()

    // デバッグ情報更新
    if (DEBUG && this.debugText) {
      this.updateDebugInfo()
    }
  }

  /**
   * 消滅エフェクトの更新と削除
   */
  private updateVanishingWinds() {
    this.vanishingWinds = this.vanishingWinds.filter((entry) => {
      entry.timer++
      if (entry.timer >= 12) {
        entry.wind.behavior.destroy()
        entry.wind.destroy()
        return false
      }
      return true
    })
  }

  /**
   * カメラシェイク演出の更新
   */
  private updateCameraShake() {
    if (this.cameraShakeTimer > 0) {
      // ランダムに-5〜+5ピクセル揺らす
      const randomOffset = () => Math.random() * 10 - 5
      this.cameraContainer.x = this.cameraShakeBaseX + randomOffset()
      this.cameraContainer.y = this.cameraShakeBaseY + randomOffset()
      this.cameraShakeTimer--

      // シェイク終了時に位置を戻す
      if (this.cameraShakeTimer === 0) {
        this.cameraContainer.x = this.cameraShakeBaseX
        this.cameraContainer.y = this.cameraShakeBaseY
      }
    }
  }

  /**
   * オートリトライタイマーの更新
   */
  private updateRetryTimer() {
    if (this.isPlayerDead && this.retryTimer > 0) {
      this.retryTimer--
      if (this.retryTimer === 0) {
        this.player.behavior.dispatch('reset')
      }
    }
  }

  /**
   * エンティティ間の衝突判定
   */
  private checkCollisions() {
    for (let i = 0; i < this.entities.length; i++) {
      for (let j = i + 1; j < this.entities.length; j++) {
        const entityA = this.entities[i]
        const entityB = this.entities[j]

        if (entityA.currentHitbox.hitTest(entityB.currentHitbox)) {
          entityA.handleCollision(entityB)
          entityB.handleCollision(entityA)
        }
      }
    }
  }

  /**
   * 全エンティティ描画
   */
  private renderEntities() {
    this.stageGraphics.clear()

    this.entities.forEach((entity) => {
      // z-index設定
      entity.zIndex = Z_INDEX.ENTITY

      // cameraContainerに追加
      if (!entity.parent || entity.parent !== this.cameraContainer) {
        this.cameraContainer.addChild(entity)
      }

      // デバッグ用ヒットボックス表示
      if (DEBUG) {
        const hitbox = entity.currentHitbox
        this.stageGraphics.rect(hitbox.x, hitbox.y, hitbox.width - 1, hitbox.height - 1)
        const strokeColor = entity.imageKey === 'player' ? 0x00ff00 : 0xffff00
        this.stageGraphics.stroke({ width: 1, color: strokeColor })
      }
    })
  }

  /**
   * デバッグ情報更新
   */
  private updateDebugInfo() {
    if (!this.debugText) return

    this.debugText.text = [
      `x: ${this.player.x.toFixed(2)}  y: ${this.player.y.toFixed(2)}`,
      `vx: ${this.player.vx.toFixed(2)}  vy: ${this.player.vy.toFixed(2)}`,
      `entities: ${this.entities.length}`,
    ].join('\n')
  }

  end() {
    this.cloudBackground.destroy()
    this.parallaxBackground?.destroy()
    this.tilemapContainer.destroy({ children: true })
    super.end()
  }
}
