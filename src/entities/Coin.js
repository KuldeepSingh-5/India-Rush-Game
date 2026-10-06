import Phaser from 'phaser';
import { getLaneX } from '../config.js';

export default class Coin {
  constructor(scene, lane, width, height) {
    this.scene = scene;
    this.lane = lane;
    this.width = width;
    this.height = height;
    this.alive = true;
    this._tween = null;

    const x = getLaneX(lane, width);
    const y = -40;

    this.sprite = scene.physics.add.staticImage(x, y, 'coin');
    this.sprite.setDepth(40);
    this.sprite.refreshBody();

    this._startTween();
  }

  _startTween() {
    this._tween = this.scene.tweens.add({
      targets: this.sprite,
      scale: { from: 0.9, to: 1.1 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  reset(lane, width, height) {
    this.scene.tweens.killTweensOf(this.sprite);
    this.lane = lane;
    this.width = width;
    this.height = height;
    this.alive = true;

    const x = getLaneX(lane, width);
    this.sprite.x = x;
    this.sprite.y = -40;
    this.sprite.scale = 1;
    this.sprite.alpha = 1;
    this.sprite.visible = true;
    this.sprite.active = true;
    this.sprite.refreshBody();

    this._startTween();
  }

  update(speed, dt) {
    this.sprite.y += speed * dt;
    this.sprite.refreshBody();
  }

  isOffScreen(height) {
    return this.sprite.y > height + 50;
  }

  collect() {
    this.alive = false;
    this.scene.tweens.killTweensOf(this.sprite);
    this._tween = null;
    this.scene.tweens.add({
      targets: this.sprite,
      scale: 2,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        if (this.sprite) {
          this.sprite.visible = false;
          this.sprite.active = false;
        }
      },
    });
  }

  destroy() {
    this.alive = false;
    if (this.scene && this.scene.tweens) {
      this.scene.tweens.killTweensOf(this.sprite);
    }
    this._tween = null;
    if (this.sprite && this.sprite.active) this.sprite.destroy();
  }
}
