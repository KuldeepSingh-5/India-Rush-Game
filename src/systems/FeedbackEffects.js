import Phaser from 'phaser';
import { POWERUP_TYPES } from '../entities/PowerUp.js';

const POWERUP_LABELS = {
  magnet: 'MAGNET!',
  shield: 'SHIELD!',
  speed: 'SPEED BOOST!',
};

const POWERUP_COLORS = {
  magnet: 0xe63946,
  shield: 0x4ecdc4,
  speed: 0xffd700,
};

export default class FeedbackEffects {
  constructor(scene) {
    this.scene = scene;
  this.effects = [];
  }

  // ── Coin collection: floating "+1" + sparkle ring at player ──

  playCoinCollect(x, y) {
    this.spawnFloatingText(x, y - 30, '+1', '#ffd700', 16, 600, -40);
    this.spawnSparkleRing(x, y, 0xffd700, 16, 400);
  this.spawnSparkles(x, y, 0xffd700, 4, 400);
  }

  // ── Power-up pickup: burst ring + name label at player ────────

  playPowerUpPickup(x, y, type) {
    const color = POWERUP_COLORS[type] || 0xffffff;
    const label = POWERUP_LABELS[type] || type.toUpperCase() + '!';

    this.spawnBurstRing(x, y, color, 50, 500);
    this.spawnSparkles(x, y, color, 8, 500);
    this.spawnFloatingText(x, y - 36, label, '#' + color.toString(16).padStart(6, '0'), 18, 800, -50);
  }

  // ── Individual effect spawners ────────────────────────────────

  spawnFloatingText(x, y, text, color, fontSize, duration, driftY) {
    const label = this.scene.add.text(x, y, text, {
      fontFamily: 'Arial, sans-serif',
      fontSize: fontSize + 'px',
      fontWeight: 'bold',
      color: color,
      stroke: '#000000',
      strokeThickness: 3,
    });
    label.setOrigin(0.5);
    label.setDepth(90);
    label.setScale(0.5);
    label.setAlpha(0);

    this.scene.tweens.add({
      targets: label,
      scale: 1,
      alpha: 1,
      duration: 100,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: label,
          y: y + driftY,
          alpha: 0,
          duration: duration,
          ease: 'Power2',
          onComplete: () => {
            label.destroy();
            this._remove(label);
          },
        });
      },
    });

    this.effects.push(label);
  }

  spawnSparkleRing(x, y, color, radius, duration) {
    const ring = this.scene.add.graphics({ x: x, y: y });
    ring.setDepth(89);
    ring.lineStyle(2, color, 1);
    ring.strokeCircle(0, 0, 4);
    ring.setAlpha(0.9);

    this.scene.tweens.add({
      targets: ring,
      alpha: 0,
      duration: duration,
      ease: 'Power2',
      onUpdate: (tween) => {
        const progress = tween.progress;
        const r = 4 + (radius - 4) * progress;
        ring.clear();
        ring.lineStyle(2, color, 1 - progress * 0.7);
        ring.strokeCircle(0, 0, r);
      },
      onComplete: () => {
        ring.destroy();
        this._remove(ring);
      },
    });

    this.effects.push(ring);
  }

  spawnBurstRing(x, y, color, maxRadius, duration) {
    const ring = this.scene.add.graphics({ x: x, y: y });
    ring.setDepth(89);
    ring.lineStyle(3, color, 1);
    ring.strokeCircle(0, 0, 8);
    ring.setAlpha(1);

    this.scene.tweens.add({
      targets: ring,
      alpha: 0,
      duration: duration,
      ease: 'Power2',
      onUpdate: (tween) => {
        const progress = tween.progress;
        const r = 8 + (maxRadius - 8) * progress;
        ring.clear();
        ring.lineStyle(3, color, 1 - progress * 0.8);
        ring.strokeCircle(0, 0, r);
      },
      onComplete: () => {
        ring.destroy();
        this._remove(ring);
      },
    });

    this.effects.push(ring);
  }

  spawnSparkles(x, y, color, count, duration) {
    const colorStr = '#' + color.toString(16).padStart(6, '0');

    for (let i = 0; i < count; i++) {
      const sparkle = this.scene.add.text(x, y, '\u2726', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: colorStr,
        stroke: '#000000',
        strokeThickness: 1,
      });
      sparkle.setOrigin(0.5);
      sparkle.setDepth(91);
      sparkle.setScale(0);
      sparkle.setAlpha(0);

      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const dist = Phaser.Math.Between(20, 40);
      const tx = x + Math.cos(angle) * dist;
      const ty = y + Math.sin(angle) * dist;

      this.scene.tweens.add({
        targets: sparkle,
        x: tx,
        y: ty,
        scale: { from: 0, to: 1 },
        alpha: { from: 1, to: 0 },
        duration: duration,
        ease: 'Power2',
        onComplete: () => {
          sparkle.destroy();
          this._remove(sparkle);
        },
      });

      this.effects.push(sparkle);
    }
  }

  _remove(obj) {
    const idx = this.effects.indexOf(obj);
    if (idx >= 0) this.effects.splice(idx, 1);
  }

  destroy() {
    for (const obj of this.effects) {
      if (obj && obj.active) obj.destroy();
    }
    this.effects = [];
  }
}
