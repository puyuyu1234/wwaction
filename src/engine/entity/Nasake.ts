import { PhysicsComponent } from '@components/PhysicsComponent'
import { TilemapCollisionComponent } from '@components/TilemapCollisionComponent'
import { Rectangle } from '@core/Rectangle'

import { CommonBehaviors } from './commonBehaviors'
import { Entity } from './Entity'

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

  constructor(centerX: number, centerY: number, stage: string[][]) {
    console.log(`[Nasake] コンストラクタ呼び出し: 中心座標=(${centerX}, ${centerY})`)

    // アンカーポイントが中央(0.5, 0.5)なので、座標は中心を指す
    // スプライトサイズ: 16x16
    const rect = new Rectangle(centerX, centerY, 16, 16)

    // hitboxも中心基準に変換: legacy(4,4,8,12) → 中心基準(-4,-4,8,12)
    // 計算: (4-8, 4-8) = (-4, -4)
    const hitbox = new Rectangle(-4, -4, 8, 12)

    // タグなし（誰も参照しないため）
    // 将来ダメージを与える敵にする場合は ['enemy'] を追加
    // imageKey は 'entity' スプライトシートを参照
    super('entity', rect, hitbox, stage, [])

    this.vx = -0.25 // 左方向にゆっくり移動
    this.scaleX = 1 // 敵は左向き時に scaleX = 1

    // 必要なComponentを初期化
    this.physics = new PhysicsComponent(this)
    this.tilemap = new TilemapCollisionComponent(this, stage)

    // 風との衝突反応を設定
    this.collisionReaction.on('wind', () => {
      CommonBehaviors.windJump(this)
    })

    // スプライトアニメーション初期化
    this.playAnimation('nasake')
    console.log(`[Nasake] 初期化完了: 最終位置=(${this.x}, ${this.y})`)
  }

  update() {
    // 重力
    this.physics.applyGravity()

    // 壁判定（跳ね返る）
    if (this.tilemap.checkLeftWall() && this.vx < 0) {
      this.tilemap.bounceAtLeftWall()
      // 向きを反転（敵は vx > 0 で scaleX = -1）
      this.scaleX = -1 // 右向き
    }
    if (this.tilemap.checkRightWall() && this.vx > 0) {
      this.tilemap.bounceAtRightWall()
      // 向きを反転
      this.scaleX = 1 // 左向き
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
