/**
 * 入力管理クラス
 * キーボード入力の状態を管理
 * engine.jsの実装に準拠
 */
export class Input {
  private isKeyPressedMap: Map<string, boolean> = new Map()
  private keyTimeMap: Map<string, number> = new Map()

  constructor() {
    // キーボードイベントのリスナー登録
    window.addEventListener('keydown', (e) => this.handleKeyDown(e))
    window.addEventListener('keyup', (e) => this.handleKeyUp(e))
  }

  private handleKeyDown(e: KeyboardEvent) {
    this.isKeyPressedMap.set(e.code, true)
    e.preventDefault()
  }

  private handleKeyUp(e: KeyboardEvent) {
    this.isKeyPressedMap.set(e.code, false)
  }

  /**
   * フレーム更新
   * キーが押されている間は正の値を増加、離されている間は負の値を減少
   */
  update() {
    this.isKeyPressedMap.forEach((isPressed, key) => {
      const keyTime = this.keyTimeMap.get(key) ?? 0
      this.keyTimeMap.set(
        key,
        isPressed ? Math.max(1, keyTime + 1) : Math.min(-1, keyTime - 1)
      )
    })
  }

  /**
   * キーの状態を取得
   * @param key キー名
   * @returns 正の値: 押されている（1=押された瞬間、2以上=押され続けている）、負の値: 離されている、0: 未入力
   */
  getKey(key: string): number {
    return this.keyTimeMap.get(key) ?? 0
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
    return this.getKey(key) > 0
  }

  /**
   * デバッグ用: 現在押されているキーの一覧を取得
   */
  getPressedKeys(): string[] {
    const pressed: string[] = []
    this.keyTimeMap.forEach((value: number, key: string) => {
      if (value > 0) {
        pressed.push(`${key}:${value}`)
      }
    })
    return pressed
  }
}
