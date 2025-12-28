import { PhysicsComponent } from '@game/components/PhysicsComponent'
import { TilemapCollisionComponent } from '@game/components/TilemapCollisionComponent'
import { Rectangle } from '@ptre/core/Rectangle'

import { CommonBehaviors } from './commonBehaviors'
import { Entity } from './Entity'
import { Nasake } from './Nasake'
import { SunGlass } from './SunGlass'

/**
 * Gurasan（グラサン）エンティティ
 * - サングラスをかけた敵キャラクター
 * - 左右に移動し、壁で反転
 * - 風に触れると分裂: Nasake + SunGlass を生成
 * - プレイヤーにダメージを与える
 */
export class Gurasan extends Entity {
  protected physics: PhysicsComponent
  protected tilemap: TilemapCollisionComponent
  protected stage: string[][]

  constructor(centerX: number, centerY: number, stage: string[][]) {
    // アンカーポイントが中央(0.5, 0.5)なので、座標は中心を指す
    // スプライトサイズ: 16x16
    // hitboxも中心基準: (-4,-4,8,12)
    const hitbox = new Rectangle(-4, -4, 8, 12)

    // タグ 'enemy': プレイヤーとの衝突判定で使用
    super('entity', centerX, centerY, 16, 16, hitbox, ['enemy'])

    this.stage = stage
    this.vx = -0.5 // 左方向に移動
    this.scale.x = 1 // 敵は左向き時に scale.x = 1

    // 必要なComponentを初期化
    this.physics = new PhysicsComponent(this)
    this.tilemap = new TilemapCollisionComponent(this, stage)

    // 風との衝突反応を設定: 分裂する
    this.collisionReaction.on('wind', () => {
      this.split()
    })

    // スプライトアニメーション初期化
    this.playAnimation('gurasan')
  }

  /**
   * 分裂処理: Nasake + SunGlass を生成して自分は消滅
   */
  private split() {
    // Nasake を生成（現在の速度の半分で移動、向きを引き継ぐ）
    const nasake = new Nasake(this.x, this.y, this.stage)
    nasake.vx = this.vx / 2
    nasake.scale.x = this.scale.x // 向きを引き継ぐ

    // SunGlass を生成（逆方向に跳ねる）
    const sunGlass = new SunGlass(this.x, this.y, -this.vx)

    // 生成イベントを発火（Sceneに追加してもらうため）
    this.behavior.dispatch('spawn', { actor: nasake })
    this.behavior.dispatch('spawn', { actor: sunGlass })

    // 自分は消滅
    this.behavior.destroy()
    super.destroy()
  }

  tick() {
    super.tick()

    this.physics.applyGravity()
    CommonBehaviors.bounceWalls(this, this.tilemap)
    this.physics.applyVelocity()
  }
}
