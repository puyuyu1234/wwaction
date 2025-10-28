import { Rectangle } from '@/core/Rectangle'
import { BLOCKSIZE, BLOCKDATA } from '@/game/config'
import { CollisionType } from '@/game/types'

/**
 * 衝突判定Componentが要求するインターフェース
 */
export interface ICollisionEntity {
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
 * - Rectangle の left/top は「境界の内側」、right/bottom は「境界の外側」を指す
 *   例: Rectangle(0, 0, 16, 16) → left=0, right=16, top=0, bottom=16
 *   実際に占有するピクセルは (0,0) から (15,15) まで
 * - タイルマップは BLOCKSIZE (16px) 単位のグリッド
 * - isWall(x, y) は座標 (x, y) が壁かどうかを判定
 */
export class TilemapCollisionComponent {
  constructor(
    private entity: ICollisionEntity,
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

    // 上方向（y < 0）はジャンプできるよう壁扱いしない
    if (y < 0) return false

    // ステージ外は壁扱い（エンティティが落下しないように）
    if (!this.stage[by]?.[bx]) return true

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
    const nextLeft = hitbox.left + this.entity.vx // left = 境界の内側

    // ヒットボックスの上から下まで BLOCKSIZE 刻みでチェック
    // left（境界の内側）の位置をチェック
    for (let y = hitbox.top; y < hitbox.bottom; y += BLOCKSIZE) {
      if (this.isWall(nextLeft, y)) {
        return true
      }
    }
    // 最後に bottom - 1（境界の内側）の位置もチェック（ループで飛ばされる可能性があるため）
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
    const nextLeft = hitbox.left + this.entity.vx // left = 境界の内側
    // 壁ブロックの右端に配置
    this.entity.x = (Math.floor(nextLeft / BLOCKSIZE) + 1) * BLOCKSIZE - this.entity.hitbox.x
    this.entity.vx = 0
  }

  /**
   * 左壁で跳ね返る（位置を壁の右端に調整し、速度を反転）
   */
  bounceAtLeftWall() {
    const hitbox = this.currentHitbox
    const nextLeft = hitbox.left + this.entity.vx // left = 境界の内側
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
    const nextRight = hitbox.right + this.entity.vx // right = 境界の外側

    // ヒットボックスの上から下まで BLOCKSIZE 刻みでチェック
    // right（境界の外側）の位置をチェック
    for (let y = hitbox.top; y < hitbox.bottom; y += BLOCKSIZE) {
      if (this.isWall(nextRight, y)) {
        return true
      }
    }
    // 最後に bottom - 1（境界の内側）の位置もチェック（ループで飛ばされる可能性があるため）
    if (this.isWall(nextRight, hitbox.bottom - 1)) {
      return true
    }
    return false
  }

  /**
   * 右壁で停止（位置を壁の左端に調整し、速度を0に）
   */
  stopAtRightWall() {
    const hitbox = this.currentHitbox
    const nextRight = hitbox.right + this.entity.vx // right = 境界の外側
    // 壁ブロックの左端に配置
    this.entity.x =
      Math.floor(nextRight / BLOCKSIZE) * BLOCKSIZE -
      this.entity.hitbox.x -
      this.entity.hitbox.width
    this.entity.vx = 0
  }

  /**
   * 右壁で跳ね返る（位置を壁の左端に調整し、速度を反転）
   */
  bounceAtRightWall() {
    const hitbox = this.currentHitbox
    const nextRight = hitbox.right + this.entity.vx // right = 境界の外側
    // 壁ブロックの左端に配置
    this.entity.x =
      Math.floor(nextRight / BLOCKSIZE) * BLOCKSIZE -
      this.entity.hitbox.x -
      this.entity.hitbox.width
    this.entity.vx *= -1
  }

  /**
   * 上方向への移動で壁に衝突するかチェック
   * ヒットボックスの上辺が次フレームで壁に入るかを判定
   */
  checkUpWall(): boolean {
    const hitbox = this.currentHitbox
    const nextTop = hitbox.top + this.entity.vy // top = 境界の内側

    // ヒットボックスの左から右まで BLOCKSIZE 刻みでチェック
    // top（境界の内側）の位置をチェック
    for (let x = hitbox.left; x < hitbox.right; x += BLOCKSIZE) {
      if (this.isWall(x, nextTop)) {
        return true
      }
    }
    // 最後に right - 1（境界の内側）の位置もチェック（ループで飛ばされる可能性があるため）
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
    const nextTop = hitbox.top + this.entity.vy // top = 境界の内側
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
    const nextBottom = hitbox.bottom + this.entity.vy // bottom = 境界の外側

    // ヒットボックスの左から右まで BLOCKSIZE 刻みでチェック
    // bottom（境界の外側）の位置をチェック
    for (let x = hitbox.left; x < hitbox.right; x += BLOCKSIZE) {
      if (this.isWall(x, nextBottom)) {
        return true
      }
    }
    // 最後に right - 1（境界の内側）の位置もチェック（ループで飛ばされる可能性があるため）
    if (this.isWall(hitbox.right - 1, nextBottom)) {
      return true
    }
    return false
  }

  /**
   * 下壁で停止（位置を壁の上端に調整し、速度を0に）
   */
  stopAtDownWall() {
    const hitbox = this.currentHitbox
    const nextBottom = hitbox.bottom + this.entity.vy // bottom = 境界の外側
    // 壁ブロックの上端に配置
    this.entity.y =
      Math.floor(nextBottom / BLOCKSIZE) * BLOCKSIZE -
      this.entity.hitbox.y -
      this.entity.hitbox.height
    this.entity.vy = 0
  }

  /**
   * 右側が崖かどうかをチェック
   * 接地している時に、ヒットボックスの右下に地面がないかを判定
   */
  checkRightSideCliff(): boolean {
    const hitbox = this.currentHitbox
    // 足元の1ピクセル下をチェック（速度は考慮しない）
    const checkBottom = hitbox.bottom + 1
    const checkRight = hitbox.right

    // 右下の足元に地面がない = 右側が崖
    return !this.isWall(checkRight, checkBottom)
  }

  /**
   * 左側が崖かどうかをチェック
   * 接地している時に、ヒットボックスの左下に地面がないかを判定
   */
  checkLeftSideCliff(): boolean {
    const hitbox = this.currentHitbox
    // 足元の1ピクセル下をチェック（速度は考慮しない）
    const checkBottom = hitbox.bottom + 1
    const checkLeft = hitbox.left

    // 左下の足元に地面がない = 左側が崖
    return !this.isWall(checkLeft, checkBottom)
  }
}
