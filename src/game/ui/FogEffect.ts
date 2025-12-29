import { Container, Graphics } from 'pixi.js'

interface FogParticle {
  graphics: Graphics
  x: number
  y: number
  width: number
  height: number
  speed: number
}

/**
 * 霧エフェクト（森ステージ用）
 * ステージ全域に霧を配置し、左端からスクロールアウトした霧は右端から再出現
 */
export class FogEffect {
  readonly container: Container
  private particles: FogParticle[] = []
  private stageWidth: number
  private stageHeight: number
  private color: number

  /**
   * @param stageWidth ステージ幅
   * @param stageHeight ステージ高さ
   * @param tileCount ステージのタイル数（横幅）
   * @param densityPerTile 1マスあたりの粒子数（デフォルト: 0.8）
   * @param color 霧の色（デフォルト: 白）
   */
  constructor(
    stageWidth: number,
    stageHeight: number,
    tileCount: number,
    densityPerTile = 0.8,
    color = 0xffffff
  ) {
    this.container = new Container()
    this.stageWidth = stageWidth
    this.stageHeight = stageHeight
    this.color = color

    // タイル数に応じた粒子数
    const particleCount = Math.floor(tileCount * densityPerTile)

    // ステージ全域に粒子を配置
    for (let i = 0; i < particleCount; i++) {
      this.createParticle()
    }
  }

  /**
   * 霧粒子を生成（ランダム位置）
   */
  private createParticle() {
    const width = 20 + Math.random() * 40 // 20-60px
    const height = 6 + Math.random() * 8 // 6-14px
    const x = Math.random() * this.stageWidth
    const y = Math.random() * this.stageHeight
    const speed = 0.05 + Math.random() * 0.1 // 0.05-0.15 px/frame
    const alpha = 0.1 + Math.random() * 0.2 // 0.1-0.3

    const graphics = new Graphics()
    graphics.roundRect(0, 0, width, height, height / 2)
    graphics.fill({ color: this.color, alpha })
    graphics.x = x
    graphics.y = y

    const particle: FogParticle = {
      graphics,
      x,
      y,
      width,
      height,
      speed,
    }

    this.particles.push(particle)
    this.container.addChild(graphics)
  }

  /**
   * 毎フレーム更新
   */
  tick() {
    for (const particle of this.particles) {
      // 左に移動
      particle.x -= particle.speed

      // 左端からスクロールアウトしたら右端へワープ
      if (particle.x + particle.width < 0) {
        particle.x = this.stageWidth + Math.random() * 20
      }

      particle.graphics.x = particle.x
    }
  }

  /**
   * 破棄
   */
  destroy() {
    for (const particle of this.particles) {
      particle.graphics.destroy()
    }
    this.particles = []
    this.container.destroy()
  }
}
