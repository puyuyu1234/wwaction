// ゲーム全体の設定定数

/** ゲーム画面設定 */
export const GAME_CONFIG = {
  /** ゲーム画面の幅 */
  WIDTH: 320,
  /** ゲーム画面の高さ */
  HEIGHT: 240,
  /** 背景色 */
  BACKGROUND_COLOR: '#68a',
} as const

/** プレイヤー設定 */
export const PLAYER_CONFIG = {
  /** スプライトサイズ */
  SPRITE: {
    WIDTH: 24,
    HEIGHT: 32,
  },
  /** 当たり判定 (元のゲームの仕様: 7,7,10,25) */
  HITBOX: {
    OFFSET_X: 7,
    OFFSET_Y: 7,
    WIDTH: 10,
    HEIGHT: 25,
  },
  /** 移動速度 */
  SPEED: 90,
  /** ジャンプ力（負の値で上向き） */
  JUMP_POWER: -180,
  /** 重力加速度 */
  GRAVITY: 300,
  /** コヨーテタイム（地面を離れても一定時間ジャンプ可能） */
  COYOTE_TIME: 6,
} as const

/** 物理演算設定 */
export const PHYSICS_CONFIG = {
  /** デバッグモード（当たり判定を表示） */
  DEBUG: true,
} as const
