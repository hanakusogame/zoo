"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Button_1 = require("./Button");
var Panel_1 = require("./Panel");
var Config_1 = require("./Config");
var MainScene = /** @class */ (function (_super) {
    __extends(MainScene, _super);
    function MainScene(param) {
        var _this = this;
        param.assetIds = [
            "img_numbers_n", "img_numbers_n_red", "title", "start", "finish", "combo", "waku", "waku2", "score", "time",
            "test", "glyph72", "number_p", "number_b",
            "panel", "mate", "config", "volume", "theme_dialog", "theme_area",
            "se_start", "se_timeup", "move", "bgm", "clear", "miss"
        ];
        _this = _super.call(this, param) || this;
        var tl = require("@akashic-extension/akashic-timeline");
        var timeline = new tl.Timeline(_this);
        var timeline2 = new tl.Timeline(_this);
        var isDebug = false; //リリース前は必ずfalseに戻すこと
        _this.loaded.add(function () {
            g.game.vars.gameState = { score: 0 };
            // 何も送られてこない時は、標準の乱数生成器を使う
            var random = g.game.random;
            var isStart = false;
            _this.message.add(function (msg) {
                if (msg.data && msg.data.type === "start" && msg.data.parameters) {
                    var sessionParameters = msg.data.parameters;
                    if (sessionParameters.randomSeed != null) {
                        // プレイヤー間で共通の乱数生成器を生成
                        // `g.XorshiftRandomGenerator` は Akashic Engine の提供する乱数生成器実装で、 `g.game.random` と同じ型。
                        random = new g.XorshiftRandomGenerator(sessionParameters.randomSeed);
                    }
                }
            });
            // 配信者のIDを取得
            _this.lastJoinedPlayerId = "";
            g.game.join.add(function (ev) {
                _this.lastJoinedPlayerId = ev.player.id;
            });
            // 背景
            var bg = new g.FilledRect({ scene: _this, width: 640, height: 360, cssColor: "gray", opacity: 0 });
            _this.append(bg);
            if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
                bg.opacity = 1.0;
                bg.modified();
            }
            var base = new g.E({ scene: _this });
            _this.append(base);
            base.hide();
            var uiBase = new g.E({ scene: _this });
            _this.append(uiBase);
            uiBase.hide();
            //タイトル
            var sprTitle = new g.Sprite({ scene: _this, src: _this.assets["title"], x: 70 });
            _this.append(sprTitle);
            timeline.create(sprTitle, {
                modified: sprTitle.modified, destroyd: sprTitle.destroyed
            }).wait(5000).moveBy(-800, 0, 200).call(function () {
                bg.show();
                base.show();
                uiBase.show();
                isStart = true;
                reset();
            });
            //テーマ変更用
            var dialogTheme = new g.Sprite({ scene: _this, x: -60, y: 250, src: _this.assets["theme_dialog"], touchable: true });
            sprTitle.append(dialogTheme);
            var areaTheme = new g.Sprite({ scene: _this, x: 135, y: 10, src: _this.assets["theme_area"] });
            dialogTheme.append(areaTheme);
            dialogTheme.pointDown.add(function (e) {
                if (e.point.x > 130) {
                    var num_1 = Math.floor((e.point.x - 130) / 165);
                    areaTheme.x = 135 + (num_1 * 155);
                    areaTheme.modified();
                    panels.forEach(function (panel) {
                        panel.setTheme(num_1);
                    });
                    sprHints.forEach(function (panel) {
                        panel.setTheme(num_1);
                    });
                }
            });
            var glyph = JSON.parse(_this.assets["test"].data);
            var numFont = new g.BitmapFont({
                src: _this.assets["img_numbers_n"],
                map: glyph.map,
                defaultGlyphWidth: glyph.width,
                defaultGlyphHeight: glyph.height,
                missingGlyph: glyph.missingGlyph
            });
            var numFontRed = new g.BitmapFont({
                src: _this.assets["img_numbers_n_red"],
                map: glyph.map,
                defaultGlyphWidth: glyph.width,
                defaultGlyphHeight: glyph.height,
                missingGlyph: glyph.missingGlyph
            });
            glyph = JSON.parse(_this.assets["glyph72"].data);
            var numFontP = new g.BitmapFont({
                src: _this.assets["number_p"],
                map: glyph.map,
                defaultGlyphWidth: 72,
                defaultGlyphHeight: 80
            });
            glyph = JSON.parse(_this.assets["glyph72"].data);
            var numFontB = new g.BitmapFont({
                src: _this.assets["number_b"],
                map: glyph.map,
                defaultGlyphWidth: 72,
                defaultGlyphHeight: 80
            });
            //スコア
            uiBase.append(new g.Sprite({ scene: _this, src: _this.assets["score"], x: 410, y: 6, height: 32 }));
            var score = 0;
            var labelScore = new g.Label({
                scene: _this,
                x: 312,
                y: 45,
                width: 32 * 10,
                fontSize: 32,
                font: numFont,
                text: "0P",
                textAlign: g.TextAlign.Right, widthAutoAdjust: false
            });
            uiBase.append(labelScore);
            var labelScorePlus = new g.Label({
                scene: _this,
                x: 312,
                y: 80,
                width: 32 * 10,
                fontSize: 32,
                font: numFontRed,
                text: "+1000",
                textAlign: g.TextAlign.Right, widthAutoAdjust: false
            });
            uiBase.append(labelScorePlus);
            //ヒント
            var labelHint = new g.Sprite({ scene: _this, src: _this.assets["score"], x: 410, y: 250, height: 32, srcY: 32 });
            uiBase.append(labelHint);
            //ヒント用パネル
            var sprHints = [];
            for (var i = 0; i < 7; i++) {
                var panel = new Panel_1.Panel(_this, 0);
                panel.moveTo(100 + (150 / 7 * i), 10);
                labelHint.append(panel);
                sprHints.push(panel);
                //panel.hide();
            }
            //最大連鎖
            uiBase.append(new g.Sprite({ scene: _this, src: _this.assets["score"], x: 410, y: 290, height: 32, srcY: 64 }));
            var labelMaxRen = new g.Label({
                scene: _this, font: numFont, fontSize: 32, text: "0", x: 450, y: 323,
                width: 32 * 2, textAlign: g.TextAlign.Right, widthAutoAdjust: false
            });
            uiBase.append(labelMaxRen);
            //タイム
            uiBase.append(new g.Sprite({ scene: _this, src: _this.assets["time"], x: 540, y: 320 }));
            var labelTime = new g.Label({ scene: _this, font: numFont, fontSize: 32, text: "70", x: 580, y: 323 });
            uiBase.append(labelTime);
            //同時消し表示
            var sprCombo = new g.Sprite({ scene: _this, src: _this.assets["combo"], x: 120, y: 20, width: 135, height: 40 });
            var labelCombo = new g.Label({
                scene: _this, font: numFontB, fontSize: 60, text: "99", x: 390, y: 110,
                width: 60 * 2, textAlign: g.TextAlign.Right, widthAutoAdjust: false
            });
            uiBase.append(labelCombo);
            labelCombo.append(sprCombo);
            //連鎖表示
            var sprRen = new g.Sprite({ scene: _this, src: _this.assets["combo"], x: 120, y: 20, width: 135, height: 40, srcY: 40 });
            var labelRen = new g.Label({
                scene: _this, font: numFontP, fontSize: 60, text: "99", x: 390, y: 180,
                width: 60 * 2, textAlign: g.TextAlign.Right, widthAutoAdjust: false
            });
            uiBase.append(labelRen);
            labelRen.append(sprRen);
            //詰み表示
            var sprMate = new g.Sprite({ scene: _this, src: _this.assets["mate"], x: 130, y: 100 });
            uiBase.append(sprMate);
            //開始
            var sprStart = new g.Sprite({ scene: _this, src: _this.assets["start"], x: 50, y: 100 });
            uiBase.append(sprStart);
            sprStart.hide();
            //終了
            var finishBase = new g.E({ scene: _this, x: 0, y: 0 });
            _this.append(finishBase);
            finishBase.hide();
            var finishBg = new g.FilledRect({ scene: _this, width: 640, height: 360, cssColor: "#000000", opacity: 0.3 });
            finishBase.append(finishBg);
            var sprFinish = new g.Sprite({ scene: _this, src: _this.assets["finish"], x: 120, y: 100 });
            finishBase.append(sprFinish);
            //最前面
            var fg = new g.FilledRect({ scene: _this, width: 640, height: 480, cssColor: "#ff0000", opacity: 0.0 });
            _this.append(fg);
            //リセットボタン
            var btnReset = new Button_1.Button(_this, ["リセット"], 500, 270, 130);
            if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
                finishBase.append(btnReset);
                btnReset.pushEvent = function () {
                    reset();
                };
            }
            //ランキングボタン
            var btnRanking = new Button_1.Button(_this, ["ランキング"], 500, 200, 130);
            if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
                finishBase.append(btnRanking);
                btnRanking.pushEvent = function () {
                    window.RPGAtsumaru.experimental.scoreboards.display(1);
                };
            }
            //設定ボタン
            var btnConfig = new g.Sprite({ scene: _this, x: 600, y: 0, src: _this.assets["config"], touchable: true });
            if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
                _this.append(btnConfig);
            }
            //設定画面
            var config = new Config_1.Config(_this, 380, 40);
            if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
                _this.append(config);
            }
            config.hide();
            btnConfig.pointDown.add(function () {
                if (config.state & 1) {
                    config.show();
                }
                else {
                    config.hide();
                }
            });
            config.bgmEvent = function (num) {
                bgm.changeVolume(0.5 * num);
            };
            config.colorEvent = function (str) {
                bg.cssColor = str;
                bg.modified();
            };
            config.themeEvent = function (num) {
                panels.forEach(function (e) {
                    e.setTheme(num);
                });
                sprHints.forEach(function (e) {
                    e.setTheme(num);
                });
            };
            var playSound = function (name) {
                _this.assets[name].play().changeVolume(config.volumes[1]);
            };
            var bgm = _this.assets["bgm"].play();
            bgm.changeVolume(0.2);
            var size = 340;
            var mapX = 8;
            var mapY = 7;
            var panelSize = size / mapY;
            var margin = 10;
            var theme = 0;
            var waku = new g.Sprite({ scene: _this, src: _this.assets["waku"], x: 0, y: 0 });
            base.append(waku);
            waku.hide();
            var waku2 = new g.Sprite({ scene: _this, src: _this.assets["waku2"], x: 0, y: 0 });
            waku.append(waku2);
            var mapBase = new g.E({ scene: _this, x: margin, y: margin, width: panelSize * mapX, height: panelSize * mapY, touchable: true });
            base.append(mapBase);
            //マップ
            var maps = [];
            for (var y = 0; y < mapY; y++) {
                maps.push([]);
                for (var x = 0; x < mapX; x++) {
                    var map = new Map({
                        scene: _this, x: x * panelSize, y: y * panelSize, width: panelSize - 2, height: panelSize - 2, cssColor: "black"
                    });
                    maps[y].push(map);
                    //mapBase.append(map);
                }
            }
            //パネル
            var panels = [];
            for (var i = 0; i < mapX * mapY; i++) {
                var panel = new Panel_1.Panel(_this, panelSize - 4);
                mapBase.append(panel);
                panels.push(panel);
                panel.hide();
            }
            //押したとき
            var isPush = false;
            mapBase.pointDown.add(function (ev) {
                if (!isStart)
                    return;
                var x = Math.floor(ev.point.x / panelSize);
                var y = Math.floor(ev.point.y / panelSize);
                isPush = true;
            });
            //動かしたとき
            mapBase.pointMove.add(function (ev) {
                if (!isPush)
                    return;
                var px = Math.floor(ev.point.x / panelSize);
                var py = Math.floor(ev.point.y / panelSize);
                var x = 0;
                var y = 0;
                var limit = 20; //移動のしきい値
                if (ev.startDelta.x < -limit)
                    x = -1;
                else if (ev.startDelta.x > limit)
                    x = 1;
                else if (ev.startDelta.y < -limit)
                    y = -1;
                else if (ev.startDelta.y > limit)
                    y = 1;
                if ((x !== 0 || y !== 0) && chkArea(px + x, py + y)) {
                    var mapSrc = maps[py][px];
                    var mapDst = maps[py + y][px + x];
                    if (mapSrc.match === 0 && mapDst.match === 0 && (chkMove(px, py, x, y) || chkMove(px + x, py + y, -x, -y))) {
                        _a = [mapDst.num, mapSrc.num], mapSrc.num = _a[0], mapDst.num = _a[1]; //入れ替え
                        [mapSrc, mapDst].forEach(function (map) {
                            var p = panels[map.num];
                            timeline.create(p, { modified: p.modified, destroyed: p.destroyed }).moveTo(map.x, map.y, 100);
                        });
                        if (!isMove) {
                            move();
                        }
                        playSound("move");
                    }
                    else {
                        //入れ替えられない
                        [mapSrc, mapDst].forEach(function (map) {
                            var p = panels[map.num];
                            timeline.create(p, { modified: p.modified, destroyed: p.destroyed }).rotateTo(45, 50).wait(100)
                                .rotateTo(0, 50);
                        });
                        playSound("miss");
                    }
                    isPush = false;
                }
                var _a;
            });
            //メインループ
            var bkTime = 0;
            var timeLimit = 70;
            var startTime = 0;
            _this.update.add(function () {
                //return;//デバッグ用
                if (!isStart)
                    return;
                var t = timeLimit - Math.floor((Date.now() - startTime) / 1000);
                //終了処理
                if (t <= -1) {
                    fg.cssColor = "#000000";
                    fg.opacity = 0.0;
                    fg.modified();
                    finishBase.show();
                    isStart = false;
                    playSound("se_timeup");
                    timeline.create().wait(1500).call(function () {
                        if (typeof window !== "undefined" && window.RPGAtsumaru) {
                            if (g.game.vars.gameState.score < 10000000) {
                                window.RPGAtsumaru.experimental.scoreboards.setRecord(1, g.game.vars.gameState.score).then(function () {
                                    btnRanking.show();
                                    btnReset.show();
                                });
                            }
                        }
                        if (isDebug) {
                            btnRanking.show();
                            btnReset.show();
                        }
                    });
                    return;
                }
                labelTime.text = "" + t;
                labelTime.invalidate();
                if (bkTime !== t && t <= 5) {
                    fg.opacity = 0.1;
                    fg.modified();
                    timeline.create().wait(500).call(function () {
                        fg.opacity = 0.0;
                        fg.modified();
                    });
                }
                bkTime = t;
            });
            //スコア加算表示
            var bkTweenScore;
            var addScore = function (num) {
                if (score + num < 0) {
                    num = -score;
                }
                score += num;
                timeline.create().every(function (e, p) {
                    labelScore.text = "" + (score - Math.floor(num * (1 - p))) + "P";
                    labelScore.invalidate();
                }, 400);
                labelScorePlus.text = "+" + num;
                labelScorePlus.invalidate();
                if (bkTweenScore)
                    timeline2.remove(bkTweenScore);
                bkTweenScore = timeline2.create().every(function (e, p) {
                    labelScorePlus.opacity = p;
                    labelScorePlus.modified();
                }, 100).wait(4000).call(function () {
                    labelScorePlus.opacity = 0;
                    labelScorePlus.modified();
                });
                g.game.vars.gameState.score = score;
            };
            //揃っているか確認
            var dx = [0, 1, 0, -1];
            var dy = [1, 0, -1, 0];
            var chkMatch = function () {
                for (var y = 0; y < mapY; y++)
                    for (var x = 0; x < mapX; x++)
                        maps[y][x].match = 0;
                var chkSub = function (x, y, num, cnt, pos) {
                    if (!(x >= 0 && x < mapX && y >= 0 && y < mapY)
                        || panels[maps[y][x].num].num !== num)
                        return cnt;
                    var xx = x + dx[pos];
                    var yy = y + dy[pos];
                    var i = chkSub(xx, yy, num, cnt + 1, pos);
                    if (i > 2) {
                        maps[y][x].match = pos + 1;
                    }
                    return i;
                };
                var isMatch = false;
                for (var y = 0; y < mapY; y++) {
                    for (var x = 0; x < mapX; x++) {
                        for (var i = 0; i < 2; i++) {
                            var num = chkSub(x, y, panels[maps[y][x].num].num, 0, i);
                            if (num > 2)
                                isMatch = true;
                        }
                    }
                }
                return isMatch;
            };
            //消して移動
            var isMove = false;
            var moveTime = 150;
            var clearTime = 600;
            var renCnt = 0;
            var comboTime = 0;
            var comboLimit = 2000;
            var bkTweenCombo;
            var bkTweenRen;
            var maxRen = 0;
            var move = function () {
                if (isMove)
                    return;
                isMove = true;
                if (!chkMatch() || !isStart) {
                    isMove = false;
                    //詰み
                    if (chkMate()) {
                        sprMate.opacity = 1;
                        sprMate.modified();
                        timeline.create().wait(1500).call(function () {
                            sprMate.opacity = 0;
                            sprMate.modified();
                            resetMap();
                        });
                        playSound("miss");
                    }
                    return;
                }
                var list = [];
                var clearCnt = 0; //消したパネルカウンタ
                for (var x = 0; x < mapX; x++) {
                    var cnt = 0;
                    var _loop_1 = function (y) {
                        if (maps[y][x].match !== 0) {
                            clearCnt++;
                            //消す処理
                            var panel_1 = panels[maps[y][x].num];
                            mapBase.append(panel_1);
                            timeline.create().wait(clearTime / 6).call(function () {
                                panel_1.setNum(panel_1.num + 8);
                                panel_1.modified();
                            }).wait(clearTime / 2).call(function () {
                                panel_1.setNum(7);
                            }).wait(clearTime / 6).call(function () {
                                panel_1.setNum(15);
                            });
                            cnt++;
                        }
                        else {
                            //ずらす処理
                            var map_1 = maps[y][x];
                            var mapd_1 = maps[y + cnt][x];
                            if (cnt > 0) {
                                var panel = panels[map_1.num];
                                timeline.create(panel, { modified: panel.modified, destroyed: panel.destroyed })
                                    .wait(clearTime).call(function () {
                                    _a = [map_1.num, mapd_1.num], mapd_1.num = _a[0], map_1.num = _a[1];
                                    _b = [map_1.match, mapd_1.match], mapd_1.match = _b[0], map_1.match = _b[1];
                                    var _a, _b;
                                }).moveTo(mapd_1.x, mapd_1.y, moveTime)
                                    .call(function () {
                                    var p = panels[mapd_1.num];
                                    p.moveTo(mapd_1.x, mapd_1.y);
                                    p.show();
                                });
                            }
                            else {
                                timeline.create()
                                    .wait(clearTime + moveTime)
                                    .call(function () {
                                    var p = panels[mapd_1.num];
                                    p.moveTo(mapd_1.x, mapd_1.y);
                                    p.show();
                                });
                            }
                        }
                    };
                    for (var y = mapY - 1; 0 <= y; y--) {
                        _loop_1(y);
                    }
                    list.push(cnt);
                }
                //上に空いたマスを埋める
                timeline.create().wait(clearTime).call(function () {
                    for (var x = 0; x < mapX; x++) {
                        for (var y = 0; y < mapY; y++) {
                            var map = maps[y][x];
                            if (map.match === 0)
                                break;
                            var panel = panels[maps[y][x].num];
                            panel.setNum(random.get(0, 6));
                            panel.moveTo(map.x, map.y - (list[x] * panelSize));
                            timeline.create(panel, { modified: panel.modified, destroyed: panel.destroyed }).moveTo(map.x, map.y, moveTime);
                            panel.modified();
                            panel.show();
                        }
                    }
                });
                timeline.create().wait(clearTime).call(function () {
                    //コンボ表示
                    if ((Date.now() - comboTime) < comboLimit) {
                        renCnt++;
                        if (renCnt >= 2) {
                            labelRen.text = "" + renCnt;
                            labelRen.invalidate();
                            if (bkTweenRen)
                                timeline2.remove(bkTweenRen);
                            bkTweenRen = timeline2.create().every(function (a, b) {
                                labelRen.opacity = b;
                                labelRen.modified();
                            }, 100).wait(2000).call(function () {
                                labelRen.opacity = 0;
                                labelRen.invalidate();
                            });
                            if (renCnt > maxRen) {
                                maxRen = renCnt;
                                labelMaxRen.text = "" + maxRen;
                                labelMaxRen.invalidate();
                            }
                        }
                    }
                    else {
                        if (bkTweenRen)
                            timeline2.remove(bkTweenRen);
                        labelRen.opacity = 0;
                        labelRen.modified();
                        renCnt = 1;
                    }
                    comboTime = Date.now();
                    labelHint.hide();
                    //消した数表示
                    labelCombo.text = "" + clearCnt;
                    labelCombo.invalidate();
                    if (bkTweenCombo)
                        timeline2.remove(bkTweenCombo);
                    bkTweenCombo = timeline2.create().every(function (a, b) {
                        labelCombo.opacity = b;
                        labelCombo.modified();
                        waku2.opacity = b / 2;
                        waku2.modified();
                    }, 100).wait(2000).call(function () {
                        labelCombo.opacity = 0;
                        labelCombo.invalidate();
                        waku2.opacity = 0;
                        waku2.modified();
                    }).wait(3000).call(function () {
                        chkHint();
                    });
                    addScore(clearCnt * 30 + Math.pow(clearCnt - 3, 2) * 10 + (renCnt * renCnt) * 20);
                    playSound("clear");
                }).wait(moveTime + 100).call(function () {
                    isMove = false;
                    move();
                });
            };
            var chkArea = function (x, y) {
                return (x >= 0 && x < mapX && y >= 0 && y < mapY);
            };
            //移動可否判定1ブロック分
            var chkMoveSub = function (x, y) {
                var num = panels[maps[y][x].num].num;
                var flg = false;
                var _loop_2 = function (j) {
                    var cnt = 1;
                    [-1, 1].forEach(function (k) {
                        var p = 1;
                        while (true) {
                            var yy = y + (dy[j] * k * p);
                            var xx = x + (dx[j] * k * p);
                            if (!chkArea(xx, yy))
                                break;
                            var n = panels[maps[yy][xx].num].num;
                            if (n !== num)
                                break;
                            cnt++;
                            p++;
                        }
                    });
                    if (cnt >= 3) {
                        flg = true;
                        return "break";
                    }
                };
                for (var j = 0; j < 2; j++) {
                    var state_1 = _loop_2(j);
                    if (state_1 === "break")
                        break;
                }
                return flg;
            };
            //移動可否判定
            var chkMove = function (x, y, mx, my) {
                var yy = y + my;
                var xx = x + mx;
                if (!chkArea(xx, yy))
                    return false;
                var map = maps[y][x];
                var mapd = maps[yy][xx];
                if (panels[map.num].num >= 7 || panels[mapd.num].num >= 7)
                    return false;
                _a = [map.num, mapd.num], mapd.num = _a[0], map.num = _a[1];
                var flg = chkMoveSub(xx, yy);
                _b = [map.num, mapd.num], mapd.num = _b[0], map.num = _b[1]; //戻す
                //console.log(flg);
                return flg;
                var _a, _b;
            };
            //詰み判定
            var chkMate = function () {
                for (var y = 0; y < mapY; y++) {
                    for (var x = 0; x < mapX; x++) {
                        for (var i = 0; i < 4; i++) {
                            if (chkMove(x, y, dx[i], dy[i]))
                                return false;
                        }
                    }
                }
                return true;
            };
            //ヒント用揃う種類判定
            var arrHint = [];
            var chkHint = function () {
                arrHint.length = 0;
                for (var y = 0; y < mapY; y++) {
                    for (var x = 0; x < mapX; x++) {
                        for (var i = 0; i < 4; i++) {
                            if (chkMove(x, y, dx[i], dy[i])) {
                                var num = panels[maps[y][x].num].num;
                                var index = arrHint.indexOf(num);
                                if (index === -1) {
                                    arrHint.push(num);
                                }
                                break;
                            }
                        }
                    }
                }
                if (arrHint.length === 0)
                    return;
                sprHints.forEach(function (e) { e.hide(); });
                for (var i = 0; i < arrHint.length; i++) {
                    sprHints[i].setNum(arrHint[i]);
                    sprHints[i].show();
                    sprHints[i].x = 100 + (150 / arrHint.length * i);
                    sprHints[i].modified();
                }
                labelHint.show();
            };
            //盤面のリセット
            var resetMap = function () {
                var i = 0;
                for (var y = 0; y < mapY; y++) {
                    for (var x = 0; x < mapX; x++) {
                        var map = maps[y][x];
                        var p = panels[i];
                        p.moveTo(map.x, -100 - random.get(0, 100));
                        p.setNum(random.get(0, 6));
                        p.show();
                        timeline.create(p, { modified: p.modified, destroyed: p.destroyed }).moveTo(map.x, map.y, 300);
                        map.num = i;
                        i++;
                    }
                }
                isMove = false;
                renCnt = 0;
                timeline.create().wait(300).call(function () {
                    move();
                });
                waku2.opacity = 0;
            };
            //リセット
            var reset = function () {
                bkTime = 0;
                startTime = Date.now();
                isStart = true;
                score = 0;
                labelScore.text = "0P";
                finishBase.hide();
                labelScore.invalidate();
                labelScorePlus.text = "";
                labelScorePlus.invalidate();
                sprStart.show();
                timeline.create().wait(750).call(function () {
                    sprStart.hide();
                });
                btnReset.hide();
                btnRanking.hide();
                fg.opacity = 0;
                fg.modified();
                renCnt = 0;
                maxRen = 0;
                labelMaxRen.text = "0";
                labelMaxRen.invalidate();
                labelHint.hide();
                labelCombo.opacity = 0;
                labelCombo.modified();
                labelRen.opacity = 0;
                labelRen.modified();
                sprMate.opacity = 0;
                sprMate.modified();
                waku.show();
                waku2.opacity = 0;
                playSound("se_start");
                startTime = Date.now();
                resetMap();
            };
        });
        return _this;
    }
    return MainScene;
}(g.Scene));
exports.MainScene = MainScene;
var Map = /** @class */ (function (_super) {
    __extends(Map, _super);
    function Map(param) {
        var _this = _super.call(this, param) || this;
        _this.num = 0;
        _this.match = 0;
        return _this;
    }
    return Map;
}(g.FilledRect));
