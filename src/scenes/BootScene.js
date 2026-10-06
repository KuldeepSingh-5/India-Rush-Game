import Phaser from 'phaser';
import { COLORS, GAMEPLAY, CHARACTERS } from '../config.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.cameras.main.setBackgroundColor(COLORS.gameOverBg);

    this.createLoadingScreen();
    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this);
    });

    // Generate textures over a few frames so the loading bar animates,
    // then transition to the menu. If generation is instant (cached),
    // we still show a brief loading animation for polish.
    this.loadingSteps = [
      () => this.createPlayerTextures(),
      () => this.createObstacleTextures(),
      () => this.createEnvironmentTextures(),
      () => this.createVehicleTextures(),
      () => this.createTrainTextures(),
      () => this.createPowerUpTextures(),
      () => this.createAnimations(),
    ];
    this.currentStep = 0;
    this.totalSteps = this.loadingSteps.length;

    this.time.delayedCall(80, () => this.runNextStep());
  }

  runNextStep() {
    if (this.currentStep < this.loadingSteps.length) {
      this.loadingSteps[this.currentStep]();
      this.currentStep++;
      const progress = this.currentStep / this.totalSteps;
      this.animateProgressTo(progress, () => {
        this.time.delayedCall(40, () => this.runNextStep());
      });
    } else {
      this.animateProgressTo(1, () => {
        this.time.delayedCall(300, () => this.transitionToMenu());
      });
    }
  }

  animateProgressTo(target, callback) {
    if (!this.progressBarFill) {
      if (callback) callback();
      return;
    }
    const targetW = this.progressBarWidth * target;
    this.tweens.add({
      targets: this.progressBarFill,
      displayWidth: targetW,
      duration: 200,
      ease: 'Power2',
      onUpdate: () => {
        if (this.progressBarFill.displayWidth < 2) {
          this.progressBarFill.setVisible(false);
          if (this.progressGlow) this.progressGlow.setVisible(false);
        } else {
          this.progressBarFill.setVisible(true);
          if (this.progressGlow) {
            this.progressGlow.setVisible(true);
            this.progressGlow.x = this.progressBarFill.x + this.progressBarFill.displayWidth;
          }
        }
      },
      onComplete: () => {
        if (this.loadingPercent) {
          this.loadingPercent.setText(Math.round(target * 100) + '%');
        }
        if (callback) callback();
      },
    });
  }

  transitionToMenu() {
    this.tweens.add({
      targets: this.loadingContainer,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        for (const b of this.bgBuildings) {
          const key = b.texture.key;
          b.destroy();
          if (key && key.startsWith('__loading-building-') && this.textures.exists(key)) {
            this.textures.remove(key);
          }
        }
        this.scene.start('MenuScene');
      },
    });
  }

  createObstacleTextures() {
    if (!this.textures.exists('obstacle-low')) {
      const w = 60;
      const h = 28;
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x333333, 1);
      g.fillRect(5, 16, 5, 12);
      g.fillRect(w - 10, 16, 5, 12);
      g.fillStyle(COLORS.obstacleOutline, 1);
      g.fillRect(0, 3, w, 14);
      g.fillStyle(COLORS.obstacleLow, 1);
      for (let i = -8; i < w; i += 16) {
        g.fillTriangle(i, 3, i + 8, 3, i + 20, 17);
      }
      g.fillStyle(0x222222, 0.9);
      g.fillRect(0, 17, w, 3);
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(8, 23, 2);
      g.fillCircle(w - 8, 23, 2);
      g.generateTexture('obstacle-low', w, h);
      g.destroy();
    }

    if (!this.textures.exists('obstacle-high')) {
      const w = 60;
      const h = 54;
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x333333, 1);
      g.fillRect(4, 0, 5, h);
      g.fillRect(w - 9, 0, 5, h);
      g.fillStyle(COLORS.obstacleHigh, 1);
      g.fillRect(0, 4, w, 12);
      g.fillStyle(COLORS.obstacleOutline, 0.9);
      g.fillRect(0, 16, w, 3);
      g.fillStyle(0x222222, 1);
      g.fillRect(10, 19, w - 20, 4);
      g.fillStyle(0xffffff, 0.7);
      g.fillRect(18, 7, 24, 3);
      g.fillStyle(COLORS.obstacleHigh, 0.9);
      g.fillTriangle(14, 29, 30, 29, 22, 43);
      g.fillTriangle(30, 29, 46, 29, 38, 43);
      g.generateTexture('obstacle-high', w, h);
      g.destroy();
    }

    if (!this.textures.exists('obstacle-full')) {
      const w = 82;
      const h = 100;
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(COLORS.trainWheel, 1);
      g.fillCircle(18, h - 5, 9);
      g.fillCircle(w - 18, h - 5, 9);
      g.fillStyle(COLORS.trainBody, 1);
      g.fillRoundedRect(3, 12, w - 6, h - 22, 8);
      g.fillStyle(COLORS.trainRoof, 1);
      g.fillRoundedRect(0, 6, w, 12, 4);
      g.fillStyle(COLORS.trainWindow, 0.9);
      g.fillRoundedRect(12, 23, 18, 18, 3);
      g.fillRoundedRect(35, 23, 18, 18, 3);
      g.fillStyle(COLORS.trainStripe, 1);
      g.fillRect(5, 48, w - 10, 5);
      g.fillStyle(0xfff8b0, 0.9);
      g.fillCircle(w / 2, 66, 5);
      g.fillStyle(0xffffff, 0.35);
      g.fillRect(12, 23, 18, 5);
      g.fillRect(35, 23, 18, 5);
      g.generateTexture('obstacle-full', w, h);
      g.generateTexture('obstacle-train', w, h);
      g.destroy();
    }

    if (!this.textures.exists('lane-divider')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(COLORS.laneDivider, 1);
      g.fillRect(0, 0, 8, 40);
      g.generateTexture('lane-divider', 8, 80);
      g.destroy();
    }

    if (!this.textures.exists('grass-tile')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(COLORS.grass, 1);
      g.fillRect(0, 0, 64, 64);
      g.fillStyle(COLORS.grassAlt, 1);
      g.fillRect(0, 0, 32, 32);
      g.fillRect(32, 32, 32, 32);
      g.generateTexture('grass-tile', 64, 64);
      g.destroy();
    }

    if (!this.textures.exists('coin')) {
      const size = 32;
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(COLORS.coinOutline, 1);
      g.fillCircle(size / 2, size / 2, size / 2);
      g.fillStyle(COLORS.coin, 1);
      g.fillCircle(size / 2, size / 2, size / 2 - 2);
      g.fillStyle(COLORS.coinInner, 1);
      g.fillCircle(size / 2, size / 2, size / 2 - 5);
      g.fillStyle(COLORS.coinShine, 0.7);
      g.fillCircle(size * 0.38, size * 0.38, 3);
      g.fillStyle(COLORS.coinOutline, 1);
      g.fillRect(size * 0.45, size * 0.3, 3, size * 0.4);
      g.generateTexture('coin', size, size);
      g.destroy();
    }
  }

  // ── Loading screen UI ───────────────────────────────────────

  createLoadingScreen() {
    this.loadingContainer = this.add.container(this.W / 2, this.H / 2);
    this.loadingContainer.setDepth(500);

    // Night-sky gradient background
    this.bgSky = this.add.graphics({ x: 0, y: 0 });
    this.bgSky.setDepth(-10);
    this.bgSky.fillGradientStyle(
      0x1a1a3e, 0x1a1a3e,
      0x2a1a4e, 0x3a2a5e,
      1
    );
    this.bgSky.fillRect(0, 0, this.W, this.H);

    // Stars
    this.bgStars = [];
    for (let i = 0; i < 30; i++) {
      const s = this.add.circle(
        Phaser.Math.Between(0, this.W),
        Phaser.Math.Between(0, this.H * 0.5),
        Phaser.Math.Between(1, 3),
        0xffffff,
        Phaser.Math.FloatBetween(0.3, 0.8)
      );
      s.setDepth(-9);
      this.bgStars.push({
        sprite: s,
        twinkle: Phaser.Math.FloatBetween(0.5, 1.5),
        phase: Phaser.Math.FloatBetween(0, Math.PI * 2),
      });
    }

    // Far buildings silhouette (drawn with graphics, no texture dependency)
    this.bgBuildings = [];
    const buildingColors = [0x3a2a4e, 0x2a3a4e, 0x3a2a3e, 0x2a2a3e];
    let bx = -20;
    while (bx < this.W + 100) {
      const bw = Phaser.Math.Between(40, 70);
      const bh = Phaser.Math.Between(50, 100);
      const color = buildingColors[Phaser.Math.Between(0, buildingColors.length - 1)];
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(color, 0.4);
      g.fillRect(0, 0, bw, bh);
      // A few lit windows
      g.fillStyle(0xfff5b0, 0.3);
      const cols = Math.floor(bw / 12);
      const rows = Math.floor(bh / 14);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (Math.random() > 0.55) {
            g.fillRect(4 + c * 12, 4 + r * 14, 6, 6);
          }
        }
      }
      const texKey = '__loading-building-' + bx + '-' + bw;
      g.generateTexture(texKey, bw, bh);
      g.destroy();
      const b = this.add.image(bx, this.H * 0.55, texKey);
      b.setOrigin(0, 1);
      b.setDepth(-8);
      b.setAlpha(0.5);
      this.bgBuildings.push(b);
      bx += bw + Phaser.Math.Between(4, 12);
    }

    // Ground area
    this.bgGround = this.add.rectangle(
      this.W / 2, this.H * 0.78,
      this.W, this.H * 0.5,
      0x1a2a1a, 0.3
    );
    this.bgGround.setDepth(-7);

    // Railway sleepers (drawn with rectangles, no texture dependency)
    this.bgSleepers = [];
    const sleeperSpacing = 80;
    const sleeperCount = Math.ceil(this.H / sleeperSpacing) + 2;
    for (let j = 0; j < sleeperCount; j++) {
      const sleeper = this.add.rectangle(
        this.W / 2,
        j * sleeperSpacing + this.H * 0.5,
        this.W * 0.5,
        10,
        0x5c4033,
        0.15
      );
      sleeper.setDepth(-6);
      this.bgSleepers.push(sleeper);
    }
    this.sleeperSpacing = sleeperSpacing;

    // ── Title ──
    const titleY = this.H * 0.30;

    this.titleText = this.add.text(0, titleY - this.H / 2, 'INDIA RUSH', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '52px',
      fontWeight: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 8,
    });
    this.titleText.setOrigin(0.5);
    this.loadingContainer.add(this.titleText);

    this.subtitleText = this.add.text(0, titleY - this.H / 2 + 48, 'TRAIN RUNNER', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#4ecdc4',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.subtitleText.setOrigin(0.5);
    this.loadingContainer.add(this.subtitleText);

    // Decorative line under subtitle
    this.titleLine = this.add.rectangle(0, titleY - this.H / 2 + 72, 160, 3, 0x4ecdc4, 0.7);
    this.titleLine.setOrigin(0.5);
    this.loadingContainer.add(this.titleLine);

    // ── Progress bar ──
    const barW = Math.min(280, this.W * 0.72);
    const barH = 14;
    const barY = this.H * 0.58 - this.H / 2;

    // Track (background)
    this.progressBarBg = this.add.rectangle(0, barY, barW, barH, 0x111122, 1);
    this.progressBarBg.setStrokeStyle(2, 0x3a4a63, 1);
    this.progressBarBg.setOrigin(0.5);
    this.loadingContainer.add(this.progressBarBg);

    // Fill
    this.progressBarWidth = barW - 4;
    this.progressBarFill = this.add.rectangle(
      -this.progressBarWidth / 2,
      barY,
      2,
      barH - 4,
      COLORS.menuPrimary,
      1
    );
    this.progressBarFill.setOrigin(0, 0.5);
    this.progressBarFill.setVisible(false);
    this.loadingContainer.add(this.progressBarFill);

    // Glow at the leading edge of the fill
    this.progressGlow = this.add.circle(
      -this.progressBarWidth / 2,
      barY,
      barH * 0.6,
      0xffffff,
      0.4
    );
    this.progressGlow.setVisible(false);
    this.loadingContainer.add(this.progressGlow);

    // "Loading..." text
    this.loadingText = this.add.text(0, barY + 32, 'Loading...', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#888888',
    });
    this.loadingText.setOrigin(0.5);
    this.loadingContainer.add(this.loadingText);

    // Percentage
    this.loadingPercent = this.add.text(0, barY - 28, '0%', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#4ecdc4',
    });
    this.loadingPercent.setOrigin(0.5);
    this.loadingContainer.add(this.loadingPercent);

    // ── Entrance animations ──
    this.titleText.setScale(0.5);
    this.titleText.setAlpha(0);
    this.tweens.add({
      targets: this.titleText,
      scale: 1,
      alpha: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });

    this.subtitleText.setAlpha(0);
    this.tweens.add({
      targets: this.subtitleText,
      alpha: 1,
      duration: 400,
      delay: 200,
    });

    this.titleLine.setScale(0, 1);
    this.tweens.add({
      targets: this.titleLine,
      scaleX: 1,
      duration: 400,
      delay: 300,
      ease: 'Power2',
    });

    this.loadingText.setAlpha(0);
    this.tweens.add({
      targets: this.loadingText,
      alpha: 1,
      duration: 300,
      delay: 400,
    });

    // Pulsing "Loading..." text
    this.tweens.add({
      targets: this.loadingText,
      alpha: { from: 0.5, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 700,
    });

    // Gentle floating on the title
    this.tweens.add({
      targets: this.titleText,
      y: this.titleText.y + 5,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  handleResize(gameSize) {
    const w = gameSize.width;
    const h = gameSize.height;
    this.W = w;
    this.H = h;

    this.bgSky.clear();
    this.bgSky.fillGradientStyle(
      0x1a1a3e, 0x1a1a3e,
      0x2a1a4e, 0x3a2a5e,
      1
    );
    this.bgSky.fillRect(0, 0, w, h);

    for (const s of this.bgStars) {
      if (s.sprite.x > w) s.sprite.x = Phaser.Math.Between(0, w);
      if (s.sprite.y > h * 0.5) s.sprite.y = Phaser.Math.Between(0, h * 0.5);
    }

    this.bgGround.setPosition(w / 2, h * 0.78);
    this.bgGround.setSize(w, h * 0.5);

    for (const s of this.bgSleepers) {
      s.setPosition(w / 2, s.y);
      s.setSize(w * 0.5, 10);
    }

    this.loadingContainer.setPosition(w / 2, h / 2);

    const barW = Math.min(280, w * 0.72);
    this.progressBarBg.setSize(barW, 14);
    this.progressBarWidth = barW - 4;
    // Keep fill proportion
    if (this.progressBarFill) {
      const ratio = this.currentStep / this.totalSteps;
      this.progressBarFill.displayWidth = Math.max(2, this.progressBarWidth * ratio);
      this.progressBarFill.setPosition(-this.progressBarWidth / 2, this.loadingText.y - 32);
    }
  }

  createPowerUpTextures() {
    if (!this.textures.exists('powerup-glow')) {
      const size = 48;
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(COLORS.powerUpGlow, 0.3);
      g.fillCircle(size / 2, size / 2, size / 2);
      g.fillStyle(COLORS.powerUpGlow, 0.15);
      g.fillCircle(size / 2, size / 2, size / 2 - 4);
      g.generateTexture('powerup-glow', size, size);
      g.destroy();
    }

    if (!this.textures.exists('powerup-magnet')) {
      const w = 40;
      const h = 40;
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x000000, 0.25);
      g.fillRoundedRect(2, 2, w - 4, h - 4, 8);
      g.fillStyle(COLORS.magnetTop, 1);
      g.fillRoundedRect(6, 6, w - 12, 8, 3);
      g.fillStyle(COLORS.magnetBody, 1);
      g.fillRoundedRect(6, 12, 6, 18, 2);
      g.fillRoundedRect(w - 12, 12, 6, 18, 2);
      g.fillStyle(COLORS.magnetDark, 1);
      g.fillRoundedRect(6, 28, 6, 6, 2);
      g.fillRoundedRect(w - 12, 28, 6, 6, 2);
      g.fillStyle(COLORS.magnetPole, 1);
      g.fillRect(8, 30, 2, 3);
      g.fillRect(w - 10, 30, 2, 3);
      g.fillStyle(0xffffff, 0.4);
      g.fillRect(8, 8, w - 16, 2);
      g.generateTexture('powerup-magnet', w, h);
      g.destroy();
    }

    if (!this.textures.exists('powerup-shield')) {
      const w = 40;
      const h = 40;
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x000000, 0.25);
      g.fillRoundedRect(2, 2, w - 4, h - 4, 8);
      g.fillStyle(COLORS.shieldOutline, 1);
      g.fillRoundedRect(8, 6, w - 16, h - 12, 6);
      g.fillStyle(COLORS.shieldBody, 1);
      g.fillRoundedRect(10, 8, w - 20, h - 16, 5);
      g.fillStyle(COLORS.shieldInner, 0.6);
      g.fillRoundedRect(14, 12, w - 28, h - 24, 4);
      g.fillStyle(COLORS.shieldShine, 0.5);
      g.fillRoundedRect(14, 12, w - 28, 4, 2);
      g.fillStyle(COLORS.shieldOutline, 1);
      g.fillRect(w / 2 - 2, 14, 4, 12);
      g.generateTexture('powerup-shield', w, h);
      g.destroy();
    }

    if (!this.textures.exists('powerup-speed')) {
      const w = 40;
      const h = 40;
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x000000, 0.25);
      g.fillRoundedRect(2, 2, w - 4, h - 4, 8);
      g.fillStyle(COLORS.speedOutline, 1);
      g.fillRoundedRect(6, 6, w - 12, h - 12, 6);
      g.fillStyle(COLORS.speedBody, 1);
      g.fillRoundedRect(8, 8, w - 16, h - 16, 5);
      g.fillStyle(COLORS.speedInner, 0.5);
      g.fillRoundedRect(12, 12, w - 24, h - 24, 4);
      g.fillStyle(COLORS.speedBolt, 1);
      g.fillTriangle(
        w / 2 + 2, 10,
        w / 2 - 6, 22,
        w / 2 - 1, 22,
        w / 2 - 4, 30,
        w / 2 + 6, 18,
        w / 2 + 1, 18
      );
      g.fillStyle(0xffffff, 0.5);
      g.fillTriangle(
        w / 2 + 2, 10,
        w / 2 - 6, 22,
        w / 2 - 1, 22
      );
      g.generateTexture('powerup-speed', w, h);
      g.destroy();
    }
  }

  createVehicleTextures() {
    if (!this.textures.exists('vehicle-cycle')) {
      const w = 60;
      const h = 42;
      const g = this.make.graphics({ x: 0, y: 0 });
      g.lineStyle(4, COLORS.motorcycleWheel, 1);
      g.strokeCircle(13, h - 8, 8);
      g.strokeCircle(47, h - 8, 8);
      g.lineStyle(3, COLORS.motorcycleBody, 1);
      g.lineBetween(13, h - 8, 25, h - 22);
      g.lineBetween(25, h - 22, 37, h - 8);
      g.lineBetween(37, h - 8, 13, h - 8);
      g.lineBetween(25, h - 22, 42, h - 24);
      g.lineBetween(42, h - 24, 47, h - 8);
      g.lineStyle(3, COLORS.motorcycleRed, 1);
      g.lineBetween(25, h - 22, 31, h - 30);
      g.lineBetween(31, h - 30, 38, h - 30);
      g.fillStyle(COLORS.motorcycleBody, 1);
      g.fillCircle(31, 7, 5);
      g.generateTexture('vehicle-cycle', w, h);
      g.destroy();
    }

    if (!this.textures.exists('vehicle-rickshaw')) {
      const w = 60;
      const h = 50;
      const g = this.make.graphics({ x: 0, y: 0 });

      g.fillStyle(COLORS.rickshawWheel, 1);
      g.fillCircle(12, h - 6, 6);
      g.fillCircle(48, h - 6, 6);
      g.fillStyle(0x444444, 1);
      g.fillCircle(12, h - 6, 3);
      g.fillCircle(48, h - 6, 3);

      g.fillStyle(COLORS.rickshawBody, 1);
      g.fillRoundedRect(4, 8, w - 8, h - 18, 6);

      g.fillStyle(COLORS.rickshawRoof, 1);
      g.fillRoundedRect(2, 4, w - 4, 8, 4);

      g.fillStyle(COLORS.rickshawWindow, 0.7);
      g.fillRoundedRect(8, 12, w - 16, 12, 3);

      g.fillStyle(0xffffff, 0.3);
      g.fillRect(8, 12, w - 16, 4);

      g.fillStyle(0x1a1a2e, 1);
      g.fillRect(6, 26, 3, h - 24);
      g.fillRect(w - 9, 26, 3, h - 24);

      g.fillStyle(0xffffff, 0.8);
      g.fillCircle(50, 20, 3);
      g.fillStyle(0xffff99, 0.6);
      g.fillCircle(50, 20, 5);

      g.generateTexture('vehicle-rickshaw', w, h);
      g.destroy();
    }

    if (!this.textures.exists('vehicle-motorcycle')) {
      const w = 60;
      const h = 38;
      const g = this.make.graphics({ x: 0, y: 0 });

      g.fillStyle(COLORS.motorcycleWheel, 1);
      g.fillCircle(12, h - 6, 7);
      g.fillCircle(48, h - 6, 7);
      g.fillStyle(0x444444, 1);
      g.fillCircle(12, h - 6, 3);
      g.fillCircle(48, h - 6, 3);

      g.fillStyle(COLORS.motorcycleBody, 1);
      g.fillRoundedRect(8, h - 18, w - 16, 8, 3);

      g.fillStyle(COLORS.motorcycleRed, 1);
      g.fillTriangle(20, h - 18, 40, h - 18, 30, h - 28);

      g.fillStyle(COLORS.motorcycleSeat, 1);
      g.fillRoundedRect(14, h - 24, 24, 6, 2);

      g.fillStyle(0x1a1a1a, 1);
      g.fillRect(28, h - 30, 4, 6);

      g.fillStyle(0xffffff, 0.6);
      g.fillCircle(10, h - 12, 2);

      g.generateTexture('vehicle-motorcycle', w, h);
      g.destroy();
    }

    if (!this.textures.exists('vehicle-car')) {
      const w = 60;
      const h = 44;
      const g = this.make.graphics({ x: 0, y: 0 });

      g.fillStyle(COLORS.carWheel, 1);
      g.fillCircle(12, h - 5, 6);
      g.fillCircle(48, h - 5, 6);
      g.fillStyle(0x444444, 1);
      g.fillCircle(12, h - 5, 3);
      g.fillCircle(48, h - 5, 3);

      g.fillStyle(COLORS.carBody, 1);
      g.fillRoundedRect(2, 10, w - 4, h - 16, 5);

      g.fillStyle(COLORS.carRoof, 1);
      g.fillRoundedRect(12, 4, w - 24, 10, 3);

      g.fillStyle(COLORS.carWindow, 0.7);
      g.fillRoundedRect(15, 6, w - 30, 7, 2);

      g.fillStyle(0xffffff, 0.3);
      g.fillRect(15, 6, w - 30, 3);

      g.fillStyle(COLORS.carBumper, 1);
      g.fillRect(0, h - 14, 6, 5);
      g.fillRect(w - 6, h - 14, 6, 5);

      g.fillStyle(0xffffff, 0.8);
      g.fillCircle(54, 16, 3);
      g.fillStyle(0xffff99, 0.5);
      g.fillCircle(54, 16, 5);

      g.generateTexture('vehicle-car', w, h);
      g.destroy();
    }
  }

  createTrainTextures() {
    if (!this.textures.exists('train-engine')) {
      const w = 160;
      const h = 70;
      const g = this.make.graphics({ x: 0, y: 0 });

      g.fillStyle(COLORS.trainWheel, 1);
      g.fillCircle(20, h - 4, 8);
      g.fillCircle(50, h - 4, 8);
      g.fillCircle(110, h - 4, 8);
      g.fillCircle(140, h - 4, 8);

      g.fillStyle(COLORS.trainEngine, 1);
      g.fillRoundedRect(4, 10, w - 8, h - 18, 8);

      g.fillStyle(COLORS.trainRoof, 1);
      g.fillRoundedRect(0, 6, w, 10, 4);

      g.fillStyle(COLORS.trainWindow, 0.85);
      g.fillRoundedRect(16, 16, 28, 16, 3);
      g.fillRoundedRect(52, 16, 28, 16, 3);
      g.fillRoundedRect(88, 16, 28, 16, 3);

      g.fillStyle(0xffffff, 0.3);
      g.fillRect(16, 16, 28, 5);
      g.fillRect(52, 16, 28, 5);
      g.fillRect(88, 16, 28, 5);

      g.fillStyle(COLORS.trainStripe, 1);
      g.fillRect(4, 38, w - 8, 4);

      g.fillStyle(0xffff99, 0.6);
      g.fillCircle(w - 6, 28, 6);
      g.fillStyle(0xffffff, 0.8);
      g.fillCircle(w - 6, 28, 4);

      g.generateTexture('train-engine', w, h);
      g.destroy();
    }

    if (!this.textures.exists('train-car')) {
      const w = 140;
      const h = 60;
      const g = this.make.graphics({ x: 0, y: 0 });

      g.fillStyle(COLORS.trainWheel, 1);
      g.fillCircle(16, h - 4, 7);
      g.fillCircle(46, h - 4, 7);
      g.fillCircle(94, h - 4, 7);
      g.fillCircle(124, h - 4, 7);

      g.fillStyle(COLORS.trainBody, 1);
      g.fillRoundedRect(4, 8, w - 8, h - 16, 6);

      g.fillStyle(COLORS.trainRoof, 1);
      g.fillRoundedRect(0, 4, w, 8, 3);

      g.fillStyle(COLORS.trainWindow, 0.8);
      g.fillRoundedRect(12, 14, 24, 14, 2);
      g.fillRoundedRect(44, 14, 24, 14, 2);
      g.fillRoundedRect(76, 14, 24, 14, 2);
      g.fillRoundedRect(108, 14, 24, 14, 2);

      g.fillStyle(0xffffff, 0.25);
      g.fillRect(12, 14, 24, 4);
      g.fillRect(44, 14, 24, 4);
      g.fillRect(76, 14, 24, 4);
      g.fillRect(108, 14, 24, 4);

      g.fillStyle(COLORS.trainStripe, 1);
      g.fillRect(4, 34, w - 8, 3);

      g.generateTexture('train-car', w, h);
      g.destroy();
    }
  }

  createEnvironmentTextures() {
    const buildingColors = [
      COLORS.buildingA,
      COLORS.buildingB,
      COLORS.buildingC,
      COLORS.buildingD,
    ];

    for (let i = 0; i < 4; i++) {
      const key = 'building-' + i;
      if (this.textures.exists(key)) continue;
      const w = 80;
      const h = 120 + i * 30;
      const g = this.make.graphics({ x: 0, y: 0 });
      const color = buildingColors[i % buildingColors.length];

      g.fillStyle(color, 1);
      g.fillRect(0, 0, w, h);

      g.fillStyle(0x000000, 0.15);
      g.fillRect(w - 8, 0, 8, h);

      g.fillStyle(0xffffff, 0.1);
      g.fillRect(0, 0, 4, h);

      g.fillStyle(COLORS.buildingRoof, 1);
      g.fillRect(-3, 0, w + 6, 8);
      g.fillStyle(0x000000, 0.2);
      g.fillRect(-3, 6, w + 6, 3);

      const cols = 4;
      const rows = Math.floor((h - 16) / 16);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const lit = Math.random() > 0.4;
          const wx = 8 + c * 17;
          const wy = 14 + r * 16;
          if (lit) {
            g.fillStyle(COLORS.buildingWindow, 0.85);
            g.fillRect(wx, wy, 10, 10);
            g.fillStyle(0xffffff, 0.3);
            g.fillRect(wx, wy, 10, 3);
          } else {
            g.fillStyle(COLORS.buildingWindowDark, 0.6);
            g.fillRect(wx, wy, 10, 10);
          }
        }
      }

      g.generateTexture(key, w, h);
      g.destroy();
    }

    if (!this.textures.exists('tree')) {
      const w = 48;
      const h = 80;
      const g = this.make.graphics({ x: 0, y: 0 });

      g.fillStyle(COLORS.treeTrunk, 1);
      g.fillRect(w / 2 - 4, h * 0.5, 8, h * 0.5);
      g.fillStyle(0x000000, 0.2);
      g.fillRect(w / 2 + 1, h * 0.5, 3, h * 0.5);

      g.fillStyle(COLORS.treeLeaves, 1);
      g.fillCircle(w / 2, h * 0.3, 20);
      g.fillCircle(w / 2 - 12, h * 0.4, 14);
      g.fillCircle(w / 2 + 12, h * 0.4, 14);
      g.fillCircle(w / 2, h * 0.15, 14);

      g.fillStyle(COLORS.treeLeavesAlt, 0.7);
      g.fillCircle(w / 2 - 5, h * 0.25, 10);
      g.fillCircle(w / 2 + 8, h * 0.35, 8);

      g.fillStyle(0xffffff, 0.15);
      g.fillCircle(w / 2 - 8, h * 0.2, 6);

      g.generateTexture('tree', w, h);
      g.destroy();
    }

    if (!this.textures.exists('street-light')) {
      const w = 12;
      const h = 100;
      const g = this.make.graphics({ x: 0, y: 0 });

      g.fillStyle(COLORS.streetLightPole, 1);
      g.fillRect(w / 2 - 2, 10, 4, h - 10);

      g.fillStyle(COLORS.streetLightPole, 1);
      g.fillRect(0, 6, w, 8);
      g.fillStyle(0x000000, 0.3);
      g.fillRect(0, 12, w, 2);

      g.fillStyle(COLORS.streetLightHead, 1);
      g.fillCircle(w / 2, 10, 5);
      g.fillStyle(COLORS.streetLightGlow, 0.4);
      g.fillCircle(w / 2, 10, 9);
      g.fillStyle(COLORS.streetLightGlow, 0.2);
      g.fillCircle(w / 2, 10, 14);

      g.generateTexture('street-light', w, h);
      g.destroy();
    }

    if (!this.textures.exists('rail-sign')) {
      const w = 40;
      const h = 70;
      const g = this.make.graphics({ x: 0, y: 0 });

      g.fillStyle(COLORS.signPost, 1);
      g.fillRect(w / 2 - 2, 30, 4, h - 30);

      g.fillStyle(COLORS.signBoard, 1);
      g.fillRoundedRect(2, 0, w - 4, 28, 4);
      g.fillStyle(0x000000, 0.3);
      g.fillRoundedRect(2, 24, w - 4, 4, 2);

      g.fillStyle(COLORS.signText, 1);
      g.fillRect(8, 6, 4, 16);
      g.fillRect(8, 6, 14, 4);
      g.fillRect(20, 6, 4, 16);
      g.fillRect(26, 6, 4, 16);
      g.fillRect(26, 6, 6, 4);

      g.generateTexture('rail-sign', w, h);
      g.destroy();
    }

    if (!this.textures.exists('mountain')) {
      const w = 200;
      const h = 80;
      const g = this.make.graphics({ x: 0, y: 0 });

      g.fillStyle(COLORS.mountain, 1);
      g.fillTriangle(0, h, w * 0.3, 10, w * 0.55, h);
      g.fillStyle(COLORS.mountainDark, 1);
      g.fillTriangle(w * 0.4, h, w * 0.65, 20, w * 0.9, h);
      g.fillStyle(COLORS.mountain, 0.8);
      g.fillTriangle(w * 0.7, h, w * 0.85, 30, w, h);

      g.generateTexture('mountain', w, h);
      g.destroy();
    }

    if (!this.textures.exists('cloud')) {
      const w = 80;
      const h = 30;
      const g = this.make.graphics({ x: 0, y: 0 });

      g.fillStyle(0xffffff, 0.7);
      g.fillCircle(15, 18, 12);
      g.fillCircle(32, 12, 16);
      g.fillCircle(52, 15, 13);
      g.fillCircle(66, 19, 10);
      g.fillRect(15, 18, 52, 12);

      g.generateTexture('cloud', w, h);
      g.destroy();
    }

    if (!this.textures.exists('platform-tile')) {
      const w = 64;
      const h = 64;
      const g = this.make.graphics({ x: 0, y: 0 });

      g.fillStyle(COLORS.platform, 1);
      g.fillRect(0, 0, w, h);
      g.fillStyle(COLORS.platformTop, 0.5);
      g.fillRect(0, 0, w, 8);
      g.fillStyle(COLORS.platformDark, 0.4);
      g.fillRect(0, h - 8, w, 8);
      g.fillStyle(0x000000, 0.1);
      g.fillRect(20, 8, 2, h - 16);
      g.fillRect(44, 8, 2, h - 16);

      g.generateTexture('platform-tile', w, h);
      g.destroy();
    }

    if (!this.textures.exists('rail-sleeper')) {
      const w = 80;
      const h = 14;
      const spacing = 80;
      const g = this.make.graphics({ x: 0, y: 0 });

      g.fillStyle(COLORS.sleeper, 1);
      g.fillRoundedRect(0, 0, w, h, 2);
      g.fillStyle(COLORS.sleeperDark, 0.5);
      g.fillRoundedRect(0, h - 4, w, 4, 2);
      g.fillStyle(0x000000, 0.15);
      g.fillRect(10, 3, w - 20, 1);
      g.fillRect(10, 7, w - 20, 1);

      g.generateTexture('rail-sleeper', w, spacing);
      g.destroy();
    }
  }

  createPlayerTextures() {
    for (const char of CHARACTERS) {
      this.createCharacterPlayerTextures(char);
      this.createCharacterPreviewTexture(char);
    }
  }

  createCharacterPreviewTexture(char) {
    const key = 'char-preview-' + char.id;
    if (this.textures.exists(key)) return;

    const s = GAMEPLAY.playerSize;
    const scale = 2;
    const g = this.make.graphics({ x: 0, y: 0 });

    const drawHead = (eyeType = 'normal') => {
      g.fillStyle(char.outlineColor, 1);
      g.fillRoundedRect(5, 0, s - 10, 18, 6);
      g.fillStyle(char.bodyColor, 1);
      g.fillRoundedRect(7, 2, s - 14, 14, 5);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(s * 0.3, 9, 3);
      g.fillCircle(s * 0.7, 9, 3);
      g.fillStyle(0x1a1a2e, 1);
      g.fillCircle(s * 0.3, 9, 1.5);
      g.fillCircle(s * 0.7, 9, 1.5);
      g.fillStyle(0x1a1a2e, 1);
      g.fillRoundedRect(s * 0.38, 13, s * 0.24, 3, 1);
    };

    const drawBody = (bodyY = 16, bodyH = 12) => {
      g.fillStyle(char.outlineColor, 1);
      g.fillRoundedRect(10, bodyY, s - 20, bodyH, 4);
      g.fillStyle(char.bodyColor, 1);
      g.fillRoundedRect(12, bodyY + 2, s - 24, bodyH - 4, 3);
    };

    const drawLimb = (x, y, w, h) => {
      g.fillStyle(char.outlineColor, 1);
      g.fillRoundedRect(x, y, w, h, 2);
      g.fillStyle(char.bodyColor, 1);
      g.fillRoundedRect(x + 1, y + 1, w - 2, h - 2, 1);
    };

    drawHead();
    drawBody();
    drawLimb(5, 18, 4, 7);
    drawLimb(31, 18, 4, 7);
    drawLimb(12, 28, 6, 11);
    drawLimb(22, 28, 6, 11);

    g.generateTexture(key, s, s);
    g.destroy();
  }

  createCharacterPlayerTextures(char) {
    const s = GAMEPLAY.playerSize;
    const p = char.id;

    const drawHead = (g, eyeType = 'normal') => {
      g.fillStyle(char.outlineColor, 1);
      g.fillRoundedRect(5, 0, s - 10, 18, 6);
      g.fillStyle(char.bodyColor, 1);
      g.fillRoundedRect(7, 2, s - 14, 14, 5);

      if (eyeType === 'dead') {
        g.fillStyle(0x1a1a2e, 1);
        g.fillCircle(s * 0.3, 9, 3);
        g.fillCircle(s * 0.7, 9, 3);
        g.fillStyle(0xffffff, 0.7);
        g.fillCircle(s * 0.3, 9, 1.5);
        g.fillCircle(s * 0.7, 9, 1.5);
        g.fillStyle(0x1a1a2e, 1);
        g.fillCircle(s * 0.3, 9, 0.5);
        g.fillCircle(s * 0.7, 9, 0.5);
      } else if (eyeType === 'jump') {
        g.fillStyle(0xffffff, 1);
        g.fillCircle(s * 0.3, 9, 3);
        g.fillCircle(s * 0.7, 9, 3);
        g.fillStyle(0x1a1a2e, 1);
        g.fillCircle(s * 0.3, 7.5, 1.5);
        g.fillCircle(s * 0.7, 7.5, 1.5);
      } else {
        g.fillStyle(0xffffff, 1);
        g.fillCircle(s * 0.3, 9, 3);
        g.fillCircle(s * 0.7, 9, 3);
        g.fillStyle(0x1a1a2e, 1);
        g.fillCircle(s * 0.3, 9, 1.5);
        g.fillCircle(s * 0.7, 9, 1.5);
      }

      g.fillStyle(0x1a1a2e, 1);
      if (eyeType === 'dead') {
        g.fillRoundedRect(s * 0.38, 13, s * 0.24, 4, 2);
      } else if (eyeType === 'jump') {
        g.fillRoundedRect(s * 0.4, 12, s * 0.2, 4, 2);
      } else {
        g.fillRoundedRect(s * 0.38, 13, s * 0.24, 3, 1);
      }
    };

    const drawBody = (g, bodyY = 16, bodyH = 12) => {
      g.fillStyle(char.outlineColor, 1);
      g.fillRoundedRect(10, bodyY, s - 20, bodyH, 4);
      g.fillStyle(char.bodyColor, 1);
      g.fillRoundedRect(12, bodyY + 2, s - 24, bodyH - 4, 3);
    };

    const drawLimb = (g, x, y, w, h) => {
      g.fillStyle(char.outlineColor, 1);
      g.fillRoundedRect(x, y, w, h, 2);
      g.fillStyle(char.bodyColor, 1);
      g.fillRoundedRect(x + 1, y + 1, w - 2, h - 2, 1);
    };

    const run1Key = p + '-player-run-1';
    if (!this.textures.exists(run1Key)) {
      const g = this.make.graphics({ x: 0, y: 0 });
      drawHead(g);
      drawBody(g);
      drawLimb(g, 5, 17, 4, 9);
      drawLimb(g, 31, 18, 4, 7);
      drawLimb(g, 10, 28, 7, 12);
      drawLimb(g, 23, 28, 7, 9);
      g.generateTexture(run1Key, s, s);
      g.destroy();
    }

    const run2Key = p + '-player-run-2';
    if (!this.textures.exists(run2Key)) {
      const g = this.make.graphics({ x: 0, y: 0 });
      drawHead(g);
      drawBody(g);
      drawLimb(g, 5, 18, 4, 7);
      drawLimb(g, 31, 18, 4, 7);
      drawLimb(g, 12, 28, 6, 11);
      drawLimb(g, 22, 28, 6, 11);
      g.generateTexture(run2Key, s, s);
      g.destroy();
    }

    const run3Key = p + '-player-run-3';
    if (!this.textures.exists(run3Key)) {
      const g = this.make.graphics({ x: 0, y: 0 });
      drawHead(g);
      drawBody(g);
      drawLimb(g, 5, 18, 4, 7);
      drawLimb(g, 31, 17, 4, 9);
      drawLimb(g, 10, 28, 7, 9);
      drawLimb(g, 23, 28, 7, 12);
      g.generateTexture(run3Key, s, s);
      g.destroy();
    }

    const run4Key = p + '-player-run-4';
    if (!this.textures.exists(run4Key)) {
      const g = this.make.graphics({ x: 0, y: 0 });
      drawHead(g);
      drawBody(g, 14, 12);
      drawLimb(g, 5, 16, 4, 7);
      drawLimb(g, 31, 16, 4, 7);
      drawLimb(g, 12, 26, 6, 11);
      drawLimb(g, 22, 26, 6, 11);
      g.generateTexture(run4Key, s, s);
      g.destroy();
    }

    const jumpKey = p + '-player-jump';
    if (!this.textures.exists(jumpKey)) {
      const g = this.make.graphics({ x: 0, y: 0 });
      drawHead(g, 'jump');
      drawBody(g, 14, 14);
      drawLimb(g, 2, 8, 4, 10);
      drawLimb(g, 34, 8, 4, 10);
      drawLimb(g, 12, 26, 6, 8);
      drawLimb(g, 22, 26, 6, 8);
      g.generateTexture(jumpKey, s, s);
      g.destroy();
    }

    const slideKey = p + '-player-slide';
    if (!this.textures.exists(slideKey)) {
      const g = this.make.graphics({ x: 0, y: 0 });
      const slideH = 20;
      g.fillStyle(0xffffff, 0.35);
      g.fillRect(0, 5, 3, 2);
      g.fillRect(0, 9, 4, 2);
      g.fillRect(0, 13, 3, 2);
      g.fillStyle(char.outlineColor, 1);
      g.fillRoundedRect(3, 2, 16, 16, 6);
      g.fillStyle(char.bodyColor, 1);
      g.fillRoundedRect(5, 4, 12, 12, 5);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(13, 9, 2.5);
      g.fillCircle(17, 9, 2.5);
      g.fillStyle(0x1a1a2e, 1);
      g.fillCircle(14, 9, 1.5);
      g.fillCircle(18, 9, 1.5);
      g.fillStyle(0x1a1a2e, 1);
      g.fillRoundedRect(14, 13, 4, 2, 1);
      g.fillStyle(char.outlineColor, 1);
      g.fillRoundedRect(14, 4, 18, 12, 4);
      g.fillStyle(char.bodyColor, 1);
      g.fillRoundedRect(16, 6, 14, 8, 3);
      g.fillStyle(char.outlineColor, 1);
      g.fillRoundedRect(30, 6, 8, 8, 2);
      g.fillStyle(char.bodyColor, 1);
      g.fillRoundedRect(31, 7, 6, 6, 1);
      g.generateTexture(slideKey, s, slideH);
      g.destroy();
    }

    const deadKey = p + '-player-dead';
    if (!this.textures.exists(deadKey)) {
      const g = this.make.graphics({ x: 0, y: 0 });
      drawHead(g, 'dead');
      drawBody(g);
      drawLimb(g, 2, 15, 4, 10);
      drawLimb(g, 34, 15, 4, 10);
      drawLimb(g, 8, 28, 7, 12);
      drawLimb(g, 25, 28, 7, 12);
      g.generateTexture(deadKey, s, s);
      g.destroy();
    }

    const staticKey = p + '-player';
    if (!this.textures.exists(staticKey)) {
      const g = this.make.graphics({ x: 0, y: 0 });
      drawHead(g);
      drawBody(g);
      drawLimb(g, 5, 18, 4, 7);
      drawLimb(g, 31, 18, 4, 7);
      drawLimb(g, 12, 28, 6, 11);
      drawLimb(g, 22, 28, 6, 11);
      g.generateTexture(staticKey, s, s);
      g.destroy();
    }
  }

  createAnimations() {
    for (const char of CHARACTERS) {
      const key = char.id + '-running';
      if (!this.anims.exists(key)) {
        this.anims.create({
          key: key,
          frames: [
            { key: char.id + '-player-run-1' },
            { key: char.id + '-player-run-2' },
            { key: char.id + '-player-run-3' },
            { key: char.id + '-player-run-4' },
          ],
          frameRate: 10,
          repeat: -1,
        });
      }
    }
  }
}
