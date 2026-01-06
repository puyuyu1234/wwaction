import { Application } from 'pixi.js'

import { Scene } from '../scene/Scene'

import { Input } from './Input'

/**
 * ゲームメインループクラス
 * PixiJS Application と Fixed timestep 方式でゲームを駆動
 */
export class Game {
  private app: Application
  private currentScene: Scene | null = null
  private input: Input
  private running = false
  private lastTime = 0
  private readonly canvasId: string
  private readonly baseWidth: number
  private readonly baseHeight: number

  // Fixed timestep設定
  private readonly FPS = 60
  private readonly FRAME_TIME = 1000 / this.FPS // 16.666...ms
  private readonly UPDATE_THRESHOLD = this.FRAME_TIME * 0.9 // 15ms (10%の許容誤差)
  private accumulator = 0

  private constructor(canvasId: string, baseWidth: number, baseHeight: number) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement
    if (!canvas) {
      throw new Error(`Canvas with id "${canvasId}" not found`)
    }

    this.canvasId = canvasId
    this.baseWidth = baseWidth
    this.baseHeight = baseHeight

    // PixiJS Application 初期化
    this.app = new Application()
    this.input = new Input()
  }

  /**
   * ゲームインスタンスを生成して初期化
   * @param canvasId - Canvas 要素の ID
   * @param baseWidth - ゲーム画面の基本幅
   * @param baseHeight - ゲーム画面の基本高さ
   * @returns 初期化済みの Game インスタンス
   */
  static async create(canvasId: string, baseWidth: number, baseHeight: number): Promise<Game> {
    const game = new Game(canvasId, baseWidth, baseHeight)
    await game.init()
    return game
  }

  /**
   * PixiJS Application を初期化（非同期）
   */
  private async init() {
    await this.app.init({
      canvas: document.getElementById(this.canvasId) as HTMLCanvasElement,
      width: this.baseWidth,
      height: this.baseHeight,
      backgroundColor: 0x4488cc,
      resolution: 1, // ピクセルアート用に解像度を1に固定
      antialias: false,
      autoDensity: false, // 解像度を1に固定する場合はfalseにする
      roundPixels: true, // サブピクセルレンダリングを防ぐ（スプライトブリーディング対策）
    })
  }

  /**
   * シーンを変更
   */
  changeScene(scene: Scene) {
    if (this.currentScene) {
      this.currentScene.end()
      this.app.stage.removeChild(this.currentScene.container)
      // 古いシーンのイベントリスナーをクリア
      this.currentScene.clearAllEvents()
    }
    this.currentScene = scene
    this.app.stage.addChild(this.currentScene.container)

    // シーンのイベントを監視（シーン遷移）
    // StageScene 内で画面遷移演出が完了したら 'changeScene' イベントが発火
    // Game がそれを受け取ってシーン切り替えを実行
    // （Scene.changeScene() メソッド → StageScene の演出リスナー → 演出完了後に Game へ）
    this.currentScene.on('changeScene', (newScene: Scene) => {
      this.changeScene(newScene)
    })

    this.currentScene.start()
  }

  /**
   * ゲームループ開始
   */
  start() {
    if (this.running) return

    this.running = true
    this.lastTime = performance.now()
    this.loop(this.lastTime)
  }

  /**
   * ゲームループ停止
   */
  stop() {
    this.running = false
  }

  /**
   * メインループ (Fixed timestep)
   */
  private loop(currentTime: number) {
    if (!this.running) return

    requestAnimationFrame((time) => this.loop(time))

    const deltaTime = currentTime - this.lastTime
    this.lastTime = currentTime

    // Fixed timestep: deltaTime を蓄積して、FRAME_TIME ごとに update
    this.accumulator += deltaTime

    // 5フレーム以上遅延した場合は、古いフレームを全てスキップ
    const maxFrames = 5
    if (this.accumulator >= this.FRAME_TIME * maxFrames) {
      // 遅延が大きすぎる場合、accumulatorをリセットして最新状態に追いつく
      this.accumulator = 0
      console.warn(`Frame skip: accumulator reset (lag detected)`)
    }

    // 通常のフレーム処理
    // UPDATE_THRESHOLD (15ms) で判定することで、描画フレームスキップを軽減
    let frames = 0
    while (this.accumulator >= this.UPDATE_THRESHOLD && frames < maxFrames) {
      this.update()
      this.accumulator -= this.FRAME_TIME
      frames++
    }

    // PixiJS の render は自動実行される
  }

  /**
   * 更新処理（固定フレームレート）
   */
  private update() {
    if (!this.currentScene) return

    // 入力更新
    this.input.update()

    // シーン更新
    this.currentScene.tick()
  }

  /**
   * Input インスタンスを取得
   */
  getInput(): Input {
    return this.input
  }

  /**
   * PixiJS Application を取得
   */
  getApp(): Application {
    return this.app
  }

  /**
   * ビューポート幅を取得
   */
  getBaseWidth(): number {
    return this.baseWidth
  }

  /**
   * ビューポート高さを取得
   */
  getBaseHeight(): number {
    return this.baseHeight
  }
}
