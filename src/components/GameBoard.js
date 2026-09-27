import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';

import { FOOD_SPRITES, SPRITES } from '../game/assets';
import {
  BOARD_WIDTH,
  DIRECTION,
  GAME_TICK_MS,
  getStageEnemySpeedMultiplier,
  HOUSE_STATE,
  MOVE_ANIMATION_MS,
  PHASE,
  POWER_FLASH_TICKS,
  TILE,
} from '../game/constants';
import { ORIGINAL_LAYOUT } from '../game/layout';

const BOARD_BORDER_WIDTH = 2;

function indexToPoint(index, cellSize) {
  return {
    x: (index % BOARD_WIDTH) * cellSize,
    y: Math.floor(index / BOARD_WIDTH) * cellSize,
  };
}

function movementShouldSnap(previousIndex, nextIndex) {
  if (previousIndex === nextIndex) return false;

  const previousRow = Math.floor(previousIndex / BOARD_WIDTH);
  const previousColumn = previousIndex % BOARD_WIDTH;
  const nextRow = Math.floor(nextIndex / BOARD_WIDTH);
  const nextColumn = nextIndex % BOARD_WIDTH;

  const rowDifference = Math.abs(previousRow - nextRow);
  const columnDifference = Math.abs(previousColumn - nextColumn);
  const isAdjacent = rowDifference + columnDifference === 1;
  const isTunnelWrap = previousRow === nextRow && columnDifference === BOARD_WIDTH - 1;

  // Tunnel travel is logical movement, but visually it must teleport from one
  // tunnel mouth to the other instead of tweening across the entire board.
  return isTunnelWrap || !isAdjacent;
}

const Tile = memo(function Tile({
  index,
  cellSize,
  hasDot,
  hasPowerSnack,
  powerSnackVisible,
  food,
}) {
  const tileType = ORIGINAL_LAYOUT[index];
  const isWall = tileType === TILE.WALL;
  const isLair = tileType === TILE.LAIR;
  const row = Math.floor(index / BOARD_WIDTH);
  const column = index % BOARD_WIDTH;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.tile,
        {
          height: cellSize + 0.25,
          left: column * cellSize,
          top: row * cellSize,
          width: cellSize + 0.25,
        },
        isWall && styles.wall,
        isLair && styles.lair,
      ]}
    >
      {!isWall && hasDot ? (
        <Image source={SPRITES.dot} resizeMode="contain" style={styles.dot} />
      ) : null}

      {!isWall && hasPowerSnack ? (
        <View
          style={[
            styles.powerSnackOuter,
            !powerSnackVisible && styles.powerSnackHidden,
          ]}
        >
          <View style={styles.powerSnackInner} />
        </View>
      ) : null}

      {!isWall && food ? (
        <Image source={FOOD_SPRITES[food.type]} resizeMode="contain" style={styles.food} />
      ) : null}
    </View>
  );
});

function AnimatedCharacter({
  index,
  cellSize,
  source,
  snapToken,
  animationDuration = MOVE_ANIMATION_MS,
  player = false,
  powered = false,
  frightened = false,
  frightenedEnding = false,
}) {
  const initialPoint = indexToPoint(index, cellSize);
  const position = useRef(new Animated.ValueXY(initialPoint)).current;
  const previousIndexRef = useRef(index);
  const previousCellSizeRef = useRef(cellSize);
  const previousSnapTokenRef = useRef(snapToken);

  useEffect(() => {
    const destination = indexToPoint(index, cellSize);
    const sizeChanged = Math.abs(previousCellSizeRef.current - cellSize) > 0.001;
    const resetChanged = previousSnapTokenRef.current !== snapToken;
    const snap = sizeChanged || resetChanged || movementShouldSnap(previousIndexRef.current, index);

    position.stopAnimation();

    if (snap) {
      position.setValue(destination);
    } else {
      Animated.timing(position, {
        toValue: destination,
        duration: animationDuration,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    }

    previousIndexRef.current = index;
    previousCellSizeRef.current = cellSize;
    previousSnapTokenRef.current = snapToken;
  }, [animationDuration, cellSize, index, position, snapToken]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.character,
        {
          height: cellSize,
          width: cellSize,
          transform: [
            { translateX: position.x },
            { translateY: position.y },
          ],
        },
      ]}
    >
      {player && powered ? <View style={styles.powerAura} /> : null}
      <View
        style={[
          styles.characterInner,
          frightened && styles.frightenedShell,
          frightenedEnding && styles.frightenedFlash,
        ]}
      >
        <Image source={source} resizeMode="contain" style={styles.sprite} />
      </View>
    </Animated.View>
  );
}


function getEnemyAnimationDuration(enemy, stage, frightened) {
  const stageMultiplier = getStageEnemySpeedMultiplier(stage);
  let speed = (1 / enemy.moveEveryTicks) * stageMultiplier;

  if (enemy.houseState === HOUSE_STATE.EXITING) {
    speed = Math.max(speed, 0.52);
  } else if (frightened) {
    speed *= 0.70;
  }

  const estimatedTicksPerMove = 1 / Math.max(0.1, speed);
  return Math.max(
    MOVE_ANIMATION_MS,
    Math.min(430, Math.round(GAME_TICK_MS * estimatedTicksPerMove + 6)),
  );
}

export default function GameBoard({ game, boardSize, onSwipeDirection }) {
  const fallbackPlayfieldSize = Math.max(1, boardSize - BOARD_BORDER_WIDTH * 2);
  const [playfieldSize, setPlayfieldSize] = useState(fallbackPlayfieldSize);

  useEffect(() => {
    setPlayfieldSize(fallbackPlayfieldSize);
  }, [fallbackPlayfieldSize]);

  const handlePlayfieldLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    const measured = Math.min(width, height);

    if (Number.isFinite(measured) && measured > 0) {
      setPlayfieldSize((previous) => (
        Math.abs(previous - measured) > 0.25 ? measured : previous
      ));
    }
  };

  const cellSize = playfieldSize / BOARD_WIDTH;

  const foodByIndex = useMemo(() => {
    const map = new Map();
    game.foods.forEach((food) => map.set(food.index, food));
    return map;
  }, [game.foods]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 8 || Math.abs(gesture.dy) > 8,
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          Math.abs(gesture.dx) > 8 || Math.abs(gesture.dy) > 8,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderRelease: (_, gesture) => {
          const horizontal = Math.abs(gesture.dx) > Math.abs(gesture.dy);
          if (horizontal && Math.abs(gesture.dx) >= 18) {
            onSwipeDirection(gesture.dx < 0 ? DIRECTION.LEFT : DIRECTION.RIGHT);
          } else if (!horizontal && Math.abs(gesture.dy) >= 18) {
            onSwipeDirection(gesture.dy < 0 ? DIRECTION.UP : DIRECTION.DOWN);
          }
        },
      }),
    [onSwipeDirection],
  );

  const frightened = game.powerModeTicks > 0;
  const frightenedEnding = frightened && game.powerModeTicks <= POWER_FLASH_TICKS;
  const powerSnackVisible = game.phase !== PHASE.PLAYING || Math.floor(game.ticks / 3) % 2 === 0;
  const snapToken = game.actorResetId;

  return (
    <View
      {...panResponder.panHandlers}
      accessibilityLabel="Minji's Snack Run game board. Swipe to steer Minji."
      style={[styles.boardFrame, { width: boardSize, height: boardSize }]}
    >
      <View onLayout={handlePlayfieldLayout} style={styles.playfield}>
        {ORIGINAL_LAYOUT.map((_, index) => (
          <Tile
            key={index}
            index={index}
            cellSize={cellSize}
            hasDot={game.dots.has(index)}
            hasPowerSnack={game.powerSnacks.has(index)}
            powerSnackVisible={powerSnackVisible}
            food={foodByIndex.get(index)}
          />
        ))}

        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {game.enemies.map((enemy) => {
            const enemyFrightened = frightened && enemy.houseState === HOUSE_STATE.OUTSIDE;
            return (
              <AnimatedCharacter
                key={enemy.id}
                index={enemy.index}
                cellSize={cellSize}
                source={SPRITES[enemy.spriteKey]}
                snapToken={`${snapToken}:${enemy.resetId}`}
                animationDuration={getEnemyAnimationDuration(enemy, game.stage, enemyFrightened)}
                frightened={enemyFrightened}
                frightenedEnding={enemyFrightened && frightenedEnding && game.powerModeTicks % 2 === 0}
              />
            );
          })}

          <AnimatedCharacter
            index={game.player.index}
            cellSize={cellSize}
            source={SPRITES.minji}
            snapToken={snapToken}
            player
            powered={frightened}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  boardFrame: {
    alignSelf: 'center',
    backgroundColor: '#02020a',
    borderColor: '#1d45d8',
    borderRadius: 8,
    borderWidth: BOARD_BORDER_WIDTH,
    overflow: 'hidden',
    position: 'relative',
  },
  playfield: {
    backgroundColor: '#02020a',
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  tile: {
    alignItems: 'center',
    backgroundColor: '#05050d',
    justifyContent: 'center',
    position: 'absolute',
  },
  wall: {
    backgroundColor: '#10247c',
    borderColor: '#2450e0',
    borderRadius: 2,
    borderWidth: 0.5,
  },
  lair: {
    backgroundColor: '#0a0a16',
  },
  dot: {
    height: '29%',
    width: '29%',
  },
  powerSnackOuter: {
    alignItems: 'center',
    backgroundColor: '#f4de79',
    borderColor: '#fff8d5',
    borderRadius: 99,
    borderWidth: 1,
    height: '62%',
    justifyContent: 'center',
    opacity: 1,
    width: '62%',
  },
  powerSnackHidden: {
    opacity: 0.18,
  },
  powerSnackInner: {
    backgroundColor: '#ffffff',
    borderRadius: 99,
    height: '24%',
    width: '24%',
  },
  food: {
    height: '92%',
    position: 'absolute',
    width: '92%',
    zIndex: 2,
  },
  character: {
    alignItems: 'center',
    justifyContent: 'center',
    left: 0,
    padding: 1,
    position: 'absolute',
    top: 0,
    zIndex: 8,
  },
  characterInner: {
    alignItems: 'center',
    borderRadius: 999,
    height: '112%',
    justifyContent: 'center',
    width: '112%',
  },
  frightenedShell: {
    backgroundColor: 'rgba(34, 82, 210, 0.78)',
    borderColor: '#b9d6ff',
    borderWidth: 1,
  },
  frightenedFlash: {
    backgroundColor: 'rgba(235, 239, 255, 0.80)',
    borderColor: '#ffffff',
  },
  powerAura: {
    backgroundColor: 'rgba(255, 221, 76, 0.24)',
    borderColor: '#ffe66a',
    borderRadius: 999,
    borderWidth: 1.5,
    height: '132%',
    position: 'absolute',
    shadowColor: '#ffe66a',
    shadowOpacity: 0.95,
    shadowRadius: 8,
    width: '132%',
  },
  sprite: {
    height: '100%',
    width: '100%',
  },
});
