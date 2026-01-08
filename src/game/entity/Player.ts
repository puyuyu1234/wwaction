import { FallDeathComponent } from '@game/components/FallDeathComponent'
import { HealthComponent } from '@game/components/HealthComponent'
import { PhysicsComponent } from '@game/components/PhysicsComponent'
import { TilemapCollisionComponent } from '@game/components/TilemapCollisionComponent'
import { BLOCKSIZE, SFX_KEYS } from '@game/config'
import { PlayerState, StageContext } from '@game/types'
import { AudioService } from '@ptre/audio/AudioService'
import { StateManager } from '@ptre/components/StateManager'
import { Input } from '@ptre/core/Input'
import { Rectangle } from '@ptre/core/Rectangle'

import { CommonBehaviors } from './commonBehaviors'
import { Entity } from './Entity'

/**
 * プレイヤーエンティティ
 * - WASD で移動・ジャンプ
 * - Space で風生成
 * - コヨーテタイム実装
 */
export class Player extends Entity {
  private input: Input
  private audio = AudioService.getInstance()
  private coyoteTime = 0
  private readonly COYOTE_TIME_MAX = 6
  private readonly JUMP_POWER = -3

  // 慣性関連の定数
  private readonly MOVE_MAX_SPEED = 1.5 // 通常移動の最大速度
  private readonly WIND_MAX_SPEED = 2.0 // 風に乗った時の最大速度
  private readonly ACCELERATION = 0.15 // 加速度
  private readonly GROUND_FRICTION = 0.2 // 地上の摩擦（空中は摩擦なし）

  // 状態管理
  private stateManager = new StateManager<PlayerState>(PlayerState.STAND)

  // 死亡フラグ
  public isDead = false

  // ゴール到達フラグ（多重発火防止）
  private hasReachedGoal = false

  // Components
  private physics: PhysicsComponent
  private tilemap: TilemapCollisionComponent
  public readonly health: HealthComponent
  private fallDeath: FallDeathComponent

  constructor(
    x: number,
    y: number,
    input: Input,
    context: StageContext,
    maxHp: number = 5,
    initialHp?: number
  ) {
    const hitbox = new Rectangle(-5, -9, 10, 25)
    super('player', x, y, 24, 32, hitbox)

    this.input = input
    this.physics = new PhysicsComponent(this)
    this.tilemap = new TilemapCollisionComponent(this, context)
    this.health = new HealthComponent(initialHp ?? maxHp, maxHp)
    this.fallDeath = new FallDeathComponent(context.layers[0].length * BLOCKSIZE)

    // 衝突反応を登録
    this.setupCollisionReactions()

    // 初期アニメーション
    this.playAnimation('stand')
  }

  /**
   * 各種エンティティとの衝突時の反応を設定
   */
  private setupCollisionReactions() {
    // 風との衝突: WindJump + 風のvxを受け継ぐ
    this.collisionReaction.on('wind', (wind) => {
      CommonBehaviors.windJump(this)
      // 風のx方向の慣性を受け継ぐ
      this.vx = wind.vx
    })

    // 敵との衝突: 1ダメージ
    this.collisionReaction.on('enemy', () => {
      this.damage(1)
    })

    // 回復アイテムとの衝突: HP回復 + アイテム消滅
    this.collisionReaction.on('healing', (item) => {
      this.heal(1)
      item.behavior.destroy()
    })

    // コインとの衝突: SE再生 + アイテム消滅
    this.collisionReaction.on('coin', (item) => {
      this.audio.playSound(SFX_KEYS.COIN)
      item.behavior.destroy()
    })

    // ゴールとの衝突: nextStageイベント発火（一度だけ）
    this.collisionReaction.on('goal', () => {
      if (this.hasReachedGoal) return
      this.hasReachedGoal = true
      // プレイヤーを停止
      this.vx = 0
      this.vy = 0
      this.behavior.dispatch('nextStage')
    })
  }

  tick() {
    super.tick()

    // Rキーでリトライ
    if (this.input.isKeyPressed('KeyR')) {
      this.behavior.dispatch('reset')
      return
    }

    // 死亡時またはゴール到達時は更新しない
    if (this.isDead || this.hasReachedGoal) return

    // 状態管理の更新
    this.stateManager.update()

    // HP・無敵時間の更新
    this.health.tick()

    // 点滅エフェクト
    this.alpha = this.health.shouldBlink() ? 0 : 1

    // 重力
    this.physics.applyGravity()

    // 状態に応じた処理
    this.processStateInput()

    // 壁判定
    if (this.tilemap.checkLeftWall() && this.vx < 0) {
      this.tilemap.stopAtLeftWall()
    }
    if (this.tilemap.checkRightWall() && this.vx > 0) {
      this.tilemap.stopAtRightWall()
    }
    if (this.tilemap.checkUpWall() && this.vy < 0) {
      this.tilemap.stopAtUpWall()
    }

    // 床判定
    if (this.tilemap.checkDownWall() && this.vy > 0) {
      this.tilemap.stopAtDownWall()
      this.coyoteTime = 0
    } else {
      this.coyoteTime++
    }

    // 速度適用
    this.physics.applyVelocity()

    // 床に接地した場合、座標を記録
    if (this.coyoteTime === 0) {
      this.fallDeath.recordFloor(this.x, this.y)
    }

    // 落下死判定
    if (this.fallDeath.checkFallDeath(this.y)) {
      this.damage(1, true)
      return
    }

    // ダメージブロック判定
    const damageBlock = this.tilemap.checkDamageBlock()
    if (damageBlock) {
      this.damage(damageBlock.damage, damageBlock.isPit)
    }

    // アニメーション更新
    this.updatePlayerAnimation()
  }

  /**
   * 状態に応じた入力処理
   */
  private processStateInput() {
    const state = this.stateManager.getState()
    const stateTime = this.stateManager.getTime()

    switch (state) {
      case PlayerState.STAND:
      case PlayerState.WALK:
        this.handleMove()
        this.handleJump()
        // 空中かつジャンプしていない場合、コヨーテタイム超過で落下状態に
        if (this.coyoteTime >= this.COYOTE_TIME_MAX) {
          this.stateManager.changeState(PlayerState.JUMP)
          break
        }
        this.handleCrouch()
        this.handleWind()
        break

      case PlayerState.JUMP:
        if (this.coyoteTime === 0) {
          this.stateManager.changeState(PlayerState.STAND)
          break
        }
        this.handleMove()
        this.handleJump()
        this.handleWind()
        break

      case PlayerState.SIT:
        this.vx = 0
        if (!this.input.isKeyDown('KeyS')) {
          this.stateManager.changeState(PlayerState.STAND_UP)
          this.hitbox = new Rectangle(-5, -9, 10, 25)
        }
        this.handleWind()
        break

      case PlayerState.STAND_UP:
        this.vx = 0
        if (stateTime >= 3) {
          this.stateManager.changeState(PlayerState.STAND)
        }
        break

      case PlayerState.DAMAGE:
        if (stateTime >= 10) {
          this.stateManager.changeState(PlayerState.STAND)
        }
        break

      case PlayerState.DAMAGE_PIT:
        if (stateTime >= 40) {
          this.fallPit()
          this.stateManager.changeState(PlayerState.STAND)
        }
        break
    }
  }

  /**
   * 移動処理（慣性ベース）
   */
  private handleMove() {
    const isGrounded = this.coyoteTime < this.COYOTE_TIME_MAX

    if (this.input.isKeyDown('KeyA')) {
      this.scale.x = -1
      // 通常移動の最大速度より遅い場合のみ加速（風で加速した分は維持）
      if (this.vx > -this.MOVE_MAX_SPEED) {
        this.vx = Math.max(this.vx - this.ACCELERATION, -this.MOVE_MAX_SPEED)
      }
      if (this.stateManager.getState() === PlayerState.STAND) {
        this.stateManager.changeState(PlayerState.WALK)
      }
    } else if (this.input.isKeyDown('KeyD')) {
      this.scale.x = 1
      // 通常移動の最大速度より遅い場合のみ加速（風で加速した分は維持）
      if (this.vx < this.MOVE_MAX_SPEED) {
        this.vx = Math.min(this.vx + this.ACCELERATION, this.MOVE_MAX_SPEED)
      }
      if (this.stateManager.getState() === PlayerState.STAND) {
        this.stateManager.changeState(PlayerState.WALK)
      }
    } else {
      // 入力なし: 地上なら摩擦、空中は摩擦なし
      if (isGrounded) {
        this.applyFriction()
      }
      if (this.stateManager.getState() === PlayerState.WALK && Math.abs(this.vx) < 0.1) {
        this.stateManager.changeState(PlayerState.STAND)
      }
    }

    // 絶対最大速度（風込み）でクランプ
    this.vx = Math.max(-this.WIND_MAX_SPEED, Math.min(this.WIND_MAX_SPEED, this.vx))
  }

  /**
   * 摩擦を適用してvxを0に近づける
   */
  private applyFriction() {
    if (Math.abs(this.vx) < this.GROUND_FRICTION) {
      this.vx = 0
    } else if (this.vx > 0) {
      this.vx -= this.GROUND_FRICTION
    } else {
      this.vx += this.GROUND_FRICTION
    }
  }

  /**
   * ジャンプ処理
   */
  private handleJump() {
    if (this.input.isKeyPressed('KeyW')) {
      if (this.coyoteTime < this.COYOTE_TIME_MAX) {
        this.stateManager.changeState(PlayerState.JUMP)
        this.vy = this.JUMP_POWER
        this.coyoteTime = this.COYOTE_TIME_MAX
        this.audio.playSound(SFX_KEYS.JUMP)
      }
    }
  }

  /**
   * しゃがみ処理
   */
  private handleCrouch() {
    if (this.input.isKeyDown('KeyS')) {
      this.stateManager.changeState(PlayerState.SIT)
      this.vx = 0
      this.hitbox = new Rectangle(-5, 0, 10, 16)
    }
  }

  /**
   * 風生成処理
   */
  private handleWind() {
    if (this.input.isKeyPressed('Space')) {
      this.createWindWithAnimation()
    }
  }

  /**
   * 落とし穴から復帰
   */
  private fallPit() {
    const pos = this.fallDeath.getRecoveryPosition()
    if (!pos) return

    this.x = pos.x
    this.y = pos.y
    this.vx = 0
    this.vy = 0
  }

  /**
   * プレイヤーの状態に応じてアニメーションを切り替え
   */
  private updatePlayerAnimation() {
    const state = this.stateManager.getState()
    let nextAnimation = ''

    switch (state) {
      case PlayerState.STAND:
        nextAnimation = 'stand'
        break
      case PlayerState.WALK:
        nextAnimation = 'walk'
        break
      case PlayerState.JUMP:
        nextAnimation = this.vy <= 0 ? 'jumpUp' : 'jumpDown'
        break
      case PlayerState.SIT:
        nextAnimation = 'sit'
        break
      case PlayerState.STAND_UP:
        nextAnimation = 'standUp'
        break
      case PlayerState.DAMAGE:
      case PlayerState.DAMAGE_PIT:
        nextAnimation = 'damage'
        break
      default:
        nextAnimation = 'stand'
        break
    }

    this.playAnimation(nextAnimation)
  }

  /**
   * ダメージを受ける
   * @param num ダメージ量
   * @param isPit 落とし穴ダメージかどうか
   */
  damage(num: number, isPit = false) {
    const result = this.health.damage(num)

    if (result.actualDamage === 0) return

    // ノックバック
    this.vx = this.scale.x > 0 ? -1 : 1
    if (isPit) {
      this.vx = 0
    }
    this.x -= this.vx

    this.audio.playSound(SFX_KEYS.DAMAGE)

    // ダメージイベント発火（HPBar更新用）
    this.behavior.dispatch('playerDamage', result.actualDamage)

    // 死亡判定
    if (result.isDead) {
      this.isDead = true
      this.playAnimationForced('damage', 100)
      this.alpha = 1
      this.behavior.dispatch('death')
    } else {
      if (isPit) {
        this.stateManager.changeState(PlayerState.DAMAGE_PIT)
      } else {
        this.stateManager.changeState(PlayerState.DAMAGE)
      }
    }
  }

  /**
   * 回復する
   * @param num 回復量
   */
  heal(num: number) {
    this.health.heal(num)
    this.audio.playSound(SFX_KEYS.HEAL)
  }

  /**
   * 風を生成する（アニメーション付き）
   */
  private createWindWithAnimation() {
    const state = this.stateManager.getState()
    let windVx = 0

    if (state === PlayerState.SIT) {
      windVx = 0
      this.playAnimationForced('wind', 12)
    } else if (state === PlayerState.WALK) {
      windVx = this.scale.x > 0 ? 2 : -2
      if (this.currentAnimationName === 'windWalk2') {
        this.playAnimationForced('windWalk', 12)
      } else {
        this.playAnimationForced('windWalk2', 12)
      }
    } else {
      windVx = this.scale.x > 0 ? 2 : -2
      this.playAnimationForced('wind', 12)
    }

    // 風生成SE
    this.audio.playSound(SFX_KEYS.WIND)

    // createWindイベントを発火（StageSceneで受け取る）
    this.behavior.dispatch('createWind', { x: this.x, y: this.y, vx: windVx })
  }

  /**
   * 無敵時間中かどうか
   */
  isInvincible(): boolean {
    return this.health.isInvincible()
  }
}
