import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import CharacterScene from './scenes/CharacterScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import DailyRewardScene from './scenes/DailyRewardScene.js';
import MissionsScene from './scenes/MissionsScene.js';
import AudioManager from './systems/AudioManager.js';

export const GAME_CONFIG = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  expandParent: true,
  fullscreenTarget: 'game-container',
  resolution: window.devicePixelRatio || 1,
  roundPixels: true,
  antialias: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: 432,
    height: 768,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  fps: {
    target: 60,
  },
  input: {
    activePointers: 2,
    touch: { capture: true },
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
  scene: [BootScene, MenuScene, CharacterScene, DailyRewardScene, MissionsScene, GameScene, GameOverScene],
};

export function getSafeAreaInsets() {
  const container = document.getElementById('game-container');
  if (!container) return { top: 0, right: 0, bottom: 0, left: 0 };

  const styles = window.getComputedStyle(container);
  const readInset = (property) => Number.parseFloat(styles.getPropertyValue(property)) || 0;

  return {
    top: readInset('--safe-area-top'),
    right: readInset('--safe-area-right'),
    bottom: readInset('--safe-area-bottom'),
    left: readInset('--safe-area-left'),
  };
}

export const audioManager = new AudioManager();

export const LANES = {
  LEFT: 0,
  CENTER: 1,
  RIGHT: 2,
};

export const LANE_COUNT = 3;

export const COLORS = {
  road: 0x2a2a3e,
  roadLine: 0xf0f0f0,
  laneDivider: 0xf7df1e,
  player: 0x4ecdc4,
  playerOutline: 0x2a9d8f,
  obstacleLow: 0xe63946,
  obstacleHigh: 0xf4a261,
  obstacleFull: 0x9d0208,
  obstacleOutline: 0xffffff,
  hud: 0xffffff,
  hudShadow: 0x000000,
  gameOverBg: 0x1a1a2e,
  restartBtn: 0x4ecdc4,
  restartBtnHover: 0x2a9d8f,
  grass: 0x1e3a1e,
  grassAlt: 0x1a2e1a,
  coin: 0xffd700,
  coinInner: 0xffc107,
  coinShine: 0xfff8b0,
  coinOutline: 0xb8860b,
  skyTop: 0xff9966,
  skyMid: 0xffb380,
  skyBottom: 0xffd9b3,
  buildingA: 0xd4524b,
  buildingB: 0xe8a04c,
  buildingC: 0xc97064,
  buildingD: 0xb8434a,
  buildingWindow: 0xfff5b0,
  buildingWindowDark: 0x3a2a1a,
  buildingRoof: 0x6b3a2e,
  platform: 0x8b7355,
  platformTop: 0xa0896a,
  platformDark: 0x6b5a45,
  railSteel: 0xc0c0c0,
  railShadow: 0x808080,
  sleeper: 0x5c4033,
  sleeperDark: 0x4a3329,
  treeTrunk: 0x5d3a1a,
  treeLeaves: 0x2d6a2d,
  treeLeavesAlt: 0x3a8a3a,
  streetLightPole: 0x4a4a4a,
  streetLightHead: 0xffd700,
  streetLightGlow: 0xffe88a,
  signBoard: 0x1a1a2e,
  signPost: 0x555555,
  signText: 0xffd700,
  mountain: 0x6b5b7a,
  mountainDark: 0x5a4a6a,
  rickshawBody: 0xd4a017,
  rickshawRoof: 0x1a1a2e,
  rickshawWheel: 0x2a2a2a,
  rickshawWindow: 0x88ccff,
  motorcycleBody: 0x2a2a2a,
  motorcycleSeat: 0x1a1a1a,
  motorcycleWheel: 0x1a1a1a,
  motorcycleRed: 0xe63946,
  carBody: 0xe63946,
  carRoof: 0xc1121f,
  carWindow: 0x88ccff,
  carWheel: 0x2a2a2a,
  carBumper: 0x555555,
  trainEngine: 0x4a2a2a,
  trainBody: 0x8b3a3a,
  trainRoof: 0x5a2a2a,
  trainWindow: 0xfff5b0,
  trainStripe: 0xffd700,
  trainWheel: 0x1a1a1a,
  magnetBody: 0xe63946,
  magnetTop: 0xb0b0b0,
  magnetPole: 0xffffff,
  magnetDark: 0x8a1a1a,
  shieldBody: 0x4ecdc4,
  shieldInner: 0x88e8e0,
  shieldOutline: 0x2a9d8f,
  shieldShine: 0xffffff,
  speedBody: 0xffd700,
  speedInner: 0xfff5b0,
  speedOutline: 0xffa500,
  speedBolt: 0xff8c00,
  powerUpGlow: 0xffffff,
  menuPanel: 0x223040,
  menuPanelBorder: 0x4ecdc4,
  menuPrimary: 0x4ecdc4,
  menuPrimaryHover: 0x2a9d8f,
  menuAccent: 0xffd700,
  menuWarning: 0xff8c00,
  menuBtnBg: 0x2a3548,
  menuBtnHover: 0x3a4a63,
  menuBtnRed: 0xe63946,
  menuBtnRedHover: 0xc1121f,
  menuBtnOrange: 0xf4a261,
  menuBtnOrangeHover: 0xe08e3e,
  menuBtnGold: 0xffd700,
  menuBtnGoldHover: 0xe6b800,
  menuBtnTeal: 0x2a9d8f,
  menuBtnTealHover: 0x1a7d6f,
  menuText: 0xffffff,
  menuTextDark: 0x1a1a2e,
};

export const GAMEPLAY = {
  baseScrollSpeed: 250,
  speedIncreasePerSec: 0.9,
  maxScrollSpeed: 650,
  laneWidth: 0.22,
  playerSize: 40,
  jumpVelocity: -900,
  jumpGravity: 2800,
  jumpDuration: 700,
  slideDuration: 600,
  obstacleMinGap: 520,
  obstacleMaxGap: 900,
  obstacleStartDelay: 3000,
  obstacleSpawnOffset: 180,
  obstacleMinGapMin: 360,
  obstacleMaxGapMin: 680,
  obstacleGapRampTime: 90,
  maxSimultaneousObstacles: 2,
  obstacleRampTime: 60,
  coinMinGap: 600,
  coinMaxGap: 1400,
  coinStartDelay: 1000,
  powerUpMinGap: 5000,
  powerUpMaxGap: 12000,
  powerUpStartDelay: 8000,
  magnetDuration: 8000,
  shieldDuration: 0,
  speedBoostDuration: 5000,
  speedBoostMultiplier: 1.8,
  magnetRange: 200,
};

export function getLaneX(laneIndex, width) {
  const laneWidth = width * GAMEPLAY.laneWidth;
  const centerX = width / 2;
  const spacing = laneWidth;
  return centerX + (laneIndex - 1) * spacing;
}

export const CHARACTERS = [
  {
    id: 'default',
    name: 'Default Runner',
    bodyColor: 0x4ecdc4,
    outlineColor: 0x2a9d8f,
    unlocked: true,
    price: 0,
  },
  {
    id: 'college',
    name: 'College Runner',
    bodyColor: 0xff6b6b,
    outlineColor: 0xc92a2a,
    unlocked: false,
    price: 2000,
  },
  {
    id: 'office',
    name: 'Office Runner',
    bodyColor: 0x5b8def,
    outlineColor: 0x2c5fb3,
    unlocked: false,
    price: 5000,
  },
];

export function isCharacterUnlocked(id) {
  if (id === 'default') return true;
  try {
    return localStorage.getItem('india-rush-unlocked-' + id) === 'true';
  } catch (e) {
    return false;
  }
}

export function unlockCharacter(id) {
  try {
    localStorage.setItem('india-rush-unlocked-' + id, 'true');
  } catch (e) {
    // localStorage may be unavailable
  }
}

export function getSelectedCharacter() {
  try {
    const id = localStorage.getItem('india-rush-character');
    if (!id) return CHARACTERS[0];
    const found = CHARACTERS.find((c) => c.id === id);
    return found || CHARACTERS[0];
  } catch (e) {
    return CHARACTERS[0];
  }
}

export function setSelectedCharacter(id) {
  try {
    localStorage.setItem('india-rush-character', id);
  } catch (e) {
    // localStorage may be unavailable
  }
}

export function getTotalCoins() {
  try {
    const stored = localStorage.getItem('india-rush-total-coins');
    return stored ? parseInt(stored, 10) || 0 : 0;
  } catch (e) {
    return 0;
  }
}

export function saveTotalCoins(amount) {
  try {
    localStorage.setItem('india-rush-total-coins', String(amount));
  } catch (e) {
    // localStorage may be unavailable
  }
}

export function isTutorialCompleted() {
  try {
    return localStorage.getItem('india-rush-tutorial-completed') === 'true';
  } catch (e) {
    return false;
  }
}

export function setTutorialCompleted() {
  try {
    localStorage.setItem('india-rush-tutorial-completed', 'true');
  } catch (e) {
    // localStorage may be unavailable
  }
}

export const DAILY_REWARDS = [
  { day: 1, coins: 100 },
  { day: 2, coins: 150 },
  { day: 3, coins: 200 },
  { day: 4, coins: 250 },
  { day: 5, coins: 300 },
  { day: 6, coins: 400 },
  { day: 7, coins: 500 },
];

function getTodayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function getDailyRewardState() {
  try {
    const raw = localStorage.getItem('india-rush-daily-reward');
    if (!raw) return { lastClaimDate: null, cycleDay: 0, cycleStartDate: null };
    const parsed = JSON.parse(raw);
    return {
      lastClaimDate: parsed.lastClaimDate || null,
      cycleDay: parsed.cycleDay || 0,
      cycleStartDate: parsed.cycleStartDate || null,
    };
  } catch (e) {
    return { lastClaimDate: null, cycleDay: 0, cycleStartDate: null };
  }
}

export function saveDailyRewardState(state) {
  try {
    localStorage.setItem('india-rush-daily-reward', JSON.stringify(state));
  } catch (e) {
    // localStorage may be unavailable
  }
}

export function getDailyRewardInfo() {
  const state = getDailyRewardState();
  const today = getTodayStr();

  if (state.lastClaimDate === today) {
    return {
      canClaim: false,
      currentDay: state.cycleDay,
      nextDay: state.cycleDay >= 7 ? 1 : state.cycleDay + 1,
      state: state,
    };
  }

  let nextDay;
  if (state.cycleDay === 0 || state.cycleDay >= 7) {
    nextDay = 1;
  } else {
    nextDay = state.cycleDay + 1;
  }

  return {
    canClaim: true,
    currentDay: state.cycleDay,
    nextDay: nextDay,
    state: state,
  };
}

export function claimDailyReward() {
  const info = getDailyRewardInfo();
  if (!info.canClaim) return null;

  const reward = DAILY_REWARDS[info.nextDay - 1];
  const today = getTodayStr();

  const newState = {
    lastClaimDate: today,
    cycleDay: info.nextDay,
    cycleStartDate: info.state.cycleStartDate || today,
  };

  saveDailyRewardState(newState);

  const coins = getTotalCoins() + reward.coins;
  saveTotalCoins(coins);

  return reward;
}

export const MISSIONS = [
  { id: 'run_1000', label: 'Run 1000 meters', target: 1000, reward: 200, metric: 'distance' },
  { id: 'collect_100', label: 'Collect 100 coins', target: 100, reward: 250, metric: 'coins' },
  { id: 'play_3', label: 'Play 3 games', target: 3, reward: 300, metric: 'games' },
];

export function getMissionsState() {
  const today = getTodayStr();
  try {
    const raw = localStorage.getItem('india-rush-missions');
    if (!raw) return makeFreshMissionState(today);
    const parsed = JSON.parse(raw);
    if (parsed.date !== today) return makeFreshMissionState(today);
    return ensureMissionStateShape(parsed, today);
  } catch (e) {
    return makeFreshMissionState(today);
  }
}

function makeFreshMissionState(date) {
  const progress = {};
  const claimed = {};
  for (const m of MISSIONS) {
    progress[m.id] = 0;
    claimed[m.id] = false;
  }
  return { date, progress, claimed };
}

function ensureMissionStateShape(parsed, today) {
  const fresh = makeFreshMissionState(today);
  for (const m of MISSIONS) {
    if (typeof parsed.progress?.[m.id] === 'number') fresh.progress[m.id] = parsed.progress[m.id];
    if (typeof parsed.claimed?.[m.id] === 'boolean') fresh.claimed[m.id] = parsed.claimed[m.id];
  }
  return fresh;
}

export function saveMissionsState(state) {
  try {
    localStorage.setItem('india-rush-missions', JSON.stringify(state));
  } catch (e) {
    // localStorage may be unavailable
  }
}

export function recordMissionProgress(metric, amount) {
  const state = getMissionsState();
  for (const m of MISSIONS) {
    if (m.metric === metric && !state.claimed[m.id]) {
      state.progress[m.id] = Math.min(m.target, state.progress[m.id] + amount);
    }
  }
  saveMissionsState(state);
}

export function setMissionProgress(metric, value) {
  const state = getMissionsState();
  for (const m of MISSIONS) {
    if (m.metric === metric && !state.claimed[m.id]) {
      state.progress[m.id] = Math.min(m.target, value);
    }
  }
  saveMissionsState(state);
}

export function claimMission(missionId) {
  const state = getMissionsState();
  const mission = MISSIONS.find((m) => m.id === missionId);
  if (!mission) return null;
  if (state.claimed[missionId]) return null;
  if (state.progress[missionId] < mission.target) return null;

  state.claimed[missionId] = true;
  saveMissionsState(state);

  const coins = getTotalCoins() + mission.reward;
  saveTotalCoins(coins);

  return mission;
}

export function createGame() {
  return new Phaser.Game(GAME_CONFIG);
}
