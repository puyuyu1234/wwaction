import { PhysicsComponent } from '@game/components/PhysicsComponent'
import { TilemapCollisionComponent } from '@game/components/TilemapCollisionComponent'
import { Rectangle } from '@ptre/core/Rectangle'

import { Entity } from './Entity'

/**
 * 風エンティティ
 * - 水平方向に移動
 * - 重力が適用される
 * - 壁で跳ね返る（モードによっては止まる）
 */
export class Wind extends Entity {
  private physics: PhysicsComponent
  private tilemap: TilemapCollisionComponent
  private wallBehavior: 'stop' | 'bounce' = 'bounce'

  constructor(centerX: number, centerY: number, vx: number, stage: string[][]) {
    // アンカーポイントが中央(0.5, 0.5)なので、座標は中心を指す
    // スプライトサイズ: 16x16
    // hitboxも中心基準: (-5,-8,10,16)
    const hitbox = new Rectangle(-5, -8, 10, 16)
    // タグ 'wind': 他エンティティの衝突反応で参照される
    super('wind', centerX, centerY, 16, 16, hitbox, ['wind'])

    this.vx = vx

    // 必要なComponentを初期化
    this.physics = new PhysicsComponent(this)
    this.tilemap = new TilemapCollisionComponent(this, stage)

    // スプライトアニメーション初期化
    this.playAnimation('wind')
  }

  /**
   * 壁判定モードを設定
   * @param mode 'stop' = 壁で止まる, 'bounce' = 壁で跳ね返る
   */
  setWallBehavior(mode: 'stop' | 'bounce') {
    this.wallBehavior = mode
  }

  tick() {
    super.tick()

    // 重力
    this.physics.applyGravity()

    // 壁判定（モードに応じて止まるか跳ね返る）
    if (this.tilemap.checkLeftWall() && this.vx < 0) {
      if (this.wallBehavior === 'stop') {
        this.tilemap.stopAtLeftWall()
      } else {
        this.tilemap.bounceAtLeftWall()
      }
    }
    if (this.tilemap.checkRightWall() && this.vx > 0) {
      if (this.wallBehavior === 'stop') {
        this.tilemap.stopAtRightWall()
      } else {
        this.tilemap.bounceAtRightWall()
      }
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
