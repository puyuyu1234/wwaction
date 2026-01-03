/**
 * Synth Engine
 * TrackConfig (ドメイン型) を Tone.js のシンセサイザーに変換する
 * Infrastructure層: Tone.jsへの依存を隠蔽
 */

import * as Tone from 'tone'

import type { TrackConfig } from '../types'

/**
 * TrackConfigからTone.jsシンセサイザーを生成
 */
export class SynthEngine {
  /**
   * TrackConfigから適切なシンセサイザーを生成
   * @param config トラック設定
   * @returns Tone.jsシンセサイザー（PolySynth or NoiseSynth）
   */
  static createSynth(config: TrackConfig): Tone.PolySynth | Tone.NoiseSynth {
    switch (config.synthType) {
      case 'synth':
        return new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: config.waveform },
          envelope: {
            attack: config.envelope.attack,
            decay: config.envelope.decay,
            sustain: config.envelope.sustain,
            release: config.envelope.release,
          },
          volume: config.volume,
          detune: config.detune ?? 0,
        })

      case 'membrane':
        return new Tone.PolySynth(Tone.MembraneSynth, {
          oscillator: { type: config.waveform },
          envelope: {
            attack: config.envelope.attack,
            decay: config.envelope.decay,
            sustain: config.envelope.sustain,
            release: config.envelope.release,
          },
          volume: config.volume,
          detune: config.detune ?? 0,
        })

      case 'noise':
        return new Tone.NoiseSynth({
          noise: { type: config.noiseColor },
          envelope: {
            attack: config.envelope.attack,
            decay: config.envelope.decay,
            sustain: config.envelope.sustain,
            release: config.envelope.release,
          },
          volume: config.volume,
          // NoiseSynthはdetuneをサポートしない
        })

      default: {
        // Discriminated Union型により、ここには到達しない
        const _exhaustiveCheck: never = config
        throw new Error(`Unknown synth type: ${(_exhaustiveCheck as TrackConfig).synthType}`)
      }
    }
  }

  /**
   * シンセサイザーの音量を変更
   * @param synth シンセサイザー
   * @param db 音量（dB）
   */
  static setVolume(synth: Tone.PolySynth | Tone.NoiseSynth, db: number): void {
    synth.volume.value = db
  }

  /**
   * シンセサイザーのエンベロープを変更
   * @param synth シンセサイザー
   * @param envelope ADSR設定
   */
  static setEnvelope(
    synth: Tone.PolySynth | Tone.NoiseSynth,
    envelope: { attack: number; decay: number; sustain: number; release: number }
  ): void {
    if (synth instanceof Tone.PolySynth) {
      synth.set({ envelope })
    } else if (synth instanceof Tone.NoiseSynth) {
      synth.envelope.attack = envelope.attack
      synth.envelope.decay = envelope.decay
      synth.envelope.sustain = envelope.sustain
      synth.envelope.release = envelope.release
    }
  }

  /**
   * シンセサイザーの波形を変更（PolySynthのみ）
   * @param synth シンセサイザー
   * @param waveform 波形タイプ
   */
  static setWaveform(
    synth: Tone.PolySynth | Tone.NoiseSynth,
    waveform: 'sine' | 'triangle' | 'square' | 'sawtooth'
  ): void {
    if (synth instanceof Tone.PolySynth) {
      synth.set({ oscillator: { type: waveform } })
    }
    // NoiseSynthは波形変更不可（無視）
  }

  /**
   * シンセサイザーの音高を変更（デチューン、セント単位）
   * @param synth シンセサイザー
   * @param cents デチューン量（セント、100 = 1半音）
   */
  static setDetune(synth: Tone.PolySynth | Tone.NoiseSynth, cents: number): void {
    if (synth instanceof Tone.PolySynth) {
      synth.set({ detune: cents })
    }
    // NoiseSynthは音高変更不可（無視）
  }
}
