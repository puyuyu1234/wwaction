import { Graphics, Container } from "pixi.js";
import { Scene } from "./Scene";
import { Player } from "@/entity/Player";
import { Input } from "@/core/Input";
import { STAGEDATA, BLOCKSIZE } from "@/game/config";

/**
 * ステージシーン
 * プレイヤーとステージを管理（PixiJS版）
 */
export class StageScene extends Scene {
  private stage: string[][];
  private player: Player;
  private stageGraphics: Graphics;
  private playerGraphics: Graphics;
  private camera: Container;

  constructor(stageIndex: number, input: Input) {
    super();

    // ステージデータ取得
    const stageData = STAGEDATA[stageIndex];
    if (!stageData || !stageData.stages || !stageData.stages[0]) {
      throw new Error(`Stage ${stageIndex} not found`);
    }

    // stages[0] は string[] の配列なので、それを文字の2次元配列に変換
    this.stage = stageData.stages[0].map((row) => row.split(""));

    // カメラコンテナ（スクロール用）
    this.camera = new Container();
    this.container.addChild(this.camera);

    // ステージ描画用Graphics
    this.stageGraphics = new Graphics();
    this.camera.addChild(this.stageGraphics);
    this.renderStage();

    // プレイヤー描画用Graphics
    this.playerGraphics = new Graphics();
    this.camera.addChild(this.playerGraphics);

    // プレイヤー生成（ステージ内の '0' を探す）
    let playerX = 0;
    let playerY = 0;
    for (let y = 0; y < this.stage.length; y++) {
      for (let x = 0; x < this.stage[y].length; x++) {
        if (this.stage[y][x] === "0") {
          playerX = x * BLOCKSIZE;
          playerY = y * BLOCKSIZE;
        }
      }
    }

    this.player = new Player(playerX, playerY, this.stage, input);
    this.add(this.player);
  }

  update() {
    super.update();

    // プレイヤー描画更新
    this.renderPlayer();
  }

  /**
   * ステージ（タイルマップ）描画
   */
  private renderStage() {
    this.stageGraphics.clear();

    for (let y = 0; y < this.stage.length; y++) {
      for (let x = 0; x < this.stage[y].length; x++) {
        const block = this.stage[y][x];
        if (block === " " || block === "0") continue;

        // デバッグ用: 壁を白で描画
        this.stageGraphics.rect(
          x * BLOCKSIZE,
          y * BLOCKSIZE,
          BLOCKSIZE,
          BLOCKSIZE
        );
        this.stageGraphics.fill(0xffffff);
      }
    }
  }

  /**
   * プレイヤー描画
   */
  private renderPlayer() {
    this.playerGraphics.clear();

    // デバッグ用: プレイヤーを赤で描画
    this.playerGraphics.rect(
      this.player.x,
      this.player.y,
      this.player.width,
      this.player.height
    );
    this.playerGraphics.fill(0xff0000);

    // ヒットボックス表示（デバッグ用）
    const hitbox = this.player.currentHitbox;
    this.playerGraphics.rect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
    this.playerGraphics.stroke({ width: 1, color: 0x00ff00 });
  }
}
