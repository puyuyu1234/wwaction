import { Container } from 'pixi.js'

/**
 * カメラクラス
 * ターゲット追従とステージ境界制限を管理
 */
export class Camera {
  private container: Container
  private viewportWidth: number
  private viewportHeight: number
  private _x = 0 // カメラのX座標（視差スクロール用に公開）
  private _y = 0 // カメラのY座標（視差スクロール用に公開）

  constructor(container: Container, viewportWidth: number, viewportHeight: number) {
    this.container = container
    this.viewportWidth = viewportWidth
    this.viewportHeight = viewportHeight
  }

  /**
   * カメラのX座標を取得（視差スクロール背景用）
   */
  get x(): number {
    return this._x
  }

  /**
   * カメラのY座標を取得（視差スクロール背景用）
   */
  get y(): number {
    return this._y
  }

  /**
   * ターゲットを画面中央に配置し、ステージ境界でカメラを停止
   * @param targetX ターゲットのX座標
   * @param targetY ターゲットのY座標
   * @param targetWidth ターゲットの幅
   * @param targetHeight ターゲットの高さ
   * @param stageWidth ステージ全体の幅
   * @param stageHeight ステージ全体の高さ
   */
  follow(
    targetX: number,
    targetY: number,
    targetWidth: number,
    targetHeight: number,
    stageWidth: number,
    stageHeight: number
  ) {
    // ターゲットの中心座標を基準にカメラ位置を計算
    const targetCenterX = targetX + targetWidth / 2
    const targetCenterY = targetY + targetHeight / 2

    // カメラ位置（ターゲットを画面中央に配置）
    let cameraX = targetCenterX - this.viewportWidth / 2
    let cameraY = targetCenterY - this.viewportHeight / 2

    // ステージ境界でカメラを制限
    cameraX = Math.max(0, Math.min(cameraX, stageWidth - this.viewportWidth))
    cameraY = Math.max(0, Math.min(cameraY, stageHeight - this.viewportHeight))

    // カメラ座標を整数に丸める（サブピクセルレンダリング防止）
    cameraX = Math.floor(cameraX)
    cameraY = Math.floor(cameraY)

    // カメラ座標を保存（視差スクロール背景用）
    this._x = cameraX
    this._y = cameraY

    // PixiJSではカメラ移動は Container.position をマイナス値で設定
    this.container.x = -cameraX
    this.container.y = -cameraY
  }
}
