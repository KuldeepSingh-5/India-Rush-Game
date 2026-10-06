import Phaser from 'phaser';
import { COLORS, audioManager } from '../config.js';

export default class SettingsPanel {
  constructor(scene, audio) {
    this.scene = scene;
    this.audio = audio || audioManager;
    this.visible = false;
    this._tweens = [];
    this.createPanel();
  }

  createPanel() {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    this.overlay = this.scene.add.rectangle(
      width / 2, height / 2, width, height, 0x000000, 0.6
    );
    this.overlay.setDepth(150);
    this.overlay.setInteractive();
    this.overlay.setVisible(false);

    const panelW = Math.min(320, width * 0.86);
    const panelH = 360;

    this.panel = this.scene.add.container(width / 2, height / 2);
    this.panel.setDepth(151);
    this.panel.setVisible(false);
    this.panelW = panelW;
    this.panelH = panelH;

    // Panel shadow
    const shadow = this.scene.add.rectangle(3, 6, panelW, panelH, 0x000000, 0.4);
    shadow.setOrigin(0.5);
    this.panel.add(shadow);

    // Panel background
    const bg = this.scene.add.rectangle(0, 0, panelW, panelH, COLORS.gameOverBg, 0.97);
    bg.setStrokeStyle(2, COLORS.menuPrimary, 0.8);
    bg.setOrigin(0.5);
    this.panel.add(bg);

    // Top accent bar
    const topBar = this.scene.add.rectangle(0, -panelH / 2 + 4, panelW - 8, 8, COLORS.menuPrimary, 0.85);
    this.panel.add(topBar);

    // Gear icon
    const gearIcon = this.scene.add.text(0, -panelH / 2 + 36, '\u2699', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '32px',
      color: '#ffd700',
    });
    gearIcon.setOrigin(0.5);
    this.panel.add(gearIcon);

    // Title
    const title = this.scene.add.text(0, -panelH / 2 + 70, 'SETTINGS', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);
    this.panel.add(title);

    // Subtitle
    const subtitle = this.scene.add.text(0, -panelH / 2 + 96, 'Adjust your audio preferences', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#4ecdc4',
      stroke: '#000000',
      strokeThickness: 2,
    });
    subtitle.setOrigin(0.5);
    this.panel.add(subtitle);

    // Toggles
    this.musicToggle = this.createToggle(-20, 'Music', '\u{1F3B5}', this.audio.musicEnabled, 'music');
    this.panel.add(this.musicToggle.container);

    this.sfxToggle = this.createToggle(50, 'Sound Effects', '\u{1F50A}', this.audio.sfxEnabled, 'sfx');
    this.panel.add(this.sfxToggle.container);

    // Buttons
    const btnW = Math.min(200, panelW - 48);
    const btnH = 46;
    const closeBtnY = panelH / 2 - 56;

    // CLOSE button
    this.closeBtn = this.createButton(0, closeBtnY, btnW, btnH, 'CLOSE', COLORS.menuPrimary, COLORS.menuPrimaryHover, () => {
      this.audio.playSfx('click');
      this.hide();
    });
    this.panel.add(this.closeBtn.container);

    // BACK TO MENU button (only shown in game scenes)
    const isGameScene = this.scene.scene.key === 'GameScene';
    if (isGameScene) {
      const backBtnY = closeBtnY + btnH + 10;
      this.backBtn = this.createButton(0, backBtnY, btnW, btnH, '\u2190 MAIN MENU', 0x555566, 0x666677, () => {
        this.audio.playSfx('click');
        this.hide();
        this.scene.scene.stop('GameOverScene');
        this.scene.scene.stop('GameScene');
        this.scene.scene.start('MenuScene');
      });
      this.panel.add(this.backBtn.container);
      // Extend panel height to fit extra button
      bg.setSize(panelW, panelH + 60);
      shadow.setSize(panelW, panelH + 60);
      topBar.setPosition(0, -(panelH + 60) / 2 + 4);
    }

    this.bg = bg;
    this.shadow = shadow;
    this.topBar = topBar;
  }

  createToggle(y, label, icon, enabled, settingKey) {
    const container = this.scene.add.container(0, y);

    // Row background
    const rowW = this.panelW - 32;
    const rowH = 56;
    const rowBg = this.scene.add.rectangle(0, 0, rowW, rowH, 0x2a3548, 0.7);
    rowBg.setStrokeStyle(1, 0x3a4a63, 0.5);
    rowBg.setOrigin(0.5);
    container.add(rowBg);

    // Icon
    const iconText = this.scene.add.text(-rowW / 2 + 22, 0, icon, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
    });
    iconText.setOrigin(0.5);
    container.add(iconText);

    // Label
    const labelText = this.scene.add.text(-rowW / 2 + 44, 0, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '17px',
      fontWeight: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    labelText.setOrigin(0, 0.5);
    container.add(labelText);

    // Toggle switch
    const toggleW = 64;
    const toggleH = 32;
    const toggleX = rowW / 2 - toggleW / 2 - 10;
    const toggleY = 0;

    const toggleBg = this.scene.add.rectangle(toggleX, toggleY, toggleW, toggleH, enabled ? COLORS.menuPrimary : 0x333344, 1);
    toggleBg.setStrokeStyle(2, enabled ? COLORS.menuPrimary : 0x555566, 0.8);
    toggleBg.setOrigin(0.5);
    toggleBg.setInteractive({ useHandCursor: true });
    container.add(toggleBg);

    // Knob (circle)
    const knobX = enabled ? toggleX + toggleW / 2 - 16 : toggleX - toggleW / 2 + 16;
    const knob = this.scene.add.circle(knobX, toggleY, 12, 0xffffff, 1);
    knob.setStrokeStyle(1, 0x000000, 0.2);
    container.add(knob);

    // State text (ON/OFF)
    const stateX = enabled ? toggleX - toggleW / 2 + 10 : toggleX + toggleW / 2 - 10;
    const stateText = this.scene.add.text(stateX, toggleY, enabled ? 'ON' : 'OFF', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      fontWeight: 'bold',
      color: enabled ? '#1a1a2e' : '#888899',
    });
    stateText.setOrigin(0.5);
    container.add(stateText);

    toggleBg._enabled = enabled;
    toggleBg._settingKey = settingKey;

    const updateVisual = (newState, animate) => {
      toggleBg._enabled = newState;
      const newKnobX = newState ? toggleX + toggleW / 2 - 16 : toggleX - toggleW / 2 + 16;
      const newStateX = newState ? toggleX - toggleW / 2 + 10 : toggleX + toggleW / 2 - 10;

      if (animate) {
        // Animate knob slide
        this.scene.tweens.add({
          targets: knob,
          x: newKnobX,
          duration: 200,
          ease: 'Back.easeOut',
        });

        // Animate bg color
        this.scene.tweens.add({
          targets: toggleBg,
          duration: 200,
          ease: 'Power2',
          onUpdate: (tween) => {
            const p = tween.progress;
            if (newState) {
              toggleBg.setFillStyle(0x333344 + Math.floor(0x4ecdc4 * p - 0x333344 * p), 1);
            }
          },
          onComplete: () => {
            toggleBg.setFillStyle(newState ? COLORS.menuPrimary : 0x333344, 1);
            toggleBg.setStrokeStyle(2, newState ? COLORS.menuPrimary : 0x555566, 0.8);
          },
        });

        // Animate state text
        this.scene.tweens.add({
          targets: stateText,
          x: newStateX,
          alpha: { from: 0, to: 1 },
          duration: 200,
          ease: 'Power2',
        });
      } else {
        knob.x = newKnobX;
        stateText.x = newStateX;
      }

      stateText.setText(newState ? 'ON' : 'OFF');
      stateText.setColor(newState ? '#1a1a2e' : '#888899');
    };

    // Initial state text position
    if (enabled) {
      stateText.x = toggleX - toggleW / 2 + 10;
    } else {
      stateText.x = toggleX + toggleW / 2 - 10;
    }

    toggleBg.on('pointerup', () => {
      const newState = !toggleBg._enabled;
      updateVisual(newState, true);
      this.audio.playSfx('click');

      // Press feedback
      this.scene.tweens.add({
        targets: toggleBg,
        scale: { from: 0.95, to: 1 },
        duration: 150,
        ease: 'Power2',
      });

      if (toggleBg._settingKey === 'music') {
        this.audio.setMusicEnabled(newState);
      } else {
        this.audio.setSfxEnabled(newState);
      }
    });

    toggleBg.on('pointerover', () => {
      this.scene.tweens.add({
        targets: rowBg,
        alpha: { from: 0.7, to: 0.9 },
        duration: 150,
      });
    });

    toggleBg.on('pointerout', () => {
      this.scene.tweens.add({
        targets: rowBg,
        alpha: { from: 0.9, to: 0.7 },
        duration: 150,
      });
    });

    container._toggleBg = toggleBg;
    container._knob = knob;
    container._stateText = stateText;
    container._updateVisual = updateVisual;

    return { container, toggleBg, knob, stateText, updateVisual };
  }

  createButton(x, y, w, h, label, color, hoverColor, onClick) {
    const container = this.scene.add.container(x, y);

    const bg = this.scene.add.rectangle(0, 0, w, h, color, 1);
    bg.setStrokeStyle(2, 0xffffff, 0.25);
    bg.setOrigin(0.5);
    bg.setInteractive({ useHandCursor: true });
    container.add(bg);

    const text = this.scene.add.text(0, 0, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fontWeight: 'bold',
      color: color === COLORS.menuPrimary ? '#1a1a2e' : '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    text.setOrigin(0.5);
    container.add(text);

    bg.on('pointerover', () => {
      bg.setFillStyle(hoverColor, 1);
      bg.setScale(1.05);
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(color, 1);
      bg.setScale(1);
    });
    bg.on('pointerdown', () => bg.setScale(0.94));
    bg.on('pointerup', () => {
      bg.setScale(1.05);
      onClick();
    });

    return { container, bg, text };
  }

  show() {
    if (this.visible) return;
    this.visible = true;
    this.overlay.setVisible(true);
    this.panel.setVisible(true);

    // Sync toggle states with current audio settings
    if (this.musicToggle) this.musicToggle.updateVisual(this.audio.musicEnabled, false);
    if (this.sfxToggle) this.sfxToggle.updateVisual(this.audio.sfxEnabled, false);

    // Pop-in animation
    this.panel.setScale(0.7);
    this.panel.setAlpha(0);
    const t1 = this.scene.tweens.add({
      targets: this.panel,
      scale: 1,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });
    this._tweens.push(t1);

    this.overlay.setAlpha(0);
    const t2 = this.scene.tweens.add({
      targets: this.overlay,
      alpha: 0.6,
      duration: 200,
    });
    this._tweens.push(t2);
  }

  hide() {
    if (!this.visible) return;
    this.visible = false;

    const t1 = this.scene.tweens.add({
      targets: this.panel,
      scale: 0.8,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.panel.setVisible(false);
        this.panel.setScale(1);
        this.panel.setAlpha(1);
      },
    });
    this._tweens.push(t1);

    const t2 = this.scene.tweens.add({
      targets: this.overlay,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.overlay.setVisible(false);
      },
    });
    this._tweens.push(t2);
  }

  toggle() {
    if (this.visible) this.hide();
    else this.show();
  }

  handleResize(width, height) {
    this.overlay.setPosition(width / 2, height / 2);
    this.overlay.setSize(width, height);
    this.panel.setPosition(width / 2, height / 2);
  }

  destroy() {
    for (const t of this._tweens) {
      if (t && t.isPlaying) t.stop();
    }
    this._tweens = [];
    if (this.overlay) this.overlay.destroy();
    if (this.panel) this.panel.destroy();
  }
}
