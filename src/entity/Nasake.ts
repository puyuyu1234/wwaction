import { Entity } from './Entity'

import { PhysicsComponent } from '@/components/PhysicsComponent'
import { TilemapCollisionComponent } from '@/components/TilemapCollisionComponent'
import { Rectangle } from '@/core/Rectangle'

/**
 * Nasake（ナサケ）エンティティ
 * - 最もシンプルな敵（プレイヤーにダメージを与えない）
 * - 左右に移動し、壁で反転
 * - 風で跳ねる
 * - 重力が適用される
 */
export class Nasake extends Entity {
  private physics: PhysicsComponent
  private tilemap: TilemapCollisionComponent

  constructor(x: number, y: number, stage: string[][]) {
    const rect = new Rectangle(x, y, 16, 16)
    const hitbox = new Rectangle(4, 4, 8, 12)

    // タグなし（誰も参照しないため）
    // 将来ダメージを与える敵にする場合は ['enemy'] を追加
    super('nasake', rect, hitbox, stage, [])

    this.vx = -0.25 // 左方向にゆっくり移動

    // 必要なComponentを初期化
    this.physics = new PhysicsComponent(this)
    this.tilemap = new TilemapCollisionComponent(this, stage)

    // 風との衝突反応を設定
    this.collisionReaction.on('wind', () => {
      this.vy = -3 // WindJump
    })
  }

  update() {
    // 重力
    this.physics.applyGravity()

    // 壁判定（跳ね返る）
    if (this.tilemap.checkLeftWall() && this.vx < 0) {
      this.tilemap.bounceAtLeftWall()
      // 向きを反転（元のJS実装の scaleX *= -1 に相当）
      // TODO: scaleX はまだ実装されていないため、後で追加
    }
    if (this.tilemap.checkRightWall() && this.vx > 0) {
      this.tilemap.bounceAtRightWall()
      // 向きを反転
      // TODO: scaleX はまだ実装されていないため、後で追加
    }
    if (this.tilemap.checkUpWall() && this.vy < 0) {
      this.tilemap.stopAtUpWall()
    }
    if (this.tilemap.checkDownWall() && this.vy > 0) {
      this.tilemap.stopAtDownWall()
    }

    // 速度適用
    this.physics.applyVelocity()
  }
}
