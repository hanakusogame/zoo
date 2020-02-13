export class Panel extends g.E {
	public num: number = 0;
	private colors: string[] = ["red", "green", "yellow", "blue", "pink", "cyan", "orange"];
	private sprite: g.FrameSprite;
	private theme: number = 0;
	constructor(scene: g.Scene, panelSize: number) {
		super({
			scene: scene,
			width: panelSize,
			height: panelSize
		});

		const size = 60;
		const pos = (panelSize - size) / 2;

		const frames: number[] = [];
		for (let i = 0; i < 48; i++) {
			frames.push(i);
		}

		this.sprite = new g.FrameSprite({
			scene: scene,
			src: scene.assets["panel"] as g.ImageAsset,
			width: size,
			height: size,
			x: pos,
			y: pos,
			frames: frames
		});
		this.append(this.sprite);
	}

	public setNum(num: number) {
		this.num = num;
		//this.cssColor = this.colors[num];
		this.sprite.frameNumber = num + this.theme * 16;
		this.sprite.modified();
	}

	public setTheme(num: number) {
		this.theme = num;
		this.setNum(this.num);
	}
}
