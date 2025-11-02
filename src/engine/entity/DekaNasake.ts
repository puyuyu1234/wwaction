import { PhysicsComponent } from '@components/PhysicsComponent'
import { TilemapCollisionComponent } from '@components/TilemapCollisionComponent'
import { Rectangle } from '@core/Rectangle'

import { Entity } from './Entity'

import { DekaNasakeState } from '@/game/types'

/**
 * DekaNasakeの状態管理クラス
 * PlayerStateManagerに倣った設計
 */
class DekaNasakeStateManager {
  private currentState: DekaNasakeState = DekaNasakeState.WALK
  private stateTime = 0

  changeState(newState: DekaNasakeState) {
    this.currentState = newState
    this.stateTime = 0
  }

  update() {
    this.stateTime++
  }

  getState(): DekaNasakeState {
    return this.currentState
  }

  getTime(): number {
    return this.stateTime
  }
}

/**
 * DekaNasake（デカナサケ）エンティティ - ボスキャラクター
 * - 3つの状態を持つ: walk（通常移動）/ hitWind（風を受けた直後）/ run（逃走中）
 * - 左右に移動し、壁で反転
 * - 崖の近くで方向を自動変更（120フレーム毎）
 * - 風を受けると驚いて逃げ回る（hitWind → run）
 * - プレイヤーに接触するとダメージを与える
 * - 重力が適用される
 */
export class DekaNasake extends Entity {
  private physics: PhysicsComponent
  private tilemap: TilemapCollisionComponent

  /** 移動方向 (-1: 左, 1: 右) */
  private direction = -1

  /** 状態管理 */
  private stateManager = new DekaNasakeStateManager()

  /** 崖検出のクールダウンタイマー */
  private cliffTimer = 120

  /** タイマー定数 */
  private readonly TIMER = {
    hitWind: 12, // 風を受けた後の待機時間（フレーム数）
    run: 24, // 逃走時間（フレーム数）
  } as const

  /** 移動速度定数 */
  private readonly SPEED = {
    walk: 0.75, // 通常移動速度 (3/4)
    run: 1, // 逃走時の速度
  } as const

  constructor(x: number, y: number, stage: string[][]) {
    // アンカーポイントが中央(0.5, 0.5)なので、座標は中心を指す
    // スプライトサイズ: 32x32、中心座標に変換: x+16, y+16
    const centerX = x + 16
    const centerY = y + 16
    const rect = new Rectangle(centerX, centerY, 32, 32)

    // hitboxも中心基準に変換: legacy(8,6,16,26) → 中心基準(-8,-10,16,26)
    // 計算: (8-16, 6-16) = (-8, -10)
    const hitbox = new Rectangle(-8, -10, 16, 26)

    // タグ 'enemy': プレイヤーの衝突反応で参照される
    // imageKey は 'deka' スプライトシートを参照
    super('deka', rect, hitbox, stage, ['enemy'])

    this.direction = -1 // 左方向に移動開始
    this.scaleX = 1 // 敵は左向き時に scaleX = 1

    // 必要なComponentを初期化
    this.physics = new PhysicsComponent(this)
    this.tilemap = new TilemapCollisionComponent(this, stage)

    // 風との衝突反応を設定
    this.setupCollisionReactions()

    // スプライトアニメーション初期化
    this.playAnimation('purupuru')
  }

  /**
   * 各種エンティティとの衝突時の反応を設定
   * Player.setupCollisionReactions() に倣った設計
   */
  private setupCollisionReactions() {
    // 風との衝突: 風の速度を奪って逃走
    this.collisionReaction.on('wind', (wind: Entity) => {
      if (this.stateManager.getTime() > 0) {
        // 既にhitWind状態の場合は反応しない
        if (this.stateManager.getState() === DekaNasakeState.HIT_WIND) return
      }

      // 風の速度を奪って逆向きにする
      this.vx = wind.vx
      wind.vx *= -1

      // 状態を hitWind に変更
      this.stateManager.changeState(DekaNasakeState.HIT_WIND)
      this.playAnimation('stand')
    })
  }

  update() {
    // 状態管理の更新
    this.stateManager.update()

    // 崖検出タイマーを減算
    this.cliffTimer--

    // 状態に応じた処理（legacy実装と同じ順序: vx設定 → 壁判定）
    // hitWind状態ではvxを変更しないため、風から奪った速度が保持される
    this.processStateInput()

    // 重力
    this.physics.applyGravity()

    // 壁判定（速度適用前に衝突チェック）
    // legacy実装では、壁で vx *= -1 されるが、direction は変更されない
    // hitWind状態で壁に当たった場合、反転した速度が保持されるが、
    // run状態に遷移すると direction から速度が再計算されるため、元に戻る
    if (this.tilemap.checkLeftWall() && this.vx < 0) {
      this.tilemap.bounceAtLeftWall()
      // hitWind状態以外の場合のみ direction を更新
      if (this.stateManager.getState() !== DekaNasakeState.HIT_WIND) {
        this.direction = 1
        this.scaleX = -1 // 右向き
      }
    }
    if (this.tilemap.checkRightWall() && this.vx > 0) {
      this.tilemap.bounceAtRightWall()
      // hitWind状態以外の場合のみ direction を更新
      if (this.stateManager.getState() !== DekaNasakeState.HIT_WIND) {
        this.direction = -1
        this.scaleX = 1 // 左向き
      }
    }
    if (this.tilemap.checkUpWall() && this.vy < 0) {
      this.tilemap.stopAtUpWall()
    }
    if (this.tilemap.checkDownWall() && this.vy > 0) {
      this.tilemap.stopAtDownWall()
    }

    // 崖検出（通常移動中のみ、120フレームのクールダウン付き）
    // legacy実装: rightFootOnCliff（左側が崖）→ 右に曲がる
    //            leftFootOnCliff（右側が崖）→ 左に曲がる
    if (this.stateManager.getState() === DekaNasakeState.WALK && this.cliffTimer <= 0) {
      if (this.tilemap.checkLeftSideCliff()) {
        // 左側が崖 → 右に曲がる（legacy: rightFootOnCliff）
        this.cliffTimer = 120
        this.direction = 1
        this.scaleX = -1 // 右向き
      } else if (this.tilemap.checkRightSideCliff()) {
        // 右側が崖 → 左に曲がる（legacy: leftFootOnCliff）
        this.cliffTimer = 120
        this.direction = -1
        this.scaleX = 1 // 左向き
      }
    }

    // 速度適用
    this.physics.applyVelocity()
  }

  /**
   * 状態に応じた処理
   * Player.processStateInput() に倣った設計
   */
  private processStateInput() {
    const state = this.stateManager.getState()
    const stateTime = this.stateManager.getTime()

    switch (state) {
      case DekaNasakeState.WALK:
        // 通常移動（ゆっくり）
        this.vx = this.direction * this.SPEED.walk
        break

      case DekaNasakeState.HIT_WIND:
        // 風を受けた直後（待機中）
        // vxは維持（風の速度を引き継ぐ）
        if (stateTime >= this.TIMER.hitWind) {
          // 待機終了 → 逃走状態へ移行
          this.stateManager.changeState(DekaNasakeState.RUN)
          this.playAnimation('purupuru')
          // directionは変更しない（元の方向に逃走する）
        }
        break

      case DekaNasakeState.RUN:
        // 逃走中（高速移動）
        if (stateTime >= this.TIMER.run) {
          // 逃走終了 → 通常移動に戻る
          this.stateManager.changeState(DekaNasakeState.WALK)
        }
        this.vx = this.direction * this.SPEED.run
        break
    }
  }
}
