import { FallDeathComponent } from '@components/FallDeathComponent'
import { HealthComponent } from '@components/HealthComponent'
import { PhysicsComponent } from '@components/PhysicsComponent'
import { TilemapCollisionComponent } from '@components/TilemapCollisionComponent'
import { Input } from '@core/Input'
import { Rectangle } from '@core/Rectangle'

import { CommonBehaviors } from './commonBehaviors'
import { Entity } from './Entity'

import { AudioManager } from '@/audio/AudioManager'
import { BLOCKSIZE, SFX_KEYS } from '@/game/config'
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

  // 死亡フラグ（アニメーション制御用）
  public isDead = false

  // Components（型安全に保持）
  private physics: PhysicsComponent
  private tilemap: TilemapCollisionComponent
  private health: HealthComponent
  private fallDeath: FallDeathComponent

  constructor(
    centerX: number,
    centerY: number,
    stage: string[][],
    input: Input,
    hp: number,
    maxHp: number
  ) {
    // アンカーポイントが中央(0.5, 0.5)なので、座標は中心を指す
    // スプライトサイズ: 24x32
    const rect = new Rectangle(centerX, centerY, 24, 32)

    // hitboxも中心基準に変換: legacy(7,7,10,25) → 中心基準(-5,-9,10,25)
    // 計算: (7-12, 7-16) = (-5, -9)
    const hitbox = new Rectangle(-5, -9, 10, 25)
    super('player', rect, hitbox, stage, [])

    this.input = input

    // Componentを初期化
    this.physics = new PhysicsComponent(this)
    this.tilemap = new TilemapCollisionComponent(this, stage)
    this.health = new HealthComponent(hp, maxHp)
    this.fallDeath = new FallDeathComponent(stage.length * BLOCKSIZE)

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

    // HP・無敵時間の更新
    this.health.update()

    // 点滅エフェクト
    const sprite = this.getAnimatedSprite()
    if (sprite) {
      sprite.alpha = this.health.shouldBlink() ? 0 : 1
    }

    // 強制アニメーションフレームの更新
    this.updateAnimationFrame()

    // 重力
    this.physics.applyGravity()

    // 状態に応じた処理
    this.processStateInput()

    // 壁判定（速度適用前に衝突チェック）
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
    } else {
      // 空中にいる場合、コヨーテタイムを増やす
      this.coyoteTime++
    }

    // 速度適用（壁判定後、衝突しない速度で移動）
    this.physics.applyVelocity()

    // 床に接地した場合、座標を記録（速度適用後の最終位置）
    if (this.coyoteTime === 0) {
      this.fallDeath.recordFloor(this.x, this.y)
    }

    // 落下死判定（ステージ外に落下）
    // 1ダメージ + 直前の地面座標に復帰
    if (this.fallDeath.checkFallDeath(this.y)) {
      this.damage(1, true) // isPit = true で落とし穴扱い
      return
    }

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
   * 落とし穴から復帰
   * legacy の fallPit イベントに対応
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

    // アニメーション切り替え
    this.playAnimation(nextAnimation)
  }

  /**
   * ダメージを受ける
   * @param num ダメージ量
   * @param isPit 落とし穴ダメージかどうか
   */
  damage(num: number, isPit = false) {
    // HealthComponentでダメージ処理
    const result = this.health.damage(num)

    // 無敵時間中はダメージを受けない
    if (result.actualDamage === 0) return

    // ノックバック（向きの逆方向に押し出す）
    this.vx = this.scaleX > 0 ? -1 : 1
    if (isPit) {
      this.vx = 0 // 落とし穴の場合は横移動なし
    }
    // 1フレーム分後退
    this.x -= this.vx

    // ダメージ音
    this.audio.playSound(SFX_KEYS.DAMAGE)

    // ダメージイベント発火（HPBar更新用）
    this.dispatch('playerDamage', result.actualDamage)

    // 死亡判定
    if (result.isDead) {
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
    this.health.heal(num)
    this.audio.playSound(SFX_KEYS.HEAL)
  }

  /**
   * 風を生成する（アニメーション付き）
   * プレイヤーの状態に応じて風の方向とアニメーションを変える
   */
  private createWindWithAnimation() {
    const state = this.stateManager.getState()
    let windVx = 0

    // アニメーション選択とwindVx決定
    // legacy実装: wind(vx) の引数が最終速度になる
    // - しゃがみ中: wind(0) → windVx = 0
    // - それ以外: wind(this.scaleX == 1 ? 2 : -2) → windVx = ±2
    if (state === PlayerState.SIT) {
      // しゃがみ中は真下に風を出す（windVx = 0）
      windVx = 0
      this.playAnimationForced('wind', 12)
    } else if (state === PlayerState.WALK) {
      // 歩き中は windWalk / windWalk2 を交互に
      windVx = this.scaleX > 0 ? 2 : -2
      // 前回のアニメーションに応じて切り替え
      if (this.currentAnimationName === 'windWalk2') {
        this.playAnimationForced('windWalk', 12)
      } else {
        this.playAnimationForced('windWalk2', 12)
      }
    } else {
      // 立ち・ジャンプ状態は wind（windVx = ±2）
      windVx = this.scaleX > 0 ? 2 : -2
      this.playAnimationForced('wind', 12)
    }

    // 風の初期位置（プレイヤーの中心）
    // legacy実装では、風をプレイヤー中心に配置した後、
    // StageSceneで6フレーム分update()を呼んで衝突判定しながら前進させる
    const windX = this.x
    const windY = this.y

    // createWindイベントを発火（StageSceneで受け取る）
    // windVx: 最終的な風の速度（しゃがみ中は0、それ以外は±2）
    this.dispatch('createWind', { x: windX, y: windY, vx: windVx })
  }

  /**
   * 無敵時間中かどうか
   */
  isInvincible(): boolean {
    return this.health.isInvincible()
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
      hp: this.health.getHp(),
      maxHp: this.health.getMaxHp(),
      invincible: this.isInvincible(),
      isDead: this.isDead,
      state: this.stateManager.getState(),
      stateTime: this.stateManager.getTime(),
    }
  }

  /**
   * HP取得（後方互換のためのgetter）
   * HPBar等の外部モジュールが `player.hp` でアクセスするため、
   * HealthComponentへの委譲を隠蔽する
   */
  get hp(): number {
    return this.health.getHp()
  }

  /**
   * 最大HP取得（後方互換のためのgetter）
   * HPBar等の外部モジュールが `player.maxHp` でアクセスするため、
   * HealthComponentへの委譲を隠蔽する
   */
  get maxHp(): number {
    return this.health.getMaxHp()
  }
}
