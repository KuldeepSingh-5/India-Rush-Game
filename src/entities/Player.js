import Phaser from 'phaser';
import { COLORS, GAMEPLAY, getLaneX, LANES } from '../config.js';

export default class Player {
  constructor(scene, width, height, characterId = 'default') {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.characterId = characterId;

    this.currentLane = LANES.CENTER;
    this.targetLane = LANES.CENTER;

    this.isJumping = false;
    this.isSliding = false;
    this.isDead = false;
    this.jumpTime = 0;
    this.slideTime = 0;

    this.baseY = height * 0.78;
    this.x = getLaneX(this.currentLane, width);
    this.y = this.baseY;
    this.displayWidth = GAMEPLAY.playerSize;
    this.displayHeight = GAMEPLAY.playerSize;

    this.sprite = scene.add.sprite(this.x, this.y, characterId + '-player-run-1');
    this.sprite.setScale(1.2);
    this.sprite.setDepth(50);

    this.laneOffset = 0;
    this.targetX = this.x;

    this.playRunning();
  }

  playRunning() {
    this.sprite.play(this.characterId + '-running');
    this.stopBounce();
    this.sprite.y = this.baseY;
    this.bounceTween = this.scene.tweens.add({
      targets: this.sprite,
      y: this.baseY - 4,
      duration: 100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  stopBounce() {
    if (this.bounceTween) {
      this.bounceTween.stop();
      this.bounceTween = null;
    }
  }

  moveLeft() {
    if (this.isDead || this.laneTween) return false;
    if (this.targetLane > 0) {
      this.targetLane--;
      this.targetX = getLaneX(this.targetLane, this.width);
      this.startLaneTween();
      return true;
    }
    return false;
  }

  moveRight() {
    if (this.isDead || this.laneTween) return false;
    if (this.targetLane < 2) {
      this.targetLane++;
      this.targetX = getLaneX(this.targetLane, this.width);
      this.startLaneTween();
      return true;
    }
    return false;
  }

  startLaneTween() {
    if (this.laneTween) this.laneTween.stop();
    const laneMotion = { x: this.sprite.x };
    this.laneMotion = laneMotion;
    this.laneTween = this.scene.tweens.add({
      targets: laneMotion,
      x: this.targetX,
      duration: 180,
      ease: 'Power2.out',
      onUpdate: () => {
        this.sprite.x = laneMotion.x;
        this.x = laneMotion.x;
      },
      onComplete: () => {
        this.x = this.targetX;
        this.sprite.x = this.targetX;
        this.laneTween = null;
        this.laneMotion = null;
      },
    });
  }

  jump() {
    if (this.isJumping || this.isSliding || this.isDead) return false;
    this.isJumping = true;
    this.jumpTime = 0;

    this.sprite.anims.pause();
    this.sprite.setTexture(this.characterId + '-player-jump');
    this.sprite.setScale(1.2, 1.2);
    this.stopBounce();

    this.scene.tweens.add({
      targets: this.sprite,
      y: this.baseY - 120,
      scaleY: 1.2,
      scaleX: 0.85,
      duration: GAMEPLAY.jumpDuration / 2,
      ease: 'Quad.easeOut',
      yoyo: true,
      onComplete: () => {
        this.isJumping = false;
        this.sprite.y = this.baseY;
        this.sprite.setScale(1.2, 1.2);
        this.playRunning();
      },
    });
    return true;
  }

  slide() {
    if (this.isJumping || this.isSliding || this.isDead) return false;
    this.isSliding = true;
    this.slideTime = 0;

    this.sprite.anims.pause();
    this.sprite.setTexture(this.characterId + '-player-slide');
    this.sprite.setScale(1.2, 1.2);
    this.sprite.y = this.baseY + this.displayHeight * 0.25;
    this.stopBounce();

    this.slideTimer = this.scene.time.delayedCall(GAMEPLAY.slideDuration, () => {
      if (this.isDead) return;
      this.isSliding = false;
      this.slideTimer = null;
      this.sprite.y = this.baseY;
      this.playRunning();
    });
    return true;
  }

  playDeath(callback) {
    this.isDead = true;
    this.stopBounce();
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.killTweensOf(this.sprite);

    this.sprite.anims.pause();
    this.sprite.setTexture(this.characterId + '-player-dead');
    this.sprite.setScale(1.2, 1.2);
    this.sprite.y = this.baseY;
    this.sprite.rotation = 0;
    this.sprite.alpha = 1;

    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.sprite,
          rotation: Math.PI * 2,
          alpha: 0,
          y: this.baseY + 50,
          scaleX: 0.3,
          scaleY: 0.3,
          duration: 600,
          ease: 'Power2',
          onComplete: () => {
            if (callback) callback();
          },
        });
      },
    });
  }

  update(dt) {
    this.jumpTime += dt;
    this.slideTime += dt;
  }

  getBounds() {
    return {
      x: this.sprite.x - this.displayWidth / 2,
      y: this.sprite.y - this.sprite.height / 2,
      width: this.displayWidth,
      height: this.sprite.height,
    };
  }

  getLane() {
    return this.targetLane;
  }

  isAirborne() {
    return this.isJumping;
  }

  isSlidingNow() {
    return this.isSliding;
  }

  handleResize(width, height) {
    this.width = width;
    this.height = height;
    this.baseY = height * 0.78;
    this.x = getLaneX(this.targetLane, width);
    this.targetX = this.x;
    if (this.laneTween) {
      this.laneTween.stop();
      this.laneTween = null;
      this.laneMotion = null;
    }
    this.sprite.x = this.x;

    this.stopBounce();

    if (this.isSliding) {
      this.sprite.setScale(1.2, 1.2);
      this.sprite.y = this.baseY + this.displayHeight * 0.25;
    } else if (!this.isJumping && !this.isDead) {
      this.sprite.setScale(1.2, 1.2);
      this.sprite.y = this.baseY;
      this.playRunning();
    }
  }

  destroy() {
    this.stopBounce();
    if (this.laneTween) {
      this.laneTween.stop();
      this.laneTween = null;
      this.laneMotion = null;
    }
    if (this.slideTimer) {
      this.slideTimer.remove();
      this.slideTimer = null;
    }
    if (this.scene && this.scene.tweens) {
      this.scene.tweens.killTweensOf(this);
      this.scene.tweens.killTweensOf(this.sprite);
    }
    if (this.sprite) this.sprite.destroy();
  }
}
