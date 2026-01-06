/**
 * Audio System Type Definitions
 * ドメイン層の型定義（Tone.jsに依存しない）
 */

import type { PRESETS } from './presets'

/**
 * プリセット名（文字列で指定）
 */
export type TrackPreset = keyof typeof PRESETS

/**
 * ADSR エンベロープ設定
 */
export interface ADSR {
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
 * 波形タイプ
 */
export type Waveform = 'sine' | 'triangle' | 'square' | 'sawtooth'

/**
 * シンセサイザータイプ（内部実装用）
 */
export type SynthType = 'synth' | 'membrane' | 'noise'

/**
 * トラック設定（内部実装用）
 * Discriminated Union型で各synthTypeに応じた設定を定義
 */
export type TrackConfig = SynthTrackConfig | MembraneTrackConfig | NoiseTrackConfig

/**
 * 通常のシンセサイザー設定
 */
export interface SynthTrackConfig {
  synthType: 'synth'
  waveform: Waveform
  envelope: ADSR
  volume: number
  /** デチューン量（セント、100 = 1半音、デフォルト: 0） */
  detune?: number
}

/**
 * メンブレンシンセ設定（キック、スネアなど）
 */
export interface MembraneTrackConfig {
  synthType: 'membrane'
  waveform: Waveform
  envelope: ADSR
  volume: number
  /** デチューン量（セント、100 = 1半音、デフォルト: 0） */
  detune?: number
}

/**
 * ノイズカラー
 */
export type NoiseColor = 'white' | 'pink' | 'brown'

/**
 * ノイズシンセ設定（ハイハットなど）
 * waveformは不要
 */
export interface NoiseTrackConfig {
  synthType: 'noise'
  /** ノイズカラー */
  noiseColor: NoiseColor
  envelope: ADSR
  volume: number
  /** デチューン量（セント、100 = 1半音、デフォルト: 0） */
  detune?: number
}

/**
 * 音楽ソース（MIDI or Audio）
 */
export type MusicSource = MidiSource | AudioSource

/**
 * MIDIソース
 */
export interface MidiSource {
  type: 'midi'
  /** MIDIファイルパス */
  path: string
  /** トラック設定（トラック番号 → プリセット名） */
  tracks: Record<number, TrackPreset>
  /** ループ再生するか（デフォルト: true） */
  loop?: boolean
}

/**
 * Audioソース（MP3等）
 */
export interface AudioSource {
  type: 'audio'
  /** 音声ファイルパス */
  path: string
  /** ループ再生するか（デフォルト: true） */
  loop?: boolean
  /** 音量（dB、デフォルト: -6） */
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
  /** 音声ファイルパス */
  path: string
  /** 音量（dB、デフォルト: -6） */
  volume?: number
}

/**
 * トラックパラメータ（リアルタイム変更用）
 */
export interface TrackParameters {
  /** 音量（dB） */
  volume?: number
  /** エンベロープ */
  envelope?: ADSR
  /** 波形 */
  waveform?: Waveform
}
