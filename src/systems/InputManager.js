import Phaser from 'phaser';

const SWIPE_THRESHOLD = 30;

export default class InputManager extends Phaser.Events.EventEmitter {
  constructor(scene) {
    super();
    this.scene = scene;

    this.startX = 0;
    this.startY = 0;
    this.startTime = 0;
    this.isTracking = false;

    this.setupKeyboard();
    this.setupTouch();
  }

  setupKeyboard() {
    this.keyboardListener = (event) => {
      switch (event.code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.emit('moveLeft');
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.emit('moveRight');
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          this.emit('jump');
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.emit('slide');
          break;
      }
    };

    this.scene.input.keyboard.on('keydown', this.keyboardListener);
  }

  setupTouch() {
    this.scene.input.on('pointerdown', this.onPointerDown, this);
    this.scene.input.on('pointerup', this.onPointerUp, this);
    this.scene.input.on('pointermove', this.onPointerMove, this);
  }

  onPointerDown(pointer) {
    this.startX = pointer.x;
    this.startY = pointer.y;
    this.startTime = pointer.time;
    this.isTracking = true;
  }

  onPointerMove(pointer) {
    if (!this.isTracking) return;

    const dx = pointer.x - this.startX;
    const dy = pointer.y - this.startY;

    if (Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(dy) > SWIPE_THRESHOLD) {
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) {
          this.emit('moveRight');
        } else {
          this.emit('moveLeft');
        }
      } else {
        if (dy < 0) {
          this.emit('jump');
        } else {
          this.emit('slide');
        }
      }
      this.isTracking = false;
    }
  }

  onPointerUp(pointer) {
    if (!this.isTracking) return;

    const dx = pointer.x - this.startX;
    const dy = pointer.y - this.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const elapsed = pointer.time - this.startTime;

    if (dist < 15 && elapsed < 250) {
      this.emit('jump');
    }

    this.isTracking = false;
  }

  destroy() {
    this.scene.input.keyboard.off('keydown', this.keyboardListener);
    this.scene.input.off('pointerdown', this.onPointerDown, this);
    this.scene.input.off('pointerup', this.onPointerUp, this);
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.removeAllListeners();
  }
}
