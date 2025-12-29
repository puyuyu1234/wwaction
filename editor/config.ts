/**
 * エディタ用設定
 */
export const EDITOR_CONFIG = {
  /** ステージ範囲外に表示する編集可能マージン（タイル数） */
  MARGIN: 5,
  /** ステージ境界線の色 */
  STAGE_BORDER_COLOR: 0xffff00, // 黄色
  /** ステージ境界線の太さ */
  STAGE_BORDER_WIDTH: 3,
  /** マージン領域のグリッド線の色 */
  MARGIN_GRID_COLOR: 0x222222,
  /** ステージ内のグリッド線の色 */
  STAGE_GRID_COLOR: 0x333333,
  /** デフォルトステージ幅（タイル数） */
  DEFAULT_WIDTH: 20,
  /** デフォルトステージ高さ（タイル数） */
  DEFAULT_HEIGHT: 15,
  /** 最大ステージ幅（タイル数） */
  MAX_WIDTH: 200,
  /** 最大ステージ高さ（タイル数） */
  MAX_HEIGHT: 200,
} as const
