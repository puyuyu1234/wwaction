import Phaser from 'phaser'
import { StageScene } from './scenes/StageScene'
import { GAME_CONFIG, PHYSICS_CONFIG } from './config'

export function initGame(parent: HTMLElement): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT,
    parent,
    backgroundColor: GAME_CONFIG.BACKGROUND_COLOR,
    scale: {
      mode: Phaser.Scale.FIT, // アスペクト比を維持しながらフィット
      autoCenter: Phaser.Scale.CENTER_BOTH, // 中央配置
      width: GAME_CONFIG.WIDTH,
      height: GAME_CONFIG.HEIGHT
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: PHYSICS_CONFIG.DEBUG
      }
    },
    render: {
      pixelArt: true, // ピクセルアート用設定
      antialias: false, // アンチエイリアス無効
      roundPixels: true // ピクセル境界に丸める
    },
    scene: [StageScene]
  }

  return new Phaser.Game(config)
}
