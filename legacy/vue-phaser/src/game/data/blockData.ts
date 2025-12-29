import type { BlockData } from "../types";

// ブロックデータの定義
// 元のtype値: 0=none, 1=platform, 15=solid, 100=damage(none), 200=water_top(none)
export const BLOCK_DATA: Record<string, BlockData> = {
  " ": { frame: [0], collision: "none" }, // type: 0
  a: { frame: [1], collision: "platform" }, // type: 1
  b: { frame: [2], collision: "platform" }, // type: 1
  c: { frame: [3], collision: "platform" }, // type: 1
  d: { frame: [4], collision: "none" }, // type: 0
  e: { frame: [5], collision: "none" }, // type: 0
  f: { frame: [6], collision: "none" }, // type: 0
  g: { frame: [7], collision: "solid" }, // type: 15
  h: { frame: [8], collision: "solid" }, // type: 15
  i: { frame: [9], collision: "solid" }, // type: 15
  j: { frame: [10], collision: "none" }, // type: 0
  k: { frame: [11], collision: "none" }, // type: 0
  l: { frame: [12], collision: "none" }, // type: 0
  m: { frame: [13], collision: "none" }, // type: 0
  n: { frame: [14], collision: "none" }, // type: 0
  o: { frame: [15], collision: "none" }, // type: 0
  p: { frame: [16], collision: "none" }, // type: 0
  q: { frame: [17], collision: "solid" }, // type: 15
  r: { frame: [18], collision: "solid" }, // type: 15
  s: { frame: [19], collision: "solid" }, // type: 15
  t: { frame: [20], collision: "platform" }, // type: 1
  u: { frame: [21], collision: "platform" }, // type: 1
  v: { frame: [22], collision: "solid" }, // type: 15
  w: { frame: [23], collision: "solid" }, // type: 15
  x: {
    frame: [24],
    collision: "none", // type: 100 (ダメージタイル)
    param: {
      hitbox: { x: 1, y: 12, width: 14, height: 4 },
      damage: 1,
    },
  },
  y: { frame: [25], collision: "none" }, // type: 0
  z: {
    frame: [26],
    collision: "none", // type: 100 (ダメージタイル)
    param: {
      hitbox: { x: 1, y: 0, width: 14, height: 4 },
      damage: 1,
    },
  },
  A: { frame: [27], collision: "solid" }, // type: 15
  B: { frame: [28], collision: "solid" }, // type: 15
  C: { frame: [29], collision: "solid" }, // type: 15
  D: { frame: [30], collision: "platform" }, // type: 1
  E: { frame: [31], collision: "platform" }, // type: 1
  F: {
    frame: [32],
    collision: "none", // type: 100 (ダメージタイル)
    param: {
      hitbox: { x: 12, y: 1, width: 4, height: 14 },
      damage: 1,
    },
  },
  G: {
    frame: [33],
    collision: "none", // type: 100 (ダメージタイル)
    param: {
      hitbox: { x: 0, y: 1, width: 4, height: 14 },
      damage: 1,
    },
  },
  H: {
    frame: [34, 53, 54, 55],
    collision: "none", // type: 200 (水面・未実装)
    param: {
      freq: 12,
      loop: true,
      layer: "top",
      alpha: 0.8,
    },
  },
  I: {
    frame: [35],
    collision: "none", // type: 200 (水面・未実装)
    param: {
      layer: "top",
      alpha: 0.8,
    },
  },
  J: { frame: [36], collision: "solid" }, // type: 15
  K: { frame: [37], collision: "solid" }, // type: 15
  L: { frame: [38], collision: "solid" }, // type: 15
  M: { frame: [39], collision: "solid" }, // type: 15
  N: { frame: [40], collision: "none" }, // type: 0
  O: { frame: [41], collision: "none" }, // type: 0
  P: { frame: [42], collision: "none" }, // type: 0
  Q: { frame: [43], collision: "none" }, // type: 0
  R: { frame: [44], collision: "none" }, // type: 0
  S: { frame: [45], collision: "none" }, // type: 0
  T: { frame: [46], collision: "none" }, // type: 0
  U: { frame: [47], collision: "none" }, // type: 0
  V: { frame: [48], collision: "none" }, // type: 0
  W: { frame: [49], collision: "none" }, // type: 0
  X: { frame: [50], collision: "none" }, // type: 0
  Y: { frame: [51], collision: "none" }, // type: 0
  Z: { frame: [52], collision: "none" }, // type: 0

  // 特殊エンティティマーカー（実際のブロックではない）
  "0": { frame: [], collision: "none" }, // プレイヤー開始位置
  "1": { frame: [], collision: "none" }, // エンティティ1
  "2": { frame: [], collision: "none" }, // エンティティ2
  "3": { frame: [], collision: "none" }, // エンティティ3
  "4": { frame: [], collision: "none" }, // エンティティ4
  "5": { frame: [], collision: "none" }, // エンティティ5
  "*": { frame: [], collision: "none" }, // ボス
};

// ブロックが壁かどうか判定
export function isBlock(char: string): boolean {
  const blockData = BLOCK_DATA[char];
  if (!blockData) return false;

  // 特殊マーカーは壁ではない
  if (["0", "1", "2", "3", "4", "5", "*"].includes(char)) return false;

  return blockData.collision !== "none";
}
