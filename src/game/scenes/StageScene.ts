import { playSfx, SFX } from '@game/audio/sfx'
import { BGM_CONFIG } from '@game/bgmConfig'
import { BLOCKSIZE, DEBUG, FONT, getBlockData, getEntityData, Z_INDEX } from '@game/config'
import { FreezeService } from '@game/FreezeService'
import { Entity } from '@game/entity/Entity'
import { createEntity, DefeatStartParams } from '@game/entity/EntityFactory'
import { PhysicsCoin } from '@game/entity/PhysicsCoin'
import { Goal } from '@game/entity/Goal'
import { Player } from '@game/entity/Player'
import { WindPool } from '@game/entity/WindPool'
import { GameSession } from '@game/GameSession'
import { StageContext } from '@game/types'
import { HPBar } from '@game/ui/HPBar'
import { SceneTransition } from '@game/ui/SceneTransition'
import { StageName } from '@game/ui/StageName'
import { ShockwaveEffect } from '@game/ui/ShockwaveEffect'
import { ThemeRenderer } from '@game/ui/ThemeRenderer'
import { TilemapRenderer } from '@game/ui/TilemapRenderer'
import { TutorialUI } from '@ptre/actor/TutorialUI'
import { AudioService } from '@ptre/audio/AudioService'
import { Camera } from '@ptre/core/Camera'
import { Input } from '@ptre/core/Input'
import { Scene } from '@ptre/scene/Scene'
import { Graphics, Container, Text } from 'pixi.js'

import { STAGEDATA } from '@/generated/stages'

/**
 * ステージシーン
 * プレイヤーとステージを管理
 */
export class StageScene extends Scene {
  private stageContext: StageContext
  private player!: Player
  private entities: Entity[] = []
  private stageGraphics: Graphics
  private tilemapRenderer: TilemapRenderer
  private cameraContainer: Container
  private camera: Camera
  private debugText?: Text
  private hpBar!: HPBar
  private input: Input
  private stageWidth: number
  private stageHeight: number

  // 風プール管理
  private windPool: WindPool

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
  private themeRenderer: ThemeRenderer

  // チュートリアルUI（ステージ0のみ）
  private tutorialUI?: TutorialUI

  // 衝撃波エフェクト
  private shockwaves: ShockwaveEffect[] = []

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

    // StageContext を生成（エンティティに渡す）
    const layers = this.stageData.stages.map((layer) => layer.map((row) => row.split('')))
    const blockData = getBlockData(this.stageData.theme)
    this.stageContext = { layers, blockData }

    // ステージサイズを計算（最初のレイヤーを基準）
    const firstLayer = layers[0]
    this.stageWidth = firstLayer[0].length * BLOCKSIZE
    this.stageHeight = firstLayer.length * BLOCKSIZE

    // sortableChildren を有効化（zIndex順で描画）
    this.container.sortableChildren = true

    // テーマに応じた背景・前景を描画
    this.themeRenderer = new ThemeRenderer({
      theme: this.stageData.theme,
      viewportWidth,
      viewportHeight,
      stageWidth: this.stageWidth,
      stageHeight: this.stageHeight,
      tileCount: layers[0].length,
      blockData,
      bgPattern: this.stageData.bg,
      fgPattern: this.stageData.fg,
    })
    this.container.addChild(this.themeRenderer.backgroundContainer)

    // カメラコンテナ（スクロール用）
    this.cameraContainer = new Container()
    this.cameraContainer.sortableChildren = true
    this.cameraContainer.zIndex = Z_INDEX.TILEMAP
    this.container.addChild(this.cameraContainer)

    // カメラ制御
    this.camera = new Camera(this.cameraContainer, viewportWidth, viewportHeight)

    // スクロール背景をカメラコンテナに追加
    this.cameraContainer.addChild(this.themeRenderer.scrollContainer)

    // タイルマップ描画（全レイヤー）
    this.tilemapRenderer = new TilemapRenderer({
      stages: this.stageData.stages,
      blockData,
    })
    this.tilemapRenderer.container.zIndex = Z_INDEX.TILEMAP
    this.cameraContainer.addChild(this.tilemapRenderer.container)

    // ステージ描画用Graphics（デバッグ用）
    this.stageGraphics = new Graphics()
    this.stageGraphics.zIndex = Z_INDEX.ENTITY
    this.cameraContainer.addChild(this.stageGraphics)

    // プレイヤー生成（ステージ内の '0' を探す）
    this.spawnPlayer()

    // ステージデータからエンティティを生成
    this.spawnEntitiesFromStage()

    // 前景をカメラコンテナに追加（エンティティより手前）
    this.themeRenderer.foregroundContainer.zIndex = Z_INDEX.FOREGROUND
    this.cameraContainer.addChild(this.themeRenderer.foregroundContainer)

    // HPBar（player.healthはIHPProviderを実装）
    this.hpBar = new HPBar(this.player.health, 10, 220)
    this.hpBar.container.zIndex = Z_INDEX.UI
    this.container.addChild(this.hpBar.container)

    // プレイヤーイベントのリッスン
    this.setupPlayerEvents()

    // 風プールを初期化
    this.windPool = new WindPool({
      context: this.stageContext,
      onAddEntity: (entity) => this.addEntity(entity),
    })
    this.windPool.getWindEntities().forEach((wind) => this.addEntity(wind))

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
      const config = BGM_CONFIG[this.stageData.bgm] ?? { loop: true }
      void audio.play({
        type: 'audio',
        path: `${import.meta.env.BASE_URL}assets/sound/music/${this.stageData.bgm}.ogg`,
        ...config,
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
      this.stageContext,
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
      this.windPool.createWind(data.x, data.y, data.vx, this.player.scale.x)
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
   * ステージデータからエンティティを生成（全レイヤーをスキャン）
   */
  private spawnEntitiesFromStage() {
    // テーマに応じたエンティティマップを取得
    const entityData = getEntityData(this.stageData.theme)

    // 全レイヤーをスキャンしてエンティティを生成
    for (const layer of this.stageContext.layers) {
      for (let y = 0; y < layer.length; y++) {
        for (let x = 0; x < layer[y].length; x++) {
          const char = layer[y][x]

          if (char in entityData) {
            const entityName = entityData[char].entityClass
            const entity = createEntity(entityName, x * BLOCKSIZE, y * BLOCKSIZE, {
              context: this.stageContext,
              getPlayerX: () => this.player.x,
              onSpawn: (e) => this.addEntity(e),
              onDefeatStart: (params) => this.handleDefeatStart(params),
            })
            if (entity) {
              this.addEntity(entity)
            }
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
   * ステージ下に落ちたエンティティを削除（プレイヤー・風以外）
   */
  private removeEntitiesBelowStage() {
    const margin = BLOCKSIZE * 2 // 余裕を持たせる
    const threshold = this.stageHeight + margin

    for (const entity of [...this.entities]) {
      if (entity === this.player) continue
      if (entity.hasTag('wind')) continue // 風はプール管理なので除外
      if (entity.y > threshold) {
        entity.behavior.destroy()
      }
    }
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
    // 衝撃波はスロー中も更新（演出優先）
    this.updateShockwaves()

    // フリーズ中は更新スキップ
    if (FreezeService.tick()) return

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

    // 背景・前景更新
    this.themeRenderer.tick()
    this.themeRenderer.updateScroll(this.camera.x, this.camera.y)

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

    // 風プール更新（消滅エフェクト管理）
    this.windPool.tick()

    // ステージ下に落ちたエンティティを削除（プレイヤー以外）
    this.removeEntitiesBelowStage()

    // デバッグ情報更新
    if (DEBUG && this.debugText) {
      this.updateDebugInfo()
    }
  }

  /**
   * カメラシェイクを開始
   * @param duration フレーム数
   */
  startCameraShake(duration: number) {
    this.cameraShakeTimer = duration
    this.cameraShakeBaseX = this.cameraContainer.x
    this.cameraShakeBaseY = this.cameraContainer.y
  }

  /**
   * 衝撃波エフェクトを生成
   */
  createShockwave(x: number, y: number) {
    const shockwave = new ShockwaveEffect(x, y)
    shockwave.graphics.zIndex = Z_INDEX.ENTITY + 10
    this.cameraContainer.addChild(shockwave.graphics)
    this.shockwaves.push(shockwave)
  }

  /**
   * 衝撃波エフェクトの更新
   */
  private updateShockwaves() {
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const shockwave = this.shockwaves[i]
      shockwave.tick()

      if (shockwave.isFinished()) {
        shockwave.destroy()
        this.shockwaves.splice(i, 1)
      }
    }
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
   * DekaNasake撃破演出
   * 衝撃波 + 画面揺れ + スローモーション → コイン生成
   */
  private handleDefeatStart(params: DefeatStartParams) {
    const { x, y, coinConfig, context } = params

    // 衝撃波エフェクト
    this.createShockwave(x, y)

    // 画面揺れ
    this.startCameraShake(15)

    // 効果音（撃破時）
    playSfx(SFX.DEFEAT)

    // スローモーション開始、終了時にコイン生成
    FreezeService.slow(30, 3, () => {
      this.spawnCoins(x, y, coinConfig, context)
    })
  }

  /**
   * コインを生成
   */
  private spawnCoins(
    x: number,
    y: number,
    config: { count: number; vyMin: number; vyMax: number; vxRange: number },
    context: StageContext
  ) {
    const { count, vyMin, vyMax, vxRange } = config

    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 2 * vxRange
      const vy = vyMin + Math.random() * (vyMax - vyMin)

      const coin = new PhysicsCoin(x, y - 8, context, vx, vy)
      this.addEntity(coin)
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
      // cameraContainerに追加（初回のみzIndex設定）
      if (!entity.parent || entity.parent !== this.cameraContainer) {
        if (entity.zIndex === 0) {
          entity.zIndex = Z_INDEX.ENTITY
        }
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
    this.themeRenderer.destroy()
    this.windPool.destroy()
    this.tilemapRenderer.destroy()
    super.end()
  }
}
