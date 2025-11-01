import { Assets, Spritesheet, Texture, SCALE_MODES } from 'pixi.js'

/**
 * アニメーション速度情報（参考用）
 * スプライトシートJSONとは別に、.info.json から読み込む
 */
export interface AnimationSpeedInfo {
  freq: number
  animationSpeed: number
  fps: number
}

/**
 * アセット読み込み管理クラス（シングルトン）
 * - PixiJS Assets システムで標準のスプライトシートJSONを読み込み
 * - legacy の ImageLoader から完全にPixiJS標準へ移行
 */
export class AssetLoader {
  private static instance: AssetLoader
  private spritesheets = new Map<string, Spritesheet>()
  private animationSpeeds = new Map<string, Map<string, AnimationSpeedInfo>>()

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
      basePath: 'assets/',
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
        texture.source.scaleMode = SCALE_MODES.NEAREST
      }
    })

    // アニメーション速度情報も読み込み（.info.json）
    try {
      const infoPath = jsonPath.replace('.json', '.info.json')
      const infoResponse = await fetch(`assets/${infoPath}`)
      const infoData = await infoResponse.json()

      const speedMap = new Map<string, AnimationSpeedInfo>()
      Object.entries(infoData.animations as Record<string, AnimationSpeedInfo>).forEach(([name, info]) => {
        speedMap.set(name, {
          freq: info.freq,
          animationSpeed: info.animationSpeed,
          fps: info.fps,
        })
      })
      this.animationSpeeds.set(key, speedMap)
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
   */
  getAnimationSpeed(sheetKey: string, animationName: string): number {
    const speedMap = this.animationSpeeds.get(sheetKey)
    if (!speedMap) return 0.1666 // デフォルト: 約10fps

    const info = speedMap.get(animationName)
    return info?.animationSpeed ?? 0.1666
  }

  /**
   * アニメーションがループするかを取得
   * legacy の AnimationDefinition.loop に相当
   * 注: PixiJS標準JSONにはloop情報がないため、
   * 命名規則から判断
   */
  getAnimationLoop(_sheetKey: string, animationName: string): boolean {
    // 暫定: 'stand', 'walk', 'damage' などはループ、'wind', 'sit' などは非ループ
    // TODO: JSON に loop 情報を追加するか、.info.json から読み込む
    const loopAnimations = ['stand', 'walk', 'jumpUp', 'jumpDown', 'damage', 'nasake', 'gurasan', 'nuefu', 'wind', 'purupuru']
    return loopAnimations.includes(animationName)
  }
}
