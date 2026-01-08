import { BGM_CONFIG } from '@game/bgmConfig'
import { BLOCKSIZE, DEBUG, FONT, getBlockData, getEntityData, Z_INDEX } from '@game/config'
import { DekaNasake } from '@game/entity/DekaNasake'
import { Entity } from '@game/entity/Entity'
import { Fun } from '@game/entity/Fun'
import { Funkorogashi } from '@game/entity/Funkorogashi'
import { Goal } from '@game/entity/Goal'
import { Gurasan } from '@game/entity/Gurasan'
import { GurasanNotFall } from '@game/entity/GurasanNotFall'
import { Nasake } from '@game/entity/Nasake'
import { Nuefu } from '@game/entity/Nuefu'
import { Onpu } from '@game/entity/Onpu'
import { Player } from '@game/entity/Player'
import { Potion } from '@game/entity/Potion'
import { Semi } from '@game/entity/Semi'
import { Shimi } from '@game/entity/Shimi'
import { WindPool } from '@game/entity/WindPool'
import { GameSession } from '@game/GameSession'
import { BlockDataMap, StageLayers, StageContext } from '@game/types'
import { HPBar } from '@game/ui/HPBar'
import { SceneTransition } from '@game/ui/SceneTransition'
import { StageName } from '@game/ui/StageName'
import { ThemeRenderer } from '@game/ui/ThemeRenderer'
import { TutorialUI } from '@ptre/actor/TutorialUI'
import { AudioService } from '@ptre/audio/AudioService'
import { AssetLoader } from '@ptre/core/AssetLoader'
import { Camera } from '@ptre/core/Camera'
import { Input } from '@ptre/core/Input'
import { Scene } from '@ptre/scene/Scene'
import { Graphics, Container, Text, Sprite } from 'pixi.js'

import { STAGEDATA } from '@/generated/stages'

/**
 * ステージシーン
 * プレイヤーとステージを管理
 */
export class StageScene extends Scene {
  private stage: StageLayers
  private stageContext: StageContext
  private blockData: BlockDataMap
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
    // 全レイヤーをパースして衝突判定用に使用
    this.stage = this.stageData.stages.map((layer) => layer.map((row) => row.split('')))

    // テーマに応じたブロックデータを取得
    this.blockData = getBlockData(this.stageData.theme)

    // StageContext を生成（エンティティに渡す）
    this.stageContext = {
      layers: this.stage,
      blockData: this.blockData,
    }

    // ステージサイズを計算（最初のレイヤーを基準）
    const firstLayer = this.stage[0]
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
      tileCount: this.stage[0].length,
      blockData: this.blockData,
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

        // blockDataからフレーム番号を取得
        const block = this.blockData[char]
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

    this.tilemapContainer.addChild(layerContainer)
  }

  /**
   * ステージデータからエンティティを生成（全レイヤーをスキャン）
   */
  private spawnEntitiesFromStage() {
    const entityFactory: Record<string, (x: number, y: number) => Entity> = {
      Nasake: (x, y) => new Nasake(x + 8, y + 8, this.stageContext),
      Gurasan: (x, y) => new Gurasan(x + 8, y + 8, this.stageContext),
      GurasanNotFall: (x, y) => new GurasanNotFall(x + 8, y + 8, this.stageContext),
      Potion: (x, y) => new Potion(x + 8, y + 8, this.stageContext),
      Nuefu: (x, y) => new Nuefu(x + 8, y + 8, this.stageContext),
      Shimi: (x, y) => new Shimi(x + 16, y + 8, this.stageContext),
      Dekanasake: (x, y) => new DekaNasake(x + 16, y + 16, this.stageContext),
      Funkorogashi: (x, y) => {
        const funko = new Funkorogashi(x + 8, y + 8, this.stageContext, () => this.player.x)
        funko.behavior.on('spawnFun', (fun: Fun) => {
          this.addEntity(fun)
        })
        return funko
      },
      Semi: (x, y) => {
        const semi = new Semi(x + 8, y + 8, () => this.player.x)
        semi.behavior.on('spawnOnpu', (onpu: Onpu) => {
          this.addEntity(onpu)
        })
        return semi
      },
    }

    // テーマに応じたエンティティマップを取得
    const entityData = getEntityData(this.stageData.theme)

    // 全レイヤーをスキャンしてエンティティを生成
    for (const layer of this.stage) {
      for (let y = 0; y < layer.length; y++) {
        for (let x = 0; x < layer[y].length; x++) {
          const char = layer[y][x]

          if (char in entityData) {
            const entityName = entityData[char].entityClass

            const factory = entityFactory[entityName]
            if (factory) {
              const entity = factory(x * BLOCKSIZE, y * BLOCKSIZE)
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
    this.tilemapContainer.destroy({ children: true })
    super.end()
  }
}
