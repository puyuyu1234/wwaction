import { Wind } from './Wind'
import { Entity } from './Entity'

interface WindPoolConfig {
  poolSize?: number
  stage: string[][]
  onAddEntity: (entity: Entity) => void
}

/**
 * 風エンティティのオブジェクトプール
 * - 風の生成・リサイクル
 * - 消滅エフェクトのライフサイクル管理
 */
export class WindPool {
  private pool: Wind[] = []
  private poolIndex = 0
  private vanishingWinds: Array<{ wind: Wind; timer: number }> = []
  private stage: string[][]
  private onAddEntity: (entity: Entity) => void

  constructor(config: WindPoolConfig) {
    const poolSize = config.poolSize ?? 2
    this.stage = config.stage
    this.onAddEntity = config.onAddEntity

    // プールを初期化
    for (let i = 0; i < poolSize; i++) {
      this.pool.push(new Wind(-100, -100, 0, this.stage))
    }
  }

  /**
   * 初期化済みの Wind エンティティ配列を取得
   */
  getWindEntities(): Wind[] {
    return this.pool
  }

  /**
   * 風を生成（プールから取得してリサイクル）
   */
  createWind(x: number, y: number, vx: number, playerScaleX: number): void {
    this.poolIndex = (this.poolIndex + 1) % this.pool.length
    const wind = this.pool[this.poolIndex]

    // 古い風の位置に消滅エフェクトを生成
    const vanishingWind = new Wind(wind.x, wind.y, 0, this.stage)
    vanishingWind.vx = wind.vx
    vanishingWind.vy = wind.vy
    vanishingWind.playAnimation('vanish')
    this.onAddEntity(vanishingWind)
    this.vanishingWinds.push({ wind: vanishingWind, timer: 0 })

    // 風を新しい位置にリセット
    wind.reset(x, y, vx, playerScaleX)
  }

  /**
   * 消滅エフェクトの更新（毎フレーム呼び出し）
   */
  tick(): void {
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
   * リソース解放
   */
  destroy(): void {
    this.vanishingWinds.forEach((entry) => {
      entry.wind.behavior.destroy()
      entry.wind.destroy()
    })
    this.vanishingWinds = []
  }
}
