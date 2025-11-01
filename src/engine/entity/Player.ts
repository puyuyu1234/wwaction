import { PhysicsComponent } from '@components/PhysicsComponent'
import { TilemapCollisionComponent } from '@components/TilemapCollisionComponent'
import { Input } from '@core/Input'
import { Rectangle } from '@core/Rectangle'

import { CommonBehaviors } from './commonBehaviors'
import { Entity } from './Entity'

import { AudioManager } from '@/audio/AudioManager'
import { SFX_KEYS } from '@/game/config'

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

  // しゃがみ状態
  public isCrouching = false
  private isStandingUp = false // 立ち上がり中フラグ
  private standUpTime = 0 // 立ち上がり経過時間

  // 風生成関連（legacy実装ではクールダウンなし）

  // HP関連
  public hp: number
  public maxHp: number
  private noHitboxTime = 0 // 無敵時間（ダメージ後の猶予）
  public isDead = false

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
    // 死亡時は更新しない
    if (this.isDead) return

    // 無敵時間の更新
    if (this.noHitboxTime > 0) {
      this.noHitboxTime--
    }

    // 強制アニメーションフレームの更新
    this.updateAnimationFrame()

    // 重力
    this.physics.applyGravity()

    // 立ち上がり中の処理
    if (this.isStandingUp) {
      this.standUpTime++
      if (this.standUpTime >= 3) {
        // 3フレーム経過で立ち上がり完了
        this.isStandingUp = false
        this.standUpTime = 0
      }
      // 立ち上がり中は移動できない
      this.vx = 0
    }
    // しゃがみ判定（地上でSキーを押している間）
    else if (this.input.isKeyDown('KeyS') && this.coyoteTime === 0) {
      // しゃがみ開始
      if (!this.isCrouching) {
        this.isCrouching = true
        // hitboxを変更（しゃがみ時は高さが半分）
        // legacy: new Rectangle(7, 16, 10, 16) → 中心基準 (-5, 0, 10, 16)
        this.hitbox = new Rectangle(-5, 0, 10, 16)
      }
      this.vx = 0 // しゃがみ中は移動できない
    }
    // しゃがみ解除
    else if (this.isCrouching) {
      this.isCrouching = false
      this.isStandingUp = true
      this.standUpTime = 0
      // hitboxを元に戻す
      this.hitbox = new Rectangle(-5, -9, 10, 25)
    }
    // 通常時の移動
    else {
      if (this.input.isKeyDown('KeyA')) {
        this.vx = -this.MOVE_SPEED
        this.scaleX = -1 // 左向き
      } else if (this.input.isKeyDown('KeyD')) {
        this.vx = this.MOVE_SPEED
        this.scaleX = 1 // 右向き
      } else {
        this.vx = 0
      }
    }

    // ジャンプ（コヨーテタイム対応、しゃがんでいない時のみ）
    if (this.input.isKeyPressed('KeyW') && !this.isCrouching && !this.isStandingUp) {
      if (this.coyoteTime < this.COYOTE_TIME_MAX) {
        this.vy = this.JUMP_POWER
        this.coyoteTime = this.COYOTE_TIME_MAX // ジャンプしたらコヨーテタイム消費
        this.audio.playSound(SFX_KEYS.JUMP)
      }
    }

    // 風生成（スペースキー）
    // legacy実装ではクールダウンなし、連打可能
    if (this.input.isKeyPressed('Space')) {
      this.createWindWithAnimation()
    }

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
    } else {
      // 空中にいる場合、コヨーテタイムを増やす
      this.coyoteTime++
    }

    // 速度適用
    this.physics.applyVelocity()

    // アニメーション更新
    this.updatePlayerAnimation()
  }

  /**
   * プレイヤーの状態に応じてアニメーションを切り替え
   */
  private updatePlayerAnimation() {
    let nextAnimation = ''

    // 立ち上がり状態を最優先
    if (this.isStandingUp) {
      nextAnimation = 'standUp'
    }
    // しゃがみ状態
    else if (this.isCrouching) {
      nextAnimation = 'sit'
    }
    // 状態に応じてアニメーション決定
    else if (this.vy < 0) {
      nextAnimation = 'jumpUp'
    } else if (this.vy > 0) {
      nextAnimation = 'jumpDown'
    } else if (this.vx === 0) {
      nextAnimation = 'stand'
    } else {
      nextAnimation = 'walk'
    }

    // アニメーション切り替え
    this.playAnimation(nextAnimation)
  }

  /**
   * ダメージを受ける
   * @param num ダメージ量
   */
  damage(num: number) {
    // 無敵時間中はダメージを受けない
    if (this.noHitboxTime > 0) return

    // HPを減らす（最小0）
    this.hp = Math.max(0, this.hp - num)

    // ノックバック（向きの逆方向に押し出す）
    this.vx = this.scaleX > 0 ? -1 : 1

    // 無敵時間を設定（約0.8秒）
    this.noHitboxTime = 50

    // ダメージ音
    this.audio.playSound(SFX_KEYS.DAMAGE)

    // ダメージイベント発火（HPBar更新用）
    this.dispatch('playerDamage', num)

    // 死亡判定
    if (this.hp <= 0) {
      this.isDead = true
      this.dispatch('death') // イベント発火（将来的にゲームオーバー処理で使用）
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
    let windVx = 0

    // しゃがみ中は真下に風を出す
    if (this.isCrouching) {
      windVx = 0
      this.playAnimationForced('wind', 12)
    }
    // 歩き中は windWalk / windWalk2 を交互に
    else if (this.vx !== 0) {
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
    }
  }
}
