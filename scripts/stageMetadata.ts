/**
 * ステージメタデータ
 * stages配列以外の設定を定義
 * このファイルは scripts/generate-stages.ts で読み込まれ、
 * stages/*.json と統合されて src/game/stages.ts が生成される
 */

import { DekaNasake } from '@/engine/entity/DekaNasake'

/**
 * ステージのメタ情報
 * stages配列はstages/*.jsonから読み込まれる
 *
 * 注意: このファイルは通常のTypeScriptとしてではなく、
 * generate-stages.ts によって正規表現で抽出されるため、
 * import文とSTAGE_METADATA配列の定義形式を変更しないこと
 */
export const STAGE_METADATA = [
  // Stage 0
  {
    bg: [' ', 'y', 'y', 'y', 'y', 'y', 'y', 'y', 'y', 'y', 'y', 'y', 'y', 'y', 'y'],
    fg: [''],
  },
  // Stage 1
  {
    name: 'チューリップ農園',
    engName: 'Tulip Plantation',
    bgm: 'bgm1',
    bg: ['y'],
    fg: [''],
  },
  // Stage 2
  {
    bg: ['y'],
    fg: [''],
  },
  // Stage 3
  {
    bg: ['y'],
    fg: [''],
  },
  // Stage 4
  {
    bg: ['y'],
    fg: [''],
  },
  // Stage 5
  {
    bg: ['y'],
    fg: [''],
  },
  // Stage 6 (Boss)
  {
    bg: ['y'],
    fg: [''],
    param: {
      boss: DekaNasake,
    },
  },
  // Stage 7
  {
    bg: ['y'],
    fg: [''],
  },
  // Stage 8
  {
    bg: ['y'],
    fg: [''],
  },
  // Stage 9
  {
    bg: ['y'],
    fg: [''],
  },
  // Stage 10
  {
    bg: ['y'],
    fg: [''],
  },
  // Stage 11 (Boss)
  {
    bg: ['y'],
    fg: [''],
    param: {
      boss: DekaNasake,
    },
  },
  // Stage 12
  {
    bg: [' '],
    fg: [''],
  },
]
