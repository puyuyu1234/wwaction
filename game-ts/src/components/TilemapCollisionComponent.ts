import { BLOCKSIZE, BLOCKDATA } from '@/game/config'
import { CollisionType } from '@/game/types'
import { Rectangle } from '@/core/Rectangle'

export interface ICollidable {
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  hitbox: Rectangle
}

/**
 * タイルマップ衝突判定Component
 *
 * 座標系の定義:
 * - Rectangle の right/bottom は「境界の外側」を指す
 *   例: Rectangle(0, 0, 16, 16) → left=0, right=16, top=0, bottom=16
 * - タイルマップは BLOCKSIZE (16px) 単位のグリッド
 * - isWall(x, y) は座標 (x, y) が壁かどうかを判定
 */
export class TilemapCollisionComponent {
  constructor(
    private entity: ICollidable,
    private stage: string[][]
  ) {}

  /**
   * エンティティの現在のヒットボックス（ワールド座標）
   */
  private get currentHitbox(): Rectangle {
    return new Rectangle(
      this.entity.x + this.entity.hitbox.x,
      this.entity.y + this.entity.hitbox.y,
      this.entity.hitbox.width,
      this.entity.hitbox.height
    )
  }

  /**
   * 指定座標が壁（SOLID または PLATFORM）かどうかを判定
   * @param x ワールド座標 X
   * @param y ワールド座標 Y
   * @returns 壁なら true
   */
  private isWall(x: number, y: number): boolean {
    const bx = Math.floor(x / BLOCKSIZE)
    const by = Math.floor(y / BLOCKSIZE)

    if (y < 0) return false
    if (!this.stage[by] || !this.stage[by][bx]) return false

    const blockKey = this.stage[by][bx]
    const blockType = BLOCKDATA[blockKey]?.type ?? CollisionType.NONE
    return blockType === CollisionType.SOLID || blockType === CollisionType.PLATFORM
  }

  /**
   * 左方向への移動で壁に衝突するかチェック
   * ヒットボックスの左辺が次フレームで壁に入るかを判定
   */
  checkLeftWall(): boolean {
    const hitbox = this.currentHitbox
    const nextLeft = hitbox.left + this.entity.vx

    // ヒットボックスの上から下まで BLOCKSIZE 刻みでチェック
    for (let y = hitbox.top; y < hitbox.bottom; y += BLOCKSIZE) {
      if (this.isWall(nextLeft, y)) {
        return true
      }
    }
    // 最後に bottom-1 の位置もチェック（ループで飛ばされる可能性があるため）
    if (this.isWall(nextLeft, hitbox.bottom - 1)) {
      return true
    }
    return false
  }

  /**
   * 左壁で停止（位置を壁の右端に調整し、速度を0に）
   */
  stopAtLeftWall() {
    const hitbox = this.currentHitbox
    const nextLeft = hitbox.left + this.entity.vx
    // 壁ブロックの右端に配置
    this.entity.x = (Math.floor(nextLeft / BLOCKSIZE) + 1) * BLOCKSIZE - this.entity.hitbox.x
    this.entity.vx = 0
  }

  /**
   * 左壁で跳ね返る（位置を壁の右端に調整し、速度を反転）
   */
  bounceAtLeftWall() {
    const hitbox = this.currentHitbox
    const nextLeft = hitbox.left + this.entity.vx
    // 壁ブロックの右端に配置
    this.entity.x = (Math.floor(nextLeft / BLOCKSIZE) + 1) * BLOCKSIZE - this.entity.hitbox.x
    this.entity.vx *= -1
  }

  /**
   * 右方向への移動で壁に衝突するかチェック
   * ヒットボックスの右辺が次フレームで壁に入るかを判定
   */
  checkRightWall(): boolean {
    const hitbox = this.currentHitbox
    const nextRight = hitbox.right + this.entity.vx

    // ヒットボックスの上から下まで BLOCKSIZE 刻みでチェック
    // right は境界の外側なので、right-1 の位置をチェック
    for (let y = hitbox.top; y < hitbox.bottom; y += BLOCKSIZE) {
      if (this.isWall(nextRight - 1, y)) {
        return true
      }
    }
    // 最後に bottom-1 の位置もチェック
    if (this.isWall(nextRight - 1, hitbox.bottom - 1)) {
      return true
    }
    return false
  }

  /**
   * 右壁で停止（位置を壁の左端に調整し、速度を0に）
   */
  stopAtRightWall() {
    const hitbox = this.currentHitbox
    const nextRight = hitbox.right + this.entity.vx
    // 壁ブロックの左端に配置
    this.entity.x = Math.floor(nextRight / BLOCKSIZE) * BLOCKSIZE - this.entity.hitbox.x - this.entity.hitbox.width
    this.entity.vx = 0
  }

  /**
   * 右壁で跳ね返る（位置を壁の左端に調整し、速度を反転）
   */
  bounceAtRightWall() {
    const hitbox = this.currentHitbox
    const nextRight = hitbox.right + this.entity.vx
    // 壁ブロックの左端に配置
    this.entity.x = Math.floor(nextRight / BLOCKSIZE) * BLOCKSIZE - this.entity.hitbox.x - this.entity.hitbox.width
    this.entity.vx *= -1
  }

  /**
   * 上方向への移動で壁に衝突するかチェック
   * ヒットボックスの上辺が次フレームで壁に入るかを判定
   */
  checkUpWall(): boolean {
    const hitbox = this.currentHitbox
    const nextTop = hitbox.top + this.entity.vy

    // ヒットボックスの左から右まで BLOCKSIZE 刻みでチェック
    for (let x = hitbox.left; x < hitbox.right; x += BLOCKSIZE) {
      if (this.isWall(x, nextTop)) {
        return true
      }
    }
    // 最後に right-1 の位置もチェック
    if (this.isWall(hitbox.right - 1, nextTop)) {
      return true
    }
    return false
  }

  /**
   * 上壁で停止（位置を壁の下端に調整し、速度を0に）
   */
  stopAtUpWall() {
    const hitbox = this.currentHitbox
    const nextTop = hitbox.top + this.entity.vy
    // 壁ブロックの下端に配置
    this.entity.y = (Math.floor(nextTop / BLOCKSIZE) + 1) * BLOCKSIZE - this.entity.hitbox.y
    this.entity.vy = 0
  }

  /**
   * 下方向への移動で壁に衝突するかチェック
   * ヒットボックスの下辺が次フレームで壁に入るかを判定
   */
  checkDownWall(): boolean {
    const hitbox = this.currentHitbox
    const nextBottom = hitbox.bottom + this.entity.vy

    // ヒットボックスの左から右まで BLOCKSIZE 刻みでチェック
    // bottom は境界の外側なので、bottom-1 の位置をチェック
    for (let x = hitbox.left; x < hitbox.right; x += BLOCKSIZE) {
      if (this.isWall(x, nextBottom - 1)) {
        return true
      }
    }
    // 最後に right-1 の位置もチェック
    if (this.isWall(hitbox.right - 1, nextBottom - 1)) {
      return true
    }
    return false
  }

  /**
   * 下壁で停止（位置を壁の上端に調整し、速度を0に）
   */
  stopAtDownWall() {
    const hitbox = this.currentHitbox
    const nextBottom = hitbox.bottom + this.entity.vy
    // 壁ブロックの上端に配置
    this.entity.y = Math.floor(nextBottom / BLOCKSIZE) * BLOCKSIZE - this.entity.hitbox.y - this.entity.hitbox.height
    this.entity.vy = 0
  }
}
