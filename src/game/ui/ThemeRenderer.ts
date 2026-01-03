import { Z_INDEX } from '@game/config'
import { Container, Graphics } from 'pixi.js'

import { CloudBackground } from './CloudBackground'
import { FogEffect } from './FogEffect'
import { LeafEffect } from './LeafEffect'
import { ParallaxBackground } from './ParallaxBackground'

export interface ThemeRendererConfig {
  theme: 'plain' | 'forest'
  viewportWidth: number
  viewportHeight: number
  stageWidth: number
  stageHeight: number
  tileCount: number
  bgPattern?: string[]
  fgPattern?: string[]
}

/**
 * テーマに応じた背景・前景を描画
 * - 森テーマ: グラデーション背景、葉っぱエフェクト、霧エフェクト
 * - 草原テーマ: 雲背景
 * - 共通: 視差背景、視差前景
 *
 * コンテナ構成:
 * - backgroundContainer: 固定背景（カメラに追従しない）
 * - scrollContainer: スクロール背景（タイルマップより後ろ）
 * - foregroundContainer: スクロール前景（エンティティより手前）
 */
export class ThemeRenderer {
  readonly backgroundContainer: Container
  readonly scrollContainer: Container
  readonly foregroundContainer: Container

  private cloudBackground?: CloudBackground
  private parallaxBackground?: ParallaxBackground
  private parallaxForeground?: ParallaxBackground
  private leafEffect?: LeafEffect
  private fogEffect?: FogEffect

  constructor(config: ThemeRendererConfig) {
    const {
      theme,
      viewportWidth,
      viewportHeight,
      stageWidth,
      stageHeight,
      tileCount,
      bgPattern,
      fgPattern,
    } = config

    const isForest = theme === 'forest'

    // 固定背景用コンテナ（カメラに追従しない）
    this.backgroundContainer = new Container()
    this.backgroundContainer.sortableChildren = true

    // スクロール背景用コンテナ（タイルマップより後ろ）
    this.scrollContainer = new Container()
    this.scrollContainer.sortableChildren = true

    // スクロール前景用コンテナ（エンティティより手前）
    this.foregroundContainer = new Container()
    this.foregroundContainer.sortableChildren = true

    // === 固定背景 ===

    if (isForest) {
      // 森テーマ: グラデーション背景
      const forestBg = this.createForestGradient(viewportWidth, viewportHeight)
      forestBg.zIndex = Z_INDEX.BACKGROUND
      this.backgroundContainer.addChild(forestBg)
    }

    // 雲の背景演出（草原テーマのみ）
    if (!isForest) {
      this.cloudBackground = new CloudBackground(viewportWidth, viewportHeight, 90)
      this.cloudBackground.container.zIndex = Z_INDEX.BACKGROUND + 5
      this.backgroundContainer.addChild(this.cloudBackground.container)
    }

    // === スクロール背景 ===

    // 視差背景
    if (bgPattern && bgPattern.length > 0) {
      this.parallaxBackground = new ParallaxBackground(
        bgPattern,
        stageWidth,
        stageHeight,
        0.5,
        1.0
      )
      this.parallaxBackground.container.zIndex = Z_INDEX.BACKGROUND
      this.scrollContainer.addChild(this.parallaxBackground.container)
    }

    // 葉っぱエフェクト（森テーマのみ）
    if (isForest) {
      this.leafEffect = new LeafEffect(stageWidth, stageHeight, tileCount, 1.0, 1.0, 1.0)
      this.leafEffect.container.zIndex = Z_INDEX.BACKGROUND + 1
      this.scrollContainer.addChild(this.leafEffect.container)
    }

    // === 前景（foregroundContainer に追加） ===

    // 視差前景
    if (fgPattern && fgPattern.length > 0) {
      this.parallaxForeground = new ParallaxBackground(
        fgPattern,
        stageWidth,
        stageHeight,
        -0.5,
        1.0
      )
      this.parallaxForeground.container.zIndex = Z_INDEX.FOREGROUND
      this.foregroundContainer.addChild(this.parallaxForeground.container)
    }

    // 霧エフェクト（森テーマのみ）
    if (isForest) {
      this.fogEffect = new FogEffect(stageWidth, stageHeight, tileCount)
      this.fogEffect.container.zIndex = Z_INDEX.FOG
      this.foregroundContainer.addChild(this.fogEffect.container)
    }
  }

  /**
   * 森テーマ用グラデーション背景を生成
   */
  private createForestGradient(width: number, height: number): Graphics {
    const forestBg = new Graphics()
    const steps = 32
    const stepHeight = Math.ceil(height / steps)

    for (let i = 0; i < steps; i++) {
      // 上（明るい緑 #3a654a）から下（暗い緑 #0a2310）へ
      const t = i / (steps - 1)
      const r = Math.floor(0x3a + (0x0a - 0x3a) * t)
      const g = Math.floor(0x65 + (0x23 - 0x65) * t)
      const b = Math.floor(0x4a + (0x10 - 0x4a) * t)
      const color = (r << 16) | (g << 8) | b

      forestBg.rect(0, i * stepHeight, width, stepHeight + 1)
      forestBg.fill(color)
    }

    return forestBg
  }

  /**
   * 毎フレーム更新
   */
  tick(): void {
    this.cloudBackground?.tick()
    this.leafEffect?.tick()
    this.fogEffect?.tick()
  }

  /**
   * スクロール更新（視差効果）
   */
  updateScroll(cameraX: number, cameraY: number): void {
    this.parallaxBackground?.updateScroll(cameraX, cameraY)
    this.parallaxForeground?.updateScroll(cameraX, cameraY)
    this.leafEffect?.updateScroll(cameraX, cameraY)
  }

  /**
   * リソース解放
   */
  destroy(): void {
    this.cloudBackground?.destroy()
    this.parallaxBackground?.destroy()
    this.parallaxForeground?.destroy()
    this.leafEffect?.destroy()
    this.fogEffect?.destroy()
    this.backgroundContainer.destroy({ children: true })
    this.scrollContainer.destroy({ children: true })
    this.foregroundContainer.destroy({ children: true })
  }
}
