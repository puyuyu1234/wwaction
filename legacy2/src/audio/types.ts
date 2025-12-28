/**
 * 音響システム型定義
 */

/**
 * BGM設定
 */
export interface MusicConfig {
  /** 音源ファイルパス */
  path: string
  /** ループ再生するか */
  loop?: boolean
  /** 音量（dB、-Infinityから0まで） */
  volume?: number
  /** ループ開始位置（秒） */
  loopStart?: number
  /** ループ終了位置（秒） */
  loopEnd?: number
}

/**
 * 効果音設定
 */
export interface SoundEffectConfig {
  /** 音源ファイルパス */
  path: string
  /** 音量（dB、-Infinityから0まで） */
  volume?: number
}

/**
 * 音響初期化状態
 */
export enum AudioState {
  /** 未初期化 */
  UNINITIALIZED = 'uninitialized',
  /** 初期化中 */
  INITIALIZING = 'initializing',
  /** 初期化済み */
  READY = 'ready',
  /** エラー */
  ERROR = 'error',
}
