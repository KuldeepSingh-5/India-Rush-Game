import Phaser from 'phaser';
import { COLORS, GAMEPLAY, getLaneX } from '../config.js';

export const OBSTACLE_TYPES = {
  LOW: 'low',
  HIGH: 'high',
  FULL: 'full',
  BARRIER: 'barrier',
  OVERHEAD: 'overhead',
  TRAIN: 'train',
  CYCLE: 'cycle',
  RICKSHAW: 'rickshaw',
  MOTORCYCLE: 'motorcycle',
  CAR: 'car',
};

export const OBSTACLE_TEXTURES = {
  low: { key: 'obstacle-low', w: 60, h: 28 },
  high: { key: 'obstacle-high', w: 60, h: 38 },
  full: { key: 'obstacle-train', w: 82, h: 100 },
  barrier: { key: 'obstacle-low', w: 60, h: 28 },
  overhead: { key: 'obstacle-high', w: 60, h: 38 },
  train: { key: 'obstacle-train', w: 82, h: 100 },
  cycle: { key: 'vehicle-cycle', w: 60, h: 42 },
  rickshaw: { key: 'vehicle-rickshaw', w: 60, h: 50 },
  motorcycle: { key: 'vehicle-motorcycle', w: 60, h: 38 },
  car: { key: 'vehicle-car', w: 60, h: 44 },
};

const VEHICLE_TYPES = new Set([
  OBSTACLE_TYPES.CYCLE,
  OBSTACLE_TYPES.RICKSHAW,
  OBSTACLE_TYPES.MOTORCYCLE,
  OBSTACLE_TYPES.CAR,
]);

export function isVehicleType(type) {
  return VEHICLE_TYPES.has(type);
}

export default class Obstacle {
  constructor(scene, lane, type, width, height) {
    this.scene = scene;
    this.lane = lane;
    this.type = type;
    this.width = width;
    this.height = height;
    this.alive = true;

    const x = getLaneX(lane, width);
    const tex = OBSTACLE_TEXTURES[type] || OBSTACLE_TEXTURES.full;

    this.sprite = scene.physics.add.staticImage(
      x,
      -tex.h - GAMEPLAY.obstacleSpawnOffset,
      tex.key
    );
    this.sprite.setDepth(30);
    this.sprite.refreshBody();
  }

  reset(lane, type, width, height) {
    this.lane = lane;
    this.type = type;
    this.width = width;
    this.height = height;
    this.alive = true;

    const x = getLaneX(lane, width);
    const tex = OBSTACLE_TEXTURES[type] || OBSTACLE_TEXTURES.full;

    this.sprite.setTexture(tex.key);
    this.sprite.x = x;
    this.sprite.y = -tex.h - GAMEPLAY.obstacleSpawnOffset;
    this.sprite.visible = true;
    this.sprite.active = true;
    this.sprite.refreshBody();
  }

  update(speed, dt) {
    this.sprite.y += speed * dt;
    this.sprite.refreshBody();
  }

  isOffScreen(height) {
    return this.sprite.y > height + 100;
  }

  getCollisionBounds() {
    const bounds = {
      x: this.sprite.x - this.sprite.width / 2,
      y: this.sprite.y - this.sprite.height / 2,
      width: this.sprite.width,
      height: this.sprite.height,
    };

    if (this.canBeAvoidedBySlide()) {
      bounds.y = this.sprite.y - this.sprite.height / 2;
      bounds.height = Math.min(20, this.sprite.height);
    }

    return bounds;
  }

  canBeAvoidedByJump() {
    return this.type === OBSTACLE_TYPES.LOW || this.type === OBSTACLE_TYPES.BARRIER;
  }

  canBeAvoidedBySlide() {
    return this.type === OBSTACLE_TYPES.HIGH || this.type === OBSTACLE_TYPES.OVERHEAD;
  }

  isFullBlock() {
    return this.type === OBSTACLE_TYPES.FULL;
  }

  isVehicle() {
    return isVehicleType(this.type);
  }

  destroy() {
    this.alive = false;
    if (this.sprite) this.sprite.destroy();
  }
}
