import { EventDispatcher } from '@core/EventDispatcher'
import { Container } from 'pixi.js'

import { Actor } from '@/engine/actor/Actor'

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
   */
  add(actor: Actor) {
    this.actorsToAdd.push(actor)
  }

  /**
   * アクターを削除
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
   * フレーム更新
   */
  update() {
    // 追加・削除の反映
    this.actors = this.actors.filter((actor) => !this.actorsToRemove.includes(actor))
    this.actors.push(...this.actorsToAdd)
    this.actorsToAdd = []
    this.actorsToRemove = []

    // アクター更新
    this.actors.forEach((actor) => {
      if (actor.update) {
        actor.update()
      }
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
    // サブクラスでオーバーライド
  }
}
