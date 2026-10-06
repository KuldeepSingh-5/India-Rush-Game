import Phaser from 'phaser';
import { COLORS, audioManager } from '../config.js';

const TUTORIAL_KEY = 'india-rush-tutorial-completed';

export default class Tutorial {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;
  this.createOverlay();
  }

  shouldShow() {
    try {
      return localStorage.getItem(TUTORIAL_KEY) !== 'true';
    } catch (e) {
      return true;
    }
  }

  // ── Overlay construction ────────────────────────────────────

  createOverlay() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;

    this.overlay = this.scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.72);
    this.overlay.setDepth(400);
    this.overlay.setInteractive();
    this.overlay.setVisible(false);

    this.panel = this.scene.add.container(w / 2, h / 2);
    this.panel.setDepth(401);
    this.panel.setVisible(false);

    this.buildPanel(w, h);
  }

  buildPanel(w, h) {
    const panelW = Math.min(340, w * 0.88);
    const panelH = Math.min(460, h * 0.86);

    const bg = this.scene.add.rectangle(0, 0, panelW, panelH, COLORS.gameOverBg, 0.97);
    bg.setStrokeStyle(3, COLORS.menuPrimary);
    this.panel.add(bg);

    const topBar = this.scene.add.rectangle(0, -panelH / 2 + 4, panelW - 8, 8, COLORS.menuPrimary, 0.85);
    this.panel.add(topBar);

    // Title
    const title = this.scene.add.text(0, -panelH / 2 + 36, 'HOW TO PLAY', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '26px',
      fontWeight: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 5,
    });
    title.setOrigin(0.5);
    this.panel.add(title);

    const subtitle = this.scene.add.text(0, -panelH / 2 + 64, 'Learn the controls!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#4ecdc4',
      stroke: '#000000',
      strokeThickness: 2,
    });
    subtitle.setOrigin(0.5);
    this.panel.add(subtitle);

    // Instruction rows
    const instructions = [
      { icon: 'horizontal', label: 'SWIPE LEFT / RIGHT', desc: 'Change lanes' },
      { icon: 'up', label: 'SWIPE UP', desc: 'Jump' },
      { icon: 'down', label: 'SWIPE DOWN', desc: 'Slide' },
    ];

    const rowH = 78;
    const startY = -panelH / 2 + 96;
    this.rowGraphics = [];

    for (let i = 0; i < instructions.length; i++) {
      const y = startY + i * rowH;
      const row = this.createInstructionRow(0, y, panelW, instructions[i]);
      this.panel.add(row.container);
      this.rowGraphics.push(row);
    }

    // GOT IT button
    const btnW = Math.min(200, panelW * 0.7);
    const btnH = 56;
    const btnY = panelH / 2 - 48;

    this.gotItBtn = this.scene.add.container(0, btnY);
    this.panel.add(this.gotItBtn);

    const glow = this.scene.add.circle(0, 0, btnW * 0.6, COLORS.menuPrimary, 0.2);
    glow.setDepth(-1);

    const btnBg = this.scene.add.rectangle(0, 0, btnW, btnH, COLORS.menuPrimary, 1);
    btnBg.setStrokeStyle(3, 0xffffff, 0.35);
    btnBg.setInteractive({ useHandCursor: true });
    btnBg.on('pointerover', () => {
      btnBg.setFillStyle(COLORS.menuPrimaryHover, 1);
      btnBg.setScale(1.05);
      glow.setScale(1.15);
    });
    btnBg.on('pointerout', () => {
      btnBg.setFillStyle(COLORS.menuPrimary, 1);
      btnBg.setScale(1);
      glow.setScale(1);
    });
    btnBg.on('pointerdown', () => btnBg.setScale(0.94));
    btnBg.on('pointerup', () => {
      btnBg.setScale(1.05);
      this.dismiss();
    });

    const btnText = this.scene.add.text(0, 0, 'GOT IT!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1a1a2e',
    });
    btnText.setOrigin(0.5);

    this.gotItBtn.add([glow, btnBg, btnText]);
    this.gotItGlow = glow;

    this.panelW = panelW;
    this.panelH = panelH;
  }

  // ── Instruction row with drawn arrow icon ───────────────────

  createInstructionRow(x, y, panelW, config) {
    const container = this.scene.add.container(x, y);

    const rowBg = this.scene.add.rectangle(0, 0, panelW - 24, 66, 0x2a3548, 0.8);
    rowBg.setStrokeStyle(1, 0x3a4a63, 0.6);
    container.add(rowBg);

    // Arrow icon drawn with graphics
    const iconBox = this.scene.add.container(-panelW * 0.28, 0);
    container.add(iconBox);

    const arrow = this.drawArrow(config.icon);
    arrow.setScale(0.9);
    iconBox.add(arrow);

    // Label
    const label = this.scene.add.text(-panelW * 0.12, -10, config.label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    label.setOrigin(0, 0.5);
    container.add(label);

    // Description
    const desc = this.scene.add.text(-panelW * 0.12, 12, config.desc, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#4ecdc4',
    });
    desc.setOrigin(0, 0.5);
    container.add(desc);

    return { container, arrow };
  }

  drawArrow(type) {
    const container = this.scene.add.container(0, 0);
    const size = 44;

    const circle = this.scene.add.circle(0, 0, size / 2, COLORS.menuPrimary, 0.25);
    circle.setStrokeStyle(2, COLORS.menuPrimary, 0.6);
    container.add(circle);

    const g = this.scene.add.graphics({ x: 0, y: 0 });

    if (type === 'horizontal') {
      // Left arrow
      g.fillStyle(0xffffff, 1);
      g.fillTriangle(-14, 0, -4, -8, -4, 8);
      g.fillRect(-4, -3, 14, 6);
      // Right arrow
      g.fillTriangle(14, 0, 4, -8, 4, 8);
      g.fillRect(-10, -3, 14, 6);
    } else if (type === 'up') {
      g.fillStyle(0xffffff, 1);
      g.fillTriangle(0, -16, -10, -4, 10, -4);
      g.fillRect(-4, -6, 8, 18);
    } else if (type === 'down') {
      g.fillStyle(0xffffff, 1);
      g.fillTriangle(0, 16, -10, 4, 10, 4);
      g.fillRect(-4, -12, 8, 18);
    }

    container.add(g);
    return container;
  }

  // ── Show / dismiss ───────────────────────────────────────────

  show() {
    if (this.visible) return;
    this.visible = true;
    this.overlay.setVisible(true);
    this.panel.setVisible(true);

    // Animate arrows
    this.animateArrows();

    // Pop-in
    this.panel.setScale(0.7);
    this.panel.setAlpha(0);
    this.scene.tweens.add({
      targets: this.panel,
      scale: 1,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });
    this.overlay.setAlpha(0);
    this.scene.tweens.add({
      targets: this.overlay,
      alpha: 0.72,
      duration: 200,
    });

    // Pulsing glow on GOT IT
    this.gotItGlowTween = this.scene.tweens.add({
      targets: this.gotItGlow,
      alpha: { from: 0.12, to: 0.3 },
      scale: { from: 0.95, to: 1.12 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  animateArrows() {
    if (this.arrowTweens) {
      for (const t of this.arrowTweens) t.stop();
    }
    this.arrowTweens = [];

    for (let i = 0; i < this.rowGraphics.length; i++) {
      const arrow = this.rowGraphics[i].arrow;
      const config = ['horizontal', 'up', 'down'][i];

      let tween;
      if (config === 'horizontal') {
        tween = this.scene.tweens.add({
          targets: arrow,
          x: { from: -6, to: 6 },
          duration: 600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      } else if (config === 'up') {
        tween = this.scene.tweens.add({
          targets: arrow,
          y: { from: 4, to: -8 },
          duration: 600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      } else {
        tween = this.scene.tweens.add({
          targets: arrow,
          y: { from: -4, to: 8 },
          duration: 600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
      this.arrowTweens.push(tween);
    }
  }

  dismiss() {
    if (!this.visible) return;
    this.visible = false;
    audioManager.playSfx('click');

    try {
      localStorage.setItem(TUTORIAL_KEY, 'true');
    } catch (e) {
      // localStorage may be unavailable
    }

    if (this.gotItGlowTween) {
      this.gotItGlowTween.stop();
      this.gotItGlowTween = null;
    }
    if (this.arrowTweens) {
      for (const t of this.arrowTweens) t.stop();
      this.arrowTweens = null;
    }

    this.scene.tweens.add({
      targets: this.panel,
      scale: 0.7,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.overlay.setVisible(false);
        this.panel.setVisible(false);
        this.panel.setScale(1);
        this.panel.setAlpha(1);
      },
    });
    this.scene.tweens.add({
      targets: this.overlay,
      alpha: 0,
      duration: 200,
    });

    if (this.scene.onTutorialDismissed) {
      this.scene.onTutorialDismissed();
    }
  }

  // ── Resize ───────────────────────────────────────────────────

  handleResize(width, height) {
    this.overlay.setPosition(width / 2, height / 2);
    this.overlay.setSize(width, height);
    this.panel.setPosition(width / 2, height / 2);

    const panelW = Math.min(340, width * 0.88);
    const panelH = Math.min(460, height * 0.86);
    this.panelW = panelW;
    this.panelH = panelH;

    const bg = this.panel.list[0];
    if (bg && bg.setSize) bg.setSize(panelW, panelH);
    const topBar = this.panel.list[1];
    if (topBar && topBar.setSize) topBar.setSize(panelW - 8, 8);
  }

  destroy() {
    if (this.gotItGlowTween) this.gotItGlowTween.stop();
    if (this.arrowTweens) for (const t of this.arrowTweens) t.stop();
    if (this.overlay) this.overlay.destroy();
    if (this.panel) this.panel.destroy();
  }
}
