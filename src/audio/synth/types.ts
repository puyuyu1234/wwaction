/**
 * オシレーター波形タイプ
 */
export type WaveformType = 'square' | 'sawtooth' | 'triangle' | 'sine'

/**
 * ADSR エンベロープ設定
 */
export interface EnvelopeConfig {
  /** Attack時間（秒） */
  attack: number
  /** Decay時間（秒） */
  decay: number
  /** Sustain レベル（0-1） */
  sustain: number
  /** Release時間（秒） */
  release: number
}

/**
 * シンセプリセット設定
 */
export interface SynthPreset {
  /** 波形タイプ */
  waveform: WaveformType
  /** エンベロープ設定 */
  envelope: EnvelopeConfig
  /** 音量（dB） */
  volume?: number
}

/**
 * トラック別シンセ設定マップ
 * { トラック番号: シンセプリセット }
 */
export type TrackSynthMap = Record<number, SynthPreset>
