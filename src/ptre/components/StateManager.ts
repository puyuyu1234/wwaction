/**
 * 汎用状態管理クラス
 * エンティティの状態遷移とフレームカウントを管理する
 *
 * @template T - 状態の型（enumまたはstring）
 */
export class StateManager<T extends string | number> {
  private currentState: T
  private stateTime = 0

  /**
   * コンストラクタ
   * @param initialState - 初期状態
   */
  constructor(initialState: T) {
    this.currentState = initialState
  }

  /**
   * 状態を変更する
   * @param newState - 新しい状態
   */
  changeState(newState: T): void {
    this.currentState = newState
    this.stateTime = 0
  }

  /**
   * フレームカウントを進める
   */
  update(): void {
    this.stateTime++
  }

  /**
   * 現在の状態を取得
   * @returns 現在の状態
   */
  getState(): T {
    return this.currentState
  }

  /**
   * 現在の状態に滞在しているフレーム数を取得
   * @returns 状態開始からのフレーム数
   */
  getTime(): number {
    return this.stateTime
  }
}
