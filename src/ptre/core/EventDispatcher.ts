/**
 * イベント駆動システム (Pub/Sub パターン)
 */
export class EventDispatcher {
  private listeners = new Map<string, Set<(...args: unknown[]) => void>>()

  /**
   * イベントリスナーを登録
   */
  on<T extends unknown[]>(event: string, callback: (...args: T) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback as (...args: unknown[]) => void)
  }

  /**
   * イベントリスナーを解除
   */
  off<T extends unknown[]>(event: string, callback: (...args: T) => void): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.delete(callback as (...args: unknown[]) => void)
      if (callbacks.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  /**
   * 1回だけ実行されるイベントリスナーを登録
   */
  once<T extends unknown[]>(event: string, callback: (...args: T) => void): void {
    const wrapper = (...args: unknown[]) => {
      callback(...(args as T))
      this.off(event, wrapper as (...args: T) => void)
    }
    this.on(event, wrapper)
  }

  /**
   * イベントを発火
   */
  dispatch(event: string, ...args: unknown[]): void {
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
   * すべてのイベントリスナーを消去
   * オブジェクト破棄時のメモリリーク防止に使用
   */
  clearAllEvents(): void {
    this.listeners.clear()
  }

  /**
   * イベントにリスナーが登録されているか確認
   */
  hasListeners(event: string): boolean {
    const callbacks = this.listeners.get(event)
    return callbacks ? callbacks.size > 0 : false
  }
}
