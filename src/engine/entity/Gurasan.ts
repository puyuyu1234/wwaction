import { PhysicsComponent } from '@components/PhysicsComponent'
import { TilemapCollisionComponent } from '@components/TilemapCollisionComponent'
import { Rectangle } from '@core/Rectangle'

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

  constructor(x: number, y: number, stage: string[][]) {
    // アンカーポイントが中央(0.5, 0.5)なので、座標は中心を指す
    // スプライトサイズ: 16x16、中心座標に変換: x+8, y+8
    const centerX = x + 8
    const centerY = y + 8
    const rect = new Rectangle(centerX, centerY, 16, 16)

    // hitboxも中心基準に変換: legacy(4,4,8,12) → 中心基準(-4,-4,8,12)
    // 計算: (4-8, 4-8) = (-4, -4)
    const hitbox = new Rectangle(-4, -4, 8, 12)

    // タグ 'enemy': プレイヤーとの衝突判定で使用
    // imageKey は 'entity' スプライトシートを参照
    super('entity', rect, hitbox, stage, ['enemy'])

    this.vx = -0.5 // 左方向に移動
    this.scaleX = 1 // 敵は左向き時に scaleX = 1

    // 必要なComponentを初期化
    this.physics = new PhysicsComponent(this)
    this.tilemap = new TilemapCollisionComponent(this, stage)

    // 風との衝突反応を設定: 分裂する
    this.collisionReaction.on('wind', () => {
      console.log('[Gurasan] 風に当たった！分裂開始')
      console.log(`[Gurasan] 現在位置: (${this.x}, ${this.y})`)
      console.log(`[Gurasan] 現在速度: vx=${this.vx}, vy=${this.vy}`)

      // Nasake を生成（現在の速度の半分で移動、向きを引き継ぐ）
      // this.x, this.y は中心座標なので、左上座標に変換（-8する）
      const nasake = new Nasake(this.x - 8, this.y - 8, this.stage)
      nasake.vx = this.vx / 2
      nasake.scaleX = this.scaleX // 向きを引き継ぐ
      console.log(`[Gurasan] Nasake生成: (${nasake.x}, ${nasake.y}), vx=${nasake.vx}`)

      // SunGlass を生成（逆方向に跳ねる）
      // this.x, this.y は中心座標なので、左上座標に変換（-8する）
      const sunGlass = new SunGlass(this.x - 8, this.y - 8, -this.vx, this.stage)
      console.log(`[Gurasan] SunGlass生成: (${sunGlass.x}, ${sunGlass.y}), vx=${sunGlass.vx}`)

      // 生成イベントを発火（親に追加してもらうため）
      console.log('[Gurasan] spawnイベント発火: nasake')
      this.dispatch('spawn', nasake)
      console.log('[Gurasan] spawnイベント発火: sunGlass')
      this.dispatch('spawn', sunGlass)

      // 自分は消滅
      console.log('[Gurasan] 自分を破棄')
      this.destroy()
    })

    // スプライトアニメーション初期化
    this.playAnimation('gurasan')
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
