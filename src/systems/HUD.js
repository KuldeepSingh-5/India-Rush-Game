import Phaser from 'phaser';
import { COLORS, GAMEPLAY, getSafeAreaInsets } from '../config.js';
import { POWERUP_TYPES, POWERUP_TEXTURES } from '../entities/PowerUp.js';

const POWERUP_LABELS = {
  magnet: 'MAGNET',
  shield: 'SHIELD',
  speed: 'SPEED BOOST',
};

const POWERUP_COLORS = {
  magnet: 0xe63946,
  shield: 0x4ecdc4,
  speed: 0xffd700,
};

const SCORE_MILESTONE = 100;

export default class HUD {
  constructor(scene, width, height) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.safeArea = getSafeAreaInsets();

    this.barHeight = 56;
    this.lastMilestoneScore = 0;
    this.floatingTexts = [];

    this.createTopBar();
    this.createPowerUpArea();
    this.createHint();
  }

  // ── Top bar: score + coins ───────────────────────────────────

  createTopBar() {
    // Semi-transparent bar background
    this.barBg = this.scene.add.graphics({ x: 0, y: 0 });
    this.barBg.setDepth(95);
    this.barBg.setScrollFactor(0);
    this.redrawBarBg();

    // ── Coins (left side) ──
    this.coinContainer = this.scene.add.container(0, 0);
    this.coinContainer.setDepth(100);
    this.coinContainer.setScrollFactor(0);

    this.coinIcon = this.scene.add.image(0, 0, 'coin');
    this.coinIcon.setScale(0.7);
    this.coinIcon.setScrollFactor(0);

    this.coinText = this.scene.add.text(0, 0, '0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.coinText.setOrigin(0, 0.5);
    this.coinText.setScrollFactor(0);

    this.coinContainer.add([this.coinIcon, this.coinText]);

    // ── Score (center) ──
    this.scoreContainer = this.scene.add.container(0, 0);
    this.scoreContainer.setDepth(100);
    this.scoreContainer.setScrollFactor(0);

    this.scoreText = this.scene.add.text(0, 0, '0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '30px',
      fontWeight: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.scoreText.setOrigin(0.5, 0.5);
    this.scoreText.setScrollFactor(0);

    this.bestText = this.scene.add.text(0, 0, 'Best: 0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.bestText.setOrigin(0.5, 0);
    this.bestText.setScrollFactor(0);

    this.scoreContainer.add([this.scoreText, this.bestText]);

    this.layoutTopBar();
  }

  redrawBarBg() {
    this.barBg.clear();
    this.barBg.fillStyle(0x000000, 0.35);
    this.barBg.fillRect(0, 0, this.width, this.barHeight + this.safeArea.top);
    this.barBg.fillStyle(COLORS.menuPrimary, 0.5);
    this.barBg.fillRect(0, this.barHeight + this.safeArea.top - 2, this.width, 2);
  }

  layoutTopBar() {
    const cx = this.width / 2;
    const barCenterY = this.safeArea.top + this.barHeight / 2;

    // Coins on the left
    const coinIconX = this.safeArea.left + 16 + this.coinIcon.displayWidth / 2;
    this.coinIcon.setPosition(coinIconX, barCenterY);
    this.coinText.setPosition(coinIconX + this.coinIcon.displayWidth / 2 + 4, barCenterY);

    // Score centered
    this.scoreText.setPosition(cx, barCenterY - 4);
    this.bestText.setPosition(cx, barCenterY + 12);
  }

  // ── Power-up indicator area ──────────────────────────────────

  createPowerUpArea() {
    this.powerUpContainer = this.scene.add.container(
      this.width / 2,
      this.barHeight + this.safeArea.top + 8
    );
    this.powerUpContainer.setDepth(100);
    this.powerUpContainer.setScrollFactor(0);

    this.activeIndicators = {};
  }

  updatePowerUpIndicators(powerUpManager) {
    const activeTypes = [];
    if (powerUpManager.isMagnetActive()) activeTypes.push(POWERUP_TYPES.MAGNET);
    if (powerUpManager.isShieldActive()) activeTypes.push(POWERUP_TYPES.SHIELD);
    if (powerUpManager.isSpeedActive()) activeTypes.push(POWERUP_TYPES.SPEED);

    // Remove indicators for expired power-ups
    for (const key of Object.keys(this.activeIndicators)) {
      if (!activeTypes.includes(key)) {
        this.removeIndicator(key);
      }
    }

    // Add or update indicators for active power-ups
    const spacing = 100;
    const startX = -(activeTypes.length - 1) * spacing / 2;

    for (let i = 0; i < activeTypes.length; i++) {
      const type = activeTypes[i];
      if (!this.activeIndicators[type]) {
        this.addIndicator(type, startX + i * spacing);
      }
    }
  }

  addIndicator(type, x) {
    const indicator = this.scene.add.container(x, 0);
    indicator.setScrollFactor(0);
    this.powerUpContainer.add(indicator);

    const accentColor = POWERUP_COLORS[type] || 0xffffff;

    // Pill background
    const pillW = 92;
    const pillH = 30;
    const bg = this.scene.add.rectangle(0, 0, pillW, pillH, 0x000000, 0.5);
    bg.setStrokeStyle(2, accentColor, 0.8);
    bg.setScrollFactor(0);

    // Progress bar background (thin strip at bottom of pill)
    const progressBg = this.scene.add.rectangle(0, pillH / 2 - 2, pillW - 4, 3, 0x222233, 1);
    progressBg.setScrollFactor(0);

    // Progress bar fill
    const progressFill = this.scene.add.rectangle(-pillW / 2 + 2, pillH / 2 - 2, pillW - 4, 3, accentColor, 1);
    progressFill.setOrigin(0, 0.5);
    progressFill.setScrollFactor(0);

    // Icon
    const icon = this.scene.add.image(-pillW / 2 + 16, 0, 'powerup-' + type);
    icon.setScale(0.55);
    icon.setScrollFactor(0);

    // Label + timer
    const label = this.scene.add.text(-pillW / 2 + 30, -7, POWERUP_LABELS[type] || type, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '9px',
      fontWeight: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    label.setOrigin(0, 0.5);
    label.setScrollFactor(0);

    const timerText = this.scene.add.text(-pillW / 2 + 30, 5, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      fontWeight: 'bold',
      color: '#' + accentColor.toString(16).padStart(6, '0'),
      stroke: '#000000',
      strokeThickness: 2,
    });
    timerText.setOrigin(0, 0.5);
    timerText.setScrollFactor(0);

    indicator.add([bg, progressBg, progressFill, icon, label, timerText]);

    // Entrance animation
    indicator.setScale(0.5);
    indicator.setAlpha(0);
    this.scene.tweens.add({
      targets: indicator,
      scale: 1,
      alpha: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });

    // Gentle pulse
    this.scene.tweens.add({
      targets: bg,
      alpha: { from: 0.4, to: 0.6 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.activeIndicators[type] = { indicator, progressFill, timerText, pillW, duration: 0 };
  }

  removeIndicator(type) {
    const entry = this.activeIndicators[type];
    if (!entry) return;

    const indicator = entry.indicator;
    this.scene.tweens.add({
      targets: indicator,
      scale: 0.5,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => indicator.destroy(),
    });

    delete this.activeIndicators[type];
  }

  updateIndicatorTimers(powerUpManager) {
    for (const type of Object.keys(this.activeIndicators)) {
      const entry = this.activeIndicators[type];
      const duration = type === POWERUP_TYPES.MAGNET ? GAMEPLAY.magnetDuration
        : type === POWERUP_TYPES.SPEED ? GAMEPLAY.speedBoostDuration
        : 0;

      if (duration > 0) {
        const remaining = powerUpManager.getRemainingTime(type);
        const secs = Math.max(0, Math.ceil(remaining / 1000));
        entry.timerText.setText(secs + 's');
        const ratio = Math.max(0, remaining / duration);
        entry.progressFill.displayWidth = Math.max(0, (entry.pillW - 4) * ratio);
      } else {
        // Shield (no expiry) — show infinite
        entry.timerText.setText('ACTIVE');
        entry.progressFill.displayWidth = entry.pillW - 4;
      }
    }
  }

  clearAllIndicators() {
    for (const type of Object.keys(this.activeIndicators)) {
      this.activeIndicators[type].indicator.destroy();
    }
    this.activeIndicators = {};
  }

  // ── Hint text (bottom) ───────────────────────────────────────

  createHint() {
    this.hintText = this.scene.add.text(
      this.width / 2,
      this.height - this.safeArea.bottom - 30,
      'Swipe or use arrow keys',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#888888',
      }
    );
    this.hintText.setOrigin(0.5, 1);
    this.hintText.setDepth(100);
    this.hintText.setScrollFactor(0);
    this.hintText.setAlpha(0.6);
  }

  fadeHint() {
    if (this.hintText && this.hintText.alpha > 0) {
      this.scene.tweens.add({
        targets: this.hintText,
        alpha: 0,
        duration: 500,
      });
    }
  }

  // ── Score update ─────────────────────────────────────────────

  setScore(score) {
    this.scoreText.setText(score.toString());

    const milestone = Math.floor(score / SCORE_MILESTONE);
    const prevMilestone = Math.floor(this.lastMilestoneScore / SCORE_MILESTONE);
    if (milestone > prevMilestone && score > 0) {
      this.playScoreMilestone();
    }
    this.lastMilestoneScore = score;
  }

  setBest(best) {
    this.bestText.setText('Best: ' + best);
  }

  playScoreMilestone() {
    this.scene.tweens.add({
      targets: this.scoreText,
      scale: { from: 1.25, to: 1 },
      duration: 300,
      ease: 'Back.easeOut',
    });

    // Brief golden flash
    const flash = this.scene.add.text(
      this.scoreText.x,
      this.scoreText.y,
      this.scoreText.text,
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '30px',
        fontWeight: 'bold',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 4,
      }
    );
    flash.setOrigin(0.5);
    flash.setDepth(99);
    flash.setScrollFactor(0);
    flash.setScale(1.25);
    flash.setAlpha(0.8);

    this.scene.tweens.add({
      targets: flash,
      scale: 1.6,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => flash.destroy(),
    });
  }

  // ── Coin collection animation ───────────────────────────────

  playCoinCollect() {
    // Pulse the coin icon
    this.scene.tweens.add({
      targets: this.coinIcon,
      scale: { from: 0.85, to: 0.7 },
      duration: 150,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    // Floating "+1" near the coin counter
    const startX = this.coinIcon.x + this.coinIcon.displayWidth / 2 + 20;
    const startY = this.coinIcon.y - 8;

    const plus = this.scene.add.text(startX, startY, '+1', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3,
    });
    plus.setOrigin(0.5);
    plus.setDepth(101);
    plus.setScrollFactor(0);

    this.scene.tweens.add({
      targets: plus,
      y: startY - 24,
      alpha: 0,
      scale: { from: 1, to: 0.7 },
      duration: 600,
      ease: 'Power2',
      onComplete: () => plus.destroy(),
    });
  }

  // ── Coins update ─────────────────────────────────────────────

  setCoins(coins) {
    this.coinText.setText(coins.toString());
  }

  // ── Resize ───────────────────────────────────────────────────

  handleResize(width, height) {
    this.width = width;
    this.height = height;
    this.safeArea = getSafeAreaInsets();
    this.redrawBarBg();
    this.layoutTopBar();
    this.powerUpContainer.setPosition(width / 2, this.barHeight + this.safeArea.top + 8);
    if (this.hintText) this.hintText.setPosition(width / 2, height - this.safeArea.bottom - 30);
  }

  // ── Cleanup ─────────────────────────────────────────────────

  destroy() {
    this.clearAllIndicators();
    if (this.barBg) this.barBg.destroy();
    if (this.coinContainer) this.coinContainer.destroy(true);
    if (this.scoreContainer) this.scoreContainer.destroy(true);
    if (this.powerUpContainer) this.powerUpContainer.destroy(true);
    if (this.hintText) this.hintText.destroy();
  }
}
