/**
 * BGM設定
 * 各BGMファイルのループポイント等を定義
 */

import type { AudioSource } from '@/ptre/audio/types'

type BgmEntry = Omit<AudioSource, 'type' | 'path'>

/** 小節の長さを計算（秒） */
const getBarLength = (bpm: number) => (60 / bpm) * 4

/** BGM設定マップ */
export const BGM_CONFIG: Record<string, BgmEntry> = {
  bgm1: {
    loop: true,
    loopStart: getBarLength(156) * 0, // 1小節目の頭
    loopEnd: getBarLength(156) * 17, // 17小節で1小節目に戻る (~26.15秒)
  },
  bgm2: {
    loop: true,
    loopStart: getBarLength(128) * 4, // 4小節目 (~7.5秒)
    loopEnd: getBarLength(128) * 16, // 16小節目 (~30秒)
  },
}
