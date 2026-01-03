import { BLOCKSIZE, BLOCKDATA } from '@game/config'
import { CollisionType, StageLayers } from '@game/types'
import { Rectangle } from '@ptre/core/Rectangle'

interface ICollisionEntity {
  x: number
  y: number
  vx: number
  vy: number
  hitbox: Rectangle
}

/**
 * タイルマップ衝突判定Component
 * 複数レイヤーに対応: いずれかのレイヤーで衝突があれば衝突とみなす
 */
export class TilemapCollisionComponent {
  constructor(
    private entity: ICollisionEntity,
    private layers: StageLayers
  ) {}

  private get currentHitbox(): Rectangle {
    return new Rectangle(
      this.entity.x + this.entity.hitbox.x,
      this.entity.y + this.entity.hitbox.y,
      this.entity.hitbox.width,
      this.entity.hitbox.height
    )
  }

  private isBlockType(x: number, y: number, types: CollisionType[]): boolean {
    const bx = Math.floor(x / BLOCKSIZE)
    const by = Math.floor(y / BLOCKSIZE)

    if (y < 0) return false

    // 全レイヤーをチェック
    for (const layer of this.layers) {
      const blockKey = layer[by]?.[bx]
      if (!blockKey || blockKey === ' ') continue

      const blockData = BLOCKDATA[blockKey]
      if (blockData && types.includes(blockData.type)) {
        return true
      }
    }

    // 画面外判定
    const stageWidth = (this.layers[0]?.[0]?.length ?? 0) * BLOCKSIZE
    if (x < 0 || x >= stageWidth) {
      return types.includes(CollisionType.SOLID)
    }

    return false
  }

  checkLeftWall(): boolean {
    const hitbox = this.currentHitbox
    const nextLeft = hitbox.left + this.entity.vx

    for (let y = hitbox.top; y < hitbox.bottom; y += BLOCKSIZE) {
      if (this.isBlockType(nextLeft, y, [CollisionType.SOLID])) return true
    }
    if (this.isBlockType(nextLeft, hitbox.bottom - 1, [CollisionType.SOLID])) return true
    return false
  }

  stopAtLeftWall() {
    const hitbox = this.currentHitbox
    const nextLeft = hitbox.left + this.entity.vx
    this.entity.x = (Math.floor(nextLeft / BLOCKSIZE) + 1) * BLOCKSIZE - this.entity.hitbox.x
    this.entity.vx = 0
  }

  bounceAtLeftWall() {
    const hitbox = this.currentHitbox
    const nextLeft = hitbox.left + this.entity.vx
    this.entity.x = (Math.floor(nextLeft / BLOCKSIZE) + 1) * BLOCKSIZE - this.entity.hitbox.x
    this.entity.vx *= -1
  }

  checkRightWall(): boolean {
    const hitbox = this.currentHitbox
    const nextRight = hitbox.right + this.entity.vx

    for (let y = hitbox.top; y < hitbox.bottom; y += BLOCKSIZE) {
      if (this.isBlockType(nextRight, y, [CollisionType.SOLID])) return true
    }
    if (this.isBlockType(nextRight, hitbox.bottom - 1, [CollisionType.SOLID])) return true
    return false
  }

  stopAtRightWall() {
    const hitbox = this.currentHitbox
    const nextRight = hitbox.right + this.entity.vx
    this.entity.x =
      Math.floor(nextRight / BLOCKSIZE) * BLOCKSIZE -
      this.entity.hitbox.x -
      this.entity.hitbox.width
    this.entity.vx = 0
  }

  bounceAtRightWall() {
    const hitbox = this.currentHitbox
    const nextRight = hitbox.right + this.entity.vx
    this.entity.x =
      Math.floor(nextRight / BLOCKSIZE) * BLOCKSIZE -
      this.entity.hitbox.x -
      this.entity.hitbox.width
    this.entity.vx *= -1
  }

  checkUpWall(): boolean {
    const hitbox = this.currentHitbox
    const nextTop = hitbox.top + this.entity.vy

    for (let x = hitbox.left; x < hitbox.right; x += BLOCKSIZE) {
      if (this.isBlockType(x, nextTop, [CollisionType.SOLID])) return true
    }
    if (this.isBlockType(hitbox.right - 1, nextTop, [CollisionType.SOLID])) return true
    return false
  }

  stopAtUpWall() {
    const hitbox = this.currentHitbox
    const nextTop = hitbox.top + this.entity.vy
    this.entity.y = (Math.floor(nextTop / BLOCKSIZE) + 1) * BLOCKSIZE - this.entity.hitbox.y
    this.entity.vy = 0
  }

  checkDownWall(): boolean {
    const hitbox = this.currentHitbox
    const nextBottom = hitbox.bottom + this.entity.vy

    const currentBlockY = Math.floor((hitbox.bottom - 1) / BLOCKSIZE)
    const nextBlockY = Math.floor(nextBottom / BLOCKSIZE)
    if (currentBlockY === nextBlockY) return false

    for (let x = hitbox.left; x < hitbox.right; x += BLOCKSIZE) {
      if (this.isBlockType(x, nextBottom, [CollisionType.SOLID, CollisionType.PLATFORM])) return true
    }
    if (this.isBlockType(hitbox.right - 1, nextBottom, [CollisionType.SOLID, CollisionType.PLATFORM])) {
      return true
    }
    return false
  }

  stopAtDownWall() {
    const hitbox = this.currentHitbox
    const nextBottom = hitbox.bottom + this.entity.vy
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
    const checkBottom = hitbox.bottom + 1
    const checkRight = hitbox.right
    return !this.isBlockType(checkRight, checkBottom, [CollisionType.SOLID, CollisionType.PLATFORM])
  }

  /**
   * 左側が崖かどうかをチェック
   * 接地している時に、ヒットボックスの左下に地面がないかを判定
   */
  checkLeftSideCliff(): boolean {
    const hitbox = this.currentHitbox
    const checkBottom = hitbox.bottom + 1
    const checkLeft = hitbox.left
    return !this.isBlockType(checkLeft, checkBottom, [CollisionType.SOLID, CollisionType.PLATFORM])
  }

  /**
   * ダメージブロック（床トゲ等）との衝突判定
   * @returns { damage: number, isPit: boolean } | null
   */
  checkDamageBlock(): { damage: number; isPit: boolean } | null {
    const hitbox = this.currentHitbox

    // ヒットボックス内の全座標をBLOCKSIZE刻みでチェック
    for (let y = hitbox.top; y < hitbox.bottom; y += BLOCKSIZE) {
      for (let x = hitbox.left; x < hitbox.right; x += BLOCKSIZE) {
        const result = this.checkDamageBlockAt(x, y)
        if (result) return result
      }
    }

    // 右下隅もチェック（ループで飛ばされる可能性があるため）
    return this.checkDamageBlockAt(hitbox.right - 1, hitbox.bottom - 1)
  }

  /**
   * 指定座標のダメージブロックをチェック（全レイヤー対応）
   */
  private checkDamageBlockAt(x: number, y: number): { damage: number; isPit: boolean } | null {
    const bx = Math.floor(x / BLOCKSIZE)
    const by = Math.floor(y / BLOCKSIZE)

    // 全レイヤーをチェック
    for (const layer of this.layers) {
      const blockKey = layer[by]?.[bx]
      if (!blockKey || blockKey === ' ') continue

      const blockData = BLOCKDATA[blockKey]

      if (!blockData || blockData.type !== CollisionType.DAMAGE || !blockData.param?.damage) {
        continue
      }

      // ダメージブロックのhitboxを計算（ブロック座標基準）
      const damageHitbox = blockData.param.hitbox
        ? new Rectangle(
            bx * BLOCKSIZE + blockData.param.hitbox.x,
            by * BLOCKSIZE + blockData.param.hitbox.y,
            blockData.param.hitbox.width,
            blockData.param.hitbox.height
          )
        : new Rectangle(bx * BLOCKSIZE, by * BLOCKSIZE, BLOCKSIZE, BLOCKSIZE)

      // エンティティのヒットボックスと衝突判定
      if (this.currentHitbox.hitTest(damageHitbox)) {
        return {
          damage: blockData.param.damage,
          isPit: false,
        }
      }
    }

    return null
  }
}
