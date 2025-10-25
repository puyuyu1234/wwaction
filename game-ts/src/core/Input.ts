/**
 * 入力管理クラス
 * キーボード入力の状態を管理
 */
export class Input {
  private keyMap: Map<string, number> = new Map()

  constructor() {
    // キーボードイベントのリスナー登録
    window.addEventListener('keydown', (e) => this.handleKeyDown(e))
    window.addEventListener('keyup', (e) => this.handleKeyUp(e))
  }

  private handleKeyDown(e: KeyboardEvent) {
    const current = this.keyMap.get(e.key) ?? 0
    if (current === 0) {
      this.keyMap.set(e.key, 1)
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    this.keyMap.set(e.key, 0)
  }

  /**
   * フレーム更新
   * 押された瞬間のキーを持続状態に更新
   */
  update() {
    this.keyMap.forEach((value, key) => {
      if (value === 1) {
        this.keyMap.set(key, 2)
      }
    })
  }

  /**
   * キーの状態を取得
   * @param key キー名
   * @returns 0: 押されていない, 1: 押された瞬間, 2: 押され続けている
   */
  getKey(key: string): number {
    return this.keyMap.get(key) ?? 0
  }

  /**
   * キーが押された瞬間かどうか
   */
  isKeyPressed(key: string): boolean {
    return this.getKey(key) === 1
  }

  /**
   * キーが押されているかどうか（押された瞬間 + 押され続けている）
   */
  isKeyDown(key: string): boolean {
    const state = this.getKey(key)
    return state === 1 || state === 2
  }
}
