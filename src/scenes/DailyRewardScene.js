import Phaser from 'phaser';
import {
  COLORS,
  audioManager,
  getTotalCoins,
  DAILY_REWARDS,
  getDailyRewardInfo,
  claimDailyReward,
} from '../config.js';

export default class DailyRewardScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DailyRewardScene' });
  }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.cameras.main.setBackgroundColor('#1a1a2e');

    this.createBackground();
    this.createTitle();
    this.createCoinDisplay();
    this.createCalendar();
    this.createClaimButton();
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
    this.titleContainer = this.add.container(this.W / 2, this.H * 0.09);
    this.titleContainer.setDepth(50);

    this.titleText = this.add.text(0, 0, 'DAILY REWARD', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '30px',
      fontWeight: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 5,
    });
    this.titleText.setOrigin(0.5);

    this.subtitleText = this.add.text(0, 30, 'Claim your daily coins!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#4ecdc4',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.subtitleText.setOrigin(0.5);

    this.titleContainer.add([this.titleText, this.subtitleText]);
  }

  // ── Coin Display ─────────────────────────────────────────────

  createCoinDisplay() {
    this.coinContainer = this.add.container(this.W / 2, this.H * 0.19);
    this.coinContainer.setDepth(50);

    const coinIcon = this.add.image(-50, 0, 'coin');
    coinIcon.setScale(0.9);

    const bg = this.add.rectangle(0, 0, 140, 36, 0x000000, 0.45);
    bg.setOrigin(0, 0.5);

    this.coinText = this.add.text(18, 0, this.formatNumber(getTotalCoins()), {
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

  // ── 7-Day Calendar ───────────────────────────────────────────

  createCalendar() {
    this.info = getDailyRewardInfo();
    this.dayCards = [];

    const cardW = Math.min(105, (this.W - 48) / 4);
    const cardH = Math.min(120, this.H * 0.16);
    const gapX = 8;
    const gapY = 12;
    const cols = 4;

    const totalGridW = cols * cardW + (cols - 1) * gapX;
    const startX = this.W / 2 - totalGridW / 2 + cardW / 2;
    const startY = this.H * 0.30;

    this._cardW = cardW;
    this._cardH = cardH;
    this._gapX = gapX;
    this._gapY = gapY;
    this._cols = cols;
    this._startX = startX;
    this._startY = startY;

    for (let i = 0; i < DAILY_REWARDS.length; i++) {
      const reward = DAILY_REWARDS[i];
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);

      const card = this.createDayCard(x, y, cardW, cardH, reward, i + 1);
      this.dayCards.push(card);
    }
  }

  createDayCard(x, y, w, h, reward, dayNum) {
    const container = this.add.container(x, y);
    container.setDepth(50);

    const claimed = dayNum <= this.info.currentDay;
    const isNextClaimable = this.info.canClaim && dayNum === this.info.nextDay;
    const isLocked = !claimed && !isNextClaimable;

    let bgColor, borderColor, alpha;
    if (claimed) {
      bgColor = 0x2a4a3a;
      borderColor = 0x4ecdc4;
      alpha = 0.88;
    } else if (isNextClaimable) {
      bgColor = 0x3a3520;
      borderColor = 0xffd700;
      alpha = 1;
    } else {
      bgColor = 0x223040;
      borderColor = 0x444455;
      alpha = 0.75;
    }

    const bg = this.add.rectangle(0, 0, w, h, bgColor, alpha);
    bg.setStrokeStyle(2, borderColor, isNextClaimable ? 1 : 0.5);
    container.add(bg);

    // Day label
    const dayLabel = this.add.text(0, -h * 0.32, 'Day ' + dayNum, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      fontWeight: 'bold',
      color: claimed ? '#4ecdc4' : isNextClaimable ? '#ffd700' : '#777788',
      stroke: '#000000',
      strokeThickness: 2,
    });
    dayLabel.setOrigin(0.5);
    container.add(dayLabel);

    // Coin icon
    const coinIcon = this.add.image(0, -h * 0.06, 'coin');
    coinIcon.setScale(0.85);
    if (isLocked) coinIcon.setAlpha(0.5);
    container.add(coinIcon);

    // Coin amount
    const amountText = this.add.text(0, h * 0.16, '+' + reward.coins, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontWeight: 'bold',
      color: isLocked ? '#888899' : '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    });
    amountText.setOrigin(0.5);
    container.add(amountText);

    // Claimed checkmark
    if (claimed) {
      const checkBg = this.add.circle(w * 0.28, -h * 0.30, 10, 0x4ecdc4, 0.9);
      container.add(checkBg);

      const check = this.add.text(w * 0.28, -h * 0.30, '\u2713', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#1a1a2e',
      });
      check.setOrigin(0.5);
      container.add(check);

      const claimedLabel = this.add.text(0, h * 0.36, 'CLAIMED', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '9px',
        fontWeight: 'bold',
        color: '#4ecdc4',
        stroke: '#000000',
        strokeThickness: 1,
      });
      claimedLabel.setOrigin(0.5);
      container.add(claimedLabel);
    }

    // Locked state
    if (isLocked) {
      const lockIcon = this.add.text(0, h * 0.36, '\uD83D\uDD12', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
      });
      lockIcon.setOrigin(0.5);
      lockIcon.setAlpha(0.5);
      container.add(lockIcon);
    }

    // Pulsing glow for claimable card
    if (isNextClaimable) {
      this.tweens.add({
        targets: bg,
        alpha: { from: 0.85, to: 1 },
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // "TODAY" badge
      const todayBadge = this.add.text(0, h * 0.38, 'TODAY', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '9px',
        fontWeight: 'bold',
        color: '#1a1a2e',
        backgroundColor: '#ffd700',
        padding: { x: 6, y: 2 },
      });
      todayBadge.setOrigin(0.5);
      container.add(todayBadge);

      // Pulsing scale on the whole card
      this.tweens.add({
        targets: container,
        scale: { from: 1, to: 1.04 },
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    container._w = w;
    container._h = h;
    container._reward = reward;
    container._dayNum = dayNum;
    container._bg = bg;

    return container;
  }

  // ── Claim Button ─────────────────────────────────────────────

  createClaimButton() {
    const btnY = this.H * 0.82;
    const btnW = Math.min(260, this.W * 0.66);
    const btnH = 56;

    this.claimButton = this.add.container(this.W / 2, btnY);
    this.claimButton.setDepth(50);

    this.claimGlow = this.add.circle(0, 0, btnW * 0.6, 0xffd700, 0.15);
    this.claimGlow.setDepth(-1);

    this.claimBg = this.add.rectangle(0, 0, btnW, btnH, COLORS.menuBtnGold, 1);
    this.claimBg.setStrokeStyle(3, 0xffffff, 0.3);
    this.claimBg.setInteractive({ useHandCursor: true });

    this.claimText = this.add.text(0, 0, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      fontWeight: 'bold',
      color: '#1a1a2e',
      stroke: '#000000',
      strokeThickness: 1,
    });
    this.claimText.setOrigin(0.5);

    this.claimButton.add([this.claimGlow, this.claimBg, this.claimText]);

    this.updateClaimButton();

    this.claimBg.on('pointerover', () => {
      if (!this.info.canClaim) return;
      this.claimBg.setFillStyle(COLORS.menuBtnGoldHover, 1);
      this.claimBg.setScale(1.05);
      this.claimGlow.setScale(1.15);
    });
    this.claimBg.on('pointerout', () => {
      if (!this.info.canClaim) return;
      this.claimBg.setFillStyle(COLORS.menuBtnGold, 1);
      this.claimBg.setScale(1);
      this.claimGlow.setScale(1);
    });
    this.claimBg.on('pointerdown', () => {
      if (!this.info.canClaim) return;
      this.claimBg.setScale(0.92);
    });
    this.claimBg.on('pointerup', () => {
      if (!this.info.canClaim) return;
      this.claimBg.setScale(1.05);
      this.handleClaim();
    });
  }

  updateClaimButton() {
    if (this.info.canClaim) {
      const reward = DAILY_REWARDS[this.info.nextDay - 1];
      this.claimText.setText('CLAIM DAY ' + this.info.nextDay + '  (+' + reward.coins + ')');
      this.claimBg.setFillStyle(COLORS.menuBtnGold, 1);
      this.claimBg.setAlpha(1);
      this.claimText.setColor('#1a1a2e');
      this.claimGlow.setVisible(true);

      this.tweens.add({
        targets: this.claimGlow,
        alpha: { from: 0.1, to: 0.3 },
        scale: { from: 0.95, to: 1.1 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else {
      const tomorrow = this.getTomorrowHint();
      this.claimText.setText('Come back ' + tomorrow + '!');
      this.claimBg.setFillStyle(0x555566, 1);
      this.claimBg.setAlpha(0.8);
      this.claimBg.removeInteractive();
      this.claimText.setColor('#aaaaaa');
      this.claimGlow.setVisible(false);
    }
  }

  getTomorrowHint() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[d.getMonth()] + ' ' + d.getDate();
  }

  handleClaim() {
    const reward = claimDailyReward();
    if (!reward) return;

    audioManager.playSfx('powerupShield');
    this.info = getDailyRewardInfo();

    // Update coin display
    this.coinText.setText(this.formatNumber(getTotalCoins()));

    // Pulse coin display
    this.tweens.add({
      targets: this.coinContainer,
      scale: { from: 1, to: 1.15 },
      duration: 150,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    // Refresh calendar
    this.refreshCalendar();

    // Update claim button
    this.updateClaimButton();

    // Coin burst animation from claim button
    this.playCoinBurst(reward.coins);

    // Claimed popup
    this.showClaimedPopup(reward);
  }

  refreshCalendar() {
    for (const card of this.dayCards) {
      card.destroy();
    }
    this.dayCards = [];

    const cardW = this._cardW;
    const cardH = this._cardH;
    const gapX = this._gapX;
    const gapY = this._gapY;
    const cols = this._cols;
    const startX = this._startX;
    const startY = this._startY;

    for (let i = 0; i < DAILY_REWARDS.length; i++) {
      const reward = DAILY_REWARDS[i];
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);

      const card = this.createDayCard(x, y, cardW, cardH, reward, i + 1);
      this.dayCards.push(card);
    }
  }

  playCoinBurst(amount) {
    const burstX = this.W / 2;
    const burstY = this.H * 0.82;

    const coinCount = Math.min(12, Math.ceil(amount / 40));
    for (let i = 0; i < coinCount; i++) {
      const coin = this.add.image(burstX, burstY, 'coin');
      coin.setDepth(80);
      coin.setScale(0.8);

      const angle = (i / coinCount) * Math.PI * 2;
      const dist = Phaser.Math.Between(60, 130);
      const tx = burstX + Math.cos(angle) * dist;
      const ty = burstY + Math.sin(angle) * dist - 50;

      this.tweens.add({
        targets: coin,
        x: tx,
        y: ty,
        scale: { from: 0.8, to: 0.3 },
        alpha: { from: 1, to: 0 },
        duration: 700,
        ease: 'Power2',
        onComplete: () => coin.destroy(),
      });
    }

    // Expanding ring
    const ring = this.add.graphics({ x: burstX, y: burstY });
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
        ring.strokeCircle(0, 0, 10 + 60 * p);
      },
      onComplete: () => ring.destroy(),
    });
  }

  showClaimedPopup(reward) {
    const overlay = this.add.rectangle(
      this.W / 2, this.H / 2,
      this.W, this.H,
      0x000000, 0.55
    );
    overlay.setDepth(200);
    overlay.setInteractive();

    const panelW = Math.min(260, this.W * 0.76);
    const panelH = 170;

    const panel = this.add.container(this.W / 2, this.H / 2);
    panel.setDepth(201);

    const bg = this.add.rectangle(0, 0, panelW, panelH, COLORS.menuPanel, 0.96);
    bg.setStrokeStyle(3, 0xffd700);

    const coinIcon = this.add.image(0, -panelH / 2 + 38, 'coin');
    coinIcon.setScale(1.4);

    const title = this.add.text(0, -12, 'Reward Claimed!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      fontWeight: 'bold',
      color: '#4ecdc4',
      stroke: '#000000',
      strokeThickness: 3,
    });
    title.setOrigin(0.5);

    const amount = this.add.text(0, 24, '+' + reward.coins + ' coins', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '26px',
      fontWeight: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3,
    });
    amount.setOrigin(0.5);

    panel.add([bg, coinIcon, title, amount]);

    panel.setScale(0.5);
    panel.setAlpha(0);
    this.tweens.add({
      targets: panel,
      scale: 1,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: panel,
          alpha: 1,
          duration: 900,
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
    const btnW = Math.min(180, this.W * 0.42);
    const btnH = 52;
    const x = this.W / 2;
    const y = this.H - 36;

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
      fontSize: '20px',
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

  // ── Entrance Animation ──────────────────────────────────────

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
    this.tweens.add({
      targets: this.coinContainer,
      alpha: 1,
      duration: 300,
      delay: 100,
    });

    for (let i = 0; i < this.dayCards.length; i++) {
      const card = this.dayCards[i];
      card.setAlpha(0);
      card.y += 20;
      this.tweens.add({
        targets: card,
        y: card.y - 20,
        alpha: 1,
        duration: 250,
        delay: 150 + i * 55,
        ease: 'Power2',
      });
    }

    this.claimButton.setAlpha(0);
    this.claimButton.y += 30;
    this.tweens.add({
      targets: this.claimButton,
      y: this.claimButton.y - 30,
      alpha: 1,
      duration: 300,
      delay: 600,
      ease: 'Power2',
    });

    this.backButton.setAlpha(0);
    this.tweens.add({
      targets: this.backButton,
      alpha: 1,
      duration: 300,
      delay: 700,
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

    for (const s of this.bgStars) {
      if (s.x > this.W) s.x = Phaser.Math.Between(0, this.W);
      if (s.y > this.H * 0.4) s.y = Phaser.Math.Between(0, this.H * 0.4);
    }

    this.titleContainer.setPosition(this.W / 2, this.H * 0.09);
    this.coinContainer.setPosition(this.W / 2, this.H * 0.19);

    const cardW = Math.min(105, (this.W - 48) / 4);
    const cardH = Math.min(120, this.H * 0.16);
    const gapX = 8;
    const gapY = 12;
    const cols = 4;

    const totalGridW = cols * cardW + (cols - 1) * gapX;
    const startX = this.W / 2 - totalGridW / 2 + cardW / 2;
    const startY = this.H * 0.30;

    this._cardW = cardW;
    this._cardH = cardH;
    this._startX = startX;
    this._startY = startY;

    this.refreshCalendar();

    const btnW = Math.min(260, this.W * 0.66);
    this.claimButton.setPosition(this.W / 2, this.H * 0.82);
    this.claimBg.setSize(btnW, 56);

    this.backButton.setPosition(this.W / 2, this.H - 36);
  }

  shutdown() {
    this.scale.off('resize', this.handleResize, this);
    this.input.keyboard.off('keydown-ESC', this._escHandler);
    this.tweens.killAll();
  }
}
