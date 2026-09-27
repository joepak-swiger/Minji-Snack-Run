export const BOARD_WIDTH = 28;
export const BOARD_HEIGHT = 28;
export const TOTAL_CELLS = BOARD_WIDTH * BOARD_HEIGHT;

export const TILE = Object.freeze({
  DOT: 0,
  WALL: 1,
  LAIR: 2,
  POWER: 3,
  EMPTY: 4,
});

export const DIRECTION = Object.freeze({
  NONE: 'none',
  LEFT: 'left',
  RIGHT: 'right',
  UP: 'up',
  DOWN: 'down',
});

export const DIRECTIONS = [
  DIRECTION.LEFT,
  DIRECTION.RIGHT,
  DIRECTION.UP,
  DIRECTION.DOWN,
];

export const OPPOSITE_DIRECTION = Object.freeze({
  [DIRECTION.LEFT]: DIRECTION.RIGHT,
  [DIRECTION.RIGHT]: DIRECTION.LEFT,
  [DIRECTION.UP]: DIRECTION.DOWN,
  [DIRECTION.DOWN]: DIRECTION.UP,
  [DIRECTION.NONE]: DIRECTION.NONE,
});

export const PHASE = Object.freeze({
  TITLE: 'title',
  READY: 'ready',
  PLAYING: 'playing',
  PAUSED: 'paused',
  LIFE_LOST: 'life-lost',
  STAGE_CLEAR: 'stage-clear',
  GAME_OVER: 'game-over',
});

export const ENEMY_MODE = Object.freeze({
  SCATTER: 'scatter',
  CHASE: 'chase',
});

export const HOUSE_STATE = Object.freeze({
  WAITING: 'waiting',
  EXITING: 'exiting',
  OUTSIDE: 'outside',
});

export const AUDIO_EVENT = Object.freeze({
  WAKKA: 'wakka',
  POWER: 'power',
  DEATH: 'death',
});

export const PLAYER_START_INDEX = 490;
export const GHOST_EXIT_INDEX = 294;

// Classic-style life setup: three starting lives and one bonus life at 10,000 points.
export const STARTING_LIVES = 3;
export const EXTRA_LIFE_SCORE = 10000;

// v0.3 movement polish: the visual tween deliberately overlaps the next logic
// tick by a few milliseconds so there is no tiny stop between neighboring tiles.
export const GAME_TICK_MS = 132;
export const MOVE_ANIMATION_MS = 138;

export const BASE_POWER_MODE_TICKS = 42;
export const MIN_POWER_MODE_TICKS = 22;
export const POWER_FLASH_TICKS = 8;
export const READY_TICKS = 10;
export const LIFE_LOST_TICKS = 8;

export const FOOD_FIRST_SPAWN_TICK = 75;
export const FOOD_SPAWN_INTERVAL_TICKS = 48;
export const FULL_COURSE_BONUS = 3000;

export const FOOD_TYPES = [1, 2, 3, 4, 5, 6];
export const FOOD_VALUES = Object.freeze({
  1: 100,
  2: 200,
  3: 300,
  4: 400,
  5: 500,
  6: 600,
});

export function getStageEnemySpeedMultiplier(stage) {
  const stageOffset = Math.max(0, Number(stage || 1) - 1);
  return Math.min(1.36, 1 + stageOffset * 0.055);
}

export function getStageReleaseMultiplier(stage) {
  const stageOffset = Math.max(0, Number(stage || 1) - 1);
  return Math.max(0.55, 1 - stageOffset * 0.07);
}

export function getStagePowerModeTicks(stage) {
  const stageOffset = Math.max(0, Number(stage || 1) - 1);
  return Math.max(MIN_POWER_MODE_TICKS, BASE_POWER_MODE_TICKS - stageOffset * 2);
}

export function getStageScatterTicks(stage) {
  const stageOffset = Math.max(0, Number(stage || 1) - 1);
  return Math.max(24, 44 - stageOffset * 2);
}

export function getStageChaseTicks(stage) {
  const stageOffset = Math.max(0, Number(stage || 1) - 1);
  return Math.min(170, 118 + stageOffset * 5);
}
