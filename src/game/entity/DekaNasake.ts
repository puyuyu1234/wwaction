import { PhysicsComponent } from '@game/components/PhysicsComponent'
import { TilemapCollisionComponent } from '@game/components/TilemapCollisionComponent'
import { BLOCKSIZE } from '@game/config'
import { StageContext } from '@game/types'
import { StateManager } from '@ptre/components/StateManager'
import { Rectangle } from '@ptre/core/Rectangle'

import { Entity } from './Entity'

/**
 * DekaNasake の状態
 */
type DekaNasakeState = 'walk' | 'hitWind' | 'run'

/**
 * DekaNasake（デカナサケ）エンティティ
 * - Nasakeの大型版
 * - 左右に移動し、壁・崖で反転
 * - 風で吹き飛ばされると一時的に走る
 * - プレイヤーにダメージを与える
 */
export class DekaNasake extends Entity {
  private physics: PhysicsComponent
  private tilemap: TilemapCollisionComponent
  private stateManager: StateManager<DekaNasakeState>
  private context: StageContext

  /** 移動方向（-1: 左, 1: 右） */
  private direction = -1

  /** ステージの底（これより下に落ちたらコイン化） */
  private stageBottom: number

  /** 各状態の継続フレーム数 */
  private static readonly TIMER = {
    hitWind: 12,
    run: 24,
  } as const

  /** 移動速度 */
  private static readonly SPEED = {
    walk: 0.75,
    run: 1.0,
  } as const

  /** コイン生成設定 */
  private static readonly COIN = {
    count: 100,
    vyMin: -6,
    vyMax: -4,
    vxRange: 3,
  } as const

  constructor(centerX: number, centerY: number, context: StageContext) {
    // スプライトサイズ: 32x32
    // hitboxは中心基準: (-8, -10, 16, 26)
    const hitbox = new Rectangle(-8, -10, 16, 26)

    // 'enemy' タグ: プレイヤーとの衝突判定で使用
    // 'deka' スプライトシートを使用（32x32）
    super('deka', centerX, centerY, 32, 32, hitbox, ['enemy'])

    this.context = context
    this.physics = new PhysicsComponent(this)
    this.tilemap = new TilemapCollisionComponent(this, context)
    this.stateManager = new StateManager<DekaNasakeState>('walk')

    // ステージの高さを計算
    this.stageBottom = context.layers[0].length * BLOCKSIZE

    this.vx = this.direction * DekaNasake.SPEED.walk
    this.scale.x = 1 // 左向き時に scale.x = 1

    // 風との衝突反応: 風を跳ね返して逃走
    this.collisionReaction.on('wind', (wind: Entity) => {
      // hitWind状態中（time > 0）は反応しない
      if (this.stateManager.getTime() > 0) {
        if (this.stateManager.getState() === 'hitWind') return
      }

      // 風の速度を奪い、風を来た方向に跳ね返す
      const oldWindVx = wind.vx
      this.vx = wind.vx
      // 風が来た方向の逆に跳ね返す（速度0の場合はDekaNasakeの進行方向）
      wind.vx = oldWindVx !== 0 ? -Math.sign(oldWindVx) * 2 : 2 * this.direction

      // 状態を hitWind に変更
      this.stateManager.changeState('hitWind')
      this.playAnimation('stand')
    })

    // スプライトアニメーション初期化
    this.playAnimation('purupuru')
  }

  tick() {
    super.tick()

    const state = this.stateManager.getState()
    const time = this.stateManager.getTime()

    switch (state) {
      case 'walk':
        this.vx = this.direction * DekaNasake.SPEED.walk
        break

      case 'hitWind':
        // 吹き飛ばされ中は速度維持（風の速度を引き継ぐ）
        if (time >= DekaNasake.TIMER.hitWind) {
          this.stateManager.changeState('run')
          this.playAnimation('purupuru')
        }
        break

      case 'run':
        this.vx = this.direction * DekaNasake.SPEED.run
        if (time >= DekaNasake.TIMER.run) {
          this.stateManager.changeState('walk')
        }
        break
    }

    this.physics.applyGravity()
    this.handleWallCollision()
    this.physics.applyVelocity()

    // 地面より下に落ちたらコイン化（スプライトが完全に見えなくなってから）
    if (this.y > this.stageBottom + 32) {
      this.behavior.dispatch('defeatStart', {
        x: this.x,
        y: this.stageBottom,
        coinConfig: DekaNasake.COIN,
        context: this.context,
      })
      this.behavior.destroy()
    }

    this.stateManager.update()
  }

  /**
   * 壁・崖との衝突処理
   */
  private handleWallCollision() {
    // 横壁: 反転
    if (this.tilemap.checkLeftWall() && this.vx < 0) {
      this.tilemap.bounceAtLeftWall()
      this.direction = 1
      this.scale.x = -1
    }
    if (this.tilemap.checkRightWall() && this.vx > 0) {
      this.tilemap.bounceAtRightWall()
      this.direction = -1
      this.scale.x = 1
    }

    // 天井: 停止
    if (this.tilemap.checkUpWall() && this.vy < 0) {
      this.tilemap.stopAtUpWall()
    }

    // 床: 停止＋崖検知
    if (this.tilemap.checkDownWall() && this.vy > 0) {
      this.tilemap.stopAtDownWall()

      // walk状態の時のみ崖で反転
      if (this.stateManager.getState() === 'walk') {
        if (this.tilemap.checkRightSideCliff() && this.direction > 0) {
          this.direction = -1
          this.scale.x = 1
        }
        if (this.tilemap.checkLeftSideCliff() && this.direction < 0) {
          this.direction = 1
          this.scale.x = -1
        }
      }
    }
  }
}
