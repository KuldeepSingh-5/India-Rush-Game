import Phaser from 'phaser';
import { getLaneX } from '../config.js';

export const POWERUP_TYPES = {
  MAGNET: 'magnet',
  SHIELD: 'shield',
  SPEED: 'speed',
};

export const POWERUP_TEXTURES = {
  magnet: { key: 'powerup-magnet', w: 40, h: 40 },
  shield: { key: 'powerup-shield', w: 40, h: 40 },
  speed: { key: 'powerup-speed', w: 40, h: 40 },
};

export default class PowerUp {
  constructor(scene, lane, type, width, height) {
    this.scene = scene;
    this.lane = lane;
    this.type = type;
    this.width = width;
    this.height = height;
    this.alive = true;

    const x = getLaneX(lane, width);
    const y = -40;
    const tex = POWERUP_TEXTURES[type];

    this.sprite = scene.physics.add.staticImage(x, y, tex.key);
    this.sprite.setDepth(35);
    this.sprite.refreshBody();

    this.glow = scene.add.image(x, y, 'powerup-glow');
    this.glow.setDepth(34);
    this.glow.setAlpha(0.4);
    this.glow.setScale(1.5);

    this._startTweens();
  }

  _startTweens() {
    this._spriteTween = this.scene.tweens.add({
      targets: this.sprite,
      scale: { from: 0.85, to: 1.15 },
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this._glowTween = this.scene.tweens.add({
      targets: this.glow,
      alpha: { from: 0.2, to: 0.5 },
      scale: { from: 1.3, to: 1.8 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  reset(lane, type, width, height) {
    this.scene.tweens.killTweensOf(this.sprite);
    this.scene.tweens.killTweensOf(this.glow);

    this.lane = lane;
    this.type = type;
    this.width = width;
    this.height = height;
    this.alive = true;

    const x = getLaneX(lane, width);
    const y = -40;
    const tex = POWERUP_TEXTURES[type];

    this.sprite.setTexture(tex.key);
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.scale = 1;
    this.sprite.alpha = 1;
    this.sprite.visible = true;
    this.sprite.active = true;
    this.sprite.refreshBody();

    this.glow.x = x;
    this.glow.y = y;
    this.glow.scale = 1.5;
    this.glow.alpha = 0.4;
    this.glow.visible = true;
    this.glow.active = true;

    this._startTweens();
  }

  update(speed, dt) {
    this.sprite.y += speed * dt;
    this.sprite.refreshBody();
    this.glow.y = this.sprite.y;
    this.glow.x = this.sprite.x;
  }

  isOffScreen(height) {
    return this.sprite.y > height + 50;
  }

  collect() {
    this.alive = false;
    this.scene.tweens.killTweensOf(this.sprite);
    this.scene.tweens.killTweensOf(this.glow);
    this._spriteTween = null;
    this._glowTween = null;
    this.scene.tweens.add({
      targets: [this.sprite, this.glow],
      scale: 2.5,
      alpha: 0,
      duration: 250,
      ease: 'Power2',
      onComplete: () => {
        if (this.sprite) {
          this.sprite.visible = false;
          this.sprite.active = false;
        }
        if (this.glow) {
          this.glow.visible = false;
          this.glow.active = false;
        }
      },
    });
  }

  destroy() {
    this.alive = false;
    if (this.scene && this.scene.tweens) {
      this.scene.tweens.killTweensOf(this.sprite);
      this.scene.tweens.killTweensOf(this.glow);
    }
    this._spriteTween = null;
    this._glowTween = null;
    if (this.sprite && this.sprite.active) this.sprite.destroy();
    if (this.glow && this.glow.active) this.glow.destroy();
  }
}
