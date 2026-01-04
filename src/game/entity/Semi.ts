import { SFX_KEYS } from '@game/config'
import { AudioService } from '@ptre/audio/AudioService'
import { Rectangle } from '@ptre/core/Rectangle'

import { Entity } from './Entity'
import { Onpu } from './Onpu'

/** 発射間隔（フレーム） */
const FIRE_INTERVAL = 120

/** アニメーション継続時間（フレーム） */
const ANIMATION_DURATION = 90

/** 弾速 */
const BULLET_SPEED = 1

/** 逃走時の初期上昇速度 */
const FLEE_INITIAL_SPEED = -1

/** 逃走時の上昇加速度 */
const FLEE_ACCELERATION = -0.05

/** 逃走時の横方向速度 */
const FLEE_HORIZONTAL_SPEED = 0.5

/** 8方向の速度ベクトル（正規化済み） */
const DIRECTIONS = [
  { vx: 0, vy: -1 }, // 上
  { vx: 0, vy: 1 }, // 下
  { vx: -1, vy: 0 }, // 左
  { vx: 1, vy: 0 }, // 右
  { vx: -0.707, vy: -0.707 }, // 左上
  { vx: 0.707, vy: -0.707 }, // 右上
  { vx: -0.707, vy: 0.707 }, // 左下
  { vx: 0.707, vy: 0.707 }, // 右下
]

/**
 * セミ（Semi）エンティティ
 * - 固定位置で動かない
 * - 定期的にアニメーションして8方向にonpuを発射
 * - 風を当てるとパタパタ飛んで逃げる
 * - 主人公の方を向く
 */
export class Semi extends Entity {
  private timer = 0
  private state: 'idle' | 'animating' | 'fleeing' = 'idle'
  private getPlayerX: () => number

  constructor(centerX: number, centerY: number, getPlayerX: () => number) {
    const hitbox = new Rectangle(-6, -6, 12, 12)
    super('entity', centerX, centerY, 16, 16, hitbox, ['enemy'])

    this.getPlayerX = getPlayerX

    this.playAnimation('semi')
    this.stop() // 初期状態は静止

    // 風との衝突反応：逃走開始（風の向きに流される）
    this.collisionReaction.on('wind', (wind: Entity) => {
      this.startFleeing(wind.vx)
    })
  }

  /**
   * 逃走状態を開始
   * @param windDirection 風の向き（1=右, -1=左）
   */
  private startFleeing(windDirection: number) {
    if (this.state === 'fleeing') return

    this.state = 'fleeing'
    this.vy = FLEE_INITIAL_SPEED
    this.vx = windDirection > 0 ? FLEE_HORIZONTAL_SPEED : -FLEE_HORIZONTAL_SPEED
    this.animationSpeed = 30 / 60
    this.play()
    AudioService.getInstance().playSound(SFX_KEYS.SEMI)
  }

  tick() {
    super.tick()

    if (this.state === 'fleeing') {
      // 逃走中：加速しながら上に飛んでいく
      this.vy += FLEE_ACCELERATION
      this.x += this.vx
      this.y += this.vy

      // 画面外に出たら消滅
      if (this.y < -32) {
        this.behavior.destroy()
      }
      return
    }

    // 主人公の方を向く
    const playerX = this.getPlayerX()
    this.scale.x = playerX > this.x ? -1 : 1

    this.timer++

    if (this.state === 'idle') {
      // 待機中：一定間隔でアニメーション開始＆発射
      if (this.timer >= FIRE_INTERVAL) {
        this.state = 'animating'
        this.timer = 0
        this.animationSpeed = 30 / 60
        this.play()
        this.fireOnpu()
        AudioService.getInstance().playSound(SFX_KEYS.SEMI)
      }
    } else if (this.state === 'animating') {
      // アニメーション中：一定フレーム後に停止
      if (this.timer >= ANIMATION_DURATION) {
        this.state = 'idle'
        this.timer = 0
        this.stop()
      }
    }
  }

  /**
   * 8方向にonpuを発射
   */
  private fireOnpu() {
    for (const dir of DIRECTIONS) {
      const onpu = new Onpu(
        this.x,
        this.y,
        dir.vx * BULLET_SPEED,
        dir.vy * BULLET_SPEED
      )
      this.behavior.dispatch('spawnOnpu', onpu)
    }
  }
}
