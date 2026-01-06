/**
 * Audio Service
 * Application層のFacade - 音響システムの統一インターフェース
 * - Tone.jsの初期化管理
 * - BGM/MIDI/効果音の再生制御
 * - 音量管理
 */

import * as Tone from 'tone'

import { AudioPlayer } from './infra/AudioPlayer'
import { MidiPlayer } from './infra/MidiPlayer'
import type { MusicSource, SoundEffectConfig } from './types'

/**
 * 音響システム統括クラス（Singleton）
 */
export class AudioService {
  private static instance: AudioService

  private midiPlayer: MidiPlayer
  private audioPlayer: AudioPlayer
  private soundEffects: Map<string, Tone.Player> = new Map()
  private initialized = false

  private masterVolume = -6 // dB
  private musicVolume = -6 // dB
  private soundVolume = -6 // dB

  private currentMusicType: 'midi' | 'audio' | null = null

  // 音響可視化用Analyser（全体のミックス音声）
  private masterWaveformAnalyser: Tone.Analyser | null = null
  private masterFFTAnalyser: Tone.Analyser | null = null

  private constructor() {
    this.midiPlayer = new MidiPlayer()
    this.audioPlayer = new AudioPlayer()
  }

  /**
   * Singletonインスタンス取得
   */
  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService()
    }
    return AudioService.instance
  }

  /**
   * 音響システム初期化
   * Canvas Focus時に一度だけ呼ばれる
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return
    }

    // クロスブラウザ対応: 同期的にresume + 非同期でstart
    if (Tone.context.state === 'suspended') {
      await Tone.context.resume()
    }
    await Tone.start()

    // マスター音量設定
    Tone.getDestination().volume.value = this.masterVolume

    // Analyserノードを作成してマスター出力に接続
    this.masterWaveformAnalyser = new Tone.Analyser('waveform', 2048)
    this.masterFFTAnalyser = new Tone.Analyser('fft', 2048)
    Tone.getDestination().connect(this.masterWaveformAnalyser)
    Tone.getDestination().connect(this.masterFFTAnalyser)

    this.initialized = true
  }

  /**
   * 初期化完了しているか
   */
  isReady(): boolean {
    return this.initialized
  }

  /**
   * 音楽を再生（MIDI or Audio）
   * @param source 音楽ソース設定
   */
  async play(source: MusicSource): Promise<void> {
    if (!this.isReady()) {
      console.warn('AudioService not ready, music will not play')
      return
    }

    // 既存の音楽を停止
    this.stopMusic()

    if (source.type === 'midi') {
      await this.midiPlayer.play(source)
      this.midiPlayer.setVolume(this.musicVolume)
      this.currentMusicType = 'midi'
    } else {
      await this.audioPlayer.play(source)
      this.audioPlayer.setVolume(this.musicVolume)
      this.currentMusicType = 'audio'
    }
  }

  /**
   * 音楽を停止
   */
  stopMusic(): void {
    this.midiPlayer.stop()
    this.audioPlayer.stop()
    this.currentMusicType = null
  }

  /**
   * 効果音をプリロード
   * @param sounds 効果音マップ { キー: ファイルパス or 設定オブジェクト }
   */
  async loadSounds(sounds: Record<string, string | SoundEffectConfig>): Promise<void> {
    if (!this.isReady()) {
      console.warn('AudioService not ready, cannot load sounds')
      return
    }

    const loadPromises = Object.entries(sounds).map(async ([key, config]) => {
      const path = typeof config === 'string' ? config : config.path
      const volume = typeof config === 'string' ? -6 : (config.volume ?? -6)

      const player = new Tone.Player({
        url: path,
        volume: volume + this.soundVolume, // SE音量を適用
      }).toDestination()

      await player.load(path)
      this.soundEffects.set(key, player)
    })

    await Promise.all(loadPromises)
  }

  /**
   * 効果音を再生
   * @param key 効果音キー
   */
  playSound(key: string): void {
    if (!this.isReady()) {
      return // 初期化前は無音で無視
    }

    const player = this.soundEffects.get(key)
    if (!player) {
      console.warn(`Sound effect not found: ${key}`)
      return
    }

    // 既に再生中の場合は停止してから再生
    if (player.state === 'started') {
      player.stop()
    }
    player.start()
  }

  /**
   * マスター音量を設定
   * @param db 音量（dB、-Infinityから0まで）
   */
  setMasterVolume(db: number): void {
    this.masterVolume = db
    if (this.isReady()) {
      Tone.getDestination().volume.value = db
    }
  }

  /**
   * BGM音量を設定
   * @param db 音量（dB、-Infinityから0まで）
   */
  setMusicVolume(db: number): void {
    this.musicVolume = db

    if (this.currentMusicType === 'midi') {
      this.midiPlayer.setVolume(db)
    } else if (this.currentMusicType === 'audio') {
      this.audioPlayer.setVolume(db)
    }
  }

  /**
   * BGM音量を取得
   */
  getMusicVolume(): number {
    return this.musicVolume
  }

  /**
   * SE音量を設定
   * @param db 音量（dB、-Infinityから0まで）
   */
  setSoundVolume(db: number): void {
    this.soundVolume = db

    // すべての効果音の音量を更新
    this.soundEffects.forEach((player) => {
      player.volume.value = db
    })
  }

  /**
   * SE音量を取得
   */
  getSoundVolume(): number {
    return this.soundVolume
  }

  // ============ MIDI 専用制御 ============

  /**
   * MIDIトラックの音量を変更
   * @param trackIndex トラック番号
   * @param db 音量（dB）
   */
  setMidiTrackVolume(trackIndex: number, db: number): void {
    if (this.currentMusicType === 'midi') {
      this.midiPlayer.setTrackVolume(trackIndex, db)
    }
  }

  /**
   * MIDIトラックのエンベロープを変更
   * @param trackIndex トラック番号
   * @param envelope ADSR設定
   */
  setMidiTrackEnvelope(
    trackIndex: number,
    envelope: { attack: number; decay: number; sustain: number; release: number }
  ): void {
    if (this.currentMusicType === 'midi') {
      this.midiPlayer.setTrackEnvelope(trackIndex, envelope)
    }
  }

  /**
   * MIDIトラックの波形を変更
   * @param trackIndex トラック番号
   * @param waveform 波形タイプ
   */
  setMidiTrackWaveform(
    trackIndex: number,
    waveform: 'sine' | 'square' | 'sawtooth' | 'triangle'
  ): void {
    if (this.currentMusicType === 'midi') {
      this.midiPlayer.setTrackWaveform(trackIndex, waveform)
    }
  }

  /**
   * MIDIトラックの音高を変更（デチューン）
   * @param trackIndex トラック番号
   * @param cents デチューン量（セント、100 = 1半音）
   */
  setMidiTrackDetune(trackIndex: number, cents: number): void {
    if (this.currentMusicType === 'midi') {
      this.midiPlayer.setTrackDetune(trackIndex, cents)
    }
  }

  /**
   * MIDIトラック数を取得
   */
  getMidiTrackCount(): number {
    return this.midiPlayer.getTrackCount()
  }

  /**
   * MIDI再生中かどうか
   */
  isMidiPlaying(): boolean {
    return this.currentMusicType === 'midi' && this.midiPlayer.isPlaying()
  }

  /**
   * 音楽が再生中かどうか
   */
  isMusicPlaying(): boolean {
    if (this.currentMusicType === 'midi') {
      return this.midiPlayer.isPlaying()
    } else if (this.currentMusicType === 'audio') {
      return this.audioPlayer.isPlaying()
    }
    return false
  }

  /**
   * 全体の波形データを取得（Waveform用）
   */
  getMasterWaveformData(): Float32Array | null {
    return this.masterWaveformAnalyser?.getValue() as Float32Array | null
  }

  /**
   * 全体の周波数データを取得（FFT用）
   */
  getMasterFFTData(): Float32Array | null {
    return this.masterFFTAnalyser?.getValue() as Float32Array | null
  }

  /**
   * トラックの波形データを取得
   */
  getTrackWaveformData(trackIndex: number): Float32Array | null {
    if (this.currentMusicType === 'midi') {
      return this.midiPlayer.getTrackWaveformData(trackIndex)
    }
    return null
  }

  /**
   * トラックの周波数データを取得
   */
  getTrackFFTData(trackIndex: number): Float32Array | null {
    if (this.currentMusicType === 'midi') {
      return this.midiPlayer.getTrackFFTData(trackIndex)
    }
    return null
  }

  /**
   * リソース解放
   */
  dispose(): void {
    this.midiPlayer.dispose()
    this.audioPlayer.dispose()
    this.soundEffects.forEach((player) => player.dispose())
    this.soundEffects.clear()
    this.masterWaveformAnalyser?.dispose()
    this.masterFFTAnalyser?.dispose()
    this.masterWaveformAnalyser = null
    this.masterFFTAnalyser = null
    this.initialized = false
  }
}
