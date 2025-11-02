/**
 * 落下死処理コンポーネント
 * - ステージ外に落下したかどうかを判定
 * - 着地した床座標を記録
 * - 落下死時の復帰座標を提供
 */
export class FallDeathComponent {
  private floorPositions: Array<{ x: number; y: number }> = []
  private deathY: number // 落下死判定のY座標
  private readonly MAX_FLOOR_HISTORY = 10 // 床座標の最大記録数

  /**
   * @param stageHeight ステージの高さ（ピクセル）
   */
  constructor(stageHeight: number) {
    // legacy実装: stageHeight + 32
    this.deathY = stageHeight + 32
  }

  /**
   * 落下死判定
   * @param y 現在のY座標
   * @returns ステージ外に落下したかどうか
   */
  checkFallDeath(y: number): boolean {
    return y > this.deathY
  }

  /**
   * 床座標を記録
   * @param x X座標
   * @param y Y座標
   */
  recordFloor(x: number, y: number) {
    this.floorPositions.push({ x, y })

    // 最大数を超えたら古いものから削除
    if (this.floorPositions.length > this.MAX_FLOOR_HISTORY) {
      this.floorPositions.shift()
    }
  }

  /**
   * 復帰座標を取得
   * - 最も古い床座標を取得
   * - 取得後も同じ座標を保持（連続で落ちても同じ場所に戻る）
   * @returns 復帰座標（記録がない場合はnull）
   */
  getRecoveryPosition(): { x: number; y: number } | null {
    if (this.floorPositions.length === 0) {
      return null
    }

    // 復帰位置は常に最古の床座標（インデックス0）
    const recoveryPos = this.floorPositions[0]

    // 履歴をリセット（同じ位置に復帰し続ける）
    this.floorPositions = [recoveryPos]

    return recoveryPos
  }
}
