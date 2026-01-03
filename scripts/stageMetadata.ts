/**
 * ステージメタデータ
 * stages配列以外の設定を定義
 * このファイルは scripts/generate-stages.ts で読み込まれ、
 * stages/*.json と統合されて src/game/stages.ts が生成される
 */

// import { DekaNasake } from '@/engine/entity/DekaNasake'

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
    theme: 'plain',
    bg: [
      " ",
      " ",
      " ",
      " ",
      "H",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y"
    ],
    fg: [''],
  },
  // Stage 1
  {
    name: 'チューリップ農園',
    engName: 'Tulip Plantation',
    bgm: 'bgm1',
    theme: 'plain',
    bg: [
      " ",
      " ",
      " ",
      " ",
      "H",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y"
    ],
    fg: [''],
  },
  // Stage 2
  {
    theme: 'plain',
    bg: [
      " ",
      " ",
      " ",
      " ",
      "H",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y"
    ],
    fg: [''],
  },
  // Stage 3
  {
    theme: 'plain',
    bg: [
      " ",
      " ",
      " ",
      " ",
      "H",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y"
    ],
    fg: [''],
  },
  // Stage 4
  {
    theme: 'plain',
    bg: [
      " ",
      " ",
      " ",
      " ",
      "H",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y"
    ],
    fg: [''],
  },
  // Stage 5
  {
    theme: 'plain',
    bg: [
      " ",
      " ",
      " ",
      " ",
      "H",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y"
    ],
    fg: [''],
  },
  // Stage 6 (Boss)
  {
    theme: 'plain',
    bg: [
      " ",
      " ",
      " ",
      " ",
      "H",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y"
    ],
    fg: [''],
    // param: {
    //   boss: DekaNasake,
    // },
  },
  // Stage 7
  {
    theme: 'plain',
    bg: [
      " ",
      " ",
      " ",
      " ",
      "H",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y"
    ],
    fg: [''],
  },
  // Stage 8
  {
    theme: 'plain',
    bg: [
      " ",
      " ",
      " ",
      " ",
      "H",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y"
    ],
    fg: [''],
  },
  // Stage 9
  {
    theme: 'plain',
    bg: [
      " ",
      " ",
      " ",
      " ",
      "H",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y"
    ],
    fg: [''],
  },
  // Stage 10
  {
    theme: 'plain',
    bg: [
      " ",
      " ",
      " ",
      " ",
      "H",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y"
    ],
    fg: [''],
  },
  // Stage 11 (Boss)
  {
    theme: 'plain',
    bg: [
      " ",
      " ",
      " ",
      " ",
      "H",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y",
      "y"
    ],
    fg: [''],
    // param: {
    //   boss: DekaNasake,
    // },
  },
  // Stage 12 (森ステージ開始)
  {
    name: 'ぷゆゆの不思議な森',
    engName: 'Puyuyu Forest',
    theme: 'forest',
    bgm: 'bgm2',
    bg: [''],
    fg: ['    NO  NO               NO      NO            '],
  },
  // Stage 13
  {
    theme: 'forest',
    bg: [''],
    fg: ['    NO  NO               NO      NO            '],
  },
]
