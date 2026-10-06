import Phaser from 'phaser';
import { COLORS, audioManager } from '../config.js';

export default class PauseMenu {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;
    this.createOverlay();
  }

  createOverlay() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;

    this.overlay = this.scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.6);
    this.overlay.setDepth(300);
    this.overlay.setInteractive();
    this.overlay.setVisible(false);

    this.panel = this.scene.add.container(w / 2, h / 2);
    this.panel.setDepth(301);
    this.panel.setVisible(false);

    const panelW = Math.min(300, w * 0.84);
    const panelH = 320;

    const bg = this.scene.add.rectangle(0, 0, panelW, panelH, COLORS.gameOverBg, 0.96);
    bg.setStrokeStyle(3, COLORS.menuPrimary);
    this.panel.add(bg);

    // Decorative top bar
    const topBar = this.scene.add.rectangle(0, -panelH / 2 + 3, panelW - 6, 6, COLORS.menuPrimary, 0.8);
    this.panel.add(topBar);

    // Pause icon
    const pauseIcon = this.scene.add.text(0, -panelH / 2 + 36, '\u23F8', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '36px',
      color: '#ffd700',
    });
    pauseIcon.setOrigin(0.5);
    this.panel.add(pauseIcon);

    // Title
    const title = this.scene.add.text(0, -panelH / 2 + 72, 'GAME PAUSED', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '26px',
      fontWeight: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);
    this.panel.add(title);

    // Subtitle with score/coins
    this.scoreLine = this.scene.add.text(0, -panelH / 2 + 104, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: '#ffd700',
    });
    this.scoreLine.setOrigin(0.5);
    this.panel.add(this.scoreLine);

    // Buttons
    const btnW = Math.min(220, panelW - 40);
    const btnH = 50;
    const btnSpacing = 12;
    const startY = 10;

    this.resumeBtn = this.makeButton(0, startY, btnW, btnH, 'RESUME', '\u25B6', COLORS.menuPrimary, COLORS.menuPrimaryHover, () => {
      audioManager.playSfx('click');
      this.scene.resumeGame();
    });
    this.panel.add(this.resumeBtn.container);

    this.restartBtn = this.makeButton(0, startY + btnH + btnSpacing, btnW, btnH, 'RESTART', '\u21BB', COLORS.menuBtnOrange, COLORS.menuBtnOrangeHover, () => {
      audioManager.playSfx('click');
      this.hide();
      this.scene.restart();
    });
    this.panel.add(this.restartBtn.container);

    this.menuBtn = this.makeButton(0, startY + (btnH + btnSpacing) * 2, btnW, btnH, 'MAIN MENU', '\u2302', 0x555566, 0x666677, () => {
      audioManager.playSfx('click');
      this.hide();
      this.scene.scene.stop('GameOverScene');
      this.scene.scene.stop('GameScene');
      this.scene.scene.start('MenuScene');
    });
    this.panel.add(this.menuBtn.container);

    this.panelW = panelW;
    this.panelH = panelH;
  }

  makeButton(x, y, w, h, label, icon, color, hoverColor, onClick) {
    const container = this.scene.add.container(x, y);

    const bg = this.scene.add.rectangle(0, 0, w, h, color, 1);
    bg.setStrokeStyle(2, 0xffffff, 0.25);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      bg.setFillStyle(hoverColor, 1);
      bg.setScale(1.04);
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(color, 1);
      bg.setScale(1);
    });
    bg.on('pointerdown', () => bg.setScale(0.94));
    bg.on('pointerup', () => {
      bg.setScale(1.04);
      onClick();
    });

    const iconText = this.scene.add.text(-w * 0.28, 0, icon, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
    });
    iconText.setOrigin(0.5);

    const labelText = this.scene.add.text(w * 0.05, 0, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    labelText.setOrigin(0.5);

    container.add([bg, iconText, labelText]);
    return { container, bg };
  }

  show() {
    this.visible = true;
    this.overlay.setVisible(true);
    this.panel.setVisible(true);

    this.scoreLine.setText('Score: ' + this.scene.score + '  |  Coins: ' + this.scene.coins);

    this.panel.setScale(0.6);
    this.panel.setAlpha(0);
    this.scene.tweens.add({
      targets: this.panel,
      scale: 1,
      alpha: 1,
      duration: 250,
      ease: 'Back.easeOut',
    });
    this.overlay.setAlpha(0);
    this.scene.tweens.add({
      targets: this.overlay,
      alpha: 0.6,
      duration: 200,
    });
  }

  hide() {
    this.visible = false;
    this.overlay.setVisible(false);
    this.panel.setVisible(false);
  }

  handleResize(width, height) {
    this.overlay.setPosition(width / 2, height / 2);
    this.overlay.setSize(width, height);
    this.panel.setPosition(width / 2, height / 2);
  }

  destroy() {
    if (this.overlay) this.overlay.destroy();
    if (this.panel) this.panel.destroy();
  }
}
