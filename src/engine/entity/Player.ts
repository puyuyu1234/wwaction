import { PhysicsComponent } from '@components/PhysicsComponent'
import { TilemapCollisionComponent } from '@components/TilemapCollisionComponent'
import { Input } from '@core/Input'
import { Rectangle } from '@core/Rectangle'

import { CommonBehaviors } from './commonBehaviors'
import { Entity } from './Entity'

import { AudioManager } from '@/audio/AudioManager'
import { SFX_KEYS } from '@/game/config'
import { PlayerState } from '@/game/types'

/**
 * プレイヤーの状態管理クラス
 * legacy の PlayerState クラスに対応
 */
class PlayerStateManager {
  private currentState: PlayerState = PlayerState.STAND
  private stateTime = 0

  changeState(newState: PlayerState) {
    this.currentState = newState
    this.stateTime = 0
  }

  update() {
    this.stateTime++
  }

  getState(): PlayerState {
    return this.currentState
  }

  getTime(): number {
    return this.stateTime
  }
}

/**
 * プレイヤーエンティティ
 * - WASD で移動・ジャンプ
 * - コヨーテタイム実装
 */
export class Player extends Entity {
  private input: Input
  private audio = AudioManager.getInstance()
  private coyoteTime = 0 // 空中にいる時間（コヨーテタイム用）
  private readonly COYOTE_TIME_MAX = 6 // コヨーテタイム最大フレーム数
  private readonly MOVE_SPEED = 1.5 // legacy実装に合わせて調整
  private readonly JUMP_POWER = -3 // legacy実装に合わせて調整

  // 状態管理
  private stateManager = new PlayerStateManager()

  // HP関連
  public hp: number
  public maxHp: number
  private noHitboxTime = 0 // 無敵時間（ダメージ後の猶予）
  public isDead = false

  // 落下死処理用（地面座標の記録）
  private floorPositions: Array<{ x: number; y: number }> = []

  // Components（型安全に保持）
  private physics: PhysicsComponent
  private tilemap: TilemapCollisionComponent

  constructor(x: number, y: number, stage: string[][], input: Input, hp: number, maxHp: number) {
    // アンカーポイントが中央(0.5, 0.5)なので、座標は中心を指す
    // スプライトサイズ: 24x32、中心座標に変換: x+12, y+16
    const centerX = x + 12
    const centerY = y + 16
    const rect = new Rectangle(centerX, centerY, 24, 32)

    // hitboxも中心基準に変換: legacy(7,7,10,25) → 中心基準(-5,-9,10,25)
    // 計算: (7-12, 7-16) = (-5, -9)
    const hitbox = new Rectangle(-5, -9, 10, 25)
    super('player', rect, hitbox, stage, [])

    this.input = input
    this.hp = hp
    this.maxHp = maxHp

    // 必要なComponentを初期化
    this.physics = new PhysicsComponent(this)
    this.tilemap = new TilemapCollisionComponent(this, stage)

    // 衝突反応を登録（元のJS実装の on("hitWind", ...) に相当）
    this.setupCollisionReactions()

    // 初期アニメーション再生
    this.playAnimation('stand')
  }

  /**
   * 各種エンティティとの衝突時の反応を設定
   */
  private setupCollisionReactions() {
    // 風との衝突: WindJump
    this.collisionReaction.on('wind', () => {
      CommonBehaviors.windJump(this)
    })

    // 敵との衝突: 1ダメージ
    this.collisionReaction.on('enemy', () => {
      this.damage(1)
    })

    // 回復アイテムとの衝突: HP回復 + アイテム消滅
    this.collisionReaction.on('healing', (item) => {
      this.heal(1)
      // アイテムを削除（元のJS実装の destroy() に相当）
      item.destroy()
    })

    // ゴールとの衝突: nextStageイベント発火
    this.collisionReaction.on('goal', () => {
      this.dispatch('nextStage')
    })
  }

  update() {
    // Rキーでリトライ
    if (this.input.isKeyPressed('KeyR')) {
      this.dispatch('reset')
      return
    }

    // 死亡時は更新しない
    if (this.isDead) return

    // 状態管理の更新
    this.stateManager.update()

    // 無敵時間の更新と点滅エフェクト
    if (this.noHitboxTime > 0) {
      this.noHitboxTime--
      // 2フレームごとに点滅（legacy実装に合わせる）
      const sprite = this.getAnimatedSprite()
      if (sprite) {
        sprite.alpha = this.noHitboxTime % 2 === 0 ? 0 : 1
      }
    } else {
      // 無敵時間終了時は完全に表示
      const sprite = this.getAnimatedSprite()
      if (sprite) {
        sprite.alpha = 1
      }
    }

    // 強制アニメーションフレームの更新
    this.updateAnimationFrame()

    // 重力
    this.physics.applyGravity()

    // 状態に応じた処理
    this.processStateInput()

    // 壁判定（停止）
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
      this.coyoteTime = 0 // 着地したらコヨーテタイムリセット

      // 地面に接地したら座標を記録（落下死処理用）
      this.recordFloorPosition()
    } else {
      // 空中にいる場合、コヨーテタイムを増やす
      this.coyoteTime++
    }

    // 速度適用
    this.physics.applyVelocity()

    // ダメージブロック判定（速度適用後にチェック）
    const damageBlock = this.tilemap.checkDamageBlock()
    if (damageBlock) {
      this.damage(damageBlock.damage, damageBlock.isPit)
    }

    // アニメーション更新
    this.updatePlayerAnimation()
  }

  /**
   * 状態に応じた入力処理
   * legacy の processInput() に対応
   */
  private processStateInput() {
    const state = this.stateManager.getState()
    const stateTime = this.stateManager.getTime()

    switch (state) {
      case PlayerState.STAND:
      case PlayerState.WALK:
        // 地上にいない場合はJUMP状態に遷移
        if (this.coyoteTime > 0) {
          this.stateManager.changeState(PlayerState.JUMP)
          break
        }
        this.handleMove()
        this.handleJump()
        this.handleCrouch()
        this.handleWind()
        break

      case PlayerState.JUMP:
        // 着地したらSTAND状態に遷移
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
        // しゃがみ解除（Sキーを離した）
        if (!this.input.isKeyDown('KeyS')) {
          this.stateManager.changeState(PlayerState.STAND_UP)
          // hitboxを元に戻す
          this.hitbox = new Rectangle(-5, -9, 10, 25)
        }
        this.handleWind()
        break

      case PlayerState.STAND_UP:
        this.vx = 0
        // 3フレーム経過で立ち上がり完了
        if (stateTime >= 3) {
          this.stateManager.changeState(PlayerState.STAND)
        }
        break

      case PlayerState.DAMAGE:
        // ノックバック継続
        // 10フレーム経過で通常状態に戻る
        if (stateTime >= 10) {
          this.stateManager.changeState(PlayerState.STAND)
        }
        break

      case PlayerState.DAMAGE_PIT:
        // 落とし穴ダメージ
        // 40フレーム経過で地面に復帰
        if (stateTime >= 40) {
          this.fallPit()
          this.stateManager.changeState(PlayerState.STAND)
        }
        break

      default:
        break
    }
  }

  /**
   * 移動処理
   */
  private handleMove() {
    if (this.input.isKeyDown('KeyA')) {
      this.vx = -this.MOVE_SPEED
      this.scaleX = -1 // 左向き
      // STAND → WALK
      if (this.stateManager.getState() === PlayerState.STAND) {
        this.stateManager.changeState(PlayerState.WALK)
      }
    } else if (this.input.isKeyDown('KeyD')) {
      this.vx = this.MOVE_SPEED
      this.scaleX = 1 // 右向き
      // STAND → WALK
      if (this.stateManager.getState() === PlayerState.STAND) {
        this.stateManager.changeState(PlayerState.WALK)
      }
    } else {
      this.vx = 0
      // WALK → STAND
      if (this.stateManager.getState() === PlayerState.WALK) {
        this.stateManager.changeState(PlayerState.STAND)
      }
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
        this.coyoteTime = this.COYOTE_TIME_MAX // ジャンプしたらコヨーテタイム消費
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
      // hitboxを変更（しゃがみ時は高さが半分）
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
   * 地面座標を記録（落下死処理用）
   */
  private recordFloorPosition() {
    this.floorPositions.push({ x: this.x, y: this.y })
    // 最大10個まで保持
    if (this.floorPositions.length > 10) {
      this.floorPositions.shift()
    }
  }

  /**
   * 落とし穴から復帰
   * legacy の fallPit イベントに対応
   */
  private fallPit() {
    if (this.floorPositions.length === 0) return

    const lastFloor = this.floorPositions.shift()!
    this.floorPositions = [lastFloor]
    this.x = lastFloor.x
    this.y = lastFloor.y
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

    // アニメーション切り替え
    this.playAnimation(nextAnimation)
  }

  /**
   * ダメージを受ける
   * @param num ダメージ量
   * @param isPit 落とし穴ダメージかどうか
   */
  damage(num: number, isPit = false) {
    // 無敵時間中はダメージを受けない
    if (this.noHitboxTime > 0) return

    // HPを減らす（最小0）
    const nextHp = Math.max(0, this.hp - num)
    const actualDamage = this.hp - nextHp
    this.hp = nextHp

    // ノックバック（向きの逆方向に押し出す）
    this.vx = this.scaleX > 0 ? -1 : 1
    if (isPit) {
      this.vx = 0 // 落とし穴の場合は横移動なし
    }
    // 1フレーム分後退
    this.x -= this.vx

    // 無敵時間を設定（約0.8秒）
    this.noHitboxTime = 50

    // ダメージ音
    this.audio.playSound(SFX_KEYS.DAMAGE)

    // ダメージイベント発火（HPBar更新用）
    this.dispatch('playerDamage', actualDamage)

    // 死亡判定
    if (this.hp <= 0) {
      this.isDead = true
      // 強制的にdamageアニメーションを100フレーム再生（legacy実装に合わせる）
      this.playAnimationForced('damage', 100)
      // 点滅を止める
      const sprite = this.getAnimatedSprite()
      if (sprite) {
        sprite.alpha = 1
      }
      this.dispatch('death')
    } else {
      // 状態遷移
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
    this.hp = Math.min(this.maxHp, this.hp + num)
    this.audio.playSound(SFX_KEYS.HEAL)
  }

  /**
   * 風を生成する（アニメーション付き）
   * プレイヤーの状態に応じて風の方向とアニメーションを変える
   */
  private createWindWithAnimation() {
    const state = this.stateManager.getState()
    let windVx = 0

    // しゃがみ中は真下に風を出す
    if (state === PlayerState.SIT) {
      windVx = 0
      this.playAnimationForced('wind', 12)
    }
    // 歩き中は windWalk / windWalk2 を交互に
    else if (state === PlayerState.WALK) {
      windVx = this.scaleX > 0 ? 2 : -2
      // 前回のアニメーションに応じて切り替え
      if (this.currentAnimationName === 'windWalk2') {
        this.playAnimationForced('windWalk', 12)
      } else {
        this.playAnimationForced('windWalk2', 12)
      }
    }
    // 立ち状態は wind
    else {
      windVx = this.scaleX > 0 ? 2 : -2
      this.playAnimationForced('wind', 12)
    }

    // 風の初期位置（プレイヤーの中心）
    // legacy実装では、風をプレイヤー中心に配置した後、
    // StageSceneで6フレーム分update()を呼んで衝突判定しながら前進させる
    const windX = this.x
    const windY = this.y

    // createWindイベントを発火（StageSceneで受け取る）
    this.dispatch('createWind', { x: windX, y: windY, vx: windVx })
  }

  /**
   * 風を生成する（後方互換性のため残す）
   * プレイヤーの向きに応じて風を発射
   */
  createWind() {
    // 風の速度を決定（向きに応じて、legacy実装に合わせて±2）
    const windVx = this.scaleX > 0 ? 2 : -2

    // 風の初期位置（プレイヤーの中心から少し前方）
    const windX = this.x + (this.scaleX > 0 ? 8 : -8)
    const windY = this.y

    // createWindイベントを発火（StageSceneで受け取る）
    this.dispatch('createWind', { x: windX, y: windY, vx: windVx })
  }

  /**
   * 無敵時間中かどうか
   */
  isInvincible(): boolean {
    return this.noHitboxTime > 0
  }

  /**
   * デバッグ情報を取得
   */
  getDebugInfo() {
    return {
      x: this.x.toFixed(2),
      y: this.y.toFixed(2),
      vx: this.vx.toFixed(2),
      vy: this.vy.toFixed(2),
      coyoteTime: this.coyoteTime,
      coyoteTimeMax: this.COYOTE_TIME_MAX,
      onGround: this.coyoteTime === 0,
      hp: this.hp,
      maxHp: this.maxHp,
      invincible: this.isInvincible(),
      isDead: this.isDead,
      state: this.stateManager.getState(),
      stateTime: this.stateManager.getTime(),
    }
  }
}
