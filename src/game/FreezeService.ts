/**
 * ゲームフリーズ・スローモーション管理
 */
export class FreezeService {
  /** 残り持続フレーム */
  private static duration = 0
  /** 何フレームに1回更新するか（0=完全停止） */
  private static interval = 0
  /** 内部カウンタ */
  private static counter = 0
  /** 終了時コールバック */
  private static onEndCallback: (() => void) | null = null

  /**
   * 完全停止
   * @param duration 停止フレーム数
   * @param onEnd 終了時コールバック
   */
  static freeze(duration: number, onEnd?: () => void) {
    this.duration = duration
    this.interval = 0
    this.counter = 0
    this.onEndCallback = onEnd ?? null
  }

  /**
   * スローモーション
   * @param duration 持続フレーム数
   * @param interval 何フレームに1回更新するか（2=半速、4=1/4速）
   * @param onEnd 終了時コールバック
   */
  static slow(duration: number, interval: number, onEnd?: () => void) {
    this.duration = duration
    this.interval = interval
    this.counter = 0
    this.onEndCallback = onEnd ?? null
  }

  /**
   * 効果中かどうか
   */
  static isActive(): boolean {
    return this.duration > 0
  }

  /**
   * 毎フレーム呼ぶ
   * @returns trueなら更新スキップ、falseなら通常更新
   */
  static tick(): boolean {
    if (this.duration <= 0) return false

    this.duration--

    // 終了時にコールバック実行
    if (this.duration === 0 && this.onEndCallback) {
      const callback = this.onEndCallback
      this.onEndCallback = null
      callback()
    }

    // 完全停止
    if (this.interval === 0) return true

    // スローモーション: intervalフレームに1回だけ更新
    this.counter++
    if (this.counter >= this.interval) {
      this.counter = 0
      return false // 更新する
    }
    return true // スキップ
  }
}
