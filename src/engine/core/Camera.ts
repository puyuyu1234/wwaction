import { Container } from 'pixi.js'

/**
 * カメラクラス
 * ターゲット追従とステージ境界制限を管理
 */
export class Camera {
  private container: Container
  private viewportWidth: number
  private viewportHeight: number

  constructor(container: Container, viewportWidth: number, viewportHeight: number) {
    this.container = container
    this.viewportWidth = viewportWidth
    this.viewportHeight = viewportHeight
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

    // PixiJSではカメラ移動は Container.position をマイナス値で設定
    this.container.x = -Math.floor(cameraX)
    this.container.y = -Math.floor(cameraY)
  }
}
