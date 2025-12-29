//@ts-check
"use strict";

const DEBUG = true;
const BLOCKSIZE = 16;
const HPDATA = [7, 5, 3, 5];
class BlockData {
  /**
   * @param {number[]} frame
   * @param {number} type
   */
  constructor(frame, type, param = {}) {
    this.frame = frame;
    this.type = type;
    this.param = param;
    this.freq = param?.freq;
    this.loop = param?.loop;
  }
}
/** @type {Record<string, BlockData>} */
const BLOCKDATA = {
  " ": new BlockData([0], 0),
  a: new BlockData([1], 1),
  b: new BlockData([2], 1),
  c: new BlockData([3], 1),
  d: new BlockData([4], 0),
  e: new BlockData([5], 0),
  f: new BlockData([6], 0),
  g: new BlockData([7], 15),
  h: new BlockData([8], 15),
  i: new BlockData([9], 15),
  j: new BlockData([10], 0),
  k: new BlockData([11], 0),
  l: new BlockData([12], 0),
  m: new BlockData([13], 0),
  n: new BlockData([14], 0),
  o: new BlockData([15], 0),
  p: new BlockData([16], 0),
  q: new BlockData([17], 15),
  r: new BlockData([18], 15),
  s: new BlockData([19], 15),
  t: new BlockData([20], 1),
  u: new BlockData([21], 1),
  v: new BlockData([22], 15),
  w: new BlockData([23], 15),
  x: new BlockData([24], 100, {
    hitbox: new Rectangle(1, 12, 14, 4),
    damage: 1,
  }),
  y: new BlockData([25], 0),
  z: new BlockData([26], 100, {
    hitbox: new Rectangle(1, 0, 14, 4),
    damage: 1,
  }),
  A: new BlockData([27], 15),
  B: new BlockData([28], 15),
  C: new BlockData([29], 15),
  D: new BlockData([30], 1),
  E: new BlockData([31], 1),
  F: new BlockData([32], 100, {
    hitbox: new Rectangle(12, 1, 4, 14),
    damage: 1,
  }),
  G: new BlockData([33], 100, {
    hitbox: new Rectangle(0, 1, 4, 14),
    damage: 1,
  }),
  H: new BlockData([34, 53, 54, 55], 200, {
    freq: 12,
    loop: true,
    layer: "top",
    alpha: 0.8,
  }),
  I: new BlockData([35], 200, {
    layer: "top",
    alpha: 0.8,
  }),
  J: new BlockData([36], 15),
  K: new BlockData([37], 15),
  L: new BlockData([38], 15),
  M: new BlockData([39], 15),
  N: new BlockData([40], 0),
  O: new BlockData([41], 0),
  P: new BlockData([42], 0),
  Q: new BlockData([43], 0),
  R: new BlockData([44], 0),
  S: new BlockData([45], 0),
  T: new BlockData([46], 0),
  U: new BlockData([47], 0),
  V: new BlockData([48], 0),
  W: new BlockData([49], 0),
  X: new BlockData([50], 0),
  Y: new BlockData([51], 0),
  Z: new BlockData([52], 0),
};

class StageData {
  /**
   * @param {string} name
   * @param {string} engName
   * @param {string[][]} stages
   * @param {string[]} bg
   * @param {string[]} fg
   */
  constructor(name, engName, stages, bg, fg, param = {}) {
    this.name = name;
    this.engName = engName;
    this.stages = stages;
    this.bg = bg;
    this.fg = fg;
    this.param = param;
  }
}
/** @type {StageData[]} */
let STAGEDATA = [];
const LoadStageData = () => {
  STAGEDATA = [
    new StageData(
      "",
      "",
      [
        [
          "                                                                    ",
          "                                                                    ",
          "                                                                    ",
          "                                                                    ",
          "                                                                    ",
          "                                                               ded 1",
          "                                                   f          abbbbb",
          "                                                 gbbbh        klllll",
          "                                 de              qlllr        klllll",
          "                               gbbbbh            qlllr      abbullll",
          " 0  de                gh       qllllr            qlllr      kllmllll",
          "bbbbbbh  nop      f  gish 1 nooqllllr      np   nqlllr nop  kllmllll",
          "llllllsbbbbbh   gbbbbillsbbbbbbillllr    gbbbbbbbbbbbbbbbbbbwllmllll",
          "llllltbbbullr   qlllllvbbbwlllllllllr    qllllllllllllllllllrllmllll",
          "lllllklllmllr   qlllllqlllrlllllllllr    qllllllllllllllllllrllmllll",
        ],
      ],
      ["y"],
      [""]
    ),
    new StageData(
      "チューリップ農園",
      "Tulip Plantation",
      [
        [
          "                                                                    ",
          "                                                                    ",
          "                                                                    ",
          "                                                                    ",
          "                                                                    ",
          "                                                                    ",
          "                                                    34              ",
          "                                                   abc              ",
          "                    2 edede2                       klm           gbb",
          "       np          gbbbbbbbbh                     abbbc          qll",
          " 0   nooop dfdfdf gillllllllr np   nop     2      klllm    nop   qll",
          "bbbbbbbbbbbbbbbbbbilllllllllsbbbbbbbbbbbbbbh  efe klllm   nooop2 qll",
          "lllllllltbbbbbullllllllllllllllllllllllllllsbbbbbbbbbbbbbbbbbbbbbill",
          "llllllllklltbbbbbullllllllltbbbbbullllltulllllllllllllllllllllllllll",
          "llllllllkllklllllmlllllllllklllllmlllltbbulllllltbbbbullllllllllllll",
        ],
      ],
      ["y"],
      [""]
      // { bgm: "bgm1" }
    ),
    new StageData(
      "",
      "",
      [
        [
          "                                                                      ",
          "                                                                      ",
          "                                                                      ",
          "                                                                      ",
          "                                                                      ",
          " 0  f                                                                 ",
          "bbbbbh                                                                ",
          "lllllsbh  nop2                          2 2 2 2 2 4 4                 ",
          "lllllllsbbbbbh efe 2222d                      fefefe                  ",
          "lllllllllllllsbbbbbbbbbbbh      nop         gbbbbbbbbh       ded   abb",
          "llllltbbbbbbullllllllllllr   gbbbbbbh     gbillllllllr noop gbbbh  kll",
          "lllllkllllllmllllllllllllr   qllllllsbbbbbillllllllllsbbbbbbilllr  kll",
          "lllllkllllllmlltbbbbbulllr   qllllllllllllllllllllllllllllllllllr  kll",
          "lllllkllllllmllklllllmullr   qllllllllllllllllllllllllllllllllllr  kll",
          "lllllkllllllmllklllllmmllr   qllllllllllllllllllllllllllllllllllr  kll",
        ],
      ],
      ["y"],
      [""]
    ),
    new StageData(
      "",
      "",
      [
        [
          "                                            gbbh        ",
          "                                            qllr        ",
          "                                            qllr        ",
          "                                            qllr        ",
          "                       3                    qllr        ",
          "                      abc                   qllr        ",
          "                      klm                   qllr        ",
          "                      DbE                   qllr      no",
          " 0 e                  klm             nop   qllr   abbbb",
          "bbbbc      4      4   klm        4  abbbbc4fqllr   kllll",
          "llllm d  abbc   abbc  klm  fef abc  kllltbbbLBBC   kllll",
          "llltbbc  kllm   kllm  DbbbbbbbbbbE  klllkllllm     kllll",
          "lllkllm  kllm   kllm  kllllllllllm  klltbbullm  4  kllll",
          "lllkllm  kllm   kllm  kllllllllllm  kllklltbbbbbbc kllll",
          "lllkllm  kllm   kllm  kllllllllllm  kllkllkllllllm kllll",
        ],
      ],
      ["y"],
      [""]
    ),
    new StageData(
      "",
      "",
      [
        [
          "                                                      gbbbbh      ",
          "                                                      qllllr      ",
          "                                                      qllllr      ",
          "                                                      qllllr      ",
          "                                                      qllllr      ",
          "                                                      qllllr      ",
          "                                                      qllllr      ",
          "op0                     ee   nop      4               qllllr      ",
          "bbbbbc                 gbbh gbbbh    gh    gbh4       ABBBBC      ",
          "lllllm                 qllr qlllrxxxxqrxxxxqlsh4       zzzz    de ",
          "lllllm   edede    4    qllr3qlllsbbbbisbbbbillsh4              gbb",
          "lllllm  gbbbbbhxxghxxgbillrxqllllllllllllllllllsh ff          gill",
          "lllllm  qlllllsbbisbbillllsbilllllllllllllllllllsbbbbbbh  gbbbilll",
          "llllvbbbillllllllllllllllllllllllllllllllllllllllllllllr  qlllllll",
          "llllqllllllllllllllllllllllllllllllllllllllllllllllllllr  qlllllll",
        ],
      ],
      ["y"],
      [""]
    ),
    new StageData(
      "",
      "",
      [
        [
          "                                                                  ",
          "                                                                  ",
          "                                                                  ",
          "                                                                  ",
          "                                                                  ",
          "                                                                  ",
          "                                                         np       ",
          "        ded4                                         gbbbbbbh     ",
          "       abbbc         fdfdf                     gbbh  qllllllr     ",
          " 0     klllm        abbbbbc    np  4           qllr  ABBBBJlr     ",
          "bbbh   klllm        klllllm  gbbbbbbhx         qllr       qlr  abb",
          "lllr   klllmnop4 4  klllllm  qllllllsbhx  x  x4qllr       qlr  kll",
          "lllsbh kllltbbbbbc  klllllm  qlltbulllsbbbbbbbbillr    33 qlr  kll",
          "lllllr klllklllllm  klllllm  qllklmlllllllllllllllr   gbbbilr  kll",
          "lllllr klllklllllm  klllllm  qllklmlllllllllllllllr   qlllllr  kll",
        ],
      ],
      ["y"],
      [""]
    ),
    new StageData(
      "",
      "",
      [
        [
          "                    ",
          "                    ",
          "                    ",
          "                    ",
          "                    ",
          "                    ",
          "                    ",
          "                    ",
          "                    ",
          " 0                  ",
          "bbc          *   abb",
          "llm              kll",
          "llm abbbbbbbbbbc kll",
          "llm kllllllllllm kll",
          "llm kllllllllllm kll",
        ],
      ],
      ["y"],
      [""],
      { boss: DekaNasake }
    ),
    new StageData(
      "",
      "",
      [
        [
          "                                                                     ",
          "                                                                     ",
          "                           2d 2                                      ",
          "                           gbbh       xx                             ",
          "                           qllr      Fgh                             ",
          "                      4  noqllr      Fqr                             ",
          "                      abbbbqllr      FAC          efef4              ",
          "                      kllllqllr   abbbbc         abbbbc              ",
          "                    4 kllllqllr   kllllm        4kllllm4np           ",
          " 0  d               abbbbbbqllr   kllllm     abbbbulltbbbbc          ",
          "bbbbbc   e4         kllllllqllr   kllllm4nop kllllmllkllllm  4       ",
          "lllllm abbc   f4  4 kllllllqllr   Dbbbbbbbbbbbulllmllkllltbbbbc   gbb",
          "lllllm kllm abbc  gbbbbbbbbillr   klllllllllllmlllmllklllkllllm   qll",
          "lllllm kllm kllm  qlllllllllllr   klllllllllllmlllmllklllkllllm   qll",
          "lllllm kllm kllm  qlllllllllllr   klllllllllllmlllmllklllkllllm   qll",
        ],
      ],
      ["y"],
      [""]
    ),
    new StageData(
      "",
      "",
      [
        [
          "                                                       ",
          "                                                       ",
          "                                                       ",
          "                                                       ",
          "                                                       ",
          "                                                       ",
          "                                                       ",
          "            dfd                    4                   ",
          "       ede  gbh                dfdfdf             4    ",
          "       gbh  qlr    nop 5      gbbbbbbh           gh    ",
          " 0     qlr  qlr   gbbbbbh     qllllllr   gh 3    qr fe ",
          "bbbbhxxqlrxxqlrxxxqlllllr d 5 qllllllrxxxqrxxxgbbisbbbb",
          "llllsbbilsbbilsbbbilllllsbbbbbillllllsbbbisbbbillllllll",
          "lllllllllllllllllllllllllllllllllllllllllllllllllllllll",
          "lllllllllllllllllllllllllllllllllllllllllllllllllllllll",
        ],
      ],
      ["y"],
      [""]
    ),
    new StageData(
      "",
      "",
      [
        [
          "             ABBBBJl",
          "                  ql",
          "                  ql",
          "                  ql",
          "                  ql",
          "          noop    ql",
          "  FgbhG  gbbbbbhG ql",
          "  FqlrG  qllllKCG ql",
          "  FqlrG  qllllrz  ql",
          "  FqlrG  ABBJlr   ql",
          "  FqlrG    Fqlr   ql",
          " 4FqlrG    Fqlr   ql",
          " 3FqlrG    Fqlr   ql",
          " gbilsbbh  Fqlr   ql",
          " ABJllllr  Fqlr  xql",
          "   qllllr  Fqlr Fgil",
          "   qllllr   qlr FABB",
          "   qllllr   qlr     ",
          "   ABBBBC   qlr     ",
          "            qlr     ",
          "            qlr     ",
          "            qlr     ",
          "            qlr     ",
          "      gbh   qlr     ",
          "      qlrxxxqlr     ",
          "      qlsbbbilr     ",
          "      qlllllllr     ",
          "      qlllllllr     ",
          "      qlllllllr     ",
          " 0  f qlllllllr ded ",
          "bbbbbbilllllllsbbbbb",
          "llllllllllllllllllll",
          "llllllllllllllllllll",
          "llllllllllllllllllll",
        ],
      ],
      ["y"],
      [""]
    ),
    new StageData(
      "",
      "",
      [
        [
          "                                                              ",
          "               xxxxxxxx                                       ",
          "               gbbbbbbh                                       ",
          "               qlKBBJlr                                       ",
          "        nop 5  qlrzzqlr    nop                                ",
          "      gbbbbbh  qlr 1qlr  gbbbbbh      gbh                     ",
          "      qlllllr  qlsbbilr  qlllllr      qlsh                    ",
          "      ABJlKBC  ABBBBBBC  ABJlllr      qllsh                   ",
          "        qlr                qlllr      qlllsh                  ",
          "        qlr                qlllr      qllllsh                 ",
          " 0fdfdf qlr  gh   gh   gh  qlllr      qlllllsh     5      np  ",
          "bbbbbbbbilr  qr   qr   AC  qlllr      qllllllsh 53ede35 gbbbbb",
          "llllllllllr  qr   qr       qlllr      qlllllllsbbbbbbbbbilllll",
          "llllllllllr  qr   qr       qlllr      qlllllllllllllllllllllll",
          "llllllllllr  qr   qr       qlllr      qlllllllllllllllllllllll",
        ],
      ],
      ["y"],
      [""]
    ),
    new StageData(
      "",
      "",
      [
        [
          "BBBBBBBBBBBBBBBJllll",
          "               qllll",
          "               qllll",
          "               qllll",
          "               qllll",
          "               qllll",
          "               qllll",
          "               qllll",
          "               qllll",
          "               qllll",
          " 0    np edede qllll",
          "bbbbbbbbbbbbbbbillll",
          "llllllllllllllllllll",
          "llllllllllllllllllll",
          "llllllllllllllllllll",
        ],
      ],
      ["y"],
      [""],
      { boss: DekaNasake }
    ),
    new StageData(
      "",
      "",
      [
        [
          "                                        ",
          "                                        ",
          "                                        ",
          "                                        ",
          "                                        ",
          "                                        ",
          "                                        ",
          "                                  gbbbbb",
          "                                  qlllll",
          "                    gbbbbh        ABJlll",
          "  0   gh          gbillllr        zzqlll",
          "bbbbbbirHHHHHHHHgbillllllrHHHHHHHHHHqlll",
          "lllllllsbbbbbbbbillllllllrIIIIIIIIIIqlll",
          "lllllllllllllllllllllllllrIIIIIIIIIIqlll",
          "lllllllllllllllllllllllllrIIIIIIIIIIqlll",
        ],
      ],
      [" "],
      [""]
    ),
  ];
};
LoadStageData();
const FONT = "'MS Gothic', 'ＭＳ ゴシック', 'MS ゴシック', monospace";

const addEntityData = () => {
  Object.entries(ENTITYDATA).forEach(([key, entityData]) => {
    BLOCKDATA[key] = new BlockData([], 0);
  });
};

addEntityData();

class TalkText {
  constructor(name, text) {
    this.name = name;
    this.text = text;
  }
}
const TALKTEXT = {
  kami: [
    new TalkText(
      "ウォールウィンディ",
      "ああああああああああああああ\nこれはテストです\nああああああ"
    ),
    new TalkText(
      "？？？",
      "テストテストテストテストテスト\n 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 "
    ),
  ],
};
