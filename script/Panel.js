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
var Panel = /** @class */ (function (_super) {
    __extends(Panel, _super);
    function Panel(scene, panelSize) {
        var _this = _super.call(this, {
            scene: scene,
            width: panelSize,
            height: panelSize
        }) || this;
        _this.num = 0;
        _this.colors = ["red", "green", "yellow", "blue", "pink", "cyan", "orange"];
        _this.theme = 0;
        var size = 60;
        var pos = (panelSize - size) / 2;
        var frames = [];
        for (var i = 0; i < 48; i++) {
            frames.push(i);
        }
        _this.sprite = new g.FrameSprite({
            scene: scene,
            src: scene.assets["panel"],
            width: size,
            height: size,
            x: pos,
            y: pos,
            frames: frames
        });
        _this.append(_this.sprite);
        return _this;
    }
    Panel.prototype.setNum = function (num) {
        this.num = num;
        //this.cssColor = this.colors[num];
        this.sprite.frameNumber = num + this.theme * 16;
        this.sprite.modified();
    };
    Panel.prototype.setTheme = function (num) {
        this.theme = num;
        this.setNum(this.num);
    };
    return Panel;
}(g.E));
exports.Panel = Panel;
