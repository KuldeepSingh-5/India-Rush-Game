import Phaser from 'phaser';
import { COLORS, GAMEPLAY, getLaneX, LANES, getSafeAreaInsets, audioManager, getSelectedCharacter, getTotalCoins, saveTotalCoins, recordMissionProgress, setMissionProgress, isTutorialCompleted } from '../config.js';
import Player from '../entities/Player.js';
import Road from '../entities/Road.js';
import Environment from '../entities/Environment.js';
import ObstacleManager from '../systems/ObstacleManager.js';
import CoinManager from '../systems/CoinManager.js';
import InputManager from '../systems/InputManager.js';
import SettingsPanel from '../systems/SettingsPanel.js';
import PauseMenu from '../systems/PauseMenu.js';
import PowerUpManager from '../systems/PowerUpManager.js';
import Tutorial from '../systems/Tutorial.js';
import HUD from '../systems/HUD.js';
import FeedbackEffects from '../systems/FeedbackEffects.js';
import { POWERUP_TYPES } from '../entities/PowerUp.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.gameWidth = this.scale.width;
    this.gameHeight = this.scale.height;
    this.gameOver = false;
    this.isPaused = false;
    this.tutorialActive = false;
    this.elapsedTime = 0;
    this.currentSpeed = GAMEPLAY.baseScrollSpeed;
    this.audioManager = audioManager;

    this.environment = new Environment(this, this.gameWidth, this.gameHeight);
    this.road = new Road(this, this.gameWidth, this.gameHeight);
    this.character = getSelectedCharacter();
    this.player = new Player(this, this.gameWidth, this.gameHeight, this.character.id);
    this.obstacleManager = new ObstacleManager(this, this.gameWidth, this.gameHeight);
    this.coinManager = new CoinManager(this, this.gameWidth, this.gameHeight);
    this.powerUpManager = new PowerUpManager(this, this.gameWidth, this.gameHeight);
    this.inputManager = new InputManager(this);
    this.settingsPanel = new SettingsPanel(this, audioManager);
    this.pauseMenu = new PauseMenu(this);
    this.tutorial = new Tutorial(this);
    this.hud = new HUD(this, this.gameWidth, this.gameHeight);
    this.feedback = new FeedbackEffects(this);

    this.activeEffectVisuals = {};

    this.inputManager.on('moveLeft', () => {
      if (this.tutorialActive) return;
      if (this.player.moveLeft()) audioManager.playSfx('lane');
    });
    this.inputManager.on('moveRight', () => {
      if (this.tutorialActive) return;
      if (this.player.moveRight()) audioManager.playSfx('lane');
    });
    this.inputManager.on('jump', () => {
      if (this.tutorialActive) return;
      if (this.player.jump()) audioManager.playSfx('jump');
    });
    this.inputManager.on('slide', () => {
      if (this.tutorialActive) return;
      if (this.player.slide()) audioManager.playSfx('slide');
    });

    this.createSettingsButton();
    this.createPauseButton();

    this.input.once('pointerdown', () => {
      audioManager.unlock();
      audioManager.resume();
      audioManager.startMusic();
    });
    this.input.keyboard.once('keydown', () => {
      audioManager.unlock();
      audioManager.resume();
      audioManager.startMusic();
    });

    this._escHandler = () => {
      if (this.gameOver || this.tutorialActive) return;
      if (this.isPaused) this.resumeGame();
      else this.pauseGame();
    };
    this._pHandler = () => {
      if (this.gameOver || this.tutorialActive) return;
      if (this.isPaused) this.resumeGame();
      else this.pauseGame();
    };
    this.input.keyboard.on('keydown-ESC', this._escHandler);
    this.input.keyboard.on('keydown-P', this._pHandler);

    this.score = 0;
    this.distance = 0;
    this.coins = 0;
    this.bestScore = this.loadBestScore();
    this.lastDistanceCheckpoint = 0;
    this.hintFading = false;

    recordMissionProgress('games', 1);

    this.events.once('shutdown', this.shutdown, this);
    this.events.once('destroy', this.shutdown, this);

    this.hud.setBest(this.bestScore);

    this.scale.on('resize', this.handleResize, this);
    this.physics.world.setBoundsCollision(false, false, false, false);

    if (!isTutorialCompleted()) {
      this.tutorialActive = true;
      this.tutorial.show();
    }
  }

  onTutorialDismissed() {
    this.tutorialActive = false;
  }

  update(time, delta) {
    if (this.gameOver || this.isPaused || this.tutorialActive) return;

    const dt = delta / 1000;
    this.elapsedTime += dt;
    this.currentSpeed = Math.min(
      GAMEPLAY.maxScrollSpeed,
      GAMEPLAY.baseScrollSpeed + this.elapsedTime * GAMEPLAY.speedIncreasePerSec
    );

    const speedMultiplier = this.powerUpManager.getSpeedMultiplier();
    const effectiveSpeed = this.currentSpeed * speedMultiplier;

    this.environment.update(effectiveSpeed, dt);
    this.road.update(effectiveSpeed, dt);
    this.player.update(dt);
    this.obstacleManager.update(effectiveSpeed, dt, this.elapsedTime);
    this.coinManager.update(effectiveSpeed, dt);
    this.powerUpManager.update(effectiveSpeed, dt);

    this.updateActiveVisualPositions();
    this.hud.updatePowerUpIndicators(this.powerUpManager);
    this.hud.updateIndicatorTimers(this.powerUpManager);

    this.distance += effectiveSpeed * dt * 0.1;
    const newScore = Math.floor(this.distance);
    if (newScore !== this.score) {
      this.score = newScore;
      this.hud.setScore(this.score);
    }

    if (this.score > 0 && this.score - this.lastDistanceCheckpoint >= 50) {
      this.lastDistanceCheckpoint = Math.floor(this.score / 50) * 50;
      setMissionProgress('distance', this.score);
    }

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      this.hud.setBest(this.bestScore);
    }

    if (this.score > 50 && !this.hintFading) {
      this.hintFading = true;
      this.hud.fadeHint();
    }
  }

  collectCoin() {
    this.coins++;
    this.hud.setCoins(this.coins);
    this.hud.playCoinCollect();
    audioManager.playSfx('coin');
    recordMissionProgress('coins', 1);

    if (this.player && this.player.sprite) {
      this.feedback.playCoinCollect(this.player.sprite.x, this.player.sprite.y);
    }
  }

  loadBestScore() {
    try {
      const stored = localStorage.getItem('india-rush-best-score');
      return stored ? parseInt(stored, 10) || 0 : 0;
    } catch (e) {
      return 0;
    }
  }

  saveBestScore() {
    try {
      localStorage.setItem('india-rush-best-score', this.bestScore.toString());
    } catch (e) {
      // localStorage may be unavailable
    }
  }

  triggerGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.inputManager.destroy();
    this.cleanupPowerUpVisuals();
    audioManager.stopMusic();
    audioManager.playSfx('crash');
    this.player.playDeath(() => {
      audioManager.playSfx('gameover');
      this.saveBestScore();
      setMissionProgress('distance', Math.floor(this.distance));
      const total = getTotalCoins() + this.coins;
      saveTotalCoins(total);
      this.scene.launch('GameOverScene', {
        score: this.score,
        best: this.bestScore,
        coins: this.coins,
      });
    });
  }

  restart() {
    this.scene.stop('GameOverScene');
    this.scene.restart();
  }

  createPauseButton() {
    const btnSize = 36;
    const safeArea = getSafeAreaInsets();
    const x = this.gameWidth - safeArea.right - 74;
    const y = safeArea.top + 22;

    this.pauseButton = this.add.container(x, y);
    this.pauseButton.setDepth(110);
    this.pauseButton.setScrollFactor(0);

    const bg = this.add.circle(0, 0, btnSize / 2, COLORS.gameOverBg, 0.7);
    bg.setStrokeStyle(2, COLORS.menuBtnGold);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setFillStyle(COLORS.menuBtnGoldHover, 0.8));
    bg.on('pointerout', () => bg.setFillStyle(COLORS.gameOverBg, 0.7));
    bg.on('pointerup', () => {
      audioManager.playSfx('click');
      this.pauseGame();
    });

    const icon = this.add.text(0, 0, '\u23F8', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
    });
    icon.setOrigin(0.5);

    this.pauseButton.add([bg, icon]);
  }

  pauseGame() {
    if (this.gameOver || this.isPaused) return;
    this.isPaused = true;

    this.tweens.pauseAll();

    if (this.player) {
      this.player.stopBounce();
      if (this.player.sprite && this.player.sprite.anims) {
        this.player.sprite.anims.pause();
      }
    }

    audioManager.stopMusic();
    this.pauseMenu.show();
  }

  resumeGame() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.pauseMenu.hide();

    if (this.player && !this.player.isJumping && !this.player.isSliding && !this.player.isDead) {
      this.player.playRunning();
    }

    this.tweens.resumeAll();

    audioManager.resume();
    audioManager.startMusic();
  }

  createSettingsButton() {
    const btnSize = 36;
    const safeArea = getSafeAreaInsets();
    const x = this.gameWidth - safeArea.right - 30;
    const y = safeArea.top + 22;

    this.settingsButton = this.add.container(x, y);
    this.settingsButton.setDepth(110);
    this.settingsButton.setScrollFactor(0);

    const bg = this.add.circle(0, 0, btnSize / 2, COLORS.gameOverBg, 0.7);
    bg.setStrokeStyle(2, COLORS.restartBtn);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setFillStyle(COLORS.restartBtnHover, 0.8));
    bg.on('pointerout', () => bg.setFillStyle(COLORS.gameOverBg, 0.7));
    bg.on('pointerup', () => {
      audioManager.playSfx('click');
      this.settingsPanel.toggle();
    });

    const icon = this.add.text(0, 0, '\u2699', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#ffffff',
    });
    icon.setOrigin(0.5);

    this.settingsButton.add([bg, icon]);
  }

  onPowerUpActivated(type) {
    this.showPowerUpVisual(type);
    if (this.player && this.player.sprite) {
      this.feedback.playPowerUpPickup(this.player.sprite.x, this.player.sprite.y, type);
    }
  }

  onPowerUpDeactivated(type) {
    this.hidePowerUpVisual(type);
  }

  showPowerUpVisual(type) {
    this.hidePowerUpVisual(type);

    if (type === POWERUP_TYPES.SHIELD) {
      const shield = this.add.image(this.player.sprite.x, this.player.sprite.y, 'powerup-shield');
      shield.setDepth(45);
      shield.setAlpha(0.6);
      shield.setScale(1.4);
      this.activeEffectVisuals.shield = shield;
      this.activeEffectVisuals.shieldTween = this.tweens.add({
        targets: shield,
        alpha: { from: 0.4, to: 0.7 },
        scale: { from: 1.3, to: 1.5 },
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else if (type === POWERUP_TYPES.MAGNET) {
      const aura = this.add.image(this.player.sprite.x, this.player.sprite.y, 'powerup-glow');
      aura.setDepth(44);
      aura.setAlpha(0.3);
      aura.setScale(2.5);
      aura.setTint(0xff4444);
      this.activeEffectVisuals.magnet = aura;
      this.activeEffectVisuals.magnetTween = this.tweens.add({
        targets: aura,
        alpha: { from: 0.2, to: 0.4 },
        scale: { from: 2.2, to: 2.8 },
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else if (type === POWERUP_TYPES.SPEED) {
      const trail = this.add.image(this.player.sprite.x, this.player.sprite.y, 'powerup-glow');
      trail.setDepth(44);
      trail.setAlpha(0.35);
      trail.setScale(2);
      trail.setTint(0xffd700);
      this.activeEffectVisuals.speed = trail;
      this.activeEffectVisuals.speedTween = this.tweens.add({
        targets: trail,
        alpha: { from: 0.25, to: 0.5 },
        scale: { from: 1.8, to: 2.3 },
        duration: 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  hidePowerUpVisual(type) {
    const key = type;
    if (this.activeEffectVisuals[key + 'Tween']) {
      this.activeEffectVisuals[key + 'Tween'].stop();
      delete this.activeEffectVisuals[key + 'Tween'];
    }
    if (this.activeEffectVisuals[key]) {
      const visual = this.activeEffectVisuals[key];
      this.tweens.add({
        targets: visual,
        alpha: 0,
        scale: 0.5,
        duration: 200,
        onComplete: () => visual.destroy(),
      });
      delete this.activeEffectVisuals[key];
    }
  }

  cleanupPowerUpVisuals() {
    for (const key of Object.keys(this.activeEffectVisuals)) {
      if (key.endsWith('Tween')) {
        this.activeEffectVisuals[key].stop();
      } else if (this.activeEffectVisuals[key] && this.activeEffectVisuals[key].active) {
        this.activeEffectVisuals[key].destroy();
      }
    }
    this.activeEffectVisuals = {};
  }

  flashShieldBreak() {
    const flash = this.add.rectangle(
      this.gameWidth / 2, this.gameHeight / 2,
      this.gameWidth, this.gameHeight,
      0x4ecdc4, 0.4
    );
    flash.setDepth(199);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy(),
    });
  }

  updateActiveVisualPositions() {
    if (!this.player || !this.player.sprite) return;
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;

    for (const key of ['magnet', 'shield', 'speed']) {
      if (this.activeEffectVisuals[key] && this.activeEffectVisuals[key].active) {
        this.activeEffectVisuals[key].x = px;
        this.activeEffectVisuals[key].y = py;
      }
    }
  }

  handleResize(gameSize) {
    this.gameWidth = gameSize.width;
    this.gameHeight = gameSize.height;
    const safeArea = getSafeAreaInsets();

    if (this.environment) this.environment.handleResize(this.gameWidth, this.gameHeight);
    if (this.road) this.road.handleResize(this.gameWidth, this.gameHeight);
    if (this.player) this.player.handleResize(this.gameWidth, this.gameHeight);
    if (this.obstacleManager) this.obstacleManager.handleResize(this.gameWidth, this.gameHeight);
    if (this.coinManager) this.coinManager.handleResize(this.gameWidth, this.gameHeight);
    if (this.powerUpManager) this.powerUpManager.handleResize(this.gameWidth, this.gameHeight);
    if (this.settingsPanel) this.settingsPanel.handleResize(this.gameWidth, this.gameHeight);
    if (this.pauseMenu) this.pauseMenu.handleResize(this.gameWidth, this.gameHeight);
    if (this.tutorial) this.tutorial.handleResize(this.gameWidth, this.gameHeight);
    if (this.hud) this.hud.handleResize(this.gameWidth, this.gameHeight);
    if (this.settingsButton) this.settingsButton.setPosition(this.gameWidth - safeArea.right - 30, safeArea.top + 22);
    if (this.pauseButton) this.pauseButton.setPosition(this.gameWidth - safeArea.right - 74, safeArea.top + 22);
  }

  shutdown() {
    this.scale.off('resize', this.handleResize, this);
    this.input.keyboard.off('keydown-ESC', this._escHandler);
    this.input.keyboard.off('keydown-P', this._pHandler);

    if (this.inputManager) this.inputManager.destroy();
    if (this.obstacleManager) this.obstacleManager.destroy();
    if (this.coinManager) this.coinManager.destroy();
    if (this.powerUpManager) this.powerUpManager.destroy();
    if (this.environment) this.environment.destroy();
    if (this.road) this.road.destroy();
    if (this.player) this.player.destroy();
    if (this.settingsPanel) this.settingsPanel.destroy();
    if (this.pauseMenu) this.pauseMenu.destroy();
    if (this.tutorial) this.tutorial.destroy();
    if (this.hud) this.hud.destroy();
    if (this.feedback) this.feedback.destroy();

    this.cleanupPowerUpVisuals();

    audioManager.stopMusic();
    this.tweens.killAll();
  }
}
