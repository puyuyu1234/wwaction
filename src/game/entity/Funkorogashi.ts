import { PhysicsComponent } from '@game/components/PhysicsComponent'
import { TilemapCollisionComponent } from '@game/components/TilemapCollisionComponent'
import { Z_INDEX } from '@game/config'
import { StageLayers } from '@game/types'
import { Rectangle } from '@ptre/core/Rectangle'

import { CommonBehaviors } from './commonBehaviors'
import { Entity } from './Entity'
import { Fun } from './Fun'

/** 成長段階ごとのフレーム数 */
const CHARGE_INTERVAL = 30

/** 発射後の待機フレーム数 */
const COOLDOWN_FRAMES = 90

/** ひっくり返っている時間 */
const FLIPPED_FRAMES = 120

/**
 * フンコロガシエンティティ
 * - 固定位置で動かない
 * - プレイヤー方向を向く
 * - フンを4段階成長させて発射
 * - 風を当てるとひっくり返る
 */
export class Funkorogashi extends Entity {
  private stage: StageLayers
  private getPlayerX: () => number
  private fun: Fun | null = null
  private timer = 0
  private state: 'charging' | 'cooldown' | 'flipped' = 'cooldown'
  private physics: PhysicsComponent
  private tilemap: TilemapCollisionComponent

  constructor(centerX: number, centerY: number, stage: StageLayers, getPlayerX: () => number) {
    const hitbox = new Rectangle(-6, -6, 12, 12)
    super('entity', centerX, centerY, 16, 16, hitbox, [])

    this.stage = stage
    this.getPlayerX = getPlayerX
    this.physics = new PhysicsComponent(this)
    this.tilemap = new TilemapCollisionComponent(this, stage)

    // 風との衝突反応（常にひっくり返る）
    this.collisionReaction.on('wind', () => {
      this.startFlipped()
    })

    this.playAnimation('funkoro')
    this.stop() // 初期状態は待機
    this.state = 'cooldown'
    this.timer = 0
  }

  /**
   * フンコロガシの前方X座標を取得
   */
  private getFrontX(): number {
    // scale.x = 1 で左向き → 左に配置、scale.x = -1 で右向き → 右に配置
    return this.x - this.scale.x * 6
  }

  /**
   * 新しいフンの生成を開始
   */
  private startCharging() {
    this.state = 'charging'
    this.timer = 0

    // フンを生成（フンコロガシの前方に配置、フンコロより奥に描画）
    this.fun = new Fun(this.getFrontX(), this.y, this.stage)
    this.fun.zIndex = Z_INDEX.ENTITY - 1

    // チャージ中はアニメーション再生
    this.animationSpeed = 10 / 60 // 10fps
    this.play()

    // StageSceneにフンの追加を通知
    this.behavior.dispatch('spawnFun', this.fun)
  }

  /**
   * フンを発射
   */
  private fireFun() {
    if (!this.fun) return

    // 現在向いている方向に発射（scale.x = 1 で左、-1 で右）
    const direction = this.scale.x > 0 ? -1 : 1
    this.fun.fire(direction)
    this.fun = null

    // クールダウン開始（アニメーション停止）
    this.state = 'cooldown'
    this.timer = 0
    this.stop()
  }

  /**
   * ひっくり返り状態を開始（風を当てられた時）
   */
  private startFlipped() {
    // 既にひっくり返っている場合はジャンプ + タイマーリセット
    if (this.state === 'flipped') {
      CommonBehaviors.windJump(this)
      this.timer = 0
      return
    }

    this.state = 'flipped'
    this.timer = 0

    // 生成中のフンを破壊
    if (this.fun) {
      this.fun.behavior.destroy()
      this.fun = null
    }

    // ジャンプ + ひっくり返る
    CommonBehaviors.windJump(this)
    this.scale.y = -1

    // アニメーション再生
    this.animationSpeed = 10 / 60
    this.play()
  }

  /**
   * ひっくり返り状態から復帰
   */
  private recoverFromFlipped() {
    // 小さくジャンプ + 元の向きに戻る
    this.vy = -1.5
    this.scale.y = 1

    // クールダウン状態へ
    this.state = 'cooldown'
    this.timer = 0
    this.stop()
  }

  tick() {
    super.tick()

    // 物理演算（ひっくり返り中のジャンプ用）
    this.physics.applyGravity()
    CommonBehaviors.bounceWalls(this, this.tilemap)
    this.physics.applyVelocity()

    // ひっくり返り中以外はプレイヤー方向を向く
    if (this.state !== 'flipped') {
      const playerX = this.getPlayerX()
      this.scale.x = playerX > this.x ? -1 : 1
    }

    // 成長中のフンの位置を更新（常にフンコロガシの前方に追従）
    if (this.fun?.phase === 'growing') {
      this.fun.updatePosition(this.getFrontX(), this.y)
    }

    this.timer++

    if (this.state === 'charging') {
      // 30フレームごとに成長
      if (this.timer >= CHARGE_INTERVAL) {
        this.timer = 0
        if (this.fun) {
          const ready = this.fun.grow()
          if (ready) {
            this.fireFun()
          }
        }
      }
    } else if (this.state === 'cooldown') {
      // クールダウン終了後、次のチャージ開始
      if (this.timer >= COOLDOWN_FRAMES) {
        this.startCharging()
      }
    } else if (this.state === 'flipped') {
      // ひっくり返り中、一定時間後にジャンプして復帰
      if (this.timer >= FLIPPED_FRAMES) {
        this.recoverFromFlipped()
      }
    }
  }
}
