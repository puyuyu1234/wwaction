/**
 * Audio Service
 * Application層のFacade - 音響システムの統一インターフェース
 * - Tone.jsの初期化管理
 * - BGM/効果音の再生制御
 * - 音量管理
 */

import * as Tone from 'tone'

import { AudioPlayer } from './infra/AudioPlayer'
import type { MusicSource, SoundEffectConfig } from './types'

/**
 * 音響システム統括クラス（Singleton）
 */
export class AudioService {
  private static instance: AudioService

  private audioPlayer: AudioPlayer
  private soundEffects: Map<string, Tone.Player> = new Map()
  private initialized = false

  private masterVolume = -6 // dB
  private musicVolume = -6 // dB
  private soundVolume = -6 // dB

  // 音響可視化用Analyser（全体のミックス音声）
  private masterWaveformAnalyser: Tone.Analyser | null = null
  private masterFFTAnalyser: Tone.Analyser | null = null

  private constructor() {
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
   * 音楽を再生
   * @param source 音楽ソース設定
   */
  async play(source: MusicSource): Promise<void> {
    if (!this.isReady()) {
      console.warn('AudioService not ready, music will not play')
      return
    }

    // 既存の音楽を停止
    this.stopMusic()

    await this.audioPlayer.play(source)
    this.audioPlayer.setVolume(this.musicVolume)
  }

  /**
   * 音楽を停止
   */
  stopMusic(): void {
    this.audioPlayer.stop()
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
    this.audioPlayer.setVolume(db)
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

  /**
   * 音楽が再生中かどうか
   */
  isMusicPlaying(): boolean {
    return this.audioPlayer.isPlaying()
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
   * リソース解放
   */
  dispose(): void {
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
