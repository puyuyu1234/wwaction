import { HPDATA } from './config'

/**
 * ゲームセッション状態
 * ステージ間で引き継がれるプレイヤーの状態を管理
 */
export class GameSession {
  /** 現在のHP */
  hp: number

  /** 最大HP */
  maxHp: number

  /** 現在のステージインデックス */
  stageIndex: number

  /**
   * @param difficulty 難易度（0: EASY, 1: NORMAL, 2: HARD, 3: LUNATIC）
   * @param stageIndex 開始ステージ
   */
  constructor(difficulty = 1, stageIndex = 0) {
    this.maxHp = HPDATA[difficulty]
    this.hp = this.maxHp
    this.stageIndex = stageIndex
  }

  /**
   * 次のステージへ進む
   * @param currentHp 現在のHP（引き継ぎ用）
   */
  advanceStage(currentHp: number) {
    this.hp = currentHp
    this.stageIndex++
  }

  /**
   * リトライ（同じステージをやり直す）
   * HPはmaxHpにリセット
   */
  retry() {
    this.hp = this.maxHp
  }
}
