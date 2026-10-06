import Phaser from 'phaser';
import {
  COLORS,
  CHARACTERS,
  audioManager,
  getSelectedCharacter,
  setSelectedCharacter,
  isCharacterUnlocked,
  unlockCharacter,
  getTotalCoins,
  saveTotalCoins,
} from '../config.js';

export default class CharacterScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CharacterScene' });
  }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;

    this.cameras.main.setBackgroundColor(COLORS.gameOverBg);

    this.selectedId = getSelectedCharacter().id;
    this.coinBalance = getTotalCoins();

    this.createBackground();
    this.createTitle();
    this.createCoinDisplay();
    this.createCards();
    this.createBackButton();

      this.setupResize();
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.setupKeyboard();
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

    this.titleText = this.add.text(0, 0, 'SELECT CHARACTER', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '30px',
      fontWeight: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 5,
    });
    this.titleText.setOrigin(0.5);

    this.subtitleText = this.add.text(0, 30, 'Choose your runner!', {
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

    this.coinLabel = this.add.text(18, 0, this.formatNumber(this.coinBalance), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.coinLabel.setOrigin(0, 0.5);

    this.coinContainer.add([bg, coinIcon, this.coinLabel]);
  }

  formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 10000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  }

  // ── Character Cards ─────────────────────────────────────────

  createCards() {
    this.cardContainers = [];

    const cardW = Math.min(150, this.W * 0.30);
    const cardH = Math.min(260, this.H * 0.52);
    const spacing = cardW + 18;
    const startX = this.W / 2 - (CHARACTERS.length - 1) * spacing / 2;
    const cardY = this.H * 0.48;

    this.cardW = cardW;
    this.cardH = cardH;
    this.cardSpacing = spacing;
    this.cardStartX = startX;
    this.cardY = cardY;

    for (let i = 0; i < CHARACTERS.length; i++) {
      const char = CHARACTERS[i];
      const x = startX + i * spacing;
      const card = this.createCharacterCard(x, cardY, cardW, cardH, char, i);
      this.cardContainers.push(card);
    }

    this.refreshCards();
  }

  createCharacterCard(x, y, w, h, char, index) {
    const container = this.add.container(x, y);
    container.setDepth(10);

    // Card background
    const bg = this.add.rectangle(0, 0, w, h, 0x2a3548, 0.92);
    bg.setStrokeStyle(2, 0x555566);
    bg.setInteractive({ useHandCursor: true });
    container.add(bg);

    // Preview area background (subtle inset)
    const previewBg = this.add.rectangle(0, -h * 0.22, w - 16, h * 0.40, 0x1a1a2e, 0.5);
    previewBg.setStrokeStyle(1, 0x3a4a63, 0.4);
    container.add(previewBg);

    // Character preview
    const previewKey = 'char-preview-' + char.id;
    const preview = this.add.image(0, -h * 0.22, previewKey);
    preview.setScale(1.4);
    container.add(preview);

    // Idle floating animation
    const floatTween = this.tweens.add({
      targets: preview,
      y: -h * 0.22 - 4,
      duration: 1000 + index * 200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Name
    const nameText = this.add.text(0, h * 0.02, char.name, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center',
    });
    nameText.setOrigin(0.5);
    container.add(nameText);

    // Status text
    const statusText = this.add.text(0, h * 0.13, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      fontWeight: 'bold',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2,
    });
    statusText.setOrigin(0.5);
    container.add(statusText);

    // Action button
    const actionBtn = this.add.container(0, h * 0.30);
    actionBtn.setVisible(false);
    container.add(actionBtn);

    const actionBtnW = w - 24;
    const actionBtnH = 38;
    const actionBg = this.add.rectangle(0, 0, actionBtnW, actionBtnH, COLORS.restartBtn, 1);
    actionBg.setStrokeStyle(2, 0xffffff, 0.2);
    actionBg.setInteractive({ useHandCursor: true });
    actionBtn.add(actionBg);

    const actionText = this.add.text(0, 0, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#1a1a2e',
    });
    actionText.setOrigin(0.5);
    actionBtn.add(actionText);

    // Feedback text (for "Not enough coins")
    const feedbackText = this.add.text(0, h * 0.42, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      fontWeight: 'bold',
      color: '#e63946',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2,
    });
    feedbackText.setOrigin(0.5);
    feedbackText.setVisible(false);
    container.add(feedbackText);

    // Selected badge (hidden by default)
    const selectedBadge = this.add.text(0, -h * 0.42, '\u2713 SELECTED', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      fontWeight: 'bold',
      color: '#1a1a2e',
      backgroundColor: '#4ecdc4',
      padding: { x: 8, y: 3 },
    });
    selectedBadge.setOrigin(0.5);
    selectedBadge.setVisible(false);
    container.add(selectedBadge);

    // Lock icon overlay (for locked characters)
    const lockIcon = this.add.text(0, -h * 0.22, '\uD83D\uDD12', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
    });
    lockIcon.setOrigin(0.5);
    lockIcon.setVisible(false);
    container.add(lockIcon);

    // Store references
    container.bg = bg;
    container.previewBg = previewBg;
    container.preview = preview;
    container.floatTween = floatTween;
    container.nameText = nameText;
    container.statusText = statusText;
    container.actionBtn = actionBtn;
    container.actionBg = actionBg;
    container.actionText = actionText;
    container.feedbackText = feedbackText;
    container.selectedBadge = selectedBadge;
    container.lockIcon = lockIcon;
    container.charData = char;
    container._index = index;
    container._w = w;
    container._h = h;

    // Interactions
    bg.on('pointerover', () => {
      if (!isCharacterUnlocked(char.id)) return;
      bg.setFillStyle(0x3a4a63, 0.92);
      bg.setScale(1.03);
    });
    bg.on('pointerout', () => {
      bg.setScale(1);
      this.refreshCardStyle(container);
    });
    bg.on('pointerup', () => {
      const unlocked = isCharacterUnlocked(char.id);
      if (unlocked) {
        audioManager.playSfx('click');
        this.selectedId = char.id;
        setSelectedCharacter(char.id);
        this.refreshCards();
      }
    });

    actionBg.on('pointerover', () => {
      const unlocked = isCharacterUnlocked(char.id);
      if (unlocked) {
        actionBg.setFillStyle(COLORS.restartBtnHover, 1);
      } else if (this.coinBalance >= char.price) {
        actionBg.setFillStyle(COLORS.menuPrimaryHover, 1);
      }
      actionBg.setScale(1.05);
    });
    actionBg.on('pointerout', () => {
      actionBg.setScale(1);
      this.refreshCardStyle(container);
    });
    actionBg.on('pointerdown', () => actionBg.setScale(0.94));
    actionBg.on('pointerup', () => {
      actionBg.setScale(1);
      this.handleAction(char, container);
    });

    return container;
  }

  handleAction(char, card) {
    if (isCharacterUnlocked(char.id)) {
      audioManager.playSfx('click');
      this.selectedId = char.id;
      setSelectedCharacter(char.id);
      this.refreshCards();
      return;
    }

    if (this.coinBalance >= char.price) {
      this.coinBalance -= char.price;
      saveTotalCoins(this.coinBalance);
      unlockCharacter(char.id);
      audioManager.playSfx('powerupShield');
      this.coinLabel.setText(this.formatNumber(this.coinBalance));
      this.flashUnlockEffect(card);
      this.refreshCards();
    } else {
      audioManager.playSfx('shieldBreak');
      this.showNotEnough(card);
    }
  }

  flashUnlockEffect(card) {
    const flash = this.add.rectangle(card.x, card.y, this.cardW + 20, this.cardH + 20, 0x4ecdc4, 0.4);
    flash.setDepth(20);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.5,
      duration: 500,
      ease: 'Power2',
      onComplete: () => flash.destroy(),
    });

    // Sparkle burst
    for (let i = 0; i < 8; i++) {
      const sparkle = this.add.text(card.x, card.y, '\u2726', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#4ecdc4',
        stroke: '#000000',
        strokeThickness: 1,
      });
      sparkle.setOrigin(0.5);
      sparkle.setDepth(21);

      const angle = (i / 8) * Math.PI * 2;
      const dist = Phaser.Math.Between(40, 80);
      const tx = card.x + Math.cos(angle) * dist;
      const ty = card.y + Math.sin(angle) * dist;

      this.tweens.add({
        targets: sparkle,
        x: tx,
        y: ty,
        alpha: 0,
        scale: { from: 1, to: 0.3 },
        duration: 500,
        ease: 'Power2',
        onComplete: () => sparkle.destroy(),
      });
    }
  }

  showNotEnough(card) {
    card.feedbackText.setText('Not enough\ncoins!');
    card.feedbackText.setVisible(true);
    card.feedbackText.setAlpha(1);

    this.tweens.add({
      targets: card,
      x: { from: card.x - 6, to: card.x },
      duration: 50,
      repeat: 3,
      yoyo: true,
    });

    this.time.delayedCall(1500, () => {
      this.tweens.add({
        targets: card.feedbackText,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          card.feedbackText.setVisible(false);
          card.feedbackText.setAlpha(1);
        },
      });
    });
  }

  // ── Card refresh / highlighting ──────────────────────────────

  refreshCards() {
    for (const card of this.cardContainers) {
      this.refreshCardStyle(card);
    }
  }

  refreshCardStyle(card) {
    const char = card.charData;
    const unlocked = isCharacterUnlocked(char.id);
    const isSelected = char.id === this.selectedId;

    card.feedbackText.setVisible(false);

    if (isSelected && unlocked) {
      // Selected highlight
      card.bg.setFillStyle(0x2a4a4a, 0.95);
      card.bg.setStrokeStyle(3, COLORS.restartBtn, 1);
      card.previewBg.setStrokeStyle(2, COLORS.restartBtn, 0.6);
      card.statusText.setText('SELECTED');
      card.statusText.setColor('#4ecdc4');
      card.preview.setAlpha(1);
      card.preview.clearTint();
      card.actionBtn.setVisible(false);
      card.selectedBadge.setVisible(true);
      card.lockIcon.setVisible(false);

      // Enhanced floating animation for selected card
      if (card.floatTween) card.floatTween.stop();
      card.floatTween = this.tweens.add({
        targets: card.preview,
        y: card._h * -0.22 - 8,
        scale: { from: 1.5, to: 1.7 },
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Glow pulse on selected badge
      if (!card._badgeTween) {
        card._badgeTween = this.tweens.add({
          targets: card.selectedBadge,
          scale: { from: 1, to: 1.08 },
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    } else if (unlocked) {
      // Unlocked but not selected
      card.bg.setFillStyle(0x2a3548, 0.92);
      card.bg.setStrokeStyle(2, 0x555566);
      card.previewBg.setStrokeStyle(1, 0x3a4a63, 0.4);
      card.statusText.setText('TAP TO SELECT');
      card.statusText.setColor('#888888');
      card.preview.setAlpha(0.85);
      card.preview.clearTint();
      card.actionBtn.setVisible(true);
      card.selectedBadge.setVisible(false);
      card.lockIcon.setVisible(false);

      card.actionBg.setFillStyle(COLORS.restartBtn, 1);
      card.actionText.setText('SELECT');
      card.actionText.setColor('#1a1a2e');

      // Normal float
      if (card.floatTween) card.floatTween.stop();
      card.floatTween = this.tweens.add({
        targets: card.preview,
        y: card._h * -0.22 - 4,
        duration: 1000 + card._index * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      if (card._badgeTween) {
        card._badgeTween.stop();
        card._badgeTween = null;
      }
    } else {
      // Locked
      card.bg.setFillStyle(0x222238, 0.92);
      card.bg.setStrokeStyle(2, 0x444455);
      card.previewBg.setStrokeStyle(1, 0x333344, 0.4);
      card.statusText.setText(this.formatNumber(char.price) + ' coins');
      card.statusText.setColor('#ffd700');
      card.preview.setAlpha(0.35);
      card.preview.setTint(0x666677);
      card.actionBtn.setVisible(true);
      card.selectedBadge.setVisible(false);
      card.lockIcon.setVisible(true);

      if (this.coinBalance >= char.price) {
        card.actionBg.setFillStyle(COLORS.menuPrimary, 1);
        card.actionText.setText('UNLOCK');
        card.actionText.setColor('#1a1a2e');
      } else {
        card.actionBg.setFillStyle(0x555566, 1);
        card.actionText.setText('UNLOCK');
        card.actionText.setColor('#999999');
      }

      // Slow float for locked
      if (card.floatTween) card.floatTween.stop();
      card.floatTween = this.tweens.add({
        targets: card.preview,
        y: card._h * -0.22 - 2,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      if (card._badgeTween) {
        card._badgeTween.stop();
        card._badgeTween = null;
      }
    }
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
    bg.on('pointerdown', () => bg.setScale(0.94));
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
  }

  // ── Keyboard ─────────────────────────────────────────────────

  setupKeyboard() {
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

    for (let i = 0; i < this.cardContainers.length; i++) {
      const card = this.cardContainers[i];
      card.setAlpha(0);
      card.y += 30;
      this.tweens.add({
        targets: card,
        y: card.y - 30,
        alpha: 1,
        duration: 350,
        delay: 150 + i * 100,
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

    for (const s of this.bgStars) {
      if (s.x > this.W) s.x = Phaser.Math.Between(0, this.W);
      if (s.y > this.H * 0.4) s.y = Phaser.Math.Between(0, this.H * 0.4);
    }

    this.titleContainer.setPosition(this.W / 2, this.H * 0.09);
    this.coinContainer.setPosition(this.W / 2, this.H * 0.19);

    const cardW = Math.min(150, this.W * 0.30);
    const cardH = Math.min(260, this.H * 0.52);
    const spacing = cardW + 18;
    const startX = this.W / 2 - (CHARACTERS.length - 1) * spacing / 2;
    const cardY = this.H * 0.48;

    this.cardW = cardW;
    this.cardH = cardH;
    this.cardSpacing = spacing;
    this.cardStartX = startX;
    this.cardY = cardY;

    for (let i = 0; i < this.cardContainers.length; i++) {
      const card = this.cardContainers[i];
      card.setPosition(startX + i * spacing, cardY);
      card._w = cardW;
      card._h = cardH;
      card.bg.setSize(cardW, cardH);
      card.previewBg.setSize(cardW - 16, cardH * 0.40);
      card.previewBg.setPosition(0, -cardH * 0.22);
      card.nameText.setPosition(0, cardH * 0.02);
      card.statusText.setPosition(0, cardH * 0.13);
      card.actionBtn.setPosition(0, cardH * 0.30);
      card.actionBg.setSize(cardW - 24, 38);
      card.feedbackText.setPosition(0, cardH * 0.42);
      card.selectedBadge.setPosition(0, -cardH * 0.42);
      card.lockIcon.setPosition(0, -cardH * 0.22);
    }

    this.backButton.setPosition(this.W / 2, this.H - 36);
  }

  // ── Shutdown ─────────────────────────────────────────────────

  shutdown() {
    this.scale.off('resize', this.handleResize, this);
    this.input.keyboard.off('keydown-ESC', this._escHandler);
    this.tweens.killAll();
  }
}
