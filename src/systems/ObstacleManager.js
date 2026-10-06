import Phaser from 'phaser';
import { GAMEPLAY } from '../config.js';
import Obstacle, { OBSTACLE_TYPES } from '../entities/Obstacle.js';

const VEHICLE_KEYS = [
  OBSTACLE_TYPES.CYCLE,
  OBSTACLE_TYPES.RICKSHAW,
  OBSTACLE_TYPES.MOTORCYCLE,
  OBSTACLE_TYPES.CAR,
];

export default class ObstacleManager {
  constructor(scene, width, height) {
    this.scene = scene;
    this.width = width;
    this.height = height;

    this.obstacles = [];
    this.pool = [];
    this.spawnTimer = 0;
    this.nextSpawnGap = GAMEPLAY.obstacleStartDelay;
    this.lastLane = -1;
  }

  acquire(lane, type) {
    if (this.pool.length > 0) {
      const obs = this.pool.pop();
      obs.reset(lane, type, this.width, this.height);
      return obs;
    }
    return new Obstacle(this.scene, lane, type, this.width, this.height);
  }

  release(obs) {
    obs.alive = false;
    obs.sprite.visible = false;
    obs.sprite.active = false;
    this.pool.push(obs);
  }

  update(speed, dt, elapsedTime) {
    this.spawnTimer += dt * 1000;

    if (this.spawnTimer >= this.nextSpawnGap) {
      this.spawnWave(elapsedTime);
      this.spawnTimer = 0;
      this.nextSpawnGap = this.computeGap(elapsedTime, speed);
    }

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.update(speed, dt);

      if (obs.isOffScreen(this.height)) {
        this.obstacles.splice(i, 1);
        this.release(obs);
        continue;
      }

      if (this.checkCollision(this.scene.player, obs)) {
        if (this.scene.powerUpManager && this.scene.powerUpManager.isShieldActive()) {
          this.scene.powerUpManager.consumeShield();
          this.scene.audioManager.playSfx('shieldBreak');
          if (this.scene.flashShieldBreak) this.scene.flashShieldBreak();
          this.obstacles.splice(i, 1);
          this.release(obs);
          continue;
        }
        this.scene.triggerGameOver();
        return;
      }
    }
  }

  computeGap(elapsedTime, speed) {
    const speedFactor = speed / GAMEPLAY.baseScrollSpeed;
    const rampT = Math.min(1, elapsedTime / GAMEPLAY.obstacleGapRampTime);
    const minBase = Phaser.Math.Linear(
      GAMEPLAY.obstacleMinGap,
      GAMEPLAY.obstacleMinGapMin,
      rampT
    );
    const maxBase = Phaser.Math.Linear(
      GAMEPLAY.obstacleMaxGap,
      GAMEPLAY.obstacleMaxGapMin,
      rampT
    );
    const minGap = Math.max(260, minBase / speedFactor);
    const maxGap = Math.max(480, maxBase / speedFactor);
    return Phaser.Math.Between(minGap, maxGap);
  }

  spawnWave(elapsedTime) {
    const maxObstacles = this.maxSimultaneous(elapsedTime);
    const count = Phaser.Math.Between(1, maxObstacles);

    const availableLanes = [0, 1, 2];
    const chosenLanes = [];

    for (let i = 0; i < count && availableLanes.length > 0; i++) {
      const idx = Phaser.Math.Between(0, availableLanes.length - 1);
      const lane = availableLanes.splice(idx, 1)[0];
      chosenLanes.push(lane);
    }

    if (chosenLanes.length === 1 && chosenLanes[0] === this.lastLane) {
      const alternatives = [0, 1, 2].filter((l) => l !== this.lastLane);
      chosenLanes[0] = alternatives[Phaser.Math.Between(0, alternatives.length - 1)];
    }

    for (const lane of chosenLanes) {
      this.lastLane = lane;
      const type = this.pickType();
      const obstacle = this.acquire(lane, type);
      this.obstacles.push(obstacle);
    }
  }

  maxSimultaneous(elapsedTime) {
    if (elapsedTime < GAMEPLAY.obstacleRampTime) return 1;
    return GAMEPLAY.maxSimultaneousObstacles;
  }

  pickType() {
    const rand = Phaser.Math.FloatBetween(0, 1);
    if (rand < 0.2) return OBSTACLE_TYPES.BARRIER;
    if (rand < 0.34) return OBSTACLE_TYPES.OVERHEAD;
    if (rand < 0.46) return OBSTACLE_TYPES.TRAIN;
    return VEHICLE_KEYS[Phaser.Math.Between(0, VEHICLE_KEYS.length - 1)];
  }

  checkCollision(player, obstacle) {
    const playerBounds = player.getBounds();
    const obstacleBounds = obstacle.getCollisionBounds();
    const horizontalOverlap =
      playerBounds.x < obstacleBounds.x + obstacleBounds.width &&
      playerBounds.x + playerBounds.width > obstacleBounds.x;
    if (!horizontalOverlap) return false;

    const yOverlap =
      playerBounds.y < obstacleBounds.y + obstacleBounds.height &&
      playerBounds.y + playerBounds.height > obstacleBounds.y;
    if (!yOverlap) return false;

    if (obstacle.canBeAvoidedByJump() && player.isAirborne()) {
      const playerFeet = playerBounds.y + playerBounds.height;
      const obstacleTop = obstacleBounds.y;
      if (playerFeet < obstacleTop) return false;
    }

    if (obstacle.canBeAvoidedBySlide() && player.isSlidingNow()) {
      return false;
    }

    return true;
  }

  handleResize(width, height) {
    this.width = width;
    this.height = height;
  }

  destroy() {
    for (const obs of this.obstacles) {
      obs.destroy();
    }
    this.obstacles = [];
    for (const obs of this.pool) {
      obs.destroy();
    }
    this.pool = [];
  }
}
