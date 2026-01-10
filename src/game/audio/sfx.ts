/**
 * 効果音システム（型安全なラッパー）
 */
import { AudioService } from '@ptre/audio/AudioService'

/**
 * 効果音設定
 * 効果音を追加する場合はここに追記するだけでOK
 */
const SFX_CONFIG = {
  JUMP: { key: 'jump', path: 'assets/sound/sfx/jump.mp3' },
  DAMAGE: { key: 'damage', path: 'assets/sound/sfx/damage.mp3' },
  HEAL: { key: 'heal', path: 'assets/sound/sfx/heal.mp3' },
  WIND: { key: 'wind', path: 'assets/sound/sfx/wind.mp3' },
  SEMI: { key: 'semi', path: 'assets/sound/sfx/semi.ogg' },
  COIN: { key: 'coin', path: 'assets/sound/sfx/coin.ogg' },
  DEFEAT: { key: 'defeat', path: 'assets/sound/sfx/defeat.ogg' },
} as const

/**
 * 効果音キー定数
 */
export const SFX = Object.fromEntries(
  Object.entries(SFX_CONFIG).map(([k, v]) => [k, v.key])
) as { [K in keyof typeof SFX_CONFIG]: (typeof SFX_CONFIG)[K]['key'] }

/**
 * 効果音キーの型
 */
export type SfxKey = (typeof SFX)[keyof typeof SFX]

/**
 * 全効果音をロード
 * @param basePath ベースパス（import.meta.env.BASE_URL）
 */
export async function loadAllSfx(basePath: string): Promise<void> {
  const paths = Object.fromEntries(
    Object.values(SFX_CONFIG).map(({ key, path }) => [key, basePath + path])
  )
  await AudioService.getInstance().loadSounds(paths)
}

/**
 * 効果音を再生（型安全）
 * @param key 効果音キー
 */
export function playSfx(key: SfxKey): void {
  AudioService.getInstance().playSound(key)
}
