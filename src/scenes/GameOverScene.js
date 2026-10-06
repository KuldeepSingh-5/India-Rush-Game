import Phaser from 'phaser';
import { AdMob } from '@capacitor-community/admob';
import {
  COLORS,
  audioManager,
  getTotalCoins,
  saveTotalCoins
} from '../config.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data) {
    const width = this.scale.width;
    const height = this.scale.height;

    const score = data.score || 0;
    const best = data.best || 0;
    const coins = data.coins || 0;
    const isNewRecord = score >= best && score > 0;

    this.rewardAdLoading = false;

    const overlay = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      COLORS.gameOverBg,
      0.88
    );
    overlay.setDepth(200);

    // =========================
    // GAME OVER
    // =========================
    const gameOverText = this.add.text(
      width / 2,
      height * 0.20,
      'GAME OVER',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '48px',
        fontWeight: 'bold',
        color: '#e63946',
        stroke: '#000000',
        strokeThickness: 6,
      }
    );

    gameOverText.setOrigin(0.5);
    gameOverText.setDepth(201);

    this.tweens.add({
      targets: gameOverText,
      scale: { from: 0.5, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 400,
      ease: 'Back.easeOut',
    });

    // =========================
    // STATS
    // =========================
    const statsContainer = this.add.container(
      width / 2,
      height * 0.34
    );

    statsContainer.setDepth(201);

    const statEntries = [
      {
        label: 'Score',
        value: score.toString(),
        color: '#ffffff',
      },
      {
        label: 'Best',
        value: best.toString(),
        color: '#ffd700',
      },
      {
        label: 'Coins',
        value: coins.toString(),
        color: '#ffd700',
      },
    ];

    const statObjects = [];
    let yOffset = 0;
    const rowSpacing = 48;

    // Keep reference to the Coins value text
    this.coinsValueText = null;

    for (const entry of statEntries) {
      const label = this.add.text(
        0,
        yOffset,
        entry.label,
        {
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
          color: '#888888',
        }
      );

      label.setOrigin(0.5, 0);

      const value = this.add.text(
        0,
        yOffset + 18,
        entry.value,
        {
          fontFamily: 'Arial, sans-serif',
          fontSize: '30px',
          fontWeight: 'bold',
          color: entry.color,
          stroke: '#000000',
          strokeThickness: 3,
        }
      );

      value.setOrigin(0.5, 0);

      // Save Coins text reference
      if (entry.label === 'Coins') {
        this.coinsValueText = value;
      }

      statObjects.push(label, value);

      yOffset += rowSpacing;
    }

    statsContainer.add(statObjects);

    // =========================
    // NEW RECORD
    // =========================
    let newRecordText = null;

    if (isNewRecord) {
      newRecordText = this.add.text(
        width / 2,
        height * 0.55,
        'NEW RECORD!',
        {
          fontFamily: 'Arial, sans-serif',
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#4ecdc4',
          stroke: '#000000',
          strokeThickness: 3,
        }
      );

      newRecordText.setOrigin(0.5);
      newRecordText.setDepth(201);

      this.tweens.add({
        targets: newRecordText,
        scale: { from: 0.8, to: 1.1 },
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // =========================
    // REWARDED AD BUTTON
    // =========================
    const rewardBtnWidth = Math.min(260, width * 0.70);
    const rewardBtnHeight = 48;
    const rewardBtnY = height * 0.64;

    const rewardBtn = this.add.container(
      width / 2,
      rewardBtnY
    );

    rewardBtn.setDepth(201);

    const rewardBg = this.add.rectangle(
      0,
      0,
      rewardBtnWidth,
      rewardBtnHeight,
      0x28a745,
      1
    );

    rewardBg.setStrokeStyle(
      2,
      0x5cff7a
    );

    rewardBg.setInteractive({
      useHandCursor: true,
    });

    const rewardText = this.add.text(
      0,
      0,
      'WATCH AD +50 COINS',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '17px',
        fontWeight: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      }
    );

    rewardText.setOrigin(0.5);

    rewardBtn.add([
      rewardBg,
      rewardText,
    ]);

    rewardBg.on('pointerover', () => {
      if (!this.rewardAdLoading) {
        rewardBg.setFillStyle(0x34c759);
        rewardBg.setScale(1.04);
      }
    });

    rewardBg.on('pointerout', () => {
      if (!this.rewardAdLoading) {
        rewardBg.setFillStyle(0x28a745);
        rewardBg.setScale(1);
      }
    });

    rewardBg.on('pointerdown', () => {
      if (!this.rewardAdLoading) {
        rewardBg.setScale(0.96);
      }
    });

    rewardBg.on('pointerup', async () => {
      if (this.rewardAdLoading) {
        return;
      }

      rewardBg.setScale(1);

      await this.watchRewardedAd(
        rewardBg,
        rewardText
      );
    });

    // =========================
    // RESTART + MENU BUTTONS
    // =========================
    const btnWidth = Math.min(
      200,
      width * 0.42
    );

    const btnHeight = 52;
    const btnY = height * 0.80;
    const btnSpacing = btnWidth + 16;

    // RESTART
    const restartBtn = this.add.container(
      width / 2 - btnSpacing / 2,
      btnY
    );

    restartBtn.setDepth(201);

    const btnBg = this.add.rectangle(
      0,
      0,
      btnWidth,
      btnHeight,
      COLORS.restartBtn,
      1
    );

    btnBg.setInteractive({
      useHandCursor: true,
    });

    btnBg.on('pointerover', () => {
      btnBg.setFillStyle(
        COLORS.restartBtnHover
      );
      btnBg.setScale(1.05);
    });

    btnBg.on('pointerout', () => {
      btnBg.setFillStyle(
        COLORS.restartBtn
      );
      btnBg.setScale(1);
    });

    btnBg.on('pointerdown', () => {
      btnBg.setScale(0.95);
    });

    btnBg.on('pointerup', () => {
      this.restartGame();
    });

    const btnText = this.add.text(
      0,
      0,
      'RESTART',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#1a1a2e',
      }
    );

    btnText.setOrigin(0.5);

    restartBtn.add([
      btnBg,
      btnText,
    ]);

    // MENU
    const menuBtn = this.add.container(
      width / 2 + btnSpacing / 2,
      btnY
    );

    menuBtn.setDepth(201);

    const menuBg = this.add.rectangle(
      0,
      0,
      btnWidth,
      btnHeight,
      0x555566,
      1
    );

    menuBg.setStrokeStyle(
      2,
      0x777788
    );

    menuBg.setInteractive({
      useHandCursor: true,
    });

    menuBg.on('pointerover', () => {
      menuBg.setFillStyle(0x666677);
      menuBg.setScale(1.05);
    });

    menuBg.on('pointerout', () => {
      menuBg.setFillStyle(0x555566);
      menuBg.setScale(1);
    });

    menuBg.on('pointerdown', () => {
      menuBg.setScale(0.95);
    });

    menuBg.on('pointerup', () => {
      audioManager.playSfx('click');
      this.goToMenu();
    });

    const menuText = this.add.text(
      0,
      0,
      'MENU',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#ffffff',
      }
    );

    menuText.setOrigin(0.5);

    menuBtn.add([
      menuBg,
      menuText,
    ]);

    // =========================
    // BUTTON ANIMATION
    // =========================
    this.tweens.add({
      targets: [
        rewardBtn,
        restartBtn,
        menuBtn,
      ],
      alpha: {
        from: 0,
        to: 1,
      },
      duration: 300,
      delay: 200,
      ease: 'Power2',
    });

    // =========================
    // KEYBOARD
    // =========================
    this.input.keyboard.on(
      'keydown-SPACE',
      () => this.restartGame()
    );

    this.input.keyboard.on(
      'keydown-ENTER',
      () => this.restartGame()
    );

    // =========================
    // RESPONSIVE RESIZE
    // =========================
    this._resizeHandler = (gameSize) => {
      const w = gameSize.width;
      const h = gameSize.height;

      overlay.setPosition(
        w / 2,
        h / 2
      );

      overlay.setSize(w, h);

      gameOverText.setPosition(
        w / 2,
        h * 0.20
      );

      statsContainer.setPosition(
        w / 2,
        h * 0.34
      );

      if (newRecordText) {
        newRecordText.setPosition(
          w / 2,
          h * 0.55
        );
      }

      rewardBtn.setPosition(
        w / 2,
        h * 0.64
      );

      const sp =
        Math.min(200, w * 0.42) + 16;

      restartBtn.setPosition(
        w / 2 - sp / 2,
        h * 0.80
      );

      menuBtn.setPosition(
        w / 2 + sp / 2,
        h * 0.80
      );
    };

    this.scale.on(
      'resize',
      this._resizeHandler
    );
  }

  // =========================
  // REWARDED AD
  // =========================
  async watchRewardedAd(
    rewardBg,
    rewardText
  ) {
    this.rewardAdLoading = true;

    rewardText.setText(
      'LOADING AD...'
    );

    rewardBg.setFillStyle(
      0x777777
    );

    rewardBg.disableInteractive();

    try {
      await AdMob.prepareRewardVideoAd({
        adId:
          'ca-app-pub-6349209299551183/4040776141',
        isTesting: true,
      });

      const result =
        await AdMob.showRewardVideoAd();

      console.log(
        'Rewarded ad result:',
        result
      );

      // Reward only if the ad returned a reward
      if (
        result &&
        result.reward
      ) {
        const rewardSaved =
          this.addCoinsReward(50);

        if (rewardSaved) {
          // Update Coins display immediately
          const currentTotal = getTotalCoins();

          if (
            this.coinsValueText &&
            this.coinsValueText.active
          ) {
            this.coinsValueText.setText(
              currentTotal.toString()
            );
          }

          rewardText.setText(
            '+50 COINS ADDED!'
          );

          rewardBg.setFillStyle(
            0x20c997
          );
        } else {
          rewardText.setText(
            'COIN SAVE ERROR'
          );

          rewardBg.setFillStyle(
            0xcc3333
          );
        }

        this.time.delayedCall(
          1500,
          () => {
            if (
              rewardText &&
              rewardText.active
            ) {
              rewardText.setText(
                'WATCH AD +50 COINS'
              );

              rewardBg.setFillStyle(
                0x28a745
              );

              rewardBg.setInteractive({
                useHandCursor: true,
              });

              this.rewardAdLoading =
                false;
            }
          }
        );
      } else {
        rewardText.setText(
          'WATCH AD +50 COINS'
        );

        rewardBg.setFillStyle(
          0x28a745
        );

        rewardBg.setInteractive({
          useHandCursor: true,
        });

        this.rewardAdLoading = false;
      }
    } catch (error) {
      console.error(
        'Rewarded ad error:',
        error
      );

      rewardText.setText(
        'WATCH AD +50 COINS'
      );

      rewardBg.setFillStyle(
        0x28a745
      );

      rewardBg.setInteractive({
        useHandCursor: true,
      });

      this.rewardAdLoading = false;
    }
  }

  // =========================
  // ADD 50 COINS
  // =========================
  addCoinsReward(amount) {
    try {
      const currentTotal = getTotalCoins();
      const newTotal = currentTotal + amount;

      saveTotalCoins(newTotal);

      console.log(
        `Reward received: +${amount} coins`
      );

      console.log(
        `Total coins: ${newTotal}`
      );

      return true;
    } catch (error) {
      console.error(
        'Failed to save reward coins:',
        error
      );

      return false;
    }
  }

  // =========================
  // RESTART GAME
  // =========================
  async restartGame() {
    audioManager.playSfx('click');

    let restartCount = Number(
      localStorage.getItem(
        'indiaRushRestartCount'
      ) || 0
    );

    restartCount++;

    localStorage.setItem(
      'indiaRushRestartCount',
      restartCount.toString()
    );

    // Every 3rd restart
    if (restartCount % 3 === 0) {
      try {
        await AdMob.prepareInterstitial({
          adId:
            'ca-app-pub-6349209299551183/7946473972',
          isTesting: true,
        });

        await AdMob.showInterstitial();

        console.log(
          'Interstitial ad shown on restart:',
          restartCount
        );
      } catch (error) {
        console.log(
          'Interstitial ad error:',
          error
        );
      }
    } else {
      console.log(
        'No interstitial. Restart count:',
        restartCount
      );
    }

    const gameScene =
      this.scene.get('GameScene');

    this.scene.stop();
    gameScene.restart();
  }

  // =========================
  // GO TO MENU
  // =========================
  goToMenu() {
    this.scene.stop('GameScene');
    this.scene.stop();
    this.scene.start('MenuScene');
  }

  // =========================
  // SHUTDOWN
  // =========================
  shutdown() {
    this.scale.off(
      'resize',
      this._resizeHandler
    );

    this.input.keyboard.off(
      'keydown-SPACE'
    );

    this.input.keyboard.off(
      'keydown-ENTER'
    );

    this.tweens.killAll();
  }
}