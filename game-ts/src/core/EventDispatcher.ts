/**
 * イベント駆動システム (Pub/Sub パターン)
 */
export class EventDispatcher {
  private listeners = new Map<string, Set<Function>>()

  /**
   * イベントリスナーを登録
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  /**
   * イベントリスナーを解除
   */
  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  /**
   * 1回だけ実行されるイベントリスナーを登録
   */
  once(event: string, callback: Function): void {
    const wrapper = (...args: any[]) => {
      callback(...args)
      this.off(event, wrapper)
    }
    this.on(event, wrapper)
  }

  /**
   * イベントを発火
   */
  dispatch(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      for (const callback of callbacks) {
        callback(...args)
      }
    }
  }

  /**
   * イベントリスナーをすべて消去
   */
  clearEvents(event: string): void {
    this.listeners.delete(event)
  }

  /**
   * イベントにリスナーが登録されているか確認
   */
  hasListeners(event: string): boolean {
    const callbacks = this.listeners.get(event)
    return callbacks ? callbacks.size > 0 : false
  }
}
