import Phaser from 'phaser';
import {
  COLORS,
  audioManager,
  getSelectedCharacter,
  getTotalCoins,
  GAMEPLAY,
} from '../config.js';
import SettingsPanel from '../systems/SettingsPanel.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.W = this.scale.width;
    this.H = this.scale.height;

    this.createAnimatedBackground();
    this.createTopBar();
    this.createTitle();
    this.createPlayButton();
    this.createMenuButtons();
    this.createFooter();

    this.settingsPanel = new SettingsPanel(this, audioManager);

      this.setupResize();
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.setupAudioUnlock();
    this.setupKeyboard();

    this.animateEntrance();
  }

  // ── Layout helpers ───────────────────────────────────────────

  getLayout() {
    const w = this.W;
    const h = this.H;
    const isNarrow = w < 380;
    const titleFontSize = isNarrow ? '40px' : '52px';
    const subtitleFontSize = isNarrow ? '20px' : '24px';
    const playBtnW = Math.min(240, w * 0.68);
    const playBtnH = isNarrow ? 58 : 66;
    const menuBtnW = Math.min(175, w * 0.44);
    const menuBtnH = isNarrow ? 48 : 54;
    const menuGapX = 14;
    const menuGapY = 12;

    // Vertical positions — spaced to avoid overlaps on all screen sizes
    const titleY = h * 0.17;
    const playY = h * 0.43;
    const menuStartY = h * 0.60;
    const footerY = h - 20;

    return {
      w, h, isNarrow,
      titleFontSize, subtitleFontSize,
      playBtnW, playBtnH,
      menuBtnW, menuBtnH, menuGapX, menuGapY,
      titleY, playY, menuStartY, footerY,
    };
  }

  // ── Animated Background ──────────────────────────────────────

  createAnimatedBackground() {
    this.bgGroup = this.add.group();

    // Sky gradient
    this.bgSky = this.add.graphics({ x: 0, y: 0 });
    this.bgSky.setDepth(-100);
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
      s.setDepth(-99);
      this.bgStars.push({
        sprite: s,
        twinkle: Phaser.Math.FloatBetween(0.5, 1.5),
        phase: Phaser.Math.FloatBetween(0, Math.PI * 2),
      });
    }

    // Clouds
    this.bgClouds = [];
    for (let i = 0; i < 4; i++) {
      const c = this.add.image(
        Phaser.Math.Between(0, this.W),
        Phaser.Math.Between(20, this.H * 0.22),
        'cloud'
      );
      c.setDepth(-98);
      c.setAlpha(0.3);
      c.setScale(Phaser.Math.FloatBetween(0.5, 1.0));
      this.bgClouds.push({ sprite: c, speed: Phaser.Math.FloatBetween(6, 14) });
    }

    // Far buildings
    this.bgFarBuildings = [];
    let x = -20;
    while (x < this.W + 100) {
      const idx = Phaser.Math.Between(0, 3);
      const b = this.add.image(x, this.H * 0.52, 'building-' + idx);
      b.setOrigin(0, 1);
      b.setDepth(-95);
      b.setAlpha(0.35);
      const scale = Phaser.Math.FloatBetween(0.4, 0.65);
      b.setScale(scale);
      this.bgFarBuildings.push(b);
      x += b.displayWidth + Phaser.Math.Between(4, 12);
    }

    // Near buildings
    this.bgNearBuildings = [];
    x = -40;
    while (x < this.W + 100) {
      const idx = Phaser.Math.Between(0, 3);
      const b = this.add.image(x, this.H * 0.55, 'building-' + idx);
      b.setOrigin(0, 1);
      b.setDepth(-90);
      b.setAlpha(0.55);
      const scale = Phaser.Math.FloatBetween(0.6, 0.9);
      b.setScale(scale);
      this.bgNearBuildings.push(b);
      x += b.displayWidth + Phaser.Math.Between(6, 18);
    }

    // Ground/platform area
    this.bgGround = this.add.rectangle(
      this.W / 2, this.H * 0.78,
      this.W, this.H * 0.5,
      0x1a2a1a, 0.4
    );
    this.bgGround.setDepth(-85);

    // Railway sleepers scrolling
    this.bgSleepers = [];
    const sleeperSpacing = 80;
    const sleeperCount = Math.ceil(this.H / sleeperSpacing) + 2;
    for (let j = 0; j < sleeperCount; j++) {
      const sleeper = this.add.image(
        this.W / 2,
        j * sleeperSpacing + this.H * 0.5,
        'rail-sleeper'
      );
      sleeper.setDepth(-80);
      sleeper.displayWidth = this.W * 0.5;
      sleeper.setAlpha(0.3);
      this.bgSleepers.push(sleeper);
    }
    this.sleeperSpacing = sleeperSpacing;

    // Trees on both sides
    this.bgTrees = [];
    const treeY = this.H * 0.62;
    let tx = 20;
    while (tx < this.W + 40) {
      const t = this.add.image(tx, treeY, 'tree');
      t.setOrigin(0.5, 1);
      t.setDepth(-88);
      t.setScale(Phaser.Math.FloatBetween(0.5, 0.8));
      t.setAlpha(0.5);
      this.bgTrees.push(t);
      tx += Phaser.Math.Between(80, 140);
    }

    // Running character on ground
    this.createRunningCharacter();

    // Coins floating in background
    this.bgCoins = [];
    for (let i = 0; i < 4; i++) {
      const cx = Phaser.Math.Between(this.W * 0.1, this.W * 0.9);
      const cy = Phaser.Math.Between(this.H * 0.35, this.H * 0.65);
      const coin = this.add.image(cx, cy, 'coin');
      coin.setDepth(-70);
      coin.setScale(Phaser.Math.FloatBetween(0.6, 1.0));
      coin.setAlpha(0.4);
      this.tweens.add({
        targets: coin,
        y: cy - 15,
        duration: 1200 + i * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: i * 150,
      });
      this.tweens.add({
        targets: coin,
        scale: { from: 0.5, to: 0.9 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: i * 100,
      });
      this.bgCoins.push(coin);
    }

    this.bgScrollOffset = 0;
  }

  createRunningCharacter() {
    const char = getSelectedCharacter();
    const cx = this.W / 2;
    const cy = this.H * 0.72;

    // Shadow
    this.charShadow = this.add.ellipse(cx, cy + 18, 36, 8, 0x000000, 0.3);
    this.charShadow.setDepth(-69);

    this.charSprite = this.add.sprite(cx, cy, char.id + '-player-run-1');
    this.charSprite.setDepth(-68);
    this.charSprite.setScale(1.8);
    this.charSprite.play(char.id + '-running');

    // Bounce while running
    this.tweens.add({
      targets: this.charSprite,
      y: cy - 6,
      duration: 150,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: this.charShadow,
      scale: { from: 0.9, to: 1.1 },
      alpha: { from: 0.25, to: 0.35 },
      duration: 150,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  updateBackground(dt) {
    // Stars twinkle
    for (const s of this.bgStars) {
      s.phase += dt * s.twinkle;
      s.sprite.setAlpha(0.3 + Math.abs(Math.sin(s.phase)) * 0.5);
    }

    // Clouds drift
    for (const c of this.bgClouds) {
      c.sprite.x -= c.speed * dt;
      if (c.sprite.x < -60) {
        c.sprite.x = this.W + 60;
        c.sprite.y = Phaser.Math.Between(20, this.H * 0.22);
      }
    }

    // Buildings parallax (slow)
    const farSpeed = 15 * dt;
    const nearSpeed = 30 * dt;
    for (const b of this.bgFarBuildings) {
      b.x -= farSpeed;
      if (b.x + b.displayWidth < -20) {
        const rightmost = this.getRightmostX(this.bgFarBuildings);
        b.x = rightmost + Phaser.Math.Between(4, 12);
      }
    }
    for (const b of this.bgNearBuildings) {
      b.x -= nearSpeed;
      if (b.x + b.displayWidth < -40) {
        const rightmost = this.getRightmostX(this.bgNearBuildings);
        b.x = rightmost + Phaser.Math.Between(6, 18);
      }
    }

    // Sleepers scroll
    const sleeperTotal = this.H + this.sleeperSpacing;
    for (const s of this.bgSleepers) {
      s.y += 50 * dt;
      if (s.y > this.H + 20) {
        s.y -= sleeperTotal;
      }
    }

    // Trees scroll
    for (const t of this.bgTrees) {
      t.y += 40 * dt;
      if (t.y > this.H + 40) {
        t.y = this.H * 0.62 - this.H;
        t.x = Phaser.Math.Between(10, this.W - 10);
      }
    }
  }

  getRightmostX(arr) {
    let max = -Infinity;
    for (const item of arr) {
      if (item.x > max) max = item.x;
    }
    return max === -Infinity ? 0 : max;
  }

  // ── Top Bar (coins + best score) ─────────────────────────────

  createTopBar() {
    const y = 14;
    const totalCoins = getTotalCoins();
    const bestScore = this.loadBestScore();

    // Coins badge (left)
    this.coinBadge = this.add.container(10, y);
    this.coinBadge.setDepth(50);

    const coinBg = this.add.rectangle(0, 16, 128, 34, 0x000000, 0.5);
    coinBg.setStrokeStyle(1, 0xffd700, 0.2);
    coinBg.setOrigin(0, 0.5);

    const coinIcon = this.add.image(16, 16, 'coin');
    coinIcon.setScale(0.8);

    this.coinText = this.add.text(30, 16, this.formatNumber(totalCoins), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.coinText.setOrigin(0, 0.5);

    this.coinBadge.add([coinBg, coinIcon, this.coinText]);

    // Best score badge (right)
    this.bestBadge = this.add.container(this.W - 10, y);
    this.bestBadge.setDepth(50);

    const bestBg = this.add.rectangle(0, 16, 135, 34, 0x000000, 0.5);
    bestBg.setStrokeStyle(1, 0x4ecdc4, 0.2);
    bestBg.setOrigin(1, 0.5);

    this.bestText = this.add.text(-8, 16, 'Best: ' + bestScore, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#4ecdc4',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.bestText.setOrigin(1, 0.5);

    this.bestBadge.add([bestBg, this.bestText]);
  }

  formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 10000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  }

  loadBestScore() {
    try {
      const stored = localStorage.getItem('india-rush-best-score');
      return stored ? parseInt(stored, 10) || 0 : 0;
    } catch (e) {
      return 0;
    }
  }

  // ── Title ────────────────────────────────────────────────────

  createTitle() {
    const L = this.getLayout();
    const titleY = L.titleY;

    this.titleContainer = this.add.container(this.W / 2, titleY);
    this.titleContainer.setDepth(60);

    // Title glow behind text
    this.titleGlow = this.add.image(0, 4, 'powerup-glow');
    this.titleGlow.setScale(3.5);
    this.titleGlow.setAlpha(0.15);
    this.titleGlow.setTint(0xffd700);

    // INDIA RUSH
    this.titleText = this.add.text(0, 0, 'INDIA RUSH', {
      fontFamily: 'Arial, sans-serif',
      fontSize: L.titleFontSize,
      fontWeight: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 8,
    });
    this.titleText.setOrigin(0.5);

    // TRAIN RUNNER subtitle
    this.subtitleText = this.add.text(0, 42, 'TRAIN RUNNER', {
      fontFamily: 'Arial, sans-serif',
      fontSize: L.subtitleFontSize,
      fontWeight: 'bold',
      color: '#4ecdc4',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.subtitleText.setOrigin(0.5);

    // Decorative line under subtitle
    this.titleLine = this.add.rectangle(0, 66, 180, 3, 0xe63946, 0.8);
    this.titleLine.setOrigin(0.5);

    // Side decorative dots
    this.titleDotL = this.add.circle(-110, 66, 3, 0xe63946, 0.6);
    this.titleDotR = this.add.circle(110, 66, 3, 0xe63946, 0.6);

    this.titleContainer.add([
      this.titleGlow,
      this.titleText,
      this.subtitleText,
      this.titleLine,
      this.titleDotL,
      this.titleDotR,
    ]);

    // Gentle floating
    this.tweens.add({
      targets: this.titleContainer,
      y: titleY + 6,
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Subtle glow pulse
    this.tweens.add({
      targets: this.titleGlow,
      alpha: { from: 0.1, to: 0.22 },
      scale: { from: 3.2, to: 3.8 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // ── Play Button ──────────────────────────────────────────────

  createPlayButton() {
    const L = this.getLayout();
    const btnY = L.playY;
    const btnW = L.playBtnW;
    const btnH = L.playBtnH;

    this.playButton = this.add.container(this.W / 2, btnY);
    this.playButton.setDepth(60);

    // Outer glow (large, pulsing)
    this.playGlow = this.add.circle(0, 0, btnW * 0.65, 0x4ecdc4, 0.2);
    this.playGlow.setDepth(-1);

    // Shadow
    const shadow = this.add.rectangle(0, 5, btnW, btnH, 0x000000, 0.35);
    shadow.setOrigin(0.5);

    // Button bg
    this.playBg = this.add.rectangle(0, 0, btnW, btnH, COLORS.menuPrimary, 1);
    this.playBg.setStrokeStyle(3, 0xffffff, 0.4);
    this.playBg.setOrigin(0.5);
    this.playBg.setInteractive({ useHandCursor: true });

    // Top highlight
    this.playHighlight = this.add.rectangle(0, -btnH / 2 + 3, btnW - 8, 4, 0xffffff, 0.3);
    this.playHighlight.setOrigin(0.5);

    // Play icon (triangle)
    const playIcon = this.add.text(-btnW * 0.25, 0, '\u25B6', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#1a1a2e',
    });
    playIcon.setOrigin(0.5);

    // Play text
    const playText = this.add.text(btnW * 0.05, 0, 'PLAY', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '30px',
      fontWeight: 'bold',
      color: '#1a1a2e',
    });
    playText.setOrigin(0.5);

    this.playButton.add([
      this.playGlow,
      shadow,
      this.playBg,
      this.playHighlight,
      playIcon,
      playText,
    ]);

    this.playShadow = shadow;

    // Pulsing glow
    this.tweens.add({
      targets: this.playGlow,
      alpha: { from: 0.15, to: 0.35 },
      scale: { from: 0.95, to: 1.1 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Button interactions
    this.playBg.on('pointerover', () => {
      this.playBg.setFillStyle(COLORS.menuPrimaryHover, 1);
      this.playBg.setScale(1.05);
      this.playShadow.setScale(1.05);
      this.playGlow.setScale(1.18);
    });
    this.playBg.on('pointerout', () => {
      this.playBg.setFillStyle(COLORS.menuPrimary, 1);
      this.playBg.setScale(1);
      this.playShadow.setScale(1);
      this.playGlow.setScale(1);
    });
    this.playBg.on('pointerdown', () => {
      this.playBg.setScale(0.92);
      this.playShadow.setScale(0.92);
      this.playShadow.y = 3;
    });
    this.playBg.on('pointerup', () => {
      this.playBg.setScale(1.05);
      this.playShadow.setScale(1.05);
      this.playShadow.y = 5;
      audioManager.playSfx('click');
      this.tweens.add({
        targets: this.playBg,
        scale: 1,
        duration: 100,
        onComplete: () => this.scene.start('GameScene'),
      });
    });
  }

  // ── Menu Buttons Grid ────────────────────────────────────────

  createMenuButtons() {
    const L = this.getLayout();
    const startY = L.menuStartY;
    const btnW = L.menuBtnW;
    const btnH = L.menuBtnH;
    const gapX = L.menuGapX;
    const gapY = L.menuGapY;

    const centerX = this.W / 2;

    const buttons = [
      { label: 'CHARACTER', icon: '\u{1F3AD}', color: COLORS.menuBtnOrange, hover: COLORS.menuBtnOrangeHover, action: () => this.startScene('CharacterScene') },
      { label: 'MISSIONS', icon: '\u2713', color: COLORS.menuBtnRed, hover: COLORS.menuBtnRedHover, action: () => this.startScene('MissionsScene') },
      { label: 'DAILY REWARD', icon: '\u2605', color: COLORS.menuBtnGold, hover: COLORS.menuBtnGoldHover, action: () => this.startScene('DailyRewardScene') },
      { label: 'SETTINGS', icon: '\u2699', color: COLORS.menuBtnTeal, hover: COLORS.menuBtnTealHover, action: () => this.toggleSettings() },
    ];

    this.menuButtons = [];
    this._menuLayout = { btnW, btnH, gapX, gapY, startY, centerX };

    for (let i = 0; i < buttons.length; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = centerX + (col === 0 ? -(btnW / 2 + gapX / 2) : (btnW / 2 + gapX / 2));
      const y = startY + row * (btnH + gapY);

      const btn = this.makeMenuButton(x, y, btnW, btnH, buttons[i]);
      this.menuButtons.push(btn);
    }
  }

  makeMenuButton(x, y, w, h, config) {
    const container = this.add.container(x, y);
    container.setDepth(60);

    // Shadow
    const shadow = this.add.rectangle(0, 4, w, h, 0x000000, 0.3);
    shadow.setOrigin(0.5);

    // Button bg
    const bg = this.add.rectangle(0, 0, w, h, config.color, 1);
    bg.setStrokeStyle(2, 0xffffff, 0.25);
    bg.setOrigin(0.5);
    bg.setInteractive({ useHandCursor: true });

    // Top highlight
    const highlight = this.add.rectangle(0, -h / 2 + 3, w - 6, 3, 0xffffff, 0.25);
    highlight.setOrigin(0.5);

    // Icon
    const icon = this.add.text(-w * 0.28, 0, config.icon, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#ffffff',
    });
    icon.setOrigin(0.5);

    // Label
    const label = this.add.text(w * 0.05, 0, config.label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '17px',
      fontWeight: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    label.setOrigin(0.5);

    container.add([shadow, bg, highlight, icon, label]);

    container._bg = bg;
    container._shadow = shadow;
    container._w = w;
    container._h = h;
    container._config = config;

    // Hover / press interactions
    bg.on('pointerover', () => {
      bg.setFillStyle(config.hover, 1);
      bg.setScale(1.05);
      shadow.setScale(1.05);
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(config.color, 1);
      bg.setScale(1);
      shadow.setScale(1);
    });
    bg.on('pointerdown', () => {
      bg.setScale(0.92);
      shadow.setScale(0.92);
      shadow.y = 2;
    });
    bg.on('pointerup', () => {
      bg.setScale(1.05);
      shadow.setScale(1.05);
      shadow.y = 4;
      audioManager.playSfx('click');
      this.tweens.add({
        targets: bg,
        scale: 1,
        duration: 100,
        onComplete: () => config.action(),
      });
    });

    return container;
  }

  // ── Footer hint ──────────────────────────────────────────────

  createFooter() {
    const L = this.getLayout();
    this.footerText = this.add.text(
      this.W / 2,
      L.footerY,
      'Tap PLAY to start your adventure!',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#888888',
        stroke: '#000000',
        strokeThickness: 1,
      }
    );
    this.footerText.setOrigin(0.5, 1);
    this.footerText.setDepth(60);
    this.footerText.setAlpha(0.7);

    this.tweens.add({
      targets: this.footerText,
      alpha: { from: 0.4, to: 0.8 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // ── Actions ──────────────────────────────────────────────────

  startScene(sceneKey) {
    this.scene.start(sceneKey);
  }

  toggleSettings() {
    if (this.settingsPanel) {
      this.settingsPanel.toggle();
    }
  }

  showComingSoon(featureName) {
    // Remove existing if open
    if (this.comingSoonOverlay) {
      this.closeComingSoon();
      return;
    }

    const overlay = this.add.rectangle(
      this.W / 2, this.H / 2,
      this.W, this.H,
      0x000000, 0.6
    );
    overlay.setDepth(200);
    overlay.setInteractive();

    const panelW = Math.min(280, this.W * 0.82);
    const panelH = 200;

    const panel = this.add.container(this.W / 2, this.H / 2);
    panel.setDepth(201);

    const bg = this.add.rectangle(0, 0, panelW, panelH, COLORS.menuPanel, 0.95);
    bg.setStrokeStyle(3, COLORS.menuPrimary);

    const icon = this.add.text(0, -panelH / 2 + 30, '\u2692', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '36px',
      color: '#ffd700',
    });
    icon.setOrigin(0.5);

    const title = this.add.text(0, -10, featureName, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#ffffff',
    });
    title.setOrigin(0.5);

    const msg = this.add.text(0, 24, 'Coming Soon!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#4ecdc4',
    });
    msg.setOrigin(0.5);

    // Close button
    const closeBtnW = 120;
    const closeBtnH = 42;
    const closeBtnY = panelH / 2 - 34;
    const closeBg = this.add.rectangle(0, closeBtnY, closeBtnW, closeBtnH, COLORS.menuPrimary, 1);
    closeBg.setInteractive({ useHandCursor: true });
    closeBg.on('pointerover', () => {
      closeBg.setFillStyle(COLORS.menuPrimaryHover);
      closeBg.setScale(1.05);
    });
    closeBg.on('pointerout', () => {
      closeBg.setFillStyle(COLORS.menuPrimary);
      closeBg.setScale(1);
    });
    closeBg.on('pointerdown', () => closeBg.setScale(0.92));
    closeBg.on('pointerup', () => {
      closeBg.setScale(1);
      audioManager.playSfx('click');
      this.closeComingSoon();
    });

    const closeText = this.add.text(0, closeBtnY, 'CLOSE', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#1a1a2e',
    });
    closeText.setOrigin(0.5);

    panel.add([bg, icon, title, msg, closeBg, closeText]);

    this.comingSoonOverlay = overlay;
    this.comingSoonPanel = panel;

    // Pop-in animation
    panel.setScale(0.5);
    panel.setAlpha(0);
    this.tweens.add({
      targets: panel,
      scale: 1,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });
    overlay.setAlpha(0);
    this.tweens.add({
      targets: overlay,
      alpha: 0.6,
      duration: 200,
    });

    // Tap overlay to close
    overlay.on('pointerup', () => {
      audioManager.playSfx('click');
      this.closeComingSoon();
    });
  }

  closeComingSoon() {
    if (!this.comingSoonPanel) return;
    this.tweens.add({
      targets: this.comingSoonPanel,
      scale: 0.5,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        if (this.comingSoonPanel) this.comingSoonPanel.destroy();
        this.comingSoonPanel = null;
      },
    });
    this.tweens.add({
      targets: this.comingSoonOverlay,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        if (this.comingSoonOverlay) this.comingSoonOverlay.destroy();
        this.comingSoonOverlay = null;
      },
    });
  }

  // ── Audio unlock ─────────────────────────────────────────────

  setupAudioUnlock() {
    this.input.once('pointerdown', () => {
      audioManager.unlock();
      audioManager.resume();
    });
    this.input.keyboard.once('keydown', () => {
      audioManager.unlock();
      audioManager.resume();
    });
  }

  // ── Keyboard shortcuts ───────────────────────────────────────

  setupKeyboard() {
    this.input.keyboard.on('keydown-SPACE', () => {
      audioManager.playSfx('click');
      this.scene.start('GameScene');
    });
    this.input.keyboard.on('keydown-ENTER', () => {
      audioManager.playSfx('click');
      this.scene.start('GameScene');
    });
  }

  // ── Entrance animation ───────────────────────────────────────

  animateEntrance() {
    const L = this.getLayout();

    // Title
    this.titleContainer.setScale(0.5);
    this.titleContainer.setAlpha(0);
    this.tweens.add({
      targets: this.titleContainer,
      scale: 1,
      alpha: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });

    // Play button
    this.playButton.setAlpha(0);
    this.playButton.y = L.playY + 30;
    this.tweens.add({
      targets: this.playButton,
      y: L.playY,
      alpha: 1,
      duration: 400,
      delay: 200,
      ease: 'Power2',
    });

    // Menu buttons — staggered entrance
    for (let i = 0; i < this.menuButtons.length; i++) {
      const btn = this.menuButtons[i];
      btn.setAlpha(0);
      btn.y += 20;
      this.tweens.add({
        targets: btn,
        y: btn.y - 20,
        alpha: 1,
        duration: 300,
        delay: 350 + i * 80,
        ease: 'Power2',
      });
    }

    // Top bar
    this.coinBadge.setAlpha(0);
    this.bestBadge.setAlpha(0);
    this.tweens.add({
      targets: [this.coinBadge, this.bestBadge],
      alpha: 1,
      duration: 300,
      delay: 100,
    });
  }

  // ── Resize ───────────────────────────────────────────────────

  setupResize() {
    this.scale.on('resize', this.handleResize, this);
  }

  handleResize(gameSize) {
    const w = gameSize.width;
    const h = gameSize.height;
    this.W = w;
    this.H = h;

    const L = this.getLayout();

    // Redraw sky
    this.bgSky.clear();
    this.bgSky.fillGradientStyle(
      0x1a1a3e, 0x1a1a3e,
      0x2a1a4e, 0x3a2a5e,
      1
    );
    this.bgSky.fillRect(0, 0, w, h);

    // Top bar
    this.coinBadge.setPosition(10, 14);
    this.bestBadge.setPosition(w - 10, 14);

    // Title
    this.titleContainer.setPosition(w / 2, L.titleY);
    this.titleText.setFontSize(L.titleFontSize);
    this.subtitleText.setFontSize(L.subtitleFontSize);

    // Play button
    this.playButton.setPosition(w / 2, L.playY);
    this.playBg.setSize(L.playBtnW, L.playBtnH);
    this.playShadow.setSize(L.playBtnW, L.playBtnH);
    this.playHighlight.setSize(L.playBtnW - 8, 4);

    // Menu buttons
    const btnW = L.menuBtnW;
    const btnH = L.menuBtnH;
    const gapX = L.menuGapX;
    const gapY = L.menuGapY;
    const startY = L.menuStartY;
    const centerX = w / 2;

    for (let i = 0; i < this.menuButtons.length; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = centerX + (col === 0 ? -(btnW / 2 + gapX / 2) : (btnW / 2 + gapX / 2));
      const y = startY + row * (btnH + gapY);
      const btn = this.menuButtons[i];
      btn.setPosition(x, y);
      btn._bg.setSize(btnW, btnH);
      btn._shadow.setSize(btnW, btnH);
      btn._w = btnW;
      btn._h = btnH;
    }

    // Footer
    this.footerText.setPosition(w / 2, L.footerY);

    // Settings panel
    if (this.settingsPanel) this.settingsPanel.handleResize(w, h);

    // Ground
    this.bgGround.setPosition(w / 2, h * 0.78);
    this.bgGround.setSize(w, h * 0.5);

    // Update character position
    if (this.charSprite) {
      const cx = w / 2;
      const cy = h * 0.72;
      this.charSprite.setPosition(cx, cy);
      this.charShadow.setPosition(cx, cy + 18);
    }

    // Coming soon panel
    if (this.comingSoonOverlay) {
      this.comingSoonOverlay.setPosition(w / 2, h / 2);
      this.comingSoonOverlay.setSize(w, h);
      this.comingSoonPanel.setPosition(w / 2, h / 2);
    }
  }

  // ── Update ───────────────────────────────────────────────────

  update(time, delta) {
    const dt = delta / 1000;
    this.updateBackground(dt);
  }

  shutdown() {
    this.scale.off('resize', this.handleResize, this);
    if (this.settingsPanel) {
      this.settingsPanel.destroy();
      this.settingsPanel = null;
    }
  }
}
