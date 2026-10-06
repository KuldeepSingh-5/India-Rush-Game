import Phaser from 'phaser';
import { GAMEPLAY, getLaneX } from '../config.js';
import Coin from '../entities/Coin.js';

export default class CoinManager {
  constructor(scene, width, height) {
    this.scene = scene;
    this.width = width;
    this.height = height;

    this.coins = [];
    this.pool = [];
    this.spawnTimer = 0;
    this.nextSpawnGap = 800;
  }

  acquire(lane) {
    if (this.pool.length > 0) {
      const coin = this.pool.pop();
      coin.reset(lane, this.width, this.height);
      return coin;
    }
    return new Coin(this.scene, lane, this.width, this.height);
  }

  release(coin) {
    this.scene.tweens.killTweensOf(coin.sprite);
    coin.sprite.visible = false;
    coin.sprite.active = false;
    coin.alive = false;
    this.pool.push(coin);
  }

  update(speed, dt) {
    this.spawnTimer += dt * 1000;

    if (this.spawnTimer >= this.nextSpawnGap) {
      this.spawnCoin();
      this.spawnTimer = 0;

      const speedFactor = speed / GAMEPLAY.baseScrollSpeed;
      const minGap = GAMEPLAY.coinMinGap / speedFactor;
      const maxGap = GAMEPLAY.coinMaxGap / speedFactor;
      this.nextSpawnGap = Phaser.Math.Between(minGap, maxGap);
    }

    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];

      if (this.scene.powerUpManager && this.scene.powerUpManager.isMagnetActive()) {
        this.applyMagnet(coin, dt);
      }

      coin.update(speed, dt);

      if (!coin.alive) {
        this.coins.splice(i, 1);
        this.release(coin);
        continue;
      }

      if (coin.isOffScreen(this.height)) {
        this.coins.splice(i, 1);
        this.release(coin);
        continue;
      }

      if (this.checkCollection(this.scene.player, coin)) {
        coin.collect();
        this.coins.splice(i, 1);
        this.scene.collectCoin();
      }
    }
  }

  spawnCoin() {
    const lane = Phaser.Math.Between(0, 2);
    const coin = this.acquire(lane);
    this.coins.push(coin);
  }

  checkCollection(player, coin) {
    if (player.getLane() !== coin.lane) return false;

    const playerY = player.sprite.y;
    const playerHeight = player.sprite.height;
    const playerYTop = playerY - playerHeight / 2;
    const playerYBottom = playerY + playerHeight / 2;

    const coinY = coin.sprite.y;
    const coinHeight = coin.sprite.height;
    const coinYTop = coinY - coinHeight / 2;
    const coinYBottom = coinY + coinHeight / 2;

    return playerYBottom > coinYTop && playerYTop < coinYBottom;
  }

  applyMagnet(coin, dt) {
    const player = this.scene.player;
    if (!player || !player.sprite) return;

    const playerY = player.sprite.y;
    const coinY = coin.sprite.y;
    const verticalDist = Math.abs(playerY - coinY);

    if (verticalDist > GAMEPLAY.magnetRange) return;

    const playerLane = player.getLane();
    if (coin.lane === playerLane) return;

    const targetX = getLaneX(playerLane, this.width);
    const currentX = coin.sprite.x;
    const diff = targetX - currentX;

    if (Math.abs(diff) < 2) {
      coin.lane = playerLane;
      return;
    }

    const moveSpeed = 600 * dt;
    if (Math.abs(diff) <= moveSpeed) {
      coin.sprite.x = targetX;
      coin.lane = playerLane;
    } else {
      coin.sprite.x += Math.sign(diff) * moveSpeed;
    }
    coin.sprite.refreshBody();
  }

  handleResize(width, height) {
    this.width = width;
    this.height = height;
  }

  destroy() {
    for (const coin of this.coins) {
      coin.destroy();
    }
    this.coins = [];
    for (const coin of this.pool) {
      coin.destroy();
    }
    this.pool = [];
  }
}
