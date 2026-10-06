import Phaser from 'phaser';
import {
  COLORS,
  audioManager,
  getTotalCoins,
  MISSIONS,
  getMissionsState,
  claimMission,
} from '../config.js';

const METRIC_ICONS = {
  distance: '\u{1F3C3}',
  coins: '\u2605',
  games: '\u{1F3AE}',
};

const METRIC_COLORS = {
  distance: 0x4ecdc4,
  coins: 0xffd700,
  games: 0xf4a261,
};

export default class MissionsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MissionsScene' });
  }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.cameras.main.setBackgroundColor('#1a1a2e');

    this.createBackground();
    this.createTitle();
    this.createCoinDisplay();
    this.createMissionCards();
    this.createBackButton();

      this.setupResize();
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.animateEntrance();
  }

  // ── Background ───────────────────────────────────────────────

  createBackground() {
    this.bgSky = this.add.graphics({ x: 0, y: 0 });
    this.bgSky.setDepth(-100);
    this.redrawSky();

    this.bgStars = [];
    for (let i = 0; i < 20; i++) {
      const s = this.add.circle(
        Phaser.Math.Between(0, this.W),
        Phaser.Math.Between(0, this.H * 0.4),
        Phaser.Math.Between(1, 2),
        0xffffff,
        Phaser.Math.FloatBetween(0.2, 0.6)
      );
      s.setDepth(-99);
      this.bgStars.push(s);
    }

    // Decorative far buildings silhouette
    this.bgBuildings = [];
    let bx = -20;
    while (bx < this.W + 100) {
      const idx = Phaser.Math.Between(0, 3);
      const b = this.add.image(bx, this.H * 0.52, 'building-' + idx);
      b.setOrigin(0, 1);
      b.setDepth(-97);
      b.setAlpha(0.18);
      const scale = Phaser.Math.FloatBetween(0.3, 0.5);
      b.setScale(scale);
      this.bgBuildings.push(b);
      bx += b.displayWidth + Phaser.Math.Between(4, 14);
    }

    // Subtle ground band
    this.bgGround = this.add.rectangle(
      this.W / 2, this.H * 0.80,
      this.W, this.H * 0.4,
      0x0d1a1a, 0.3
    );
    this.bgGround.setDepth(-96);
  }

  redrawSky() {
    this.bgSky.clear();
    this.bgSky.fillGradientStyle(
      0x1a1a3e, 0x1a1a3e,
      0x2a1a4e, 0x3a2a5e,
      1
    );
    this.bgSky.fillRect(0, 0, this.W, this.H);
  }

  // ── Title ────────────────────────────────────────────────────

  createTitle() {
    this.titleContainer = this.add.container(this.W / 2, this.H * 0.075);
    this.titleContainer.setDepth(50);

    this.titleText = this.add.text(0, 0, 'MISSIONS', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '30px',
      fontWeight: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 6,
    });
    this.titleText.setOrigin(0.5);

    this.titleLine = this.add.rectangle(0, 22, 100, 3, 0xe63946, 0.8);
    this.titleLine.setOrigin(0.5);

    this.subtitleText = this.add.text(0, 36, 'Complete daily missions for coins!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#4ecdc4',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.subtitleText.setOrigin(0.5);

    this.titleContainer.add([this.titleText, this.titleLine, this.subtitleText]);
  }

  // ── Coin Display ─────────────────────────────────────────────

  createCoinDisplay() {
    this.coinContainer = this.add.container(this.W / 2, this.H * 0.17);
    this.coinContainer.setDepth(50);

    const bg = this.add.rectangle(0, 0, 150, 38, 0x000000, 0.5);
    bg.setStrokeStyle(1, 0xffd700, 0.3);
    bg.setOrigin(0.5);

    const coinIcon = this.add.image(-50, 0, 'coin');
    coinIcon.setScale(0.9);

    this.coinText = this.add.text(8, 0, this.formatNumber(getTotalCoins()), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.coinText.setOrigin(0, 0.5);

    this.coinContainer.add([bg, coinIcon, this.coinText]);
  }

  formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 10000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  }

  // ── Mission Cards ────────────────────────────────────────────

  createMissionCards() {
    this.state = getMissionsState();
    this.missionCards = [];

    const cardW = Math.min(360, this.W - 28);
    const cardH = 120;
    const gapY = 16;
    const startY = this.H * 0.26;

    this._cardW = cardW;
    this._cardH = cardH;
    this._gapY = gapY;
    this._startY = startY;

    for (let i = 0; i < MISSIONS.length; i++) {
      const mission = MISSIONS[i];
      const y = startY + i * (cardH + gapY);
      const card = this.createMissionCard(this.W / 2, y, cardW, cardH, mission, i);
      this.missionCards.push(card);
    }
  }

  createMissionCard(x, y, w, h, mission, index) {
    const progress = this.state.progress[mission.id] || 0;
    const claimed = this.state.claimed[mission.id] || false;
    const isComplete = progress >= mission.target;
    const accentColor = METRIC_COLORS[mission.metric] || 0x4ecdc4;

    const container = this.add.container(x, y);
    container.setDepth(50);

    let bgColor, borderColor, borderAlpha;
    if (claimed) {
      bgColor = 0x1a3a2a;
      borderColor = 0x4ecdc4;
      borderAlpha = 0.8;
    } else if (isComplete) {
      bgColor = 0x3a3520;
      borderColor = 0xffd700;
      borderAlpha = 1;
    } else {
      bgColor = 0x223040;
      borderColor = 0x3a4a63;
      borderAlpha = 0.7;
    }

    // Card shadow
    const shadow = this.add.rectangle(2, 4, w, h, 0x000000, 0.3);
    shadow.setOrigin(0.5);
    container.add(shadow);

    // Card background
    const bg = this.add.rectangle(0, 0, w, h, bgColor, 0.92);
    bg.setStrokeStyle(2, borderColor, borderAlpha);
    bg.setOrigin(0.5);
    container.add(bg);

    // Accent bar on left edge
    const accentBar = this.add.rectangle(-w / 2 + 3, 0, 4, h - 8, accentColor, claimed ? 0.5 : 0.85);
    accentBar.setOrigin(0.5);
    container.add(accentBar);

    // Icon badge (circle with icon)
    const iconBadgeX = -w / 2 + 38;
    const iconBadgeY = -h * 0.20;
    const badgeRadius = 22;

    const badgeBg = this.add.circle(iconBadgeX, iconBadgeY, badgeRadius, 0x000000, 0.4);
    badgeBg.setStrokeStyle(2, accentColor, claimed ? 0.4 : 0.7);
    container.add(badgeBg);

    const icon = this.add.text(iconBadgeX, iconBadgeY, METRIC_ICONS[mission.metric] || '\u2605', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
    });
    icon.setOrigin(0.5);
    icon.setAlpha(claimed ? 0.5 : 1);
    container.add(icon);

    // Mission label
    const labelX = -w / 2 + 72;
    const label = this.add.text(labelX, -h * 0.32, mission.label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '17px',
      fontWeight: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    label.setOrigin(0, 0.5);
    container.add(label);

    // Progress text (current / target)
    const progressText = this.add.text(
      labelX, -h * 0.14,
      this.getProgressLabel(mission, progress),
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        fontWeight: 'bold',
        color: isComplete ? '#ffd700' : '#aaaabb',
        stroke: '#000000',
        strokeThickness: 1,
      }
    );
    progressText.setOrigin(0, 0.5);
    container.add(progressText);

    // Progress bar
    const barW = w - 80;
    const barH = 10;
    const barX = labelX;
    const barY = h * 0.08;

    const barBg = this.add.rectangle(barX + barW / 2, barY, barW, barH, 0x111122, 1);
    barBg.setStrokeStyle(1, 0x333344);
    barBg.setOrigin(0.5);
    container.add(barBg);

    const fillRatio = Math.min(1, progress / mission.target);
    const fillW = Math.max(2, barW * fillRatio);
    const barFill = this.add.rectangle(barX + fillW / 2, barY, fillW, barH - 2, accentColor, 1);
    barFill.setOrigin(0.5);
    container.add(barFill);

    // Shine on progress bar fill
    if (fillW > 6 && !claimed) {
      const shine = this.add.rectangle(barX + fillW / 2, barY - 2, fillW, 3, 0xffffff, 0.25);
      shine.setOrigin(0.5);
      container.add(shine);
    }

    // Reward badge (bottom-left)
    const rewardY = h * 0.30;
    const rewardCoinIcon = this.add.image(labelX + 10, rewardY, 'coin');
    rewardCoinIcon.setScale(0.55);
    container.add(rewardCoinIcon);

    const rewardText = this.add.text(labelX + 22, rewardY, '+' + mission.reward + ' coins', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    });
    rewardText.setOrigin(0, 0.5);
    container.add(rewardText);

    // Action area (right side)
    if (claimed) {
      // COMPLETED state
      const doneBg = this.add.rectangle(w * 0.30, 0, 90, 34, 0x4ecdc4, 0.15);
      doneBg.setStrokeStyle(2, 0x4ecdc4, 0.6);
      doneBg.setOrigin(0.5);
      container.add(doneBg);

      const check = this.add.text(w * 0.30, 0, '\u2713  DONE', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        fontWeight: 'bold',
        color: '#4ecdc4',
        stroke: '#000000',
        strokeThickness: 2,
      });
      check.setOrigin(0.5);
      container.add(check);

      // Dim the card slightly
      bg.setAlpha(0.75);
    } else if (isComplete) {
      // CLAIM button with glow
      const claimBtnW = 92;
      const claimBtnH = 40;
      const claimX = w * 0.30;
      const claimY = 0;

      // Glow behind button
      const claimGlow = this.add.circle(claimX, claimY, claimBtnW * 0.7, 0xffd700, 0.15);
      container.add(claimGlow);

      const claimBg = this.add.rectangle(claimX, claimY, claimBtnW, claimBtnH, COLORS.menuBtnGold, 1);
      claimBg.setStrokeStyle(2, 0xffffff, 0.4);
      claimBg.setOrigin(0.5);
      claimBg.setInteractive({ useHandCursor: true });
      container.add(claimBg);

      const claimText = this.add.text(claimX, claimY, 'CLAIM', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#1a1a2e',
      });
      claimText.setOrigin(0.5);
      container.add(claimText);

      // Pulsing glow
      this.tweens.add({
        targets: claimGlow,
        alpha: { from: 0.1, to: 0.3 },
        scale: { from: 0.9, to: 1.15 },
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Button interactions
      claimBg.on('pointerover', () => {
        claimBg.setFillStyle(COLORS.menuBtnGoldHover, 1);
        claimBg.setScale(1.06);
        claimGlow.setScale(1.2);
      });
      claimBg.on('pointerout', () => {
        claimBg.setFillStyle(COLORS.menuBtnGold, 1);
        claimBg.setScale(1);
        claimGlow.setScale(1);
      });
      claimBg.on('pointerdown', () => claimBg.setScale(0.94));
      claimBg.on('pointerup', () => {
        claimBg.setScale(1.06);
        this.handleClaim(mission, container);
      });

      // "READY" badge above button
      const readyBadge = this.add.text(claimX, claimY - claimBtnH / 2 - 10, 'READY!', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '10px',
        fontWeight: 'bold',
        color: '#1a1a2e',
        backgroundColor: '#ffd700',
        padding: { x: 6, y: 2 },
      });
      readyBadge.setOrigin(0.5);
      container.add(readyBadge);

      this.tweens.add({
        targets: readyBadge,
        scale: { from: 1, to: 1.12 },
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else {
      // In-progress: show percentage
      const pct = Math.floor(fillRatio * 100);
      const pctText = this.add.text(w * 0.30, 0, pct + '%', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        fontWeight: 'bold',
        color: '#555566',
        stroke: '#000000',
        strokeThickness: 2,
      });
      pctText.setOrigin(0.5);
      container.add(pctText);
    }

    container._mission = mission;
    container._w = w;
    container._h = h;
    container._index = index;

    return container;
  }

  getProgressLabel(mission, progress) {
    if (mission.metric === 'distance') {
      return Math.floor(progress) + ' / ' + mission.target + ' m';
    }
    if (mission.metric === 'coins') {
      return Math.floor(progress) + ' / ' + mission.target + ' coins';
    }
    return Math.floor(progress) + ' / ' + mission.target + ' games';
  }

  handleClaim(mission, card) {
    const result = claimMission(mission.id);
    if (!result) return;

    audioManager.playSfx('powerupShield');

    // Pulse coin display
    this.tweens.add({
      targets: this.coinContainer,
      scale: { from: 1, to: 1.15 },
      duration: 150,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    // Update coin display
    this.coinText.setText(this.formatNumber(getTotalCoins()));

    // Coin burst from card
    this.playCoinBurst(card.x, card.y);

    // Show popup
    this.showClaimedPopup(result);

    // Refresh cards after a slight delay so the burst is visible
    this.time.delayedCall(300, () => this.refreshCards());
  }

  refreshCards() {
    for (const card of this.missionCards) {
      card.destroy();
    }
    this.missionCards = [];

    this.state = getMissionsState();

    const cardW = this._cardW || Math.min(360, this.W - 28);
    const cardH = this._cardH || 120;
    const gapY = this._gapY || 16;
    const startY = this._startY || this.H * 0.26;

    for (let i = 0; i < MISSIONS.length; i++) {
      const mission = MISSIONS[i];
      const y = startY + i * (cardH + gapY);
      const card = this.createMissionCard(this.W / 2, y, cardW, cardH, mission, i);
      this.missionCards.push(card);
    }
  }

  playCoinBurst(x, y) {
    const coinCount = 12;
    for (let i = 0; i < coinCount; i++) {
      const coin = this.add.image(x, y, 'coin');
      coin.setDepth(80);
      coin.setScale(0.8);

      const angle = (i / coinCount) * Math.PI * 2 + Math.random() * 0.3;
      const dist = Phaser.Math.Between(60, 120);
      const tx = x + Math.cos(angle) * dist;
      const ty = y + Math.sin(angle) * dist - 40;

      this.tweens.add({
        targets: coin,
        x: tx,
        y: ty,
        scale: { from: 0.9, to: 0.3 },
        alpha: { from: 1, to: 0 },
        duration: 600,
        ease: 'Power2',
        onComplete: () => coin.destroy(),
      });
    }

    // Expanding ring
    const ring = this.add.graphics({ x: x, y: y });
    ring.setDepth(79);
    ring.lineStyle(3, 0xffd700, 1);
    ring.strokeCircle(0, 0, 10);
    this.tweens.add({
      targets: ring,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onUpdate: (tween) => {
        const p = tween.progress;
        ring.clear();
        ring.lineStyle(3, 0xffd700, 1 - p * 0.8);
        ring.strokeCircle(0, 0, 10 + 50 * p);
      },
      onComplete: () => ring.destroy(),
    });
  }

  showClaimedPopup(mission) {
    const overlay = this.add.rectangle(
      this.W / 2, this.H / 2,
      this.W, this.H,
      0x000000, 0.55
    );
    overlay.setDepth(200);
    overlay.setInteractive();

    const panelW = Math.min(280, this.W * 0.78);
    const panelH = 180;

    const panel = this.add.container(this.W / 2, this.H / 2);
    panel.setDepth(201);

    const bg = this.add.rectangle(0, 0, panelW, panelH, COLORS.menuPanel, 0.96);
    bg.setStrokeStyle(3, 0xffd700);

    // Top accent bar
    const topBar = this.add.rectangle(0, -panelH / 2 + 4, panelW - 8, 6, 0xffd700, 0.8);
    panel.add(topBar);

    // Coin icon with bounce
    const coinIcon = this.add.image(0, -panelH / 2 + 40, 'coin');
    coinIcon.setScale(1.5);
    panel.add(coinIcon);

    const title = this.add.text(0, -8, 'Mission Complete!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      fontWeight: 'bold',
      color: '#4ecdc4',
      stroke: '#000000',
      strokeThickness: 3,
    });
    title.setOrigin(0.5);
    panel.add(title);

    const amount = this.add.text(0, 28, '+' + mission.reward + ' coins', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3,
    });
    amount.setOrigin(0.5);
    panel.add(amount);

    panel.add(bg);
    panel.moveTo(bg, 0);
    panel.add(topBar);
    panel.moveTo(topBar, 1);
    panel.add(coinIcon);
    panel.moveTo(coinIcon, 2);
    panel.add(title);
    panel.moveTo(title, 3);
    panel.add(amount);
    panel.moveTo(amount, 4);

    // Bounce coin icon
    this.tweens.add({
      targets: coinIcon,
      scale: { from: 1.3, to: 1.5 },
      y: coinIcon.y + 4,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    panel.setScale(0.5);
    panel.setAlpha(0);
    this.tweens.add({
      targets: panel,
      scale: 1,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Coin burst from popup
        this.playCoinBurst(this.W / 2, this.H / 2);

        this.tweens.add({
          targets: panel,
          alpha: 1,
          duration: 800,
          onComplete: () => {
            this.tweens.add({
              targets: [panel, overlay],
              alpha: 0,
              duration: 300,
              onComplete: () => {
                panel.destroy();
                overlay.destroy();
              },
            });
          },
        });
      },
    });
  }

  // ── Back Button ──────────────────────────────────────────────

  createBackButton() {
    const btnW = Math.min(160, this.W * 0.4);
    const btnH = 50;
    const x = this.W / 2;
    const y = this.H - 30;

    this.backButton = this.add.container(x, y);
    this.backButton.setDepth(50);

    const bg = this.add.rectangle(0, 0, btnW, btnH, 0x555566, 1);
    bg.setStrokeStyle(2, 0x777788);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      bg.setFillStyle(0x666677);
      bg.setScale(1.05);
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0x555566);
      bg.setScale(1);
    });
    bg.on('pointerdown', () => bg.setScale(0.92));
    bg.on('pointerup', () => {
      bg.setScale(1);
      audioManager.playSfx('click');
      this.scene.start('MenuScene');
    });

    const text = this.add.text(0, 0, '\u2190 BACK', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    text.setOrigin(0.5);

    this.backButton.add([bg, text]);

    this._escHandler = () => {
      audioManager.playSfx('click');
      this.scene.start('MenuScene');
    };
    this.input.keyboard.on('keydown-ESC', this._escHandler);
  }

  // ── Entrance Animation ───────────────────────────────────────

  animateEntrance() {
    this.titleContainer.setScale(0.5);
    this.titleContainer.setAlpha(0);
    this.tweens.add({
      targets: this.titleContainer,
      scale: 1,
      alpha: 1,
      duration: 400,
      ease: 'Back.easeOut',
    });

    this.coinContainer.setAlpha(0);
    this.coinContainer.scale = 0.8;
    this.tweens.add({
      targets: this.coinContainer,
      alpha: 1,
      scale: 1,
      duration: 300,
      delay: 100,
      ease: 'Power2',
    });

    for (let i = 0; i < this.missionCards.length; i++) {
      const card = this.missionCards[i];
      card.setAlpha(0);
      card.y += 30;
      this.tweens.add({
        targets: card,
        y: card.y - 30,
        alpha: 1,
        duration: 350,
        delay: 150 + i * 90,
        ease: 'Power2',
      });
    }

    this.backButton.setAlpha(0);
    this.backButton.y += 20;
    this.tweens.add({
      targets: this.backButton,
      y: this.backButton.y - 20,
      alpha: 1,
      duration: 300,
      delay: 500,
      ease: 'Power2',
    });
  }

  // ── Resize ───────────────────────────────────────────────────

  setupResize() {
    this.scale.on('resize', this.handleResize, this);
  }

  handleResize(gameSize) {
    this.W = gameSize.width;
    this.H = gameSize.height;

    this.redrawSky();
    this.titleContainer.setPosition(this.W / 2, this.H * 0.075);
    this.coinContainer.setPosition(this.W / 2, this.H * 0.17);
    this.bgGround.setPosition(this.W / 2, this.H * 0.80);
    this.bgGround.setSize(this.W, this.H * 0.4);
    this.refreshCards();
    this.backButton.setPosition(this.W / 2, this.H - 30);
  }

  shutdown() {
    this.scale.off('resize', this.handleResize, this);
    this.input.keyboard.off('keydown-ESC', this._escHandler);
    this.tweens.killAll();
  }
}
