// @ts-check

class Rectangle {
    /**
     * @constructor
     * @param {number} x - 四角形左上のx座標。
     * @param {number} y - 四角形左上のy座標。
     * @param {number} width - 四角形の横幅。
     * @param {number} height - 四角形の縦幅。
     */
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    /**
     * 他の四角形と重なっているかを判定をします。
     * @param {Rectangle} other - 他の四角形。
     * @returns {boolean} - 重なっている場合はtrue。
     */
    hitTest(other) {
        const horizontal = other.left < this.right && this.left < other.right;
        const vertical = other.top < this.bottom && this.top < other.bottom;
        return horizontal && vertical;
    }

    /**
     * 指定した座標が四角形内にあるかを判定します。
     * @param {number} x - 指定するx座標
     * @param {number} y - 指定するy座標
     * @returns {boolean} - 指定した座標が四角形内にある場合はtrue。
     */
    contain(x, y) {
        return this.left <= x && x < this.right && this.top <= y && y < this.bottom;
    }

    /**
     * 現在のRectangleインスタンスを複製して新しいインスタンスを返します。
     * @returns {Rectangle} 新しいRectangleインスタンス
     */
    clone() {
        return new Rectangle(this.x, this.y, this.width, this.height);
    }

    get left() {
        return this.x;
    }
    get right() {
        return this.x + this.width - 1;
    }
    get top() {
        return this.y;
    }
    get bottom() {
        return this.y + this.height - 1;
    }
    get centerX() {
        return this.x + this.width / 2;
    }
    get centerY() {
        return this.y + this.height / 2;
    }
    get center() {
        return [this.centerX, this.centerY];
    }
    get param() {
        return [this.x, this.y, this.width, this.height];
    }
}

class SpriteAnimation {
    /**
     * @param {string} animationName
     * @param {number[]} frames
     */
    constructor(animationName, frames, freq = 0, loop = false) {
        this.aninmationName = animationName;
        this.frames = frames;
        this.freq = freq;
        this.loop = loop;
    }
}

class SpriteData {
    /**
     * @param {number} cols
     * @param {number} rows
     * @param {SpriteAnimation[]} animations
     */
    constructor(cols, rows, animations) {
        this.cols = cols;
        this.rows = rows;

        /** @private @type {Map<string, SpriteAnimation>} */
        this._animations = new Map();
        for (const anime of animations) {
            this._animations.set(anime.aninmationName, anime);
        }
    }

    /**
     * @param {string} animationName
     */
    get(animationName) {
        const anime = this._animations.get(animationName);
        if (anime) return anime;

        throw new Error(
            `"${animationName}" という名前のスプライトアニメーションは読み込まれていません`
        );
    }
}

class ImageLoader {
    constructor() {
        /** @private @type {Map<string, HTMLImageElement>} 画像データを保持するマップ */
        this._images = new Map();

        /** @private @type {Promise<HTMLImageElement>[]} ロード状況を管理するマップ */
        this._promises = [];

        /** @private @type {Map<string, SpriteData>} スプライトシート情報を保持するマップ*/
        this._spriteDatas = new Map();
    }

    /**
     * 画像を登録します。
     * @param {string} key - 画像のキー（名前）。
     * @param {string} src - 画像のURL。
     */
    addImage(key, src) {
        const img = new Image();
        img.src = src;
        this._images.set(key, img);

        const promise = new Promise((resolve) =>
            img.addEventListener("load", () => {
                this._images.set(key, img);
                resolve(img);
            })
        );

        img.addEventListener("error", () => {
            console.error(`${key} (${src}) の読み込みに失敗しました`);
        });

        this._promises.push(promise);
    }

    /**
     * すべての画像がロード済みか確認します。
     * @returns {Promise<Map<string, HTMLImageElement>>}
     */
    async loadAll() {
        await Promise.all(this._promises);
        return this._images;
    }

    /**
     * 指定したキーの画像を取得します。
     * @param {string} key - 画像のキー。
     * @returns {HTMLImageElement} 指定したキーの画像（ロード済み）。見つからない場合はnull。
     */
    getImage(key) {
        const image = this._images.get(key);
        if (image) return image;

        throw new Error(`"${key}" という名前の画像は読み込まれていません`);
    }

    /**
     * @param {string} key
     * @param {number} cols
     * @param {number} rows
     * @param {SpriteAnimation[]} animations
     */
    addSpriteData(key, cols, rows, animations) {
        this._spriteDatas.set(key, new SpriteData(cols, rows, animations));
    }

    /**
     * @param {string} key
     */
    getSpriteData(key) {
        const spriteData = this._spriteDatas.get(key);
        if (spriteData) return spriteData;
        throw new Error(`"${key}" という名前のスプライトデータは読み込まれていません`);
    }
}
const images = new ImageLoader();

class EventDispatcher {
    constructor() {
        /** @private @type {Map<string, Set<Function>>} イベントリスナーを保持するマップ */
        this._listeners = new Map();
    }

    /**
     * イベントリスナーを登録します。
     * @param {string} event - イベント名。
     * @param {Function} callback - イベント発火時に呼び出される関数。
     */
    on(event, callback) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, new Set());
        }
        this._listeners.get(event)?.add(callback);
    }

    /**
     * イベントリスナーを解除します。
     * @param {string} event - イベント名。
     * @param {Function} callback - 登録解除する関数。
     */
    off(event, callback) {
        this._listeners.get(event)?.delete(callback);
        if (this._listeners.get(event)?.size === 0) {
            this._listeners.delete(event); // 空になったら削除
        }
    }

    /**
     * イベントリスナーを全て消去します。
     * @param {string} event - イベント名。
     */
    clearEvents(event) {
        this._listeners.set(event, new Set());
    }

    /**
     * 1回だけ実行されるイベントリスナーを登録します。
     * @param {string} event - イベント名。
     * @param {Function} callback - 実行後に自動的に解除される関数。
     */
    once(event, callback) {
        const wrapper = (...args) => {
            callback(...args);
            this.off(event, wrapper);
        };
        this.on(event, wrapper);
    }

    /**
     * イベントをディスパッチします。
     * @param {string} event - 発火するイベント名。
     * @param {...any} args - リスナーに渡す引数。
     */
    dispatch(event, ...args) {
        for (const callback of this._listeners.get(event) ?? []) {
            callback(...args);
        }
    }

    /**
     * 指定したイベントにリスナーが登録されているか確認します。
     * @param {string} event - 確認するイベント名。
     * @returns {boolean} リスナーが存在する場合はtrue。
     */
    hasListeners(event) {
        return (this._listeners.get(event)?.size ?? 0) > 0;
    }
}

class GameEvent {
    /**
     * @param {Object} target - イベントを発生させたオブジェクト（ターゲット）
     * @param {Object} [data=null] - イベントに関連する追加データ（任意）
     */
    constructor(target, data = null) {
        this.target = target;
        this.data = data;
    }
}

class Camera {
    /**
     * @param {Rectangle} rectangle - カメラの表示領域
     * @param {Rectangle} screenRectangle - ゲームの画面サイズ
     */
    constructor(rectangle, screenRectangle) {
        this.rectangle = rectangle;
        this.screenRectangle = screenRectangle.clone();
        this.rotate = 0;
        this.initRect = rectangle.clone();
    }

    reset() {
        this.rectangle = this.initRect.clone();
    }

    get scaleX() {
        return this.screenRectangle.width / this.rectangle.width;
    }
    get scaleY() {
        return this.screenRectangle.height / this.rectangle.height;
    }
    /** @returns {[number,number]} */
    get scale() {
        return [this.scaleX, this.scaleY];
    }
}

/**
 * シーンのデフォルト設定です。
 */
class DefaultData {
    /**
     *
     * @param {Object} defaultData - シーンのデフォルト設定
     */
    constructor(defaultData) {
        this.rotate = defaultData.rotate ?? 0;
        this.alpha = defaultData.alpha ?? 1;
        this.scaleX = defaultData.scaleX ?? 1;
        this.scaleY = defaultData.scaleY ?? 1;
        this.compositeOperation = defaultData.compositeOperation ?? "source-over";
        this.textBaseline = defaultData.textBaseline ?? "middle";
        this.textAlign = defaultData.textAlign ?? "center";
        this.color = defaultData.color ?? "#000";
        this.font = defaultData.font ?? "20px monospace";
        this.lineHeight = defaultData.lineHeight;
        this.lineWidth = defaultData.lineWidth ?? 1;
        this.lineJoin = defaultData.lineJoin ?? "miter";
    }
}

/**
 * ゲーム内のキャラクターやオブジェクトを表す基底クラスです。
 */
class Actor extends EventDispatcher {
    /**
     *
     * @param {number} x - Actorの初期x座標
     * @param {number} y - Actorの初期y座標
     * @param {Array<string>} [tags] - Actorのタグ
     */
    constructor(x, y, tags = []) {
        super();
        this.x = x;
        this.y = y;
        this.tags = tags;

        this.width = 0;
        this.height = 0;
        this.time = 0;
        this.parentKey = -1;
        this.parent = null;
        this.cameraFollowRateX = this.cameraFollowRateY = 1;

        this.rotate = undefined;
        this.alpha = undefined;
        this.scaleX = undefined;
        this.scaleY = undefined;
        this.compositeOperation = undefined;
    }

    /**
     * シーンのデフォルト設定を反映します。
     * @param {DefaultData} defaultData - シーンのデフォルト設定
     */
    setDefault(defaultData) {
        this.rotate ??= defaultData.rotate ?? 0;
        this.alpha ??= defaultData.alpha ?? 1;
        this.scaleX ??= defaultData.scaleX ?? 1;
        this.scaleY ??= defaultData.scaleY ?? 1;
        this.compositeOperation ??= defaultData.compositeOperation ?? "source-over";
    }

    /**
     * 指定するタグを持っているか確認します。
     * @param {string} tagName
     * @returns {boolean}
     */
    hasTag(tagName) {
        return this.tags.includes(tagName);
    }

    /**
     * シーンから毎フレーム呼び出される処理です。
     * @param {Input} input
     */
    update(input) {}

    /**
     * アクターを描画します。
     * @param {CanvasRenderingContext2D} context - 描画に使用するコンテキスト。
     * @param {Camera} camera - ゲームのカメラ。
     */
    render(context, camera) {
        context.save();
        context.globalAlpha = this.alpha;
        context.globalCompositeOperation = this.compositeOperation;

        // カメラ設定反映
        const [cx, cy] = camera.rectangle.center;
        const [scx, scy] = camera.screenRectangle.center;
        context.translate(scx | 0, scy | 0);
        context.rotate((camera.rotate * Math.PI) / 180);
        context.scale(...camera.scale);
        context.translate(-scx | 0, -scy | 0);

        // followRate反映
        const followDX = (scx - cx) * this.cameraFollowRateX; // * this.scaleX;
        const followDY = (scy - cy) * this.cameraFollowRateY; // * this.scaleY;
        context.translate(followDX | 0, followDY | 0);

        // アクター設定反映
        const [acx, acy] = this.rectangle.center;
        context.translate(acx | 0, acy | 0);
        context.rotate((this.rotate * Math.PI) / 180);
        context.scale(this.scaleX, this.scaleY);
        context.translate(-acx | 0, -acy | 0);
    }

    /**
     * このアクターを破棄します。
     */
    destroy() {
        this.dispatch("destroy", new GameEvent(this));
    }

    /** @param {LayerActor | StaticLayerActor | Scene} parent  */
    addChildTo(parent) {
        parent.addChild(this);
        return this;
    }

    get rectangle() {
        return new Rectangle(this.x, this.y, this.width, this.height);
    }

    set rectangle(rectangle) {
        this.x = rectangle.x;
        this.y = rectangle.y;
        this.width = rectangle.width;
        this.height = rectangle.height;
    }
}

/**
 * 塗りつぶし四角形のアクターです。
 */
class RectActor extends Actor {
    /**
     * @param {(string|CanvasGradient|CanvasPattern)} color - 塗りつぶしの色として使用する値。
     * @param {Rectangle} rectangle - 描画する四角形です。
     * @param {Array<string>} [tags] - アクターのタグ
     */
    constructor(color, rectangle, tags = []) {
        super(rectangle.x, rectangle.y, tags);
        this.width = rectangle.width;
        this.height = rectangle.height;
        this.color = color;
    }

    /**
     * アクターを描画します。
     * @override
     * @param {CanvasRenderingContext2D} context - 描画に使用するコンテキスト。
     * @param {Camera} camera - ゲームのカメラ。
     */
    render(context, camera) {
        super.render(context, camera);
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, this.width, this.height);
        context.restore();
    }
}

/**
 * 枠のみ四角形のアクターです。
 */
class StrokeRectActor extends Actor {
    /**
     * @param {(string|CanvasGradient|CanvasPattern)} color - 塗りつぶしの色として使用する値。
     * @param {Rectangle} rectangle - 描画する四角形です。
     * @param {Array<string>} [tags] - アクターのタグ
     */
    constructor(color, rectangle, tags = []) {
        super(rectangle.x, rectangle.y, tags);
        this.width = rectangle.width;
        this.height = rectangle.height;
        this.color = color;
    }

    /**
     * アクターを描画します。
     * @override
     * @param {CanvasRenderingContext2D} context - 描画に使用するコンテキスト。
     * @param {Camera} camera - ゲームのカメラ。
     */
    render(context, camera) {
        super.render(context, camera);
        context.strokeStyle = this.color;
        context.strokeRect(this.x, this.y, this.width, this.height);
        context.restore();
    }
}

/**
 * テキストを描画するアクターです。
 */
class TextActor extends Actor {
    /**
     * @param {string} text - 描画するテキスト
     * @param {number} x - テキストのx座標
     * @param {number} y - テキストのy座標
     * @param {Array<string>} [tags] - アクターのタグ
     */
    constructor(text, x, y, tags = []) {
        super(x, y, tags);
        this.text = text;

        this.textBaseline = undefined;
        this.textAlign = undefined;
        this.color = undefined;
        this.font = undefined;
        this.lineHeight = undefined;
    }

    /**
     * シーンのデフォルト設定を反映します。
     * @override
     * @param {DefaultData} defaultData - シーンのデフォルト設定
     */
    setDefault(defaultData) {
        super.setDefault(defaultData);
        this.textBaseline ??= defaultData.textBaseline;
        this.textAlign ??= defaultData.textAlign;
        this.color ??= defaultData.color;
        this.font ??= defaultData.font;
        this.lineHeight ??= defaultData.lineHeight;
    }

    /**
     * アクターを描画します。
     * @override
     * @param {CanvasRenderingContext2D} context - 描画に使用するコンテキスト。
     * @param {Camera} camera - ゲームのカメラ。
     */
    render(context, camera) {
        super.render(context, camera);
        context.fillStyle = this.color;
        context.textBaseline = this.textBaseline;
        context.textAlign = this.textAlign;
        context.font = this.font;

        const match = this.font.match(/(\d+)px/);
        const fontSize = match ? parseInt(match[1], 10) : 0;

        const lines = this.text.split("\n");
        for (const lineIdx in lines) {
            this.lineHeight ??= fontSize;
            const line = lines[lineIdx];
            context.fillText(line, this.x, this.y + this.lineHeight * +lineIdx);
        }

        context.restore();
    }
}

class Sprite {
    /**
     * @param {HTMLImageElement} image
     */
    constructor(image) {
        this.image = image;
        this.x = 0;
        this.y = 0;
        this.width = image.width;
        this.height = image.height;
    }
}

class SpriteActor extends Actor {
    /**
     * @param {string} imageKey - 使用する画像のキー
     * @param {Rectangle} rectangle - 画像を配置する位置
     * @param {Array<string>} [tags] - アクターのタグ
     */
    constructor(imageKey, rectangle, tags = []) {
        super(rectangle.x, rectangle.y, tags);
        this.imageKey = imageKey;
        this.sprite = new Sprite(images.getImage(imageKey));
        this.width = rectangle.width;
        this.height = rectangle.height;
    }

    /**
     * @param {string} animationName
     */
    playAnimation(animationName) {
        const spriteData = images.getSpriteData(this.imageKey);
        const { frames, freq, loop } = spriteData.get(animationName);
        const cols = spriteData.cols;
        const rows = spriteData.rows;
        this.spriteSheetData = { time: 0, index: 0, cols, rows, frames, freq, loop };
    }

    stopAnimation() {
        this.spriteSheetData = null;
    }

    updateSpriteAnimation() {
        if (this.sprite && this.spriteSheetData) {
            const { time, index, cols, rows, frames, freq, loop } = this.spriteSheetData;
            if (freq == 0 || time % freq == 0) {
                if (!loop && index >= frames.length) {
                    return;
                }
                const frame = frames[index % frames.length];
                let w = this.sprite.image.width / cols;
                let h = this.sprite.image.height / rows;
                let x = w * (frame % cols);
                let y = h * ((frame / cols) | 0);
                if (x < 0) {
                    w *= -1;
                    x *= -1;
                }
                if (y < 0) {
                    h *= -1;
                    y *= -1;
                }
                [this.sprite.x, this.sprite.y, this.sprite.width, this.sprite.height] = [
                    x,
                    y,
                    w,
                    h,
                ];
                this.spriteSheetData.index = index + 1;
            }
            this.spriteSheetData.time++;
        }
    }

    /**
     * アクターを描画します。
     * @override
     * @param {CanvasRenderingContext2D} context - 描画に使用するコンテキスト。
     * @param {Camera} camera - ゲームのカメラ。
     */
    render(context, camera) {
        super.render(context, camera);
        this.updateSpriteAnimation();

        context.drawImage(
            this.sprite.image,
            this.sprite.x,
            this.sprite.y,
            this.sprite.width,
            this.sprite.height,
            this.x | 0,
            this.y | 0,
            this.width,
            this.height
        );
        context.restore();
    }
}

class StrokePathActor extends Actor {
    /**
     * @param {(string|CanvasGradient|CanvasPattern)} color
     * @param {string[]} [tags=[]]
     */
    constructor(color, tags = []) {
        super(0, 0, tags);
        this.color = color;
        this.paths = [];
        this.lineWidth = undefined;
        this.lineJoin = undefined;
    }

    /**
     * シーンのデフォルト設定を反映します。
     * @override
     * @param {DefaultData} defaultData - シーンのデフォルト設定
     */
    setDefault(defaultData) {
        super.setDefault(defaultData);
        this.lineWidth ??= defaultData.lineWidth;
        this.lineJoin ??= defaultData.lineJoin;
    }

    beginPath() {
        this.paths = [];
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    moveTo(x, y) {
        this.paths.push(["moveTo", x, y]);
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    lineTo(x, y) {
        this.paths.push(["lineTo", x, y]);
    }

    /**
     * @param {CanvasRenderingContext2D} context
     * @param {Camera} camera
     */
    render(context, camera) {
        super.render(context, camera);

        context.lineJoin = this.lineJoin;
        context.strokeStyle = this.color;
        context.lineWidth = this.lineWidth;
        context.beginPath();
        for (const [op, ...args] of this.paths) {
            context[op](...args);
        }
        context.stroke();

        context.restore();
    }
}

/**
 * 通常のレイヤーです。
 */
class LayerActor extends Actor {
    /**
     * @param {Rectangle} rectangle - レイヤーのサイズ
     * @param {Array<string>} [tags] - アクターのタグ
     */
    constructor(rectangle, tags = []) {
        super(rectangle.x, rectangle.y, tags);
        this.width = rectangle.width;
        this.height = rectangle.height;

        this.cameraFollowRateX = this.cameraFollowRateY = 1;
        this.canvas = document.createElement("canvas");
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        const context = this.canvas.getContext("2d");
        if (context) context.imageSmoothingEnabled = false;

        /** @type {Map<number, Actor>} */
        this.children = new Map();
        this.childKey = 0;

        this.defaultData = new DefaultData({});
    }

    /** @param {Actor} child  */
    addChild(child) {
        child.setDefault(this.defaultData);
        child.on("destroy", (e) => this.deleteChild(e.target.parentKey));
        child.parent = this;
        const key = this.childKey++;
        this.children.set(key, child);
        child.parentKey = key;
        child.cameraFollowRateX = child.cameraFollowRateY = 0;
    }

    /** @param {number} key  */
    deleteChild(key) {
        this.children.delete(key);
    }

    /**
     * シーンから毎フレーム呼び出される処理です。
     * @override
     * @param {Input} input
     */
    update(input) {
        for (const [key, actor] of this.children) {
            actor.update(input);
            actor.time++;
        }
    }

    /**
     * アクターを描画します。
     * @override
     * @param {CanvasRenderingContext2D} context - 描画に使用するコンテキスト。
     * @param {Camera} camera - ゲームのカメラ。
     */
    render(context, camera) {
        super.render(context, camera);
        const thisContext = this.canvas.getContext("2d");
        if (thisContext) {
            thisContext.clearRect(0, 0, this.width, this.height);
            for (const [key, actor] of this.children) {
                actor.render(thisContext, camera);
            }
        }

        context.drawImage(this.canvas, this.x | 0, this.y | 0, this.width, this.height);
        context.restore();
    }
}

/**
 * 描画内容を更新しないレイヤーです。
 * Actor.update()が実行されず、Actor.cameraFollowRateも反映されません。
 */
class StaticLayerActor extends Actor {
    /**
     * @param {Rectangle} rectangle - レイヤーのサイズ
     * @param {Array<string>} [tags] - アクターのタグ
     */
    constructor(rectangle, tags = []) {
        super(rectangle.x, rectangle.y, tags);
        this.width = rectangle.width;
        this.height = rectangle.height;

        this.canvas = document.createElement("canvas");
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.context = this.canvas.getContext("2d");
        if (this.context) this.context.imageSmoothingEnabled = false;

        this.defaultData = new DefaultData({});
    }

    /** @param {Actor} child  */
    addChild(child) {
        child.setDefault(this.defaultData);
        child.parent = this;
        const rect11 = new Rectangle(0, 0, 1, 1);
        const camera = new Camera(rect11, rect11);
        if (this.context) {
            child.render(this.context, camera);
        }
    }

    /** @param {number} key  */
    deleteChild(key) {}

    clear() {
        this.context?.clearRect(0, 0, this.width, this.height);
    }

    /**
     * アクターを描画します。
     * @override
     * @param {CanvasRenderingContext2D} context - 描画に使用するコンテキスト。
     * @param {Camera} camera - ゲームのカメラ。
     */
    render(context, camera) {
        super.render(context, camera);
        context.drawImage(this.canvas, this.x | 0, this.y | 0, this.width, this.height);
        context.restore();
    }
}

class Scene extends EventDispatcher {
    /**
     * @param {Game} game
     */
    constructor(game) {
        super();
        this.game = game;
        this.camera = game.camera;

        /** @type {Map<number, Actor>} */
        this.children = new Map();
        this.defaultData = new DefaultData({});
        this.childKey = 0;
    }

    /** @param {...Actor} actors  */
    addChild(...actors) {
        for (const actor of actors) {
            actor.setDefault(this.defaultData);
            actor.on("destroy", (e) => this.deleteChild(e.target.parentKey));
            actor.parent = this;
            const key = this.childKey++;
            this.children.set(key, actor);
            actor.parentKey = key;
        }
    }

    /** @param {number} key  */
    deleteChild(key) {
        this.children.delete(key);
    }

    /**
     *
     * @param  {...Scene} newSceneList
     */
    changeScene(...newSceneList) {
        const event = new GameEvent(newSceneList);
        this.dispatch("changescene", event);
    }

    /**
     * @param {Input} input
     */
    update(input) {
        for (const [key, actor] of this.children) {
            actor.update(input);
            actor.time++;
        }
    }

    /**
     * @param {CanvasRenderingContext2D} context
     */
    render(context) {
        for (const [key, actor] of this.children) {
            actor.render(context, this.camera);
        }
    }
}

class GameInformation {
    /**
     * @param {Rectangle} screenRectangle
     * @param {number} maxFps
     * @param {number} currentFps
     */
    constructor(screenRectangle, maxFps, currentFps) {
        this.screenRectangle = screenRectangle;
        this.maxFps = maxFps;
        this.currentFps = currentFps;
    }
}

class Game {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {number} [maxFps=60]
     */
    constructor(canvas, maxFps = 60) {
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        if (this.context) this.context.imageSmoothingEnabled = false;
        this.maxFps = maxFps;

        const screenRectangle = new Rectangle(0, 0, canvas.width, canvas.height);
        this.camera = new Camera(screenRectangle, screenRectangle);
        this.prevTimestamp = 0;
        this.lag = 0;
        this.currentFps = 0;
        this.elapsedSecondList = Array(60).fill(1 / maxFps);
        this.input = new Input(canvas, this.camera);

        /** @type {Array<Scene>} */
        this.currentSceneList = [];

        this.time = 0;
    }

    get info() {
        const screenRectangle = new Rectangle(0, 0, this.canvas.width, this.canvas.height);
        return new GameInformation(screenRectangle, this.maxFps, this.currentFps);
    }

    /** @param {...Scene} newSceneList  */
    changeScene(...newSceneList) {
        this.currentSceneList = newSceneList;
        for (const currentScene of this.currentSceneList) {
            if (!currentScene.hasListeners("changescene")) {
                currentScene.on("changescene", (e) => this.changeScene(...e.target));
            }
        }
    }

    /**
     * @param {number} timestamp
     */
    _loop(timestamp) {
        const elapsedSec = (timestamp - this.prevTimestamp) / 1000;
        this.prevTimestamp = timestamp;
        this.lag += elapsedSec;
        const frameTime = 1 / this.maxFps;
        this.time++;

        while (this.lag >= frameTime / 2) {
            this.input.update();
            for (const currentScene of this.currentSceneList) {
                currentScene.update(this.input);
            }
            this.lag -= frameTime;
            this.elapsedSecondList.shift();
            this.elapsedSecondList.push(frameTime);
        }
        for (const currentScene of this.currentSceneList) {
            if (this.context) currentScene.render(this.context);
        }

        this.currentFps = 60 / this.elapsedSecondList.reduce((s, v) => s + v, 0);
        requestAnimationFrame(this._loop.bind(this));
    }

    start() {
        requestAnimationFrame(this._loop.bind(this));
    }
}

class StaticPointerPosition {
    /**
     * @param {Camera} camera
     * @param {number} [displayX]
     * @param {number} [displayY]
     */
    constructor(camera, displayX = -1, displayY = -1) {
        this.displayX = displayX;
        this.displayY = displayY;
        this.camera = camera;

        const worldPoint = this.getWorldPoint();
        this._wX = worldPoint[0];
        this._wY = worldPoint[1];
    }

    /**
     * @param {number} displayX
     * @param {number} displayY
     */
    changePoint(displayX, displayY) {
        this.displayX = displayX;
        this.displayY = displayY;

        const worldPoint = this.getWorldPoint();
        this._wX = worldPoint[0];
        this._wY = worldPoint[1];
    }

    getWorldPoint() {
        const rotatePoint = (x, y, rotate) => {
            const radian = (rotate * Math.PI) / 180;
            const rotatedX = x * Math.cos(radian) - y * Math.sin(radian);
            const rotatedY = x * Math.sin(radian) + y * Math.cos(radian);
            return { x: rotatedX, y: rotatedY };
        };

        // カメラ設定反映
        const [cx, cy] = this.camera.rectangle.center;
        const [scx, scy] = this.camera.screenRectangle.center;
        const worldRotatedPoint = rotatePoint(
            this.displayX - scx,
            this.displayY - scy,
            -this.camera.rotate
        );
        const worldX = worldRotatedPoint.x / this.camera.scaleX + cx;
        const worldY = worldRotatedPoint.y / this.camera.scaleY + cy;

        return [worldX, worldY];
    }

    get worldX() {
        return this._wX;
    }

    get worldY() {
        return this._wY;
    }
}

class PointerPosition extends StaticPointerPosition {
    /**
     * @param {Camera} camera
     * @param {number} [displayX]
     * @param {number} [displayY]
     */
    constructor(camera, displayX = -1, displayY = -1) {
        super(camera, displayX, displayY);
    }

    get displayPoint() {
        return [this.displayX, this.displayY];
    }

    get worldPoint() {
        const rotatePoint = (x, y, rotate) => {
            const radian = (rotate * Math.PI) / 180;
            const rotatedX = x * Math.cos(radian) - y * Math.sin(radian);
            const rotatedY = x * Math.sin(radian) + y * Math.cos(radian);
            return { x: rotatedX, y: rotatedY };
        };

        // カメラ設定反映
        const [cx, cy] = this.camera.rectangle.center;
        const [scx, scy] = this.camera.screenRectangle.center;
        const worldRotatedPoint = rotatePoint(
            this.displayX - scx,
            this.displayY - scy,
            -this.camera.rotate
        );
        const worldX = worldRotatedPoint.x / this.camera.scaleX + cx;
        const worldY = worldRotatedPoint.y / this.camera.scaleY + cy;

        return [worldX, worldY];
    }

    get worldX() {
        return this.worldPoint[0];
    }

    get worldY() {
        return this.worldPoint[1];
    }
}

class LastPointerInfo {
    /**
     * @param {Camera} camera
     */
    constructor(camera) {
        this.left = new StaticPointerPosition(camera);
        this.right = new StaticPointerPosition(camera);
        this.center = new StaticPointerPosition(camera);
    }
}

class PointerInput {
    /**
     * @param {HTMLCanvasElement} target
     * @param {Camera} camera
     */
    constructor(target, camera) {
        /** @private @type {Map<string, boolean>} */
        this._isPointerDownedMap = new Map();
        /** @private @type {Map<string, number>} */
        this._pointerTimeMap = new Map();
        this.currentPosition = new PointerPosition(camera);

        this.lastDownPosition = new LastPointerInfo(camera);
        this.lastUpPosition = new LastPointerInfo(camera);

        {
            /** @returns {[number, number]} */
            const _calcPointerPosition = (pe) => {
                const clientRect = target.getBoundingClientRect();
                const positionX = clientRect.left + window.scrollX;
                const positionY = clientRect.top + window.scrollY;
                const displayX = ((pe.pageX - positionX) / clientRect.width) * target.width;
                const displayY = ((pe.pageY - positionY) / clientRect.height) * target.height;

                return [displayX, displayY];
            };

            /** @type {[number,string][]} */
            const buttonsName = [
                [1, "left"],
                [2, "right"],
                [4, "center"],
            ];
            target.addEventListener("pointerdown", (pe) => {
                const position = _calcPointerPosition(pe);
                for (const [buttonNum, Name] of buttonsName) {
                    if (pe.buttons & buttonNum) {
                        this.lastDownPosition[Name].changePoint(...position);
                        this._isPointerDownedMap.set(Name, true);
                    }
                }
            });
            target.addEventListener("pointerup", (pe) => {
                const position = _calcPointerPosition(pe);
                for (const [buttonNum, Name] of buttonsName) {
                    if (!(pe.buttons & buttonNum)) {
                        this.lastUpPosition[Name].changePoint(...position);
                        this._isPointerDownedMap.set(Name, false);
                    }
                }
            });
            target.addEventListener("pointerout", (pe) => {
                for (const [buttonNum, Name] of buttonsName) {
                    this._isPointerDownedMap.set(Name, false);
                }
            });
            target.addEventListener("pointermove", (pe) => {
                this.currentPosition.changePoint(..._calcPointerPosition(pe));
            });
        }
    }

    update() {
        this._isPointerDownedMap.forEach((isPressed, k) => {
            const keyTime = this._pointerTimeMap.get(k) ?? 0;
            this._pointerTimeMap.set(
                k,
                isPressed ? Math.max(1, keyTime + 1) : Math.min(-1, keyTime - 1)
            );
        });
    }

    /**
     * @param {string} pointerName
     */
    getKey(pointerName) {
        return this._pointerTimeMap.get(pointerName) ?? 0;
    }
}

class Input {
    /**
     * @param {HTMLCanvasElement} target
     * @param {Camera} camera
     */
    constructor(target, camera) {
        /** @private @type {Map<string, boolean>} */
        this._isKeyPressedMap = new Map();
        /** @private @type {Map<string, number>} */
        this._keyTimeMap = new Map();
        this.pointer = new PointerInput(target, camera);

        target.tabIndex = 0;
        target.addEventListener("keydown", (ke) => {
            this._isKeyPressedMap.set(ke.key, true);
            ke.preventDefault();
        });
        target.addEventListener("keyup", (ke) => {
            this._isKeyPressedMap.set(ke.key, false);
        });
    }

    update() {
        this.pointer.update();
        this._isKeyPressedMap.forEach((isPressed, k) => {
            const keyTime = this._keyTimeMap.get(k) ?? 0;
            this._keyTimeMap.set(
                k,
                isPressed ? Math.max(1, keyTime + 1) : Math.min(-1, keyTime - 1)
            );
        });
    }

    /**
     * @param {string} keyName
     */
    getKey(keyName) {
        return this._keyTimeMap.get(keyName) ?? 0;
    }
}

class SoundTrack {
    /**
     * @param {AudioBuffer} buffer
     * @param {number} loopStart
     * @param {number} loopEnd
     */
    constructor(buffer, loopStart, loopEnd) {
        this.buffer = buffer;
        this.loopStart = loopStart;
        this.loopEnd = loopEnd;

        this.playbackRate = 1;
        this.bufferSource = null;
        this.isPlaying = false;
    }

    /**
     * @param {AudioContext} context
     */
    makeBufferSource(context) {
        if (!this.buffer) {
            throw new Error(`AudioContextの初期化が行われていません`);
        }
        this.bufferSource = context.createBufferSource();
        this.bufferSource.buffer = this.buffer;
        this.bufferSource.playbackRate.value = this.playbackRate;
        if (this.loopStart != -1) {
            this.bufferSource.loop = true;
            this.bufferSource.loopStart = this.loopStart;
            this.bufferSource.loopEnd = this.loopEnd;
        }

        return this.bufferSource;
    }
}

class SoundFilter {
    /**
     * @param {BiquadFilterNode} filter
     */
    constructor(filter) {
        this.filter = filter;
        this.active = true;
    }
}

class SoundLoader {
    constructor() {
        /** @private @type {Map<string, SoundTrack>} */
        this._tracks = new Map();
        /** @private @type {Promise<SoundTrack>[]} ロード状況を管理するマップ */
        this._promises = [];

        /** @private @type {Map<string, SoundFilter>} */
        this._filters = new Map();
    }

    init() {
        this.context = new AudioContext();
        this.analyser = this.context.createAnalyser();
        this.preFilterGain = this.context.createGain();
        this.postFilterGain = this.context.createGain();
        this.postFilterGain.connect(this.analyser);
        this.analyser.connect(this.context.destination);
        this._reconnectFilters();
    }

    /**
     * 音楽データを登録します。
     * @param {string} key - 音楽データのキー（名前）。
     * @param {string} url - 音楽データのURL。
     */
    addTrack(key, url, loopStart = -1, loopEnd = -1) {
        const promise = fetch(url)
            .then((response) => response.arrayBuffer())
            .then((arrayBuffer) => {
                if (this.context) {
                    return this.context.decodeAudioData(arrayBuffer);
                } else {
                    throw new Error(`AudioContextの初期化が行われていません`);
                }
            })
            .then((buffer) => {
                const sound = new SoundTrack(buffer, loopStart, loopEnd);
                this._tracks.set(key, sound);
                return sound;
            });

        this._promises.push(promise);
    }

    /**
     * @param {string} key
     * @param {BiquadFilterType} type
     * @param {number} freq
     */
    addFilter(key, type, freq, q = 1) {
        if (!this.context) {
            throw new Error(`AudioContextの初期化が行われていません`);
        }
        const filter = this.context.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = freq;
        filter.Q.value = q;

        this._filters.set(key, new SoundFilter(filter));
    }

    /**
     * @param {string} key
     */
    deleteFilter(key) {
        this._filters.delete(key);
    }

    async loadAll() {
        await Promise.all(this._promises);
        return this._tracks;
    }

    /**
     * @param {string} key
     */
    play(key) {
        if (!this.context || !this.preFilterGain) {
            throw new Error(`AudioContextの初期化が行われていません`);
        }
        this._reconnectFilters();
        const track = this._tracks.get(key);

        if (track) {
            track.isPlaying = true;
            const source = track.makeBufferSource(this.context);
            source.connect(this.preFilterGain);
            source.start(0);
        } else {
            throw new Error(`"${key}" という名前の音楽ファイルは読み込まれていません`);
        }
    }

    /**
     * @param {string} key
     */
    stop(key) {
        const track = this._tracks.get(key);

        if (track) {
            track.isPlaying = false;
            if (track.bufferSource) {
                track.bufferSource.stop();
                track.bufferSource.disconnect();
                track.bufferSource = null;
            }
        } else {
            throw new Error(`"${key}" という名前の音楽ファイルは読み込まれていません`);
        }
    }

    /**
     * @param {string} key
     */
    enableFilter(key) {
        const soundFilter = this._filters.get(key);
        if (soundFilter) {
            soundFilter.active = true;
            this._reconnectFilters();
        } else {
            throw new Error(`"${key}" という名前の音楽フィルターは読み込まれていません`);
        }
    }

    /**
     * @param {string} key
     */
    disableFilter(key) {
        const soundFilter = this._filters.get(key);
        if (soundFilter) {
            soundFilter.active = false;
            this._reconnectFilters();
        } else {
            throw new Error(`"${key}" という名前の音楽フィルターは読み込まれていません`);
        }
    }

    _reconnectFilters() {
        if (!this.postFilterGain || !this.preFilterGain) {
            throw new Error(`AudioContextの初期化が行われていません`);
        }
        this.preFilterGain.disconnect();
        let lastNode = this.preFilterGain;

        for (const [key, soundFilter] of this._filters) {
            if (soundFilter.active) {
                lastNode.connect(soundFilter.filter);
                lastNode = soundFilter.filter;
            }
        }

        lastNode.connect(this.postFilterGain);
    }

    /**
     * @param {number} sampleSize
     */
    getWaveData(sampleSize) {
        if (!this.analyser) {
            throw new Error(`AudioContextの初期化が行われていません`);
        }
        this.analyser.fftSize = sampleSize;
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);

        return { bufferLength, dataArray };
    }

    /**
     * @param {string} key
     */
    get(key) {
        const track = this._tracks.get(key);
        if (track) return track;

        throw new Error(`"${key}" という名前の音楽ファイルは読み込まれていません`);
    }

    /**
     * @param {string} key
     */
    getFilter(key) {
        const filter = this._filters.get(key);
        if (filter) return filter;

        throw new Error(`"${key}" という名前の音楽フィルターは読み込まれていません`);
    }
}
const sounds = new SoundLoader();
