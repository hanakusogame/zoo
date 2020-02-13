import { Button } from "./Button";
import { Panel } from "./Panel";
import { Config } from "./Config";
declare function require(x: string): any;
export class MainScene extends g.Scene {
	public lastJoinedPlayerId: string; // 配信者のID
	private font: g.Font;

	constructor(param: g.SceneParameterObject) {
		param.assetIds = [
			"img_numbers_n", "img_numbers_n_red", "title", "start", "finish", "combo", "waku", "waku2", "score", "time",
			"test", "glyph72", "number_p", "number_b",
			"panel", "mate", "config", "volume", "theme_dialog", "theme_area",
			"se_start", "se_timeup", "move", "bgm", "clear", "miss"];
		super(param);

		const tl = require("@akashic-extension/akashic-timeline");
		const timeline = new tl.Timeline(this);
		const timeline2 = new tl.Timeline(this);
		const isDebug = false;//リリース前は必ずfalseに戻すこと

		this.loaded.add(() => {

			g.game.vars.gameState = { score: 0 };

			// 何も送られてこない時は、標準の乱数生成器を使う
			let random = g.game.random;
			let isStart = false;

			this.message.add((msg) => {
				if (msg.data && msg.data.type === "start" && msg.data.parameters) { // セッションパラメータのイベント
					const sessionParameters = msg.data.parameters;
					if (sessionParameters.randomSeed != null) {
						// プレイヤー間で共通の乱数生成器を生成
						// `g.XorshiftRandomGenerator` は Akashic Engine の提供する乱数生成器実装で、 `g.game.random` と同じ型。
						random = new g.XorshiftRandomGenerator(sessionParameters.randomSeed);
					}
				}
			});

			// 配信者のIDを取得
			this.lastJoinedPlayerId = "";
			g.game.join.add((ev) => {
				this.lastJoinedPlayerId = ev.player.id;
			});

			// 背景
			const bg = new g.FilledRect({ scene: this, width: 640, height: 360, cssColor: "gray", opacity: 0 });
			this.append(bg);
			if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
				bg.opacity = 1.0;
				bg.modified();
			}

			const base = new g.E({ scene: this });
			this.append(base);
			base.hide();

			const uiBase = new g.E({ scene: this });
			this.append(uiBase);
			uiBase.hide();

			//タイトル
			const sprTitle = new g.Sprite({ scene: this, src: this.assets["title"], x: 70 });
			this.append(sprTitle);
			timeline.create(
				sprTitle, {
				modified: sprTitle.modified, destroyd: sprTitle.destroyed
			}).wait(5000).moveBy(-800, 0, 200).call(() => {
				bg.show();
				base.show();
				uiBase.show();
				isStart = true;
				reset();
			});

			//テーマ変更用
			const dialogTheme = new g.Sprite({ scene: this, x: -60, y: 250, src: this.assets["theme_dialog"], touchable: true });
			sprTitle.append(dialogTheme);

			const areaTheme = new g.Sprite({ scene: this, x: 135, y: 10, src: this.assets["theme_area"] });
			dialogTheme.append(areaTheme);

			dialogTheme.pointDown.add((e) => {
				if (e.point.x > 130) {
					const num = Math.floor((e.point.x - 130) / 165);
					areaTheme.x = 135 + (num * 155);
					areaTheme.modified();
					panels.forEach((panel) => {
						panel.setTheme(num);
					});
					sprHints.forEach((panel) => {
						panel.setTheme(num);
					});
				}
			});

			let glyph = JSON.parse((this.assets["test"] as g.TextAsset).data);
			const numFont = new g.BitmapFont({
				src: this.assets["img_numbers_n"],
				map: glyph.map,
				defaultGlyphWidth: glyph.width,
				defaultGlyphHeight: glyph.height,
				missingGlyph: glyph.missingGlyph
			});

			const numFontRed = new g.BitmapFont({
				src: this.assets["img_numbers_n_red"],
				map: glyph.map,
				defaultGlyphWidth: glyph.width,
				defaultGlyphHeight: glyph.height,
				missingGlyph: glyph.missingGlyph
			});

			glyph = JSON.parse((this.assets["glyph72"] as g.TextAsset).data);
			const numFontP = new g.BitmapFont({
				src: this.assets["number_p"],
				map: glyph.map,
				defaultGlyphWidth: 72,
				defaultGlyphHeight: 80
			});

			glyph = JSON.parse((this.assets["glyph72"] as g.TextAsset).data);
			const numFontB = new g.BitmapFont({
				src: this.assets["number_b"],
				map: glyph.map,
				defaultGlyphWidth: 72,
				defaultGlyphHeight: 80
			});

			//スコア
			uiBase.append(new g.Sprite({ scene: this, src: this.assets["score"], x: 410, y: 6, height: 32 }));
			let score = 0;
			const labelScore = new g.Label({
				scene: this,
				x: 312,
				y: 45,
				width: 32 * 10,
				fontSize: 32,
				font: numFont,
				text: "0P",
				textAlign: g.TextAlign.Right, widthAutoAdjust: false
			});
			uiBase.append(labelScore);

			const labelScorePlus = new g.Label({
				scene: this,
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
			const labelHint = new g.Sprite({ scene: this, src: this.assets["score"], x: 410, y: 250, height: 32, srcY: 32 });
			uiBase.append(labelHint);

			//ヒント用パネル
			const sprHints: Panel[] = [];
			for (let i = 0; i < 7; i++) {
				const panel = new Panel(this, 0);
				panel.moveTo(100 + (150 / 7 * i), 10);
				labelHint.append(panel);
				sprHints.push(panel);
				//panel.hide();
			}

			//最大連鎖
			uiBase.append(new g.Sprite({ scene: this, src: this.assets["score"], x: 410, y: 290, height: 32, srcY: 64 }));
			const labelMaxRen = new g.Label({
				scene: this, font: numFont, fontSize: 32, text: "0", x: 450, y: 323,
				width: 32 * 2, textAlign: g.TextAlign.Right, widthAutoAdjust: false
			});
			uiBase.append(labelMaxRen);

			//タイム
			uiBase.append(new g.Sprite({ scene: this, src: this.assets["time"], x: 540, y: 320 }));
			const labelTime = new g.Label({ scene: this, font: numFont, fontSize: 32, text: "70", x: 580, y: 323 });
			uiBase.append(labelTime);

			//同時消し表示
			const sprCombo = new g.Sprite({ scene: this, src: this.assets["combo"], x: 120, y: 20, width: 135, height: 40 });
			const labelCombo = new g.Label({
				scene: this, font: numFontB, fontSize: 60, text: "99", x: 390, y: 110,
				width: 60 * 2, textAlign: g.TextAlign.Right, widthAutoAdjust: false
			});
			uiBase.append(labelCombo);
			labelCombo.append(sprCombo);

			//連鎖表示
			const sprRen = new g.Sprite({ scene: this, src: this.assets["combo"], x: 120, y: 20, width: 135, height: 40, srcY: 40 });
			const labelRen = new g.Label({
				scene: this, font: numFontP, fontSize: 60, text: "99", x: 390, y: 180,
				width: 60 * 2, textAlign: g.TextAlign.Right, widthAutoAdjust: false
			});
			uiBase.append(labelRen);
			labelRen.append(sprRen);

			//詰み表示
			const sprMate = new g.Sprite({ scene: this, src: this.assets["mate"], x: 130, y: 100 });
			uiBase.append(sprMate);

			//開始
			const sprStart = new g.Sprite({ scene: this, src: this.assets["start"], x: 50, y: 100 });
			uiBase.append(sprStart);
			sprStart.hide();

			//終了
			const finishBase = new g.E({ scene: this, x: 0, y: 0 });
			this.append(finishBase);
			finishBase.hide();

			const finishBg = new g.FilledRect({ scene: this, width: 640, height: 360, cssColor: "#000000", opacity: 0.3 });
			finishBase.append(finishBg);

			const sprFinish = new g.Sprite({ scene: this, src: this.assets["finish"], x: 120, y: 100 });
			finishBase.append(sprFinish);

			//最前面
			const fg = new g.FilledRect({ scene: this, width: 640, height: 480, cssColor: "#ff0000", opacity: 0.0 });
			this.append(fg);

			//リセットボタン
			const btnReset = new Button(this, ["リセット"], 500, 270, 130);
			if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
				finishBase.append(btnReset);
				btnReset.pushEvent = () => {
					reset();
				};
			}

			//ランキングボタン
			const btnRanking = new Button(this, ["ランキング"], 500, 200, 130);
			if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
				finishBase.append(btnRanking);
				btnRanking.pushEvent = () => {
					window.RPGAtsumaru.experimental.scoreboards.display(1);
				};
			}

			//設定ボタン
			const btnConfig = new g.Sprite({ scene: this, x: 600, y: 0, src: this.assets["config"], touchable: true });
			if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
				this.append(btnConfig);
			}

			//設定画面
			const config = new Config(this, 380, 40);
			if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
				this.append(config);
			}
			config.hide();

			btnConfig.pointDown.add(() => {
				if (config.state & 1) {
					config.show();
				} else {
					config.hide();
				}
			});

			config.bgmEvent = (num) => {
				bgm.changeVolume(0.5 * num);
			};

			config.colorEvent = (str) => {
				bg.cssColor = str;
				bg.modified();
			};

			config.themeEvent = (num) => {
				panels.forEach((e) => {
					e.setTheme(num);
				});
				sprHints.forEach((e) => {
					e.setTheme(num);
				});
			};

			const playSound = (name: string) => {
				(this.assets[name] as g.AudioAsset).play().changeVolume(config.volumes[1]);
			};

			const bgm = (this.assets["bgm"] as g.AudioAsset).play();
			bgm.changeVolume(0.2);

			const size = 340;
			const mapX = 8;
			const mapY = 7;
			const panelSize = size / mapY;
			const margin = 10;
			const theme = 0;

			const waku = new g.Sprite({ scene: this, src: this.assets["waku"], x: 0, y: 0 });
			base.append(waku);
			waku.hide();

			const waku2 = new g.Sprite({ scene: this, src: this.assets["waku2"], x: 0, y: 0 });
			waku.append(waku2);

			const mapBase = new g.E({ scene: this, x: margin, y: margin, width: panelSize * mapX, height: panelSize * mapY, touchable: true });
			base.append(mapBase);

			//マップ
			const maps: Map[][] = [];
			for (let y = 0; y < mapY; y++) {
				maps.push([]);
				for (let x = 0; x < mapX; x++) {
					const map = new Map({
						scene: this, x: x * panelSize, y: y * panelSize, width: panelSize - 2, height: panelSize - 2, cssColor: "black"
					});
					maps[y].push(map);
					//mapBase.append(map);
				}
			}

			//パネル
			const panels: Panel[] = [];
			for (let i = 0; i < mapX * mapY; i++) {
				const panel = new Panel(this, panelSize - 4);
				mapBase.append(panel);
				panels.push(panel);
				panel.hide();
			}

			//押したとき
			let isPush = false;
			mapBase.pointDown.add((ev) => {
				if (!isStart) return;
				const x = Math.floor(ev.point.x / panelSize);
				const y = Math.floor(ev.point.y / panelSize);
				isPush = true;
			});

			//動かしたとき
			mapBase.pointMove.add((ev) => {
				if (!isPush) return;

				const px = Math.floor(ev.point.x / panelSize);
				const py = Math.floor(ev.point.y / panelSize);
				let x = 0;
				let y = 0;
				const limit = 20;//移動のしきい値

				if (ev.startDelta.x < -limit) x = -1;
				else if (ev.startDelta.x > limit) x = 1;
				else if (ev.startDelta.y < -limit) y = -1;
				else if (ev.startDelta.y > limit) y = 1;

				if ((x !== 0 || y !== 0) && chkArea(px + x, py + y)) {

					const mapSrc = maps[py][px];
					const mapDst = maps[py + y][px + x];
					if (mapSrc.match === 0 && mapDst.match === 0 && (chkMove(px, py, x, y) || chkMove(px + x, py + y, -x, -y))) {
						[mapSrc.num, mapDst.num] = [mapDst.num, mapSrc.num];//入れ替え

						[mapSrc, mapDst].forEach(map => {
							const p = panels[map.num];
							timeline.create(p, { modified: p.modified, destroyed: p.destroyed }).moveTo(map.x, map.y, 100);
						});

						if (!isMove) {
							move();
						}

						playSound("move");
					} else {
						//入れ替えられない
						[mapSrc, mapDst].forEach(map => {
							const p = panels[map.num];
							timeline.create(p, { modified: p.modified, destroyed: p.destroyed }).rotateTo(45, 50).wait(100)
								.rotateTo(0, 50);
						});
						playSound("miss");
					}

					isPush = false;
				}
			});

			//メインループ
			let bkTime = 0;
			const timeLimit = 70;
			let startTime: number = 0;
			this.update.add(() => {
				//return;//デバッグ用

				if (!isStart) return;
				const t = timeLimit - Math.floor((Date.now() - startTime) / 1000);

				//終了処理
				if (t <= -1) {
					fg.cssColor = "#000000";
					fg.opacity = 0.0;
					fg.modified();

					finishBase.show();

					isStart = false;

					playSound("se_timeup");

					timeline.create().wait(1500).call(() => {
						if (typeof window !== "undefined" && window.RPGAtsumaru) {
							if (g.game.vars.gameState.score < 10000000) {
								window.RPGAtsumaru.experimental.scoreboards.setRecord(1, g.game.vars.gameState.score).then(() => {
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
					timeline.create().wait(500).call(() => {
						fg.opacity = 0.0;
						fg.modified();
					});
				}

				bkTime = t;
			});

			//スコア加算表示
			let bkTweenScore: any;
			const addScore = (num: number) => {

				if (score + num < 0) {
					num = -score;
				}

				score += num;

				timeline.create().every((e: number, p: number) => {
					labelScore.text = "" + (score - Math.floor(num * (1 - p))) + "P";
					labelScore.invalidate();
				}, 400);

				labelScorePlus.text = "+" + num;
				labelScorePlus.invalidate();
				if (bkTweenScore) timeline2.remove(bkTweenScore);
				bkTweenScore = timeline2.create().every((e: number, p: number) => {
					labelScorePlus.opacity = p;
					labelScorePlus.modified();
				}, 100).wait(4000).call(() => {
					labelScorePlus.opacity = 0;
					labelScorePlus.modified();
				});

				g.game.vars.gameState.score = score;
			};

			//揃っているか確認
			const dx = [0, 1, 0, -1];
			const dy = [1, 0, -1, 0];
			const chkMatch = () => {
				for (let y = 0; y < mapY; y++) for (let x = 0; x < mapX; x++) maps[y][x].match = 0;

				const chkSub = (x: number, y: number, num: number, cnt: number, pos: number) => {
					if (!(x >= 0 && x < mapX && y >= 0 && y < mapY)
						|| panels[maps[y][x].num].num !== num) return cnt;

					const xx = x + dx[pos];
					const yy = y + dy[pos];

					const i: number = chkSub(xx, yy, num, cnt + 1, pos);

					if (i > 2) {
						maps[y][x].match = pos + 1;
					}
					return i;
				};

				let isMatch = false;
				for (let y = 0; y < mapY; y++) {
					for (let x = 0; x < mapX; x++) {
						for (let i = 0; i < 2; i++) {
							const num = chkSub(x, y, panels[maps[y][x].num].num, 0, i);
							if (num > 2) isMatch = true;
						}
					}
				}
				return isMatch;
			};

			//消して移動
			let isMove = false;
			const moveTime = 150;
			const clearTime = 600;
			let renCnt = 0;
			let comboTime = 0;
			const comboLimit = 2000;
			let bkTweenCombo: any;
			let bkTweenRen: any;
			let maxRen = 0;
			const move = () => {
				if (isMove) return;
				isMove = true;
				if (!chkMatch() || !isStart) {
					isMove = false;
					//詰み
					if (chkMate()) {
						sprMate.opacity = 1;
						sprMate.modified();
						timeline.create().wait(1500).call(() => {
							sprMate.opacity = 0;
							sprMate.modified();
							resetMap();
						});
						playSound("miss");
					}
					return;
				}

				const list: number[] = [];
				let clearCnt = 0;//消したパネルカウンタ
				for (let x = 0; x < mapX; x++) {
					let cnt = 0;
					for (let y = mapY - 1; 0 <= y; y--) {
						if (maps[y][x].match !== 0) {
							clearCnt++;
							//消す処理
							const panel = panels[maps[y][x].num];
							mapBase.append(panel);
							timeline.create().wait(clearTime / 6).call(() => {
								panel.setNum(panel.num + 8);
								panel.modified();
							}).wait(clearTime / 2).call(() => {
								panel.setNum(7);
							}).wait(clearTime / 6).call(() => {
								panel.setNum(15);
							});
							cnt++;
						} else {
							//ずらす処理
							const map = maps[y][x];
							const mapd = maps[y + cnt][x];
							if (cnt > 0) {
								const panel = panels[map.num];
								timeline.create(panel, { modified: panel.modified, destroyed: panel.destroyed })
									.wait(clearTime).call(() => {
										[mapd.num, map.num] = [map.num, mapd.num];
										[mapd.match, map.match] = [map.match, mapd.match];
									}).moveTo(mapd.x, mapd.y, moveTime)
									.call(() => {
										const p = panels[mapd.num];
										p.moveTo(mapd.x, mapd.y);
										p.show();
									});
							} else {
								timeline.create()
									.wait(clearTime + moveTime)
									.call(() => {
										const p = panels[mapd.num];
										p.moveTo(mapd.x, mapd.y);
										p.show();
									});
							}
						}
					}
					list.push(cnt);
				}

				//上に空いたマスを埋める
				timeline.create().wait(clearTime).call(() => {
					for (let x = 0; x < mapX; x++) {
						for (let y = 0; y < mapY; y++) {
							const map = maps[y][x];
							if (map.match === 0) break;
							const panel = panels[maps[y][x].num];
							panel.setNum(random.get(0, 6));
							panel.moveTo(map.x, map.y - (list[x] * panelSize));
							timeline.create(panel, { modified: panel.modified, destroyed: panel.destroyed }).moveTo(map.x, map.y, moveTime);
							panel.modified();
							panel.show();
						}
					}
				});

				timeline.create().wait(clearTime).call(() => {
					//コンボ表示
					if ((Date.now() - comboTime) < comboLimit) {
						renCnt++;
						if (renCnt >= 2) {
							labelRen.text = "" + renCnt;
							labelRen.invalidate();
							if (bkTweenRen) timeline2.remove(bkTweenRen);
							bkTweenRen = timeline2.create().every((a: number, b: number) => {
								labelRen.opacity = b;
								labelRen.modified();
							}, 100).wait(2000).call(() => {
								labelRen.opacity = 0;
								labelRen.invalidate();
							});
							if (renCnt > maxRen) {
								maxRen = renCnt;
								labelMaxRen.text = "" + maxRen;
								labelMaxRen.invalidate();
							}
						}
					} else {
						if (bkTweenRen) timeline2.remove(bkTweenRen);
						labelRen.opacity = 0;
						labelRen.modified();
						renCnt = 1;
					}
					comboTime = Date.now();

					labelHint.hide();

					//消した数表示
					labelCombo.text = "" + clearCnt;
					labelCombo.invalidate();
					if (bkTweenCombo) timeline2.remove(bkTweenCombo);
					bkTweenCombo = timeline2.create().every((a: number, b: number) => {
						labelCombo.opacity = b;
						labelCombo.modified();
						waku2.opacity = b / 2;
						waku2.modified();
					}, 100).wait(2000).call(() => {
						labelCombo.opacity = 0;
						labelCombo.invalidate();
						waku2.opacity = 0;
						waku2.modified();
					}).wait(3000).call(() => {
						chkHint();
					});

					addScore(clearCnt * 30 + Math.pow(clearCnt - 3, 2) * 10 + (renCnt * renCnt) * 20);
					playSound("clear");

				}).wait(moveTime + 100).call(() => {
					isMove = false;
					move();
				});
			};

			const chkArea = (x: number, y: number) => {
				return (x >= 0 && x < mapX && y >= 0 && y < mapY);
			};

			//移動可否判定1ブロック分
			const chkMoveSub = (x: number, y: number) => {
				const num = panels[maps[y][x].num].num;
				let flg = false;
				for (let j = 0; j < 2; j++) {
					let cnt = 1;
					[-1, 1].forEach((k) => {
						let p = 1;
						while (true) {
							const yy = y + (dy[j] * k * p);
							const xx = x + (dx[j] * k * p);
							if (!chkArea(xx, yy)) break;
							const n = panels[maps[yy][xx].num].num;
							if (n !== num) break;
							cnt++;
							p++;
						}
					});

					if (cnt >= 3) {
						flg = true;
						break;
					}
				}
				return flg;
			};

			//移動可否判定
			const chkMove = (x: number, y: number, mx: number, my: number) => {
				const yy = y + my;
				const xx = x + mx;
				if (!chkArea(xx, yy)) return false;
				const map = maps[y][x];
				const mapd = maps[yy][xx];

				if (panels[map.num].num >= 7 || panels[mapd.num].num >= 7) return false;

				[mapd.num, map.num] = [map.num, mapd.num];

				const flg = chkMoveSub(xx, yy);

				[mapd.num, map.num] = [map.num, mapd.num];//戻す
				//console.log(flg);
				return flg;
			};

			//詰み判定
			const chkMate = () => {
				for (let y = 0; y < mapY; y++) {
					for (let x = 0; x < mapX; x++) {
						for (let i = 0; i < 4; i++) {
							if (chkMove(x, y, dx[i], dy[i])) return false;
						}
					}
				}
				return true;
			};

			//ヒント用揃う種類判定
			const arrHint: number[] = [];
			const chkHint = () => {
				arrHint.length = 0;
				for (let y = 0; y < mapY; y++) {
					for (let x = 0; x < mapX; x++) {
						for (let i = 0; i < 4; i++) {
							if (chkMove(x, y, dx[i], dy[i])) {
								const num = panels[maps[y][x].num].num;
								const index = arrHint.indexOf(num);
								if (index === -1) {
									arrHint.push(num);
								}
								break;
							}
						}
					}
				}

				if (arrHint.length === 0) return;
				sprHints.forEach((e) => { e.hide(); });
				for (let i = 0; i < arrHint.length; i++) {
					sprHints[i].setNum(arrHint[i]);
					sprHints[i].show();
					sprHints[i].x = 100 + (150 / arrHint.length * i);
					sprHints[i].modified();
				}
				labelHint.show();
			};

			//盤面のリセット
			const resetMap = () => {
				let i = 0;
				for (let y = 0; y < mapY; y++) {
					for (let x = 0; x < mapX; x++) {
						const map = maps[y][x];
						const p = panels[i];
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
				timeline.create().wait(300).call(() => {
					move();
				});

				waku2.opacity = 0;
			};

			//リセット
			const reset = () => {
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
				timeline.create().wait(750).call(() => {
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
	}
}

class Map extends g.FilledRect {
	public num: number = 0;
	public match: number = 0;
	constructor(param: g.FilledRectParameterObject) {
		super(param);
	}
}
