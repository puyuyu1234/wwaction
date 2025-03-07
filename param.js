//@ts-check
"use strict";

const BLOCKSIZE = 16;
class BlockData {
    /**
     * @param {number[]} frame
     * @param {number} type
     */
    constructor(frame, type) {
        this.frame = frame;
        this.type = type;
    }
}
class EntityData {
    /**
     * @param {string} key
     */
    constructor(key, cl) {
        this.key = key;
        this.cl = cl;
    }
}
class BGData {
    /**
     * @param {number[]} frame
     */
    constructor(frame) {
        this.frame = frame;
    }
}
const BLOCKDATA = {
    " ": new BlockData([0], 0),
    "a": new BlockData([1], 15),
    "b": new BlockData([2], 15),
    "c": new BlockData([3], 15),
    "d": new BlockData([4], 0),
    "e": new BlockData([5], 0),
    "f": new BlockData([6], 0),
    "g": new BlockData([7], 0),
    "h": new BlockData([8], 0),
    "i": new BlockData([9], 0),
    "j": new BlockData([10], 0),
    "k": new BlockData([11], 15),
    "l": new BlockData([12], 15),
    "m": new BlockData([13], 15),
    "n": new BlockData([14], 0),
    "o": new BlockData([15], 0),
    "p": new BlockData([16], 0),
    "q": new BlockData([17], 0),
    "r": new BlockData([18], 0),
    "s": new BlockData([19], 0),
    "t": new BlockData([20], 15),
    "u": new BlockData([21], 15),
    "v": new BlockData([22], 0),
    "w": new BlockData([23], 0),
    "x": new BlockData([24], 0),
    "y": new BlockData([25], 0),
    "z": new BlockData([26], 0),
};
const BGDATA = {
    " ": new BGData([30]),
    "a": new BGData([31]),
    "b": new BGData([32]),
    "c": new BGData([33]),
    "d": new BGData([34]),
    "e": new BGData([35]),
    "f": new BGData([36]),
    "g": new BGData([37]),
    "h": new BGData([38]),
    "i": new BGData([39]),
    "j": new BGData([40]),
    "k": new BGData([41]),
    "l": new BGData([42]),
    "m": new BGData([43]),
    "n": new BGData([44]),
    "o": new BGData([45]),
    "p": new BGData([46]),
    "q": new BGData([47]),
    "r": new BGData([48]),
    "s": new BGData([49]),
    "t": new BGData([50]),
    "u": new BGData([51]),
    "v": new BGData([52]),
    "w": new BGData([53]),
    "x": new BGData([54]),
    "y": new BGData([55]),
    "z": new BGData([56]),
};

class StageData {
    /**
     * @param {string[]} stage
     * @param {string[]} bg
     * @param {string[]} fg
     */
    constructor(stage, bg, fg) {
        this.stage = stage;
        this.bg = bg;
        this.fg = fg;
    }
}
const STAGEDATA = [
    new StageData(
        [
            "                                                            ",
            "                                                            ",
            "                                                            ",
            "                  d                                         ",
            "                 abc                                        ",
            "                 klm                                  e     ",
            "                 klm                                 abc    ",
            "            A    klm      np     nop e    np         klm    ",
            "          abbc   klm    abbbc   abbbbbbbbbbbbc      aklmc   ",
            "          kllm   klm    klllm   kllllllllllllm     akklmmc  ",
            "      ac  kllm   klm    klllm   kllllllllllllm fAd kkklmmm  ",
            " U f nkm aullmop klm  f klllm   kltbbbullllltbbbbbbbuklmmm  ",
            "bbbbbbbbbbbbbbbbbbbbbbbbklllm   klklllmlllllklllllllmklmmm  ",
            "llllllltbbulltbbbbulllllklllm   klklllmlllllklllllllmklmmm  ",
            "lllllllkltbbbbulllmlllllklllm   klklllmlllllklllllllmklmmm  ",
        ],
        ["a"],
        [""]
    ),
];
const FONT = "'MS Gothic', 'ＭＳ ゴシック', 'MS ゴシック', monospace";
