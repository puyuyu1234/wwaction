import { Difficulty } from '@game/config'
import type { GameSettingsData } from '@game/types'

/**
 * デフォルト設定
 */
const DEFAULT_SETTINGS: GameSettingsData = {
  difficulty: Difficulty.LUNATIC,
  bgmVolume: -12,
  sfxVolume: -6,
}

/**
 * localStorage保存キー
 */
const STORAGE_KEY = 'wwaction_settings'

/**
 * ゲーム設定管理（Singleton）
 * - localStorage永続化
 * - 難易度/音量設定
 */
export class GameSettings {
  private static instance: GameSettings
  private data: GameSettingsData

  private constructor() {
    this.data = this.load()
  }

  /**
   * Singletonインスタンス取得
   */
  static getInstance(): GameSettings {
    if (!GameSettings.instance) {
      GameSettings.instance = new GameSettings()
    }
    return GameSettings.instance
  }

  // --- 難易度 ---

  /**
   * 難易度を取得
   */
  getDifficulty(): number {
    return this.data.difficulty
  }

  /**
   * 難易度を設定
   * @param difficulty 難易度 (0-3)
   */
  setDifficulty(difficulty: number): void {
    this.data.difficulty = Math.max(0, Math.min(3, difficulty))
    this.save()
  }

  // --- BGM音量 ---

  /**
   * BGM音量を取得（dB単位）
   */
  getBgmVolume(): number {
    return this.data.bgmVolume
  }

  /**
   * BGM音量を設定（dB単位）
   * @param db 音量 (-60 ~ 0)
   */
  setBgmVolume(db: number): void {
    this.data.bgmVolume = Math.max(-60, Math.min(0, db))
    this.save()
  }

  // --- SE音量 ---

  /**
   * SE音量を取得（dB単位）
   */
  getSfxVolume(): number {
    return this.data.sfxVolume
  }

  /**
   * SE音量を設定（dB単位）
   * @param db 音量 (-60 ~ 0)
   */
  setSfxVolume(db: number): void {
    this.data.sfxVolume = Math.max(-60, Math.min(0, db))
    this.save()
  }

  // --- 永続化 ---

  /**
   * localStorageから設定を読み込み
   */
  private load(): GameSettingsData {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      }
    } catch (error) {
      console.warn('Failed to load settings:', error)
    }
    return { ...DEFAULT_SETTINGS }
  }

  /**
   * localStorageに設定を保存
   */
  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data))
    } catch (error) {
      console.warn('Failed to save settings:', error)
    }
  }

  /**
   * 設定をリセット
   */
  reset(): void {
    this.data = { ...DEFAULT_SETTINGS }
    this.save()
  }
}
