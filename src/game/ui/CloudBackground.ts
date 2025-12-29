import { Container, Graphics } from 'pixi.js'

interface Cloud {
  graphics: Graphics
  x: number
  y: number
  width: number
  height: number
  speed: number
  alpha: number
}

/**
 * 雲の背景演出
 * 画面右端からランダムに雲が出現し、左にゆっくり流れる
 */
export class CloudBackground {
  readonly container: Container
  private clouds: Cloud[] = []
  private spawnTimer = 0
  private spawnInterval: number
  private viewportWidth: number
  private viewportHeight: number

  /**
   * @param viewportWidth 画面幅
   * @param viewportHeight 画面高さ
   * @param spawnInterval 雲の出現間隔（フレーム）
   */
  constructor(viewportWidth: number, viewportHeight: number, spawnInterval = 120) {
    this.container = new Container()
    this.viewportWidth = viewportWidth
    this.viewportHeight = viewportHeight
    this.spawnInterval = spawnInterval

    // 初期雲を配置（画面全体に分散）
    const initialCount = 5 + Math.floor(Math.random() * 3) // 5-7個
    for (let i = 0; i < initialCount; i++) {
      // 画面幅全体に均等に分散させつつランダム性を持たせる
      const segmentWidth = viewportWidth / initialCount
      const baseX = i * segmentWidth
      this.spawnCloud(baseX + Math.random() * segmentWidth)
    }
  }

  /**
   * 雲を生成
   */
  private spawnCloud(x?: number) {
    const width = 40 + Math.random() * 60 // 40-100px
    const height = 12 + Math.random() * 12 // 12-24px
    const y = Math.random() * (this.viewportHeight * 0.6) // 画面上部60%
    const speed = 0.2 + Math.random() * 0.3 // 0.2-0.5 px/frame
    const alpha = 0.3 + Math.random() * 0.3 // 0.3-0.6

    const graphics = new Graphics()
    graphics.roundRect(0, 0, width, height, height / 2)
    graphics.fill({ color: 0xffffff, alpha })

    const cloud: Cloud = {
      graphics,
      x: x ?? this.viewportWidth + width,
      y,
      width,
      height,
      speed,
      alpha,
    }

    graphics.x = cloud.x
    graphics.y = cloud.y

    this.clouds.push(cloud)
    this.container.addChild(graphics)
  }

  /**
   * 毎フレーム更新
   */
  tick() {
    // 雲の移動
    for (let i = this.clouds.length - 1; i >= 0; i--) {
      const cloud = this.clouds[i]
      cloud.x -= cloud.speed
      cloud.graphics.x = cloud.x

      // 画面外に出たら削除
      if (cloud.x + cloud.width < 0) {
        this.container.removeChild(cloud.graphics)
        cloud.graphics.destroy()
        this.clouds.splice(i, 1)
      }
    }

    // 新しい雲の生成
    this.spawnTimer++
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0
      // ランダム性を追加（50%の確率で生成）
      if (Math.random() > 0.5) {
        this.spawnCloud()
      }
    }
  }

  /**
   * 破棄
   */
  destroy() {
    for (const cloud of this.clouds) {
      cloud.graphics.destroy()
    }
    this.clouds = []
    this.container.destroy()
  }
}
