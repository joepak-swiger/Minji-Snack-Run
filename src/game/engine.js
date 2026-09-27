import {
  AUDIO_EVENT,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  DIRECTION,
  DIRECTIONS,
  ENEMY_MODE,
  EXTRA_LIFE_SCORE,
  FOOD_FIRST_SPAWN_TICK,
  FOOD_SPAWN_INTERVAL_TICKS,
  FOOD_TYPES,
  FOOD_VALUES,
  FULL_COURSE_BONUS,
  getStageChaseTicks,
  getStageEnemySpeedMultiplier,
  getStagePowerModeTicks,
  getStageReleaseMultiplier,
  getStageScatterTicks,
  GHOST_EXIT_INDEX,
  HOUSE_STATE,
  LIFE_LOST_TICKS,
  OPPOSITE_DIRECTION,
  PHASE,
  PLAYER_START_INDEX,
  READY_TICKS,
  STARTING_LIVES,
  TILE,
} from './constants';
import { ENEMY_DEFINITIONS } from './enemies';
import { ORIGINAL_LAYOUT } from './layout';

const TUNNEL_ROW = 13;
const DIRECTION_TIE_PRIORITY = [
  DIRECTION.UP,
  DIRECTION.LEFT,
  DIRECTION.DOWN,
  DIRECTION.RIGHT,
];

function cloneSet(source) {
  return new Set(source);
}

function cloneGame(state) {
  return {
    ...state,
    player: { ...state.player },
    enemies: state.enemies.map((enemy) => ({ ...enemy })),
    dots: cloneSet(state.dots),
    powerSnacks: cloneSet(state.powerSnacks),
    clearedTiles: cloneSet(state.clearedTiles),
    collectedFood: cloneSet(state.collectedFood),
    foods: state.foods.map((food) => ({ ...food })),
    audioEvent: { ...state.audioEvent },
  };
}

function scaledReleaseTick(definition, stage, baseTick) {
  const multiplier = getStageReleaseMultiplier(stage);
  return baseTick + Math.max(3, Math.round(definition.releaseTick * multiplier));
}

function makeEnemies(stage, baseTick = 0) {
  return ENEMY_DEFINITIONS.map((definition) => ({
    ...definition,
    index: definition.spawnIndex,
    direction: DIRECTION.NONE,
    released: false,
    releaseAtTick: scaledReleaseTick(definition, stage, baseTick),
    houseState: HOUSE_STATE.WAITING,
    housePathCursor: 0,
    moveProgress: 0,
    resetId: 0,
  }));
}

function makeBoardSets() {
  const dots = new Set();
  const powerSnacks = new Set();

  ORIGINAL_LAYOUT.forEach((tile, index) => {
    if (tile === TILE.DOT) dots.add(index);
    if (tile === TILE.POWER) powerSnacks.add(index);
  });

  return { dots, powerSnacks };
}

function makeStageState({
  stage,
  score,
  lives,
  bonusLifeAwarded,
  audioEventId,
  actorResetId = 0,
  phase,
}) {
  const { dots, powerSnacks } = makeBoardSets();

  return {
    phase,
    phaseTicks: phase === PHASE.READY ? READY_TICKS : 0,
    stage,
    score,
    lives,
    bonusLifeAwarded,
    actorResetId,
    ticks: 0,
    stageLivesLost: 0,
    stageStars: 0,
    enemyMode: ENEMY_MODE.SCATTER,
    player: {
      index: PLAYER_START_INDEX,
      direction: DIRECTION.NONE,
      queuedDirection: DIRECTION.NONE,
    },
    enemies: makeEnemies(stage, 0),
    dots,
    powerSnacks,
    clearedTiles: new Set(),
    foods: [],
    collectedFood: new Set(),
    fullCourseAwarded: false,
    powerModeTicks: 0,
    powerCombo: 0,
    message: phase === PHASE.READY ? 'READY!' : 'Ready for a snack run?',
    messageTicks: phase === PHASE.READY ? READY_TICKS : 0,
    audioEvent: {
      id: audioEventId,
      type: null,
    },
  };
}

export function createInitialGameState() {
  return makeStageState({
    stage: 1,
    score: 0,
    lives: STARTING_LIVES,
    bonusLifeAwarded: false,
    audioEventId: 0,
    actorResetId: 0,
    phase: PHASE.TITLE,
  });
}

export function startNewGame() {
  return makeStageState({
    stage: 1,
    score: 0,
    lives: STARTING_LIVES,
    bonusLifeAwarded: false,
    audioEventId: 0,
    actorResetId: 1,
    phase: PHASE.READY,
  });
}

export function startNextStage(state) {
  if (state.phase !== PHASE.STAGE_CLEAR) return state;

  return makeStageState({
    stage: state.stage + 1,
    score: state.score,
    lives: state.lives,
    bonusLifeAwarded: state.bonusLifeAwarded,
    audioEventId: state.audioEvent.id,
    actorResetId: state.actorResetId + 1,
    phase: PHASE.READY,
  });
}

export function queueDirection(state, direction) {
  if (!DIRECTIONS.includes(direction)) return state;
  if (![PHASE.READY, PHASE.PLAYING].includes(state.phase)) return state;

  const next = cloneGame(state);
  next.player.queuedDirection = direction;
  return next;
}

export function togglePause(state) {
  if (state.phase === PHASE.PLAYING) {
    const next = cloneGame(state);
    next.phase = PHASE.PAUSED;
    next.message = 'PAUSED';
    next.messageTicks = 0;
    return next;
  }

  if (state.phase === PHASE.PAUSED) {
    const next = cloneGame(state);
    next.phase = PHASE.READY;
    next.phaseTicks = 5;
    next.message = 'READY!';
    next.messageTicks = 5;
    return next;
  }

  return state;
}

export function directionFromKey(key) {
  const normalized = String(key || '').toLowerCase();
  if (normalized === 'arrowleft' || normalized === 'a') return DIRECTION.LEFT;
  if (normalized === 'arrowright' || normalized === 'd') return DIRECTION.RIGHT;
  if (normalized === 'arrowup' || normalized === 'w') return DIRECTION.UP;
  if (normalized === 'arrowdown' || normalized === 's') return DIRECTION.DOWN;
  return null;
}

function getRow(index) {
  return Math.floor(index / BOARD_WIDTH);
}

function getColumn(index) {
  return index % BOARD_WIDTH;
}

function toIndex(row, column) {
  const safeRow = Math.max(0, Math.min(BOARD_HEIGHT - 1, row));
  const safeColumn = Math.max(0, Math.min(BOARD_WIDTH - 1, column));
  return safeRow * BOARD_WIDTH + safeColumn;
}

export function getNeighbor(index, direction) {
  const row = getRow(index);
  const column = getColumn(index);

  if (direction === DIRECTION.LEFT) {
    if (column === 0) {
      return row === TUNNEL_ROW ? row * BOARD_WIDTH + (BOARD_WIDTH - 1) : null;
    }
    return index - 1;
  }

  if (direction === DIRECTION.RIGHT) {
    if (column === BOARD_WIDTH - 1) {
      return row === TUNNEL_ROW ? row * BOARD_WIDTH : null;
    }
    return index + 1;
  }

  if (direction === DIRECTION.UP) {
    return row === 0 ? null : index - BOARD_WIDTH;
  }

  if (direction === DIRECTION.DOWN) {
    return row === BOARD_HEIGHT - 1 ? null : index + BOARD_WIDTH;
  }

  return null;
}

function canPlayerEnter(index) {
  if (index === null || index < 0 || index >= ORIGINAL_LAYOUT.length) return false;
  const tile = ORIGINAL_LAYOUT[index];
  return tile !== TILE.WALL && tile !== TILE.LAIR;
}

function canEnemyEnter(fromIndex, nextIndex) {
  if (nextIndex === null || nextIndex < 0 || nextIndex >= ORIGINAL_LAYOUT.length) return false;
  const tile = ORIGINAL_LAYOUT[nextIndex];
  if (tile === TILE.WALL) return false;

  const currentTile = ORIGINAL_LAYOUT[fromIndex];
  if (currentTile !== TILE.LAIR && tile === TILE.LAIR) return false;

  return true;
}

function movePlayer(next) {
  const queuedTarget = getNeighbor(next.player.index, next.player.queuedDirection);
  const currentTarget = getNeighbor(next.player.index, next.player.direction);

  if (canPlayerEnter(queuedTarget)) {
    next.player.direction = next.player.queuedDirection;
    next.player.index = queuedTarget;
    return;
  }

  if (canPlayerEnter(currentTarget)) {
    next.player.index = currentTarget;
  }
}

function emitAudio(next, type) {
  next.audioEvent = {
    id: next.audioEvent.id + 1,
    type,
  };
}

function addScore(next, value) {
  const previousScore = next.score;
  next.score += value;

  if (
    !next.bonusLifeAwarded
    && previousScore < EXTRA_LIFE_SCORE
    && next.score >= EXTRA_LIFE_SCORE
  ) {
    next.bonusLifeAwarded = true;
    next.lives += 1;
    next.message = '1-UP! EXTRA LIFE';
    next.messageTicks = 16;
    return true;
  }

  return false;
}

function setMessage(next, text, ticks = 10) {
  next.message = text;
  next.messageTicks = ticks;
}

function reverseOutsideEnemies(next) {
  next.enemies.forEach((enemy) => {
    if (
      !enemy.released
      || enemy.houseState !== HOUSE_STATE.OUTSIDE
      || enemy.direction === DIRECTION.NONE
    ) {
      return;
    }
    enemy.direction = OPPOSITE_DIRECTION[enemy.direction];
  });
}

function collectAtPlayer(next) {
  const index = next.player.index;

  if (next.dots.has(index)) {
    next.dots.delete(index);
    next.clearedTiles.add(index);
    addScore(next, 10);
    emitAudio(next, AUDIO_EVENT.WAKKA);
  }

  if (next.powerSnacks.has(index)) {
    next.powerSnacks.delete(index);
    next.clearedTiles.add(index);
    addScore(next, 50);
    next.powerModeTicks = getStagePowerModeTicks(next.stage);
    next.powerCombo = 0;
    reverseOutsideEnemies(next);
    setMessage(next, 'MINJI MODE!', 12);
    emitAudio(next, AUDIO_EVENT.POWER);
  }

  const foodIndex = next.foods.findIndex((food) => food.index === index);
  if (foodIndex >= 0) {
    const [food] = next.foods.splice(foodIndex, 1);
    next.collectedFood.add(food.type);
    addScore(next, FOOD_VALUES[food.type]);
    setMessage(next, `SNACK +${FOOD_VALUES[food.type]}!`, 10);

    if (next.collectedFood.size === FOOD_TYPES.length && !next.fullCourseAwarded) {
      next.fullCourseAwarded = true;
      addScore(next, FULL_COURSE_BONUS);
      setMessage(next, `FULL COURSE! +${FULL_COURSE_BONUS}`, 20);
      emitAudio(next, AUDIO_EVENT.POWER);
    }
  }
}

function resetActors(next) {
  next.actorResetId += 1;
  next.player = {
    index: PLAYER_START_INDEX,
    direction: DIRECTION.NONE,
    queuedDirection: DIRECTION.NONE,
  };
  next.enemies = makeEnemies(next.stage, next.ticks);
  next.powerModeTicks = 0;
  next.powerCombo = 0;
  next.enemyMode = ENEMY_MODE.SCATTER;
}

function loseLife(next) {
  next.lives -= 1;
  next.stageLivesLost += 1;
  emitAudio(next, AUDIO_EVENT.DEATH);

  if (next.lives <= 0) {
    next.phase = PHASE.GAME_OVER;
    next.phaseTicks = 0;
    next.player.direction = DIRECTION.NONE;
    next.player.queuedDirection = DIRECTION.NONE;
    setMessage(next, 'GAME OVER', 0);
    return;
  }

  next.phase = PHASE.LIFE_LOST;
  next.phaseTicks = LIFE_LOST_TICKS;
  next.player.direction = DIRECTION.NONE;
  next.player.queuedDirection = DIRECTION.NONE;
  setMessage(next, 'Minji lost a life.', LIFE_LOST_TICKS);
}

function bonkEnemy(next, enemy) {
  next.powerCombo += 1;
  const comboValue = 200 * Math.pow(2, Math.min(next.powerCombo - 1, 3));
  addScore(next, comboValue);
  enemy.index = enemy.spawnIndex;
  enemy.direction = DIRECTION.NONE;
  enemy.released = false;
  enemy.releaseAtTick = next.ticks + Math.max(8, Math.round(18 * getStageReleaseMultiplier(next.stage)));
  enemy.houseState = HOUSE_STATE.WAITING;
  enemy.housePathCursor = 0;
  enemy.moveProgress = 0;
  enemy.resetId += 1;
  setMessage(next, `+${comboValue}`, 8);
}

function resolvePlayerEnemyCollisions(next) {
  const collidingEnemies = next.enemies.filter((enemy) => enemy.index === next.player.index);
  if (collidingEnemies.length === 0) return false;

  if (next.powerModeTicks > 0) {
    collidingEnemies.forEach((enemy) => bonkEnemy(next, enemy));
    return false;
  }

  loseLife(next);
  return true;
}

function wrappedManhattanDistance(a, b) {
  const rowA = getRow(a);
  const rowB = getRow(b);
  const colA = getColumn(a);
  const colB = getColumn(b);
  const vertical = Math.abs(rowA - rowB);
  const horizontalRaw = Math.abs(colA - colB);
  const horizontal = Math.min(horizontalRaw, BOARD_WIDTH - horizontalRaw);
  return vertical + horizontal;
}

function getAvailableEnemyDirections(enemy) {
  let options = DIRECTIONS.filter((direction) => {
    const candidate = getNeighbor(enemy.index, direction);
    return canEnemyEnter(enemy.index, candidate);
  });

  const reverse = OPPOSITE_DIRECTION[enemy.direction];
  const nonReverse = options.filter((direction) => direction !== reverse);
  if (enemy.direction !== DIRECTION.NONE && nonReverse.length > 0) {
    options = nonReverse;
  }

  return options;
}

function projectPlayerPosition(state, steps) {
  let target = state.player.index;
  const direction = state.player.direction !== DIRECTION.NONE
    ? state.player.direction
    : state.player.queuedDirection;

  for (let i = 0; i < steps; i += 1) {
    const nextIndex = getNeighbor(target, direction);
    if (nextIndex === null || !canPlayerEnter(nextIndex)) break;
    target = nextIndex;
  }

  return target;
}

function chooseToward(enemy, targetIndex, options) {
  if (options.length === 0) return DIRECTION.NONE;

  let bestDistance = Infinity;
  let bestDirections = [];

  options.forEach((direction) => {
    const candidate = getNeighbor(enemy.index, direction);
    const distance = wrappedManhattanDistance(candidate, targetIndex);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestDirections = [direction];
    } else if (distance === bestDistance) {
      bestDirections.push(direction);
    }
  });

  return DIRECTION_TIE_PRIORITY.find((direction) => bestDirections.includes(direction))
    || bestDirections[0]
    || DIRECTION.NONE;
}

function chooseAway(enemy, state, options) {
  if (options.length === 0) return DIRECTION.NONE;

  let bestDistance = -1;
  let bestDirections = [];

  options.forEach((direction) => {
    const candidate = getNeighbor(enemy.index, direction);
    const distance = wrappedManhattanDistance(candidate, state.player.index);
    if (distance > bestDistance) {
      bestDistance = distance;
      bestDirections = [direction];
    } else if (distance === bestDistance) {
      bestDirections.push(direction);
    }
  });

  return bestDirections[Math.floor(Math.random() * bestDirections.length)] || DIRECTION.NONE;
}

function chooseInterceptTarget(state) {
  const ahead = projectPlayerPosition(state, 2);
  const redJoe = state.enemies.find((enemy) => enemy.id === 'red-joe');
  if (!redJoe) return ahead;

  const aheadRow = getRow(ahead);
  const aheadColumn = getColumn(ahead);
  const redRow = getRow(redJoe.index);
  const redColumn = getColumn(redJoe.index);

  const targetRow = aheadRow + (aheadRow - redRow);
  const targetColumn = aheadColumn + (aheadColumn - redColumn);
  return toIndex(targetRow, targetColumn);
}

function chooseEnemyDirection(enemy, state) {
  const options = getAvailableEnemyDirections(enemy);
  if (options.length === 0) return DIRECTION.NONE;

  if (state.powerModeTicks > 0) {
    return chooseAway(enemy, state, options);
  }

  if (state.enemyMode === ENEMY_MODE.SCATTER) {
    return chooseToward(enemy, enemy.scatterTargetIndex, options);
  }

  if (enemy.behavior === 'chase') {
    return chooseToward(enemy, state.player.index, options);
  }

  if (enemy.behavior === 'predict') {
    return chooseToward(enemy, projectPlayerPosition(state, 4), options);
  }

  if (enemy.behavior === 'intercept') {
    return chooseToward(enemy, chooseInterceptTarget(state), options);
  }

  if (enemy.behavior === 'chaos') {
    const distance = wrappedManhattanDistance(enemy.index, state.player.index);
    const chaseChance = distance <= 7 ? 0.58 : 0.25;
    if (Math.random() < chaseChance) {
      return chooseToward(enemy, state.player.index, options);
    }
    return options[Math.floor(Math.random() * options.length)];
  }

  return options[Math.floor(Math.random() * options.length)];
}

function directionBetweenAdjacentIndexes(fromIndex, toIndex) {
  return DIRECTIONS.find((direction) => getNeighbor(fromIndex, direction) === toIndex) || DIRECTION.NONE;
}

function moveEnemyThroughHouse(enemy) {
  const target = enemy.houseExitPath[enemy.housePathCursor];
  if (target === undefined) {
    enemy.houseState = HOUSE_STATE.OUTSIDE;
    enemy.direction = DIRECTION.NONE;
    return;
  }

  const direction = directionBetweenAdjacentIndexes(enemy.index, target);
  if (direction === DIRECTION.NONE) {
    enemy.index = target;
  } else {
    enemy.index = target;
    enemy.direction = direction;
  }

  enemy.housePathCursor += 1;
  if (enemy.index === GHOST_EXIT_INDEX || enemy.housePathCursor >= enemy.houseExitPath.length) {
    enemy.houseState = HOUSE_STATE.OUTSIDE;
  }
}

function isEnemyInTunnel(index) {
  const row = getRow(index);
  const column = getColumn(index);
  return row === TUNNEL_ROW && (column <= 5 || column >= BOARD_WIDTH - 6);
}

function enemySpeedPerTick(enemy, state) {
  const stageMultiplier = getStageEnemySpeedMultiplier(state.stage);
  let speed = (1 / enemy.moveEveryTicks) * stageMultiplier;

  if (enemy.houseState === HOUSE_STATE.EXITING) {
    speed = Math.max(speed, 0.52);
  } else {
    if (state.powerModeTicks > 0) speed *= 0.70;
    if (isEnemyInTunnel(enemy.index)) speed *= 0.78;
  }

  return Math.min(0.92, speed);
}

function moveEnemies(next, playerPreviousIndex) {
  for (let i = 0; i < next.enemies.length; i += 1) {
    const enemy = next.enemies[i];

    if (!enemy.released && next.ticks >= enemy.releaseAtTick) {
      enemy.released = true;
      enemy.houseState = HOUSE_STATE.EXITING;
      enemy.moveProgress = Math.max(enemy.moveProgress, 0.25);
    }

    if (!enemy.released) continue;

    enemy.moveProgress += enemySpeedPerTick(enemy, next);
    if (enemy.moveProgress < 1) continue;
    enemy.moveProgress -= 1;

    const enemyPreviousIndex = enemy.index;

    if (enemy.houseState === HOUSE_STATE.EXITING) {
      moveEnemyThroughHouse(enemy);
    } else {
      const direction = chooseEnemyDirection(enemy, next);
      const destination = getNeighbor(enemy.index, direction);

      if (canEnemyEnter(enemy.index, destination)) {
        enemy.index = destination;
        enemy.direction = direction;
      }
    }

    const sameTile = enemy.index === next.player.index;
    const crossedPaths = enemyPreviousIndex === next.player.index
      && enemy.index === playerPreviousIndex;

    if (sameTile || crossedPaths) {
      if (next.powerModeTicks > 0) {
        bonkEnemy(next, enemy);
      } else {
        loseLife(next);
        return;
      }
    }
  }
}

function getEnemyModeAtTick(stage, tick) {
  const scatterTicks = getStageScatterTicks(stage);
  const chaseTicks = getStageChaseTicks(stage);
  const cycle = scatterTicks + chaseTicks;
  const cycleTick = tick % cycle;
  return cycleTick < scatterTicks ? ENEMY_MODE.SCATTER : ENEMY_MODE.CHASE;
}

function updateEnemyMode(next) {
  const mode = getEnemyModeAtTick(next.stage, next.ticks);
  if (mode === next.enemyMode) return;

  next.enemyMode = mode;
  if (next.powerModeTicks <= 0) {
    reverseOutsideEnemies(next);
  }
}

function maybeSpawnFood(next) {
  if (next.ticks < FOOD_FIRST_SPAWN_TICK) return;
  if ((next.ticks - FOOD_FIRST_SPAWN_TICK) % FOOD_SPAWN_INTERVAL_TICKS !== 0) return;

  const activeFoodTypes = new Set(next.foods.map((food) => food.type));
  const remainingFoodTypes = FOOD_TYPES.filter(
    (type) => !next.collectedFood.has(type) && !activeFoodTypes.has(type),
  );
  if (remainingFoodTypes.length === 0) return;

  const occupied = new Set([
    next.player.index,
    ...next.enemies.map((enemy) => enemy.index),
    ...next.foods.map((food) => food.index),
  ]);

  const candidates = Array.from(next.clearedTiles).filter((index) => {
    if (occupied.has(index)) return false;
    const tile = ORIGINAL_LAYOUT[index];
    return tile !== TILE.WALL && tile !== TILE.LAIR;
  });

  if (candidates.length === 0) return;

  const type = remainingFoodTypes[Math.floor(Math.random() * remainingFoodTypes.length)];
  const index = candidates[Math.floor(Math.random() * candidates.length)];
  next.foods.push({ type, index });
}

function updateTimers(next) {
  if (next.powerModeTicks > 0) {
    next.powerModeTicks -= 1;
    if (next.powerModeTicks === 0) {
      next.powerCombo = 0;
      setMessage(next, '', 0);
    }
  }

  if (next.messageTicks > 0) {
    next.messageTicks -= 1;
    if (next.messageTicks === 0 && next.phase === PHASE.PLAYING) {
      next.message = '';
    }
  }
}

function calculateStageStars(next) {
  if (!next.fullCourseAwarded) return 1;
  if (next.stageLivesLost === 0) return 3;
  return 2;
}

function checkStageClear(next) {
  if (next.dots.size === 0 && next.powerSnacks.size === 0) {
    next.phase = PHASE.STAGE_CLEAR;
    next.phaseTicks = 0;
    next.stageStars = calculateStageStars(next);
    next.player.direction = DIRECTION.NONE;
    next.player.queuedDirection = DIRECTION.NONE;
    setMessage(next, 'ROUND CLEARED!', 0);
    return true;
  }
  return false;
}

export function advanceGame(state) {
  if ([PHASE.TITLE, PHASE.PAUSED, PHASE.STAGE_CLEAR, PHASE.GAME_OVER].includes(state.phase)) {
    return state;
  }

  const next = cloneGame(state);

  if (next.phase === PHASE.READY) {
    next.phaseTicks -= 1;
    if (next.phaseTicks <= 0) {
      next.phase = PHASE.PLAYING;
      next.phaseTicks = 0;
      next.message = '';
      next.messageTicks = 0;
    }
    return next;
  }

  if (next.phase === PHASE.LIFE_LOST) {
    next.phaseTicks -= 1;
    if (next.phaseTicks <= 0) {
      resetActors(next);
      next.phase = PHASE.READY;
      next.phaseTicks = READY_TICKS;
      next.message = 'READY!';
      next.messageTicks = READY_TICKS;
    }
    return next;
  }

  if (next.phase !== PHASE.PLAYING) return next;

  next.ticks += 1;
  updateTimers(next);
  updateEnemyMode(next);

  const playerPreviousIndex = next.player.index;
  movePlayer(next);
  collectAtPlayer(next);

  if (resolvePlayerEnemyCollisions(next)) return next;
  if (checkStageClear(next)) return next;

  moveEnemies(next, playerPreviousIndex);
  if (next.phase === PHASE.LIFE_LOST || next.phase === PHASE.GAME_OVER) return next;

  maybeSpawnFood(next);
  return next;
}
