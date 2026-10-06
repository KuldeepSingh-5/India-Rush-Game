import Phaser from 'phaser';
import { GAMEPLAY } from '../config.js';
import PowerUp, { POWERUP_TYPES } from '../entities/PowerUp.js';

const POWERUP_KEYS = [
  POWERUP_TYPES.MAGNET,
  POWERUP_TYPES.SHIELD,
  POWERUP_TYPES.SPEED,
];

export default class PowerUpManager {
  constructor(scene, width, height) {
    this.scene = scene;
    this.width = width;
    this.height = height;

    this.powerUps = [];
    this.pool = [];
    this.spawnTimer = 0;
    this.nextSpawnGap = GAMEPLAY.powerUpStartDelay;
    this.lastLane = -1;

    this.activeEffects = {
      magnet: { active: false, timer: 0, duration: 0 },
      shield: { active: false, timer: 0, duration: 0 },
      speed: { active: false, timer: 0, duration: 0 },
    };
  }

  acquire(lane, type) {
    if (this.pool.length > 0) {
      const pu = this.pool.pop();
      pu.reset(lane, type, this.width, this.height);
      return pu;
    }
    return new PowerUp(this.scene, lane, type, this.width, this.height);
  }

  release(pu) {
    this.scene.tweens.killTweensOf(pu.sprite);
    this.scene.tweens.killTweensOf(pu.glow);
    pu.sprite.visible = false;
    pu.sprite.active = false;
    pu.glow.visible = false;
    pu.glow.active = false;
    pu.alive = false;
    this.pool.push(pu);
  }

  update(speed, dt) {
    this.spawnTimer += dt * 1000;

    if (this.spawnTimer >= this.nextSpawnGap) {
      this.spawnPowerUp();
      this.spawnTimer = 0;
      const speedFactor = speed / GAMEPLAY.baseScrollSpeed;
      const minGap = GAMEPLAY.powerUpMinGap / speedFactor;
      const maxGap = GAMEPLAY.powerUpMaxGap / speedFactor;
      this.nextSpawnGap = Phaser.Math.Between(minGap, maxGap);
    }

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pu = this.powerUps[i];
      pu.update(speed, dt);

      if (!pu.alive) {
        this.powerUps.splice(i, 1);
        this.release(pu);
        continue;
      }

      if (pu.isOffScreen(this.height)) {
        this.powerUps.splice(i, 1);
        this.release(pu);
        continue;
      }

      if (this.checkCollection(this.scene.player, pu)) {
        this.activatePowerUp(pu.type);
        pu.collect();
        this.powerUps.splice(i, 1);
      }
    }

    this.updateActiveEffects(dt);
  }

  updateActiveEffects(dt) {
    for (const key of POWERUP_KEYS) {
      const effect = this.activeEffects[key];
      if (effect.active) {
        effect.timer += dt * 1000;
        if (effect.duration > 0 && effect.timer >= effect.duration) {
          this.deactivateEffect(key);
        }
      }
    }
  }

  activatePowerUp(type) {
    const effect = this.activeEffects[type];
    effect.active = true;
    effect.timer = 0;

    switch (type) {
      case POWERUP_TYPES.MAGNET:
        effect.duration = GAMEPLAY.magnetDuration;
        this.scene.audioManager.playSfx('powerupMagnet');
        break;
      case POWERUP_TYPES.SHIELD:
        effect.duration = GAMEPLAY.shieldDuration;
        this.scene.audioManager.playSfx('powerupShield');
        break;
      case POWERUP_TYPES.SPEED:
        effect.duration = GAMEPLAY.speedBoostDuration;
        this.scene.audioManager.playSfx('powerupSpeed');
        break;
    }

    if (this.scene.onPowerUpActivated) {
      this.scene.onPowerUpActivated(type);
    }
  }

  deactivateEffect(type) {
    const effect = this.activeEffects[type];
    effect.active = false;
    effect.timer = 0;
    if (this.scene.onPowerUpDeactivated) {
      this.scene.onPowerUpDeactivated(type);
    }
  }

  consumeShield() {
    if (this.activeEffects.shield.active) {
      this.deactivateEffect(POWERUP_TYPES.SHIELD);
      return true;
    }
    return false;
  }

  isMagnetActive() {
    return this.activeEffects.magnet.active;
  }

  isShieldActive() {
    return this.activeEffects.shield.active;
  }

  isSpeedActive() {
    return this.activeEffects.speed.active;
  }

  getSpeedMultiplier() {
    return this.isSpeedActive() ? GAMEPLAY.speedBoostMultiplier : 1;
  }

  getRemainingTime(type) {
    const effect = this.activeEffects[type];
    if (!effect.active || effect.duration === 0) return 0;
    return Math.max(0, effect.duration - effect.timer);
  }

  spawnPowerUp() {
    let lane = Phaser.Math.Between(0, 2);
    if (lane === this.lastLane) {
      const alternatives = [0, 1, 2].filter((l) => l !== this.lastLane);
      lane = alternatives[Phaser.Math.Between(0, alternatives.length - 1)];
    }
    this.lastLane = lane;

    const type = POWERUP_KEYS[Phaser.Math.Between(0, POWERUP_KEYS.length - 1)];
    const powerUp = this.acquire(lane, type);
    this.powerUps.push(powerUp);
  }

  checkCollection(player, powerUp) {
    if (player.getLane() !== powerUp.lane) return false;

    const playerY = player.sprite.y;
    const playerHeight = player.sprite.height;
    const playerYTop = playerY - playerHeight / 2;
    const playerYBottom = playerY + playerHeight / 2;

    const puY = powerUp.sprite.y;
    const puHeight = powerUp.sprite.height;
    const puYTop = puY - puHeight / 2;
    const puYBottom = puY + puHeight / 2;

    return playerYBottom > puYTop && playerYTop < puYBottom;
  }

  handleResize(width, height) {
    this.width = width;
    this.height = height;
  }

  destroy() {
    for (const pu of this.powerUps) {
      pu.destroy();
    }
    this.powerUps = [];
    for (const pu of this.pool) {
      pu.destroy();
    }
    this.pool = [];
  }
}
