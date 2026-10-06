import Phaser from 'phaser';
import { COLORS, GAMEPLAY, getLaneX, LANES } from '../config.js';

export default class Road {
  constructor(scene, width, height) {
    this.scene = scene;
    this.width = width;
    this.height = height;

    this.roadWidth = width * (GAMEPLAY.laneWidth * 3 + 0.12);
    this.horizonRoadWidth = width * (GAMEPLAY.laneWidth * 3 + 0.10);
    this.horizonY = height * 0.1;
    this.groundTransitionY = height * 0.56;
    this.roadX = width / 2;
    this.roadY = height / 2;

    this.platformLeft = scene.add.tileSprite(
      0,
      this.horizonY,
      width / 2 - this.roadWidth / 2,
      height - this.groundTransitionY,
      'platform-tile'
    );
    this.platformLeft.setOrigin(0, 0);
    this.platformLeft.setDepth(0);

    this.platformRight = scene.add.tileSprite(
      width / 2 + this.roadWidth / 2,
      this.horizonY,
      width / 2 - this.roadWidth / 2,
      height - this.groundTransitionY,
      'platform-tile'
    );
    this.platformRight.setOrigin(0, 0);
    this.platformRight.setDepth(0);

    this.grassLeft = scene.add.tileSprite(
      0,
      0,
      width / 2 - this.roadWidth / 2,
      this.groundTransitionY,
      'grass-tile'
    );
    this.grassLeft.setOrigin(0, 0);
    this.grassLeft.setDepth(0);

    this.grassRight = scene.add.tileSprite(
      width / 2 + this.roadWidth / 2,
      0,
      width / 2 - this.roadWidth / 2,
      this.groundTransitionY,
      'grass-tile'
    );
    this.grassRight.setOrigin(0, 0);
    this.grassRight.setDepth(0);

    this.roadBg = scene.add.graphics();
    this.roadBg.setDepth(1);
    this.redrawRoadSurface();
    this.roadMask = this.roadBg.createGeometryMask();

    this.roadDetails = scene.add.graphics();
    this.roadDetails.setDepth(2);
    this.drawRoadDetails();

    this.sleepers = scene.add.tileSprite(
      this.roadX,
      this.roadY,
      this.roadWidth,
      height,
      'rail-sleeper'
    );
    this.sleepers.setDepth(1.5);
    this.sleepers.setOrigin(0.5, 0.5);
    this.sleepers.setMask(this.roadMask);

    this.scrollOffset = 0;
  }

  getRoadLeftAt(y) {
    const progress = Phaser.Math.Clamp(y / this.height, 0, 1);
    const topLeft = (this.width - this.horizonRoadWidth) / 2;
    const bottomLeft = (this.width - this.roadWidth) / 2;
    return Phaser.Math.Linear(topLeft, bottomLeft, progress);
  }

  getDividerX(divider, y) {
    const progress = Phaser.Math.Clamp(
      (y - this.horizonY) / (this.height - this.horizonY),
      0,
      1
    );
    const topX = this.width * (divider === 0 ? 0.4 : 0.6);
    const bottomX =
      (getLaneX(divider, this.width) + getLaneX(divider + 1, this.width)) / 2;
    return Phaser.Math.Linear(topX, bottomX, progress);
  }

  redrawRoadSurface() {
    const topLeft = (this.width - this.horizonRoadWidth) / 2;
    const topRight = this.width - topLeft;
    const bottomLeft = (this.width - this.roadWidth) / 2;
    const bottomRight = this.width - bottomLeft;

    this.roadBg.clear();
    this.roadBg.fillStyle(COLORS.road, 1);
    this.roadBg.fillPoints(
      [
        new Phaser.Geom.Point(topLeft, this.horizonY),
        new Phaser.Geom.Point(topRight, this.horizonY),
        new Phaser.Geom.Point(bottomRight, this.height),
        new Phaser.Geom.Point(bottomLeft, this.height),
      ],
      true
    );
  }

  drawRoadDetails() {
    const topLeft = (this.width - this.horizonRoadWidth) / 2;
    const topRight = this.width - topLeft;
    const bottomLeft = (this.width - this.roadWidth) / 2;
    const bottomRight = this.width - bottomLeft;

    this.roadDetails.clear();
    this.roadDetails.lineStyle(2, COLORS.railSteel, 0.8);
    this.roadDetails.lineBetween(topLeft + 6, this.horizonY, bottomLeft + 6, this.height);
    this.roadDetails.lineBetween(topRight - 6, this.horizonY, bottomRight - 6, this.height);
    this.roadDetails.lineStyle(3, COLORS.roadLine, 0.9);
    this.roadDetails.lineBetween(topLeft + 13, this.horizonY, bottomLeft + 13, this.height);
    this.roadDetails.lineBetween(topRight - 13, this.horizonY, bottomRight - 13, this.height);

    let y = this.horizonY - (this.scrollOffset % 64);
    while (y < this.height) {
      const progress = Phaser.Math.Clamp(
        (y - this.horizonY) / (this.height - this.horizonY),
        0,
        1
      );
      const dashLength = 8 + progress * 28;
      const gapLength = 12 + progress * 44;
      const endY = Math.min(y + dashLength, this.height);
      const startY = Math.max(y, this.horizonY);

      if (endY > startY) {
        for (let divider = 0; divider < 2; divider++) {
          this.roadDetails.lineStyle(5, 0x202020, 0.5);
          this.roadDetails.lineBetween(
            this.getDividerX(divider, startY),
            startY,
            this.getDividerX(divider, endY),
            endY
          );
          this.roadDetails.lineStyle(2, COLORS.laneDivider, 0.95);
          this.roadDetails.lineBetween(
            this.getDividerX(divider, startY),
            startY,
            this.getDividerX(divider, endY),
            endY
          );
        }
      }
      y += dashLength + gapLength;
    }
  }

  update(speed, dt) {
    this.scrollOffset += speed * dt;

    this.sleepers.tilePositionY += speed * dt;
    this.drawRoadDetails();

    this.grassLeft.tilePositionY += speed * dt * 0.5;
    this.grassRight.tilePositionY += speed * dt * 0.5;
    this.platformLeft.tilePositionY += speed * dt * 0.5;
    this.platformRight.tilePositionY += speed * dt * 0.5;
  }

  handleResize(width, height) {
    this.width = width;
    this.height = height;
    this.roadWidth = width * (GAMEPLAY.laneWidth * 3 + 0.12);
    this.horizonRoadWidth = width * (GAMEPLAY.laneWidth * 3 + 0.10);
    this.horizonY = height * 0.1;
    this.groundTransitionY = height * 0.56;
    this.roadX = width / 2;
    this.roadY = height / 2;

    this.grassLeft.setSize(width / 2 - this.roadWidth / 2, this.groundTransitionY);
    this.grassRight.setPosition(width / 2 + this.roadWidth / 2, 0);
    this.grassRight.setSize(width / 2 - this.roadWidth / 2, this.groundTransitionY);

    this.platformLeft.setSize(width / 2 - this.roadWidth / 2, height - this.groundTransitionY);
    this.platformLeft.setPosition(0, this.groundTransitionY);
    this.platformRight.setPosition(width / 2 + this.roadWidth / 2, this.groundTransitionY);
    this.platformRight.setSize(width / 2 - this.roadWidth / 2, height - this.groundTransitionY);

    this.redrawRoadSurface();
    this.drawRoadDetails();

    this.sleepers.setPosition(this.roadX, this.roadY);
    this.sleepers.setSize(this.roadWidth, height);
  }

  destroy() {
    if (this.grassLeft) this.grassLeft.destroy();
    if (this.grassRight) this.grassRight.destroy();
    if (this.platformLeft) this.platformLeft.destroy();
    if (this.platformRight) this.platformRight.destroy();
    if (this.roadBg) this.roadBg.destroy();
    if (this.roadDetails) this.roadDetails.destroy();
    if (this.sleepers) this.sleepers.destroy();
    if (this.roadMask) this.roadMask.destroy();
  }
}
