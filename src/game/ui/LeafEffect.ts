import { Container, Graphics } from 'pixi.js'

interface LeafParticle {
  graphics: Graphics
  x: number
  y: number
  baseSize: number
  speedX: number
  speedY: number
  alpha: number
}

/**
 * 葉っぱ/草のパーティクルエフェクト（森ステージ用）
 * 上から下へ舞い落ち、左にも流れる
 * サイズがチラチラ変わる（風に揺れる感じ）
 */
export class LeafEffect {
  readonly container: Container
  private particles: LeafParticle[] = []
  private stageWidth: number
  private stageHeight: number
  private color: number
  private parallaxX: number
  private parallaxY: number

  /**
   * @param stageWidth ステージ幅
   * @param stageHeight ステージ高さ
   * @param tileCount ステージのタイル数（横幅）
   * @param densityPerTile 1マスあたりの粒子数（デフォルト: 0.5）
   * @param parallaxX X軸視差レート（デフォルト: 0.5）
   * @param parallaxY Y軸視差レート（デフォルト: 1.0）
   * @param color 葉の色（デフォルト: 薄緑）
   */
  constructor(
    stageWidth: number,
    stageHeight: number,
    tileCount: number,
    densityPerTile = 0.5,
    parallaxX = 0.5,
    parallaxY = 1.0,
    color = 0x88cc88
  ) {
    this.container = new Container()
    this.stageWidth = stageWidth
    this.stageHeight = stageHeight
    this.color = color
    this.parallaxX = parallaxX
    this.parallaxY = parallaxY

    // タイル数に応じた粒子数
    const particleCount = Math.floor(tileCount * densityPerTile)

    // ステージ全域に粒子を配置
    for (let i = 0; i < particleCount; i++) {
      this.createParticle()
    }
  }

  /**
   * パーティクルを生成（ランダム位置）
   */
  private createParticle() {
    const baseSize = 0.5 + Math.random() * 1 // 1-3px
    const x = Math.random() * this.stageWidth
    const y = Math.random() * this.stageHeight
    const speedX = 0.1 + Math.random() * 0.15 // 左への移動 0.1-0.25
    const speedY = 0.3 + Math.random() * 0.3  // 落下速度 0.3-0.6
    const alpha = 0.4 + Math.random() * 0.3   // 0.4-0.7

    const graphics = new Graphics()
    this.drawLeaf(graphics, baseSize, alpha)
    graphics.x = x
    graphics.y = y

    const particle: LeafParticle = {
      graphics,
      x,
      y,
      baseSize,
      speedX,
      speedY,
      alpha,
    }

    this.particles.push(particle)
    this.container.addChild(graphics)
  }

  /**
   * 葉っぱの形を描画
   */
  private drawLeaf(graphics: Graphics, size: number, alpha: number) {
    graphics.clear()
    // 小さな楕円形（葉っぱ風）
    graphics.ellipse(0, 0, size, size * 0.6)
    graphics.fill({ color: this.color, alpha })
  }

  /**
   * 毎フレーム更新
   */
  tick() {
    for (const particle of this.particles) {
      // 移動
      particle.x -= particle.speedX
      particle.y += particle.speedY

      // 左端からスクロールアウトしたら右端へワープ
      if (particle.x + particle.baseSize < 0) {
        particle.x = this.stageWidth + Math.random() * 20
      }

      // 下端に達したら上へワープ
      if (particle.y > this.stageHeight) {
        particle.y = -particle.baseSize
        particle.x = Math.random() * this.stageWidth
      }

      // ランダムにチラチラ（たまに再描画）
      if (Math.random() < 0.1) {
        const sizeVariation = 0.7 + Math.random() * 0.6 // 0.7-1.3倍
        const size = particle.baseSize * sizeVariation
        const alpha = particle.alpha * (0.8 + Math.random() * 0.4) // 微妙なちらつき
        this.drawLeaf(particle.graphics, size, alpha)
      }

      // ランダム回転（ひらひら感）
      particle.graphics.rotation = Math.random() * Math.PI * 2

      particle.graphics.x = particle.x
      particle.graphics.y = particle.y
    }
  }

  /**
   * スクロール更新（視差効果）
   */
  updateScroll(cameraX: number, cameraY: number) {
    // 視差レートに応じてコンテナをオフセット
    // parallax 0.5 = カメラの半分の速度で動く = 背景が遅れて見える
    this.container.x = -cameraX * (1 - this.parallaxX)
    this.container.y = -cameraY * (1 - this.parallaxY)
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
