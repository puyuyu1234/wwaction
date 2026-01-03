import { AssetLoader } from './AssetLoader'
import { Game } from './Game'

/**
 * ゲーム初期化ヘルパー
 * Game と AssetLoader の標準的な初期化手順を提供
 */
export class GameFactory {
  /**
   * 標準的なゲームの初期化を実行
   * Game と AssetLoader を初期化して返す
   *
   * @param canvasId - Canvas 要素の ID
   * @param baseWidth - ゲーム画面の基本幅
   * @param baseHeight - ゲーム画面の基本高さ
   * @returns 初期化済みの Game と AssetLoader
   */
  static async createGame(
    canvasId: string,
    baseWidth: number,
    baseHeight: number
  ): Promise<{ game: Game; assetLoader: AssetLoader }> {
    // 1. ゲームインスタンス作成と初期化
    const game = await Game.create(canvasId, baseWidth, baseHeight)

    // 2. AssetLoader 初期化（シングルトン取得）
    const assetLoader = AssetLoader.getInstance()
    assetLoader.setRenderer(game.getApp().renderer)
    await assetLoader.init()

    return { game, assetLoader }
  }
}
