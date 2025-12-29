import type { TilemapCollisionComponent } from '@components/TilemapCollisionComponent'

import type { Entity } from './Entity'

/**
 * エンティティ間で共通する振る舞い（反応）を定義
 *
 * 設計方針:
 * - 設計が固まっていない段階では、共通の挙動を一箇所に集約
 * - 変更時は1ファイルの修正で全エンティティに反映
 * - 必要に応じて各エンティティで個別にオーバーライド可能
 */

/**
 * 風ジャンプの速度（上方向）
 */
const WIND_JUMP_POWER = -3

export const CommonBehaviors = {
  /**
   * 風に触れたときのジャンプ動作
   * 多くのエンティティで共通の挙動
   *
   * @param entity ジャンプするエンティティ
   */
  windJump: (entity: Entity) => {
    entity.vy = WIND_JUMP_POWER
  },

  /**
   * 横壁（左右）で反転＋スプライト反転
   * 単独で横壁のみ処理する場合に使用（縦壁は別途処理）
   *
   * - 左壁にぶつかる → 右向きに反転（vx反転、scaleX = -1）
   * - 右壁にぶつかる → 左向きに反転（vx反転、scaleX = 1）
   *
   * @param entity 反転するエンティティ
   * @param tilemap タイルマップ衝突判定Component
   */
  bounceHorizontalWalls: (entity: Entity, tilemap: TilemapCollisionComponent) => {
    if (tilemap.checkLeftWall() && entity.vx < 0) {
      tilemap.bounceAtLeftWall()
      entity.scaleX = -1
    }
    if (tilemap.checkRightWall() && entity.vx > 0) {
      tilemap.bounceAtRightWall()
      entity.scaleX = 1
    }
  },

  /**
   * 壁との衝突処理（横壁反転＋縦壁停止）
   * Nasake, Gurasan等の基本的な敵エンティティで使用
   *
   * - 左壁にぶつかる → 右向きに反転（vx反転、scaleX = -1）
   * - 右壁にぶつかる → 左向きに反転（vx反転、scaleX = 1）
   * - 天井にぶつかる → 上方向の速度を0にして停止
   * - 床にぶつかる → 下方向の速度を0にして停止
   *
   * @param entity 衝突処理を行うエンティティ
   * @param tilemap タイルマップ衝突判定Component
   */
  bounceWalls: (entity: Entity, tilemap: TilemapCollisionComponent) => {
    // 横壁: 反転
    if (tilemap.checkLeftWall() && entity.vx < 0) {
      tilemap.bounceAtLeftWall()
      entity.scaleX = -1
    }
    if (tilemap.checkRightWall() && entity.vx > 0) {
      tilemap.bounceAtRightWall()
      entity.scaleX = 1
    }

    // 縦壁: 停止
    if (tilemap.checkUpWall() && entity.vy < 0) {
      tilemap.stopAtUpWall()
    }
    if (tilemap.checkDownWall() && entity.vy > 0) {
      tilemap.stopAtDownWall()
    }
  },

  /**
   * 床着地時の崖検知＋方向転換
   * Nuefu, GurasanNotFall等の崖を避ける敵エンティティで使用
   *
   * - 床に着地している場合のみ崖をチェック
   * - 右側が崖 → 左向きに方向転換（vx負、scaleX = 1）
   * - 左側が崖 → 右向きに方向転換（vx正、scaleX = -1）
   *
   * 注意: この関数は縦壁停止処理も含むため、stopVerticalWalls()と併用しないこと
   *
   * @param entity 方向転換するエンティティ
   * @param tilemap タイルマップ衝突判定Component
   */
  stopVerticalWallsWithCliffDetection: (
    entity: Entity,
    tilemap: TilemapCollisionComponent
  ) => {
    // 天井: 停止
    if (tilemap.checkUpWall() && entity.vy < 0) {
      tilemap.stopAtUpWall()
    }

    // 床: 停止＋崖検知
    if (tilemap.checkDownWall() && entity.vy > 0) {
      tilemap.stopAtDownWall()

      // 右側が崖 → 左に曲がる
      if (tilemap.checkRightSideCliff()) {
        entity.vx = -Math.abs(entity.vx)
        entity.scaleX = 1
      }
      // 左側が崖 → 右に曲がる
      if (tilemap.checkLeftSideCliff()) {
        entity.vx = Math.abs(entity.vx)
        entity.scaleX = -1
      }
    }
  },
} as const
