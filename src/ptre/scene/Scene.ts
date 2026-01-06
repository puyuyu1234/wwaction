import { Container } from 'pixi.js'

import type { Actor } from '../actor/types'
import { EventDispatcher } from '../core/EventDispatcher'

/**
 * シーン基底クラス
 * PixiJS Container としてアクターの管理とupdateループを提供
 */
export class Scene extends EventDispatcher {
  public container: Container
  protected actors: Actor[] = []
  protected actorsToAdd: Actor[] = []
  protected actorsToRemove: Actor[] = []

  constructor() {
    super()
    this.container = new Container()
  }

  /**
   * アクターを追加
   * spawn/destroyイベントを自動的に購読
   */
  add(actor: Actor) {
    this.actorsToAdd.push(actor)

    // PixiJS表示オブジェクトも自動追加
    this.container.addChild(actor)

    // spawn イベントを購読して新しいActorを自動追加
    actor.behavior.on('spawn', ({ actor: newActor }: { actor: Actor }) => {
      this.add(newActor)
    })

    // destroy イベントを購読して削除予約
    // 注: コールバック引数のactorはActorBehaviorなので、クロージャでactorをキャプチャ
    actor.behavior.on('destroy', () => {
      this.remove(actor)
    })
  }

  /**
   * アクターを削除
   * 遅延削除: 次のtick()実行時に実際の削除が行われる
   */
  remove(actor: Actor) {
    this.actorsToRemove.push(actor)
  }

  /**
   * タグでアクターを検索
   */
  find(tag: string): Actor[] {
    return this.actors.filter((actor) => actor.hasTag(tag))
  }

  /**
   * すべてのアクターを取得
   */
  getActors(): Actor[] {
    return [...this.actors]
  }

  /**
   * ゲームロジック更新（毎フレーム呼ばれる）
   */
  tick() {
    // 破壊されたアクターを削除予約に追加
    this.actors.forEach((actor) => {
      if (actor.isDestroyed) {
        this.actorsToRemove.push(actor)
      }
    })

    // 削除処理の実行（PixiJS表示オブジェクトとイベントをクリーンアップ）
    this.actorsToRemove.forEach((actor) => {
      if (actor.parent) {
        actor.parent.removeChild(actor)
      }
      actor.behavior.clearAllEvents()
    })

    // 追加・削除の反映
    this.actors = this.actors.filter((actor) => !this.actorsToRemove.includes(actor))
    this.actors.push(...this.actorsToAdd)
    this.actorsToAdd = []
    this.actorsToRemove = []

    // アクター更新
    this.actors.forEach((actor) => {
      actor.tick()
    })
  }

  /**
   * シーン開始時の処理
   */
  start() {
    // サブクラスでオーバーライド
  }

  /**
   * シーン終了時の処理
   */
  end() {
    // 全てのアクターのイベントリスナーをクリーンアップ
    this.actors.forEach((actor) => {
      actor.behavior.clearAllEvents()
    })

    // サブクラスでオーバーライド
  }

  /**
   * シーン遷移をリクエスト
   * Game に対してシーン切り替えを通知する
   * 演出が必要な場合は、サブクラスでこのメソッドをオーバーライドして
   * 演出完了後に super.changeScene(newScene) を呼ぶ
   */
  changeScene(newScene: Scene) {
    this.dispatch('changeScene', newScene)
  }
}
