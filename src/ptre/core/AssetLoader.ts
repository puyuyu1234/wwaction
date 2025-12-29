import { Assets, Spritesheet, Texture } from 'pixi.js'
import type { Renderer } from 'pixi.js'

/**
 * アニメーション速度情報（参考用）
 * スプライトシートJSONとは別に、.info.json から読み込む
 */
interface AnimationInfo {
  fps: number
  loop?: boolean
}

/**
 * アセット読み込み管理クラス（シングルトン）
 * - PixiJS Assets システムで標準のスプライトシートJSONを読み込み
 * - legacy の ImageLoader から完全にPixiJS標準へ移行
 * - 単一画像の読み込みもサポート
 */
export class AssetLoader {
  private static instance: AssetLoader
  private spritesheets = new Map<string, Spritesheet>()
  private animationInfos = new Map<string, Map<string, AnimationInfo>>()
  private textures = new Map<string, Texture>()
  private renderer?: Renderer

  private constructor() {}

  static getInstance(): AssetLoader {
    if (!this.instance) {
      this.instance = new AssetLoader()
    }
    return this.instance
  }

  /**
   * PixiJS Assets を初期化
   */
  async init() {
    await Assets.init({
      basePath: `${import.meta.env.BASE_URL}assets/`,
    })
  }

  /**
   * PixiJS標準のスプライトシートJSONを読み込む
   * @param key スプライトシートのキー (例: "player")
   * @param jsonPath JSONファイルパス (例: "spritesheets/player.json")
   */
  async loadSpritesheet(key: string, jsonPath: string) {
    // PixiJS標準のSpritesheetを読み込み
    // data.cachePrefix でフレーム名にプレフィックスを付けてキャッシュ衝突を回避
    const spritesheet = await Assets.load<Spritesheet>({
      src: jsonPath,
      alias: key,
      data: {
        cachePrefix: `${key}_`, // 'player_frame_0', 'entity_frame_0' のように区別
      },
    })
    this.spritesheets.set(key, spritesheet)

    // ピクセルアート用にテクスチャのスケールモードをNEARESTに設定（スプライトブリーディング対策）
    Object.values(spritesheet.textures).forEach((texture) => {
      if (texture.source) {
        texture.source.scaleMode = 'nearest'
      }
    })

    // アニメーション速度情報も読み込み（.info.json）
    try {
      const infoPath = jsonPath.replace('.json', '.info.json')
      const infoResponse = await fetch(`${import.meta.env.BASE_URL}assets/${infoPath}`)
      const infoData = await infoResponse.json()

      const infoMap = new Map<string, AnimationInfo>()
      Object.entries(infoData.animations as Record<string, AnimationInfo>).forEach(([name, info]) => {
        infoMap.set(name, {
          fps: info.fps,
          loop: info.loop,
        })
      })
      this.animationInfos.set(key, infoMap)
    } catch (error) {
      console.warn(`Could not load animation speed info for ${key}:`, error)
    }
  }

  /**
   * スプライトシートを取得
   */
  getSpritesheet(key: string): Spritesheet | undefined {
    return this.spritesheets.get(key)
  }

  /**
   * 特定のアニメーションのテクスチャ配列を取得
   * AnimatedSprite に渡すために使用
   */
  getAnimationTextures(sheetKey: string, animationName: string): Texture[] | undefined {
    const sheet = this.spritesheets.get(sheetKey)
    if (!sheet) return undefined
    return sheet.animations[animationName]
  }

  /**
   * アニメーション速度情報を取得
   * AnimatedSprite の animationSpeed に設定するために使用
   * fps から計算: animationSpeed = fps / 60
   */
  getAnimationSpeed(sheetKey: string, animationName: string): number {
    const infoMap = this.animationInfos.get(sheetKey)
    if (!infoMap) return 10 / 60 // デフォルト: 10fps

    const info = infoMap.get(animationName)
    const fps = info?.fps ?? 10
    return fps / 60
  }

  /**
   * アニメーションがループするかを取得
   * .info.json の loop プロパティから読み込み（デフォルト: true）
   */
  getAnimationLoop(sheetKey: string, animationName: string): boolean {
    const infoMap = this.animationInfos.get(sheetKey)
    if (!infoMap) return true // デフォルト: ループする

    const info = infoMap.get(animationName)
    return info?.loop ?? true // デフォルト: ループする
  }

  /**
   * PixiJS Rendererを設定（Game初期化時に一度だけ呼ばれる）
   */
  setRenderer(renderer: Renderer) {
    this.renderer = renderer
  }

  /**
   * PixiJS Rendererを取得
   */
  getRenderer(): Renderer | undefined {
    return this.renderer
  }

  /**
   * 単一の画像を読み込む
   * @param key テクスチャのキー (例: "fighter")
   * @param imagePath 画像ファイルパス (例: "images/fighter.gif")
   */
  async loadImage(key: string, imagePath: string) {
    const texture = await Assets.load<Texture>({
      src: imagePath,
      alias: key,
    })

    // ピクセルアート用にスケールモードをNEARESTに設定
    if (texture.source) {
      texture.source.scaleMode = 'nearest'
    }

    this.textures.set(key, texture)
  }

  /**
   * 読み込んだ画像テクスチャを取得
   * @param key テクスチャのキー
   */
  getTexture(key: string): Texture | undefined {
    return this.textures.get(key)
  }
}
