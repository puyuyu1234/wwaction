import { Application } from 'pixi.js'

import { Input } from './Input'

import { Scene } from '@/engine/scene/Scene'

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
  private readonly baseWidth: number
  private readonly baseHeight: number

  // Fixed timestep設定
  private readonly FPS = 60
  private readonly FRAME_TIME = 1000 / this.FPS // 16.666...ms
  private accumulator = 0

  constructor(canvasId: string, baseWidth: number, baseHeight: number) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement
    if (!canvas) {
      throw new Error(`Canvas with id "${canvasId}" not found`)
    }

    this.baseWidth = baseWidth
    this.baseHeight = baseHeight

    // PixiJS Application 初期化
    this.app = new Application()
    this.input = new Input()
  }

  /**
   * PixiJS Application を初期化（非同期）
   */
  async init() {
    await this.app.init({
      canvas: document.getElementById('gameCanvas') as HTMLCanvasElement,
      width: this.baseWidth,
      height: this.baseHeight,
      backgroundColor: 0x000000,
      resolution: 1, // ピクセルアート用に解像度を1に固定
      antialias: false,
      autoDensity: false, // 解像度を1に固定する場合はfalseにする
    })

    // リサイズ処理を設定
    this.setupResize()
    this.resize()
  }

  /**
   * リサイズ処理のセットアップ
   */
  private setupResize() {
    window.addEventListener('resize', () => this.resize())
  }

  /**
   * 画面サイズに合わせてキャンバスをリサイズ（アスペクト比維持）
   */
  private resize() {
    const canvas = this.app.canvas as HTMLCanvasElement
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight

    // アスペクト比を計算
    const aspectRatio = this.baseWidth / this.baseHeight
    const windowAspectRatio = windowWidth / windowHeight

    let scale: number
    if (windowAspectRatio > aspectRatio) {
      // 横長の場合、高さに合わせる
      scale = windowHeight / this.baseHeight
    } else {
      // 縦長の場合、幅に合わせる
      scale = windowWidth / this.baseWidth
    }

    // CSSで表示サイズを調整
    canvas.style.width = `${this.baseWidth * scale}px`
    canvas.style.height = `${this.baseHeight * scale}px`
  }

  /**
   * シーンを変更
   */
  changeScene(scene: Scene) {
    if (this.currentScene) {
      this.currentScene.end()
      this.app.stage.removeChild(this.currentScene.container)
    }
    this.currentScene = scene
    this.app.stage.addChild(this.currentScene.container)
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

    // 最大5フレーム分までキャッチアップ（無限ループ防止）
    const maxFrames = 5
    let frames = 0

    while (this.accumulator >= this.FRAME_TIME && frames < maxFrames) {
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
    this.currentScene.update()
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
}
