import { Container } from 'pixi.js'
import { ActorBehavior } from './ActorBehavior'
import type { Actor } from './types'

/**
 * 複数のActorを格納・管理するコンテナActor
 *
 * ## 用途
 * - UIパネル（スコア表示、メニュー、インベントリなど）
 * - エフェクトグループ（パーティクル、爆発エフェクトなど）
 * - ゲームオブジェクトグループ（敵編隊、建物群など）
 * - レイヤー管理（背景、中景、前景の分離）
 *
 * ## 特徴
 * - 子Actorの一括ライフサイクル管理
 * - 座標変換の継承（親の移動・回転・スケールが子に影響）
 * - PixiJS Containerとの統合でパフォーマンス最適化
 */
export class ContainerActor extends Container {
  readonly behavior: ActorBehavior
  protected childActors: Actor[] = []

  constructor(x = 0, y = 0, tags: string[] = []) {
    super()
    this.x = x
    this.y = y
    this.behavior = new ActorBehavior(tags)
  }

  /**
   * タグを持っているか確認
   */
  hasTag(tag: string): boolean {
    return this.behavior.hasTag(tag)
  }

  /**
   * 破壊されているかどうか
   */
  get isDestroyed(): boolean {
    return this.behavior.isDestroyed
  }

  /**
   * 子Actorを追加
   */
  addActor(actor: Actor): void {
    if (this.isDestroyed) {
      console.warn('ContainerActor: 破壊済みのコンテナに子要素を追加しようとしました')
      return
    }

    this.childActors.push(actor)
    this.addChild(actor) // Actor は Container
  }

  /**
   * 子Actorを削除
   */
  removeActor(actor: Actor): void {
    const index = this.childActors.indexOf(actor)
    if (index === -1) return

    this.childActors.splice(index, 1)
    this.removeChild(actor)
  }

  /**
   * すべての子Actorを削除
   */
  removeAllActors(): void {
    for (const child of [...this.childActors]) {
      this.removeActor(child)
    }
  }

  /**
   * ゲームロジック更新（毎フレーム呼ばれる）
   * - 子Actorのtickを順次実行
   * - 破壊された子Actorを自動削除
   */
  tick(): void {
    if (this.isDestroyed) return

    // 子Actorを更新
    for (const child of this.childActors) {
      child.tick()
    }

    // 破壊された子Actorを削除
    const destroyedChildren = this.childActors.filter((child) => child.isDestroyed)
    for (const child of destroyedChildren) {
      this.removeActor(child)
    }
  }

  /**
   * Actorを破壊
   */
  destroy(): void {
    if (this.isDestroyed) return

    this.behavior.destroy()

    // 子Actorを破壊
    for (const child of this.childActors) {
      child.destroy()
    }

    this.childActors.length = 0
    super.destroy()
  }
}