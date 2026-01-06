/**
 * MIDI Player
 * MIDIファイルをプリセットベースで再生する
 * Infrastructure層: @tonejs/midi と Tone.js を使用
 */

import { Midi } from '@tonejs/midi'
import * as Tone from 'tone'

import { PRESETS } from '../presets'
import type { MidiSource } from '../types'

import { SynthEngine } from './SynthEngine'

/**
 * MIDI再生クラス
 */
export class MidiPlayer {
  private synths: (Tone.PolySynth | Tone.NoiseSynth)[] = []
  private parts: Tone.Part[] = []
  private currentSource: MidiSource | null = null

  // 音量ミキサー
  private musicVolume = 0 // 全体の音量オフセット (dB)
  private trackVolumes: number[] = [] // トラックごとの音量オフセット (dB)
  private presetVolumes: number[] = [] // プリセットの初期音量 (dB)

  // トラック別可視化用Analyser
  private trackWaveformAnalysers: Tone.Analyser[] = []
  private trackFFTAnalysers: Tone.Analyser[] = []

  /**
   * MIDIファイルを再生
   * @param source MIDIソース設定
   */
  async play(source: MidiSource): Promise<void> {
    // 既に同じMIDIが再生中なら何もしない
    if (this.currentSource?.path === source.path && Tone.Transport.state === 'started') {
      return
    }

    // 既存の再生を停止
    this.stop()

    // MIDIファイルをロード
    const response = await fetch(source.path)
    const arrayBuffer = await response.arrayBuffer()
    const midi = new Midi(arrayBuffer)

    // 音量ミキサーの初期化
    this.trackVolumes = []
    this.presetVolumes = []

    // トラックごとにシンセとPartを作成
    midi.tracks.forEach((track, index) => {
      const presetName = source.tracks[index]
      if (!presetName) {
        // トラック設定がない場合はスキップ
        return
      }

      // プリセットからTrackConfigを取得
      const trackConfig = PRESETS[presetName]
      if (!trackConfig) {
        console.warn(`Unknown preset: ${presetName}, skipping track ${index}`)
        return
      }

      // プリセット音量を記録
      this.presetVolumes.push(trackConfig.volume)
      // トラック個別音量は初期値0 (オフセットなし)
      this.trackVolumes.push(0)

      // シンセサイザーを生成
      const synth = SynthEngine.createSynth(trackConfig)

      // トラック別Analyserを作成
      const waveformAnalyser = new Tone.Analyser('waveform', 2048)
      const fftAnalyser = new Tone.Analyser('fft', 2048)

      // シンセ → Analyser → Destination
      synth.connect(waveformAnalyser)
      synth.connect(fftAnalyser)
      synth.toDestination()

      this.synths.push(synth)
      this.trackWaveformAnalysers.push(waveformAnalyser)
      this.trackFFTAnalysers.push(fftAnalyser)

      // 初期音量を設定 (preset + music + track)
      this.updateTrackVolume(this.synths.length - 1)

      // ノートデータをTone.Part用に変換
      const notes = track.notes.map((note) => ({
        time: note.time,
        note: note.name,
        duration: note.duration,
        velocity: note.velocity,
      }))

      // Partを作成
      const part = new Tone.Part((time, note) => {
        if (synth instanceof Tone.NoiseSynth) {
          // NoiseSynthはモノフォニック: 前の音を止めてから新しい音を鳴らす
          synth.triggerRelease(time)
          synth.triggerAttack(time, note.velocity)
          synth.triggerRelease(time + Tone.Time(note.duration).toSeconds())
        } else {
          synth.triggerAttackRelease(note.note, note.duration, time, note.velocity)
        }
      }, notes)

      const loop = source.loop ?? true
      part.loop = loop
      if (loop && midi.duration > 0) {
        part.loopEnd = midi.duration
      }

      this.parts.push(part)
      part.start(0)
    })

    // Tone.jsコンテキストを確実に起動してからTransport開始
    await Tone.start()

    // Transport開始
    Tone.Transport.start()

    this.currentSource = source
  }

  /**
   * 再生を停止
   */
  stop(): void {
    // Transport停止
    Tone.Transport.stop()
    Tone.Transport.cancel() // すべてのイベントをキャンセル

    // リソース解放
    this.parts.forEach((part) => part.dispose())
    this.synths.forEach((synth) => synth.dispose())
    this.trackWaveformAnalysers.forEach((analyser) => analyser.dispose())
    this.trackFFTAnalysers.forEach((analyser) => analyser.dispose())

    this.parts = []
    this.synths = []
    this.trackWaveformAnalysers = []
    this.trackFFTAnalysers = []
    this.currentSource = null
  }

  /**
   * 音量を設定（全トラック一括）
   * @param db 音量オフセット（dB）
   */
  setVolume(db: number): void {
    this.musicVolume = db
    this.updateAllVolumes()
  }

  /**
   * トラックの音量を設定
   * @param trackIndex トラック番号
   * @param db 音量オフセット（dB）
   */
  setTrackVolume(trackIndex: number, db: number): void {
    if (trackIndex < 0 || trackIndex >= this.trackVolumes.length) {
      return
    }
    this.trackVolumes[trackIndex] = db
    this.updateTrackVolume(trackIndex)
  }

  /**
   * 全トラックの音量を更新
   */
  private updateAllVolumes(): void {
    this.synths.forEach((_, index) => {
      this.updateTrackVolume(index)
    })
  }

  /**
   * 特定トラックの音量を更新
   * 最終音量 = プリセット音量 + Music音量 + Track音量
   */
  private updateTrackVolume(trackIndex: number): void {
    const synth = this.synths[trackIndex]
    if (!synth) return

    const presetVolume = this.presetVolumes[trackIndex] ?? 0
    const trackVolume = this.trackVolumes[trackIndex] ?? 0
    const finalVolume = presetVolume + this.musicVolume + trackVolume

    SynthEngine.setVolume(synth, finalVolume)
  }

  /**
   * トラックのエンベロープを変更
   * @param trackIndex トラック番号
   * @param envelope ADSR設定
   */
  setTrackEnvelope(
    trackIndex: number,
    envelope: { attack: number; decay: number; sustain: number; release: number }
  ): void {
    const synth = this.synths[trackIndex]
    if (synth) {
      SynthEngine.setEnvelope(synth, envelope)
    }
  }

  /**
   * トラックの波形を変更
   * @param trackIndex トラック番号
   * @param waveform 波形タイプ
   */
  setTrackWaveform(
    trackIndex: number,
    waveform: 'sine' | 'triangle' | 'square' | 'sawtooth'
  ): void {
    const synth = this.synths[trackIndex]
    if (synth) {
      SynthEngine.setWaveform(synth, waveform)
    }
  }

  /**
   * トラックの音高を変更（デチューン）
   * @param trackIndex トラック番号
   * @param cents デチューン量（セント、100 = 1半音）
   */
  setTrackDetune(trackIndex: number, cents: number): void {
    const synth = this.synths[trackIndex]
    if (synth) {
      SynthEngine.setDetune(synth, cents)
    }
  }

  /**
   * 再生中かどうか
   */
  isPlaying(): boolean {
    return Tone.Transport.state === 'started'
  }

  /**
   * トラック数を取得
   */
  getTrackCount(): number {
    return this.synths.length
  }

  /**
   * トラックの波形データを取得
   */
  getTrackWaveformData(trackIndex: number): Float32Array | null {
    const analyser = this.trackWaveformAnalysers[trackIndex]
    return analyser ? (analyser.getValue() as Float32Array) : null
  }

  /**
   * トラックの周波数データを取得
   */
  getTrackFFTData(trackIndex: number): Float32Array | null {
    const analyser = this.trackFFTAnalysers[trackIndex]
    return analyser ? (analyser.getValue() as Float32Array) : null
  }

  /**
   * リソース解放
   */
  dispose(): void {
    this.stop()
    this.musicVolume = 0
    this.trackVolumes = []
    this.presetVolumes = []
  }
}
