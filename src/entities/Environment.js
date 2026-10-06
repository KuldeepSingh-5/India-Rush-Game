import Phaser from 'phaser';
import { COLORS, GAMEPLAY } from '../config.js';

export default class Environment {
  constructor(scene, width, height) {
    this.scene = scene;
    this.width = width;
    this.height = height;

    this.createSky(width, height);
    this.createMountains(width, height);
    this.createClouds(width, height);
    this.createFarBuildings(width, height);
    this.createNearBuildings(width, height);
    this.createTrain(width, height);
    this.createStreetLights(width, height);
    this.createTrees(width, height);
    this.createSigns(width, height);
  }

  createSky(width, height) {
    this.sky = this.scene.add.graphics({ x: 0, y: 0 });
    this.sky.setDepth(-30);
    this.redrawSky(width, height);
  }

  redrawSky(width, height) {
    this.sky.clear();
    this.sky.fillGradientStyle(
      COLORS.skyTop,
      COLORS.skyTop,
      COLORS.skyBottom,
      COLORS.skyBottom,
      1
    );
    this.sky.fillRect(0, 0, width, height * 0.6);
  }

  createMountains(width, height) {
    this.mountains = [];
    const mountainH = height * 0.18;
    const yBase = height * 0.5;
    const count = Math.ceil(width / 180) + 2;

    for (let i = 0; i < count; i++) {
      const m = this.scene.add.image(
        i * 180 - 90,
        yBase,
        'mountain'
      );
      m.setOrigin(0, 1);
      m.setDepth(-25);
      m.setAlpha(0.6);
      m.displayHeight = mountainH;
      m.displayWidth = 180;
      this.mountains.push(m);
    }
    this.mountainCount = count;
    this.mountainSpacing = 180;
  }

  createClouds(width, height) {
    this.clouds = [];
    const cloudCount = 5;
    for (let i = 0; i < cloudCount; i++) {
      const c = this.scene.add.image(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(20, height * 0.25),
        'cloud'
      );
      c.setDepth(-28);
      c.setAlpha(0.5);
      c.setScale(Phaser.Math.FloatBetween(0.6, 1.2));
      this.clouds.push({ sprite: c, speed: Phaser.Math.FloatBetween(8, 18) });
    }
  }

  createFarBuildings(width, height) {
    this.farBuildings = [];
    const yBase = height * 0.5;
    let x = -20;
    while (x < width + 80) {
      const idx = Phaser.Math.Between(0, 3);
      const tex = 'building-' + idx;
      const b = this.scene.add.image(x, yBase, tex);
      b.setOrigin(0, 1);
      b.setDepth(-20);
      b.setAlpha(0.55);
      const scale = Phaser.Math.FloatBetween(0.5, 0.8);
      b.setScale(scale);
      this.farBuildings.push(b);
      x += b.displayWidth + Phaser.Math.Between(4, 16);
    }
    this.farBuildingBaseY = yBase;
  }

  createNearBuildings(width, height) {
    this.nearBuildings = [];
    const yBase = height * 0.52;
    let x = -40;
    while (x < width + 100) {
      const idx = Phaser.Math.Between(0, 3);
      const tex = 'building-' + idx;
      const b = this.scene.add.image(x, yBase, tex);
      b.setOrigin(0, 1);
      b.setDepth(-15);
      b.setAlpha(0.8);
      const scale = Phaser.Math.FloatBetween(0.7, 1.1);
      b.setScale(scale);
      this.nearBuildings.push(b);
      x += b.displayWidth + Phaser.Math.Between(8, 24);
    }
    this.nearBuildingBaseY = yBase;
  }

  createTrain(width, height) {
    this.trainParts = [];
    const yBase = height * 0.54;
    const trainY = yBase;

    const engine = this.scene.add.image(
      width + 100,
      trainY,
      'train-engine'
    );
    engine.setOrigin(0, 1);
    engine.setDepth(-12);
    engine.setAlpha(0.75);
    this.trainParts.push({ sprite: engine, w: 160 });

    for (let i = 0; i < 3; i++) {
      const car = this.scene.add.image(
        width + 100 + 160 + i * 145,
        trainY + 5,
        'train-car'
      );
      car.setOrigin(0, 1);
      car.setDepth(-12);
      car.setAlpha(0.75);
      this.trainParts.push({ sprite: car, w: 140 });
    }

    this.trainYBase = trainY;
    this.trainSpeed = 60;
  }

  createStreetLights(width, height) {
    this.streetLights = [];
    const yBase = height * 0.56;
    const spacing = 220;
    const count = Math.ceil(width / spacing) + 2;

    for (let i = 0; i < count; i++) {
      const sl = this.scene.add.image(
        i * spacing - 20,
        yBase,
        'street-light'
      );
      sl.setOrigin(0.5, 1);
      sl.setDepth(-10);
      this.streetLights.push(sl);
    }
    this.lightSpacing = spacing;
    this.lightCount = count;
    this.lightBaseY = yBase;
  }

  createTrees(width, height) {
    this.trees = [];
    const yBase = height * 0.58;
    const positions = [];
    let x = 30;
    while (x < width + 60) {
      positions.push(x);
      x += Phaser.Math.Between(80, 160);
    }

    for (const px of positions) {
      const t = this.scene.add.image(px, yBase, 'tree');
      t.setOrigin(0.5, 1);
      t.setDepth(-8);
      t.setScale(Phaser.Math.FloatBetween(0.55, 0.85));
      this.trees.push(t);
    }
    this.treeBaseY = yBase;
  }

  createSigns(width, height) {
    this.signs = [];
    const yBase = height * 0.56;
    const spacing = 320;
    const count = Math.ceil(width / spacing) + 2;

    for (let i = 0; i < count; i++) {
      const s = this.scene.add.image(
        i * spacing + 100,
        yBase,
        'rail-sign'
      );
      s.setOrigin(0.5, 1);
      s.setDepth(-9);
      this.signs.push(s);
    }
    this.signSpacing = spacing;
    this.signCount = count;
    this.signBaseY = yBase;
  }

  update(speed, dt) {
    const farSpeed = speed * dt * 0.1;
    const nearSpeed = speed * dt * 0.2;
    const lightSpeed = speed * dt * 0.35;
    const treeSpeed = speed * dt * 0.4;
    const signSpeed = speed * dt * 0.4;
    const mountainSpeed = speed * dt * 0.04;
    const trainSpeed = this.trainSpeed * dt;

    for (const m of this.mountains) {
      m.x -= mountainSpeed;
      if (m.x + m.displayWidth < -10) {
        const rightmost = this.getRightmostX(this.mountains);
        m.x = rightmost + this.mountainSpacing;
      }
    }

    for (const c of this.clouds) {
      c.sprite.x -= c.speed * dt;
      if (c.sprite.x < -60) {
        c.sprite.x = this.width + 60;
        c.sprite.y = Phaser.Math.Between(20, this.height * 0.25);
      }
    }

    for (const b of this.farBuildings) {
      b.x -= farSpeed;
      if (b.x + b.displayWidth < -20) {
        const rightmost = this.getRightmostX(this.farBuildings);
        b.x = rightmost + Phaser.Math.Between(4, 16);
      }
    }

    for (const b of this.nearBuildings) {
      b.x -= nearSpeed;
      if (b.x + b.displayWidth < -40) {
        const rightmost = this.getRightmostX(this.nearBuildings);
        b.x = rightmost + Phaser.Math.Between(8, 24);
      }
    }

    for (const part of this.trainParts) {
      part.sprite.x -= trainSpeed;
      if (part.sprite.x + part.w < -20) {
        const rightmost = this.getRightmostX(this.trainParts, 'sprite');
        part.sprite.x = rightmost + 10;
      }
    }

    for (const sl of this.streetLights) {
      sl.x -= lightSpeed;
      if (sl.x < -20) {
        const rightmost = this.getRightmostX(this.streetLights);
        sl.x = rightmost + this.lightSpacing;
      }
    }

    for (const t of this.trees) {
      t.x -= treeSpeed;
      if (t.x < -40) {
        const rightmost = this.getRightmostX(this.trees);
        t.x = rightmost + Phaser.Math.Between(80, 160);
      }
    }

    for (const s of this.signs) {
      s.x -= signSpeed;
      if (s.x < -30) {
        const rightmost = this.getRightmostX(this.signs);
        s.x = rightmost + this.signSpacing;
      }
    }
  }

  getRightmostX(arr, prop) {
    let max = -Infinity;
    for (const item of arr) {
      const x = prop ? item[prop].x : item.x;
      if (x > max) max = x;
    }
    return max === -Infinity ? 0 : max;
  }

  handleResize(width, height) {
    this.width = width;
    this.height = height;

    this.redrawSky(width, height);

    const mountainH = height * 0.18;
    const yBase = height * 0.5;
    for (const m of this.mountains) {
      m.y = yBase;
      m.displayHeight = mountainH;
    }

    for (const c of this.clouds) {
      if (c.sprite.y > height * 0.3) {
        c.sprite.y = Phaser.Math.Between(20, height * 0.25);
      }
    }

    for (const b of this.farBuildings) {
      b.y = height * 0.5;
    }
    for (const b of this.nearBuildings) {
      b.y = height * 0.52;
    }
    for (const sl of this.streetLights) {
      sl.y = height * 0.56;
    }
    for (const part of this.trainParts) {
      part.sprite.y = height * 0.54 + (part.sprite.texture.key === 'train-car' ? 5 : 0);
    }
    for (const t of this.trees) {
      t.y = height * 0.58;
    }
    for (const s of this.signs) {
      s.y = height * 0.56;
    }
  }

  destroy() {
    this.sky.destroy();
    for (const m of this.mountains) m.destroy();
    for (const c of this.clouds) c.sprite.destroy();
    for (const b of this.farBuildings) b.destroy();
    for (const b of this.nearBuildings) b.destroy();
    for (const sl of this.streetLights) sl.destroy();
    for (const t of this.trees) t.destroy();
    for (const s of this.signs) s.destroy();
    for (const part of this.trainParts) part.sprite.destroy();
  }
}
