//@ts-check
"use strict";

class UITypeData {
    constructor(imageKey, animationKey, width, height) {
        this.imageKey = imageKey;
        this.animationKey = animationKey;
        this.width = width;
        this.height = height;
    }
}
/** @type {Object<string, UITypeData>} */
const UI_TYPE_DATA = {
    "w": new UITypeData("entity", "W", 16, 16),
    "a": new UITypeData("entity", "A", 16, 16),
    "s": new UITypeData("entity", "S", 16, 16),
    "d": new UITypeData("entity", "D", 16, 16),
    "+": new UITypeData("entity", "+", 16, 16),
    " ": new UITypeData("space", "space", 48, 16),
};
class UISprite extends SpriteActor {
    constructor(type, x, y) {
        const uiType = UI_TYPE_DATA[type];
        super(uiType.imageKey, new Rectangle(x, y, uiType.width, uiType.height));
        this.type = type;
        this.playAnimation(uiType.animationKey);
    }

    update(input) {
        switch (this.type) {
            case "w":
            case "a":
            case "s":
            case "d":
            case " ":
                const key = UI_TYPE_DATA[this.type].animationKey;
                if (input.getKey(this.type) > 0) this.playAnimation(key + "-pushed");
                else this.playAnimation(key);
                break;
        }
    }
}

class Talk extends LayerActor {
    constructor(text) {
        super(new Rectangle(0, 0, 0, 0));
        new RectActor("#000", new Rectangle(0, 0, 0, 0));
    }
}
