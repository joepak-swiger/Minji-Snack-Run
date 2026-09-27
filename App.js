import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import useGameAudio from './src/audio/useGameAudio';
import DPad from './src/components/DPad';
import GameBoard from './src/components/GameBoard';
import Hud from './src/components/Hud';
import SnackTray from './src/components/SnackTray';
import { SPRITES } from './src/game/assets';
import { GAME_TICK_MS, PHASE } from './src/game/constants';
import {
  advanceGame,
  createInitialGameState,
  directionFromKey,
  queueDirection,
  startNewGame,
  startNextStage,
  togglePause,
} from './src/game/engine';

function PrimaryButton({ label, onPress, compact = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        compact && styles.compactButton,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.primaryButtonText, compact && styles.compactButtonText]}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress, compact = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondaryButton,
        compact && styles.compactButton,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.secondaryButtonText, compact && styles.compactButtonText]}>{label}</Text>
    </Pressable>
  );
}

function StarRow({ stars }) {
  return (
    <Text accessibilityLabel={`${stars} star rating`} style={styles.starRow}>
      {[1, 2, 3].map((star) => (star <= stars ? '★' : '☆')).join(' ')}
    </Text>
  );
}

function TitleScreen({ muted, onStart, onToggleMute }) {
  return (
    <View style={styles.titleScreen}>
      <View style={styles.titleSpriteRow}>
        <Image source={SPRITES.joeCyan} resizeMode="contain" style={styles.titleEnemy} />
        <Image source={SPRITES.joePurple} resizeMode="contain" style={styles.titleEnemy} />
        <Image source={SPRITES.minji} resizeMode="contain" style={styles.titleMinji} />
        <Image source={SPRITES.joeRed} resizeMode="contain" style={styles.titleEnemy} />
        <Image source={SPRITES.milo} resizeMode="contain" style={styles.titleEnemy} />
      </View>

      <Text style={styles.titleVersion}>PAKKANG ARCADE • v0.3</Text>
      <Text style={styles.titleLogo}>MINJI'S{`\n`}SNACK RUN</Text>

      <Text style={styles.storyText}>
        Joe and Milo scattered Minji's snacks through the maze. Clear every dot, grab the bonus food,
        and do not get caught.
      </Text>

      <View style={styles.titleButtonRow}>
        <PrimaryButton label="START GAME" onPress={onStart} />
        <SecondaryButton label={muted ? 'UNMUTE' : 'MUTE'} onPress={onToggleMute} />
      </View>

      <View style={styles.titleInfoCard}>
        <Text style={styles.titleInfoHeading}>HOW TO PLAY</Text>
        <Text style={styles.titleInfoText}>Clear every dot to advance to the next stage.</Text>
        <Text style={styles.titleInfoText}>Power snacks let Minji turn the tables for a few seconds.</Text>
        <Text style={styles.titleInfoText}>3 starting lives • one bonus life at 10,000 points.</Text>
        <Text style={styles.titleInfoText}>
          {Platform.OS === 'web' ? 'Move: Arrow Keys / WASD • Pause: P / Esc / Space • Mute: M' : 'Move: Swipe or D-pad'}
        </Text>
      </View>

      <View style={styles.titleInfoCard}>
        <Text style={styles.titleInfoHeading}>ROUND RATING</Text>
        <Text style={styles.titleInfoText}>★ Clear the stage</Text>
        <Text style={styles.titleInfoText}>★★ Clear + Full Course</Text>
        <Text style={styles.titleInfoText}>★★★ Full Course without losing a life</Text>
      </View>
    </View>
  );
}

function GameOverlay({
  game,
  onResume,
  onRestart,
  onNextStage,
  onTitle,
}) {
  if (game.phase === PHASE.PLAYING) return null;

  let title = '';
  let subtitle = '';
  let action = null;
  let stars = null;

  if (game.phase === PHASE.READY) {
    title = 'READY!';
    subtitle = `STAGE ${game.stage}`;
  } else if (game.phase === PHASE.LIFE_LOST) {
    title = 'OUCH!';
    subtitle = `${game.lives} ${game.lives === 1 ? 'life' : 'lives'} left`;
  } else if (game.phase === PHASE.PAUSED) {
    title = 'PAUSED';
    subtitle = 'Even the music is taking it sloooow.';
    action = (
      <View style={styles.overlayActions}>
        <PrimaryButton label="RESUME" onPress={onResume} />
        <SecondaryButton label="RESTART GAME" onPress={onRestart} />
        <SecondaryButton label="TITLE SCREEN" onPress={onTitle} />
      </View>
    );
  } else if (game.phase === PHASE.STAGE_CLEAR) {
    title = `STAGE ${game.stage} CLEAR!`;
    if (game.stageStars === 3) {
      subtitle = 'Perfect Full Course!';
    } else if (game.stageStars === 2) {
      subtitle = 'Full Course complete!';
    } else {
      subtitle = 'Maze cleared!';
    }
    stars = <StarRow stars={game.stageStars} />;
    action = (
      <View style={styles.overlayActions}>
        <PrimaryButton label={`NEXT: STAGE ${game.stage + 1}`} onPress={onNextStage} />
        <SecondaryButton label="TITLE SCREEN" onPress={onTitle} />
      </View>
    );
  } else if (game.phase === PHASE.GAME_OVER) {
    title = 'GAME OVER';
    subtitle = `Final score: ${game.score.toLocaleString()}`;
    action = (
      <View style={styles.overlayActions}>
        <PrimaryButton label="PLAY AGAIN" onPress={onRestart} />
        <SecondaryButton label="TITLE SCREEN" onPress={onTitle} />
      </View>
    );
  }

  return (
    <View
      style={styles.overlay}
      pointerEvents={game.phase === PHASE.READY || game.phase === PHASE.LIFE_LOST ? 'none' : 'auto'}
    >
      <View style={styles.overlayCard}>
        <Image source={SPRITES.minji} resizeMode="contain" style={styles.overlayMinji} />
        <Text style={styles.overlayTitle}>{title}</Text>
        {stars}
        <Text style={styles.overlaySubtitle}>{subtitle}</Text>
        {action}
      </View>
    </View>
  );
}

export default function App() {
  const { width: windowWidth } = useWindowDimensions();
  const [game, setGame] = useState(() => createInitialGameState());
  const [highScore, setHighScore] = useState(0);
  const { muted, restartMusic, stopMusic, toggleMute } = useGameAudio(game);

  // Keep the entire playfield inside the actual viewport on narrow phones.
  // GameBoard then measures its inner playfield so every tile and character
  // shares one coordinate system.
  const availableWidth = Math.max(1, windowWidth - 24);
  const boardSize = Math.floor(Math.min(availableWidth, 620));
  const contentWidth = Math.floor(Math.min(availableWidth, 680));

  useEffect(() => {
    if (game.score > highScore) {
      setHighScore(game.score);
    }
  }, [game.score, highScore]);

  useEffect(() => {
    const interval = setInterval(() => {
      setGame((previous) => advanceGame(previous));
    }, GAME_TICK_MS);

    return () => clearInterval(interval);
  }, []);

  const handleDirection = useCallback((direction) => {
    setGame((previous) => queueDirection(previous, direction));
  }, []);

  const handleStart = useCallback(() => {
    restartMusic();
    setGame(startNewGame());
  }, [restartMusic]);

  const handleRestart = useCallback(() => {
    restartMusic();
    setGame(startNewGame());
  }, [restartMusic]);

  const handleNextStage = useCallback(() => {
    setGame((previous) => startNextStage(previous));
  }, []);

  const handlePause = useCallback(() => {
    setGame((previous) => togglePause(previous));
  }, []);

  const handleTitle = useCallback(() => {
    stopMusic();
    setGame(createInitialGameState());
  }, [stopMusic]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;

    const onKeyDown = (event) => {
      const direction = directionFromKey(event.key);
      if (direction) {
        event.preventDefault();
        handleDirection(direction);
        return;
      }

      const key = String(event.key || '').toLowerCase();
      if (key === 'm') {
        event.preventDefault();
        toggleMute();
        return;
      }

      if (key === 'p' || key === 'escape' || key === ' ') {
        if ([PHASE.PLAYING, PHASE.PAUSED].includes(game.phase)) {
          event.preventDefault();
          handlePause();
        }
        return;
      }

      if (key === 'enter') {
        if (game.phase === PHASE.TITLE) {
          event.preventDefault();
          handleStart();
        } else if (game.phase === PHASE.STAGE_CLEAR) {
          event.preventDefault();
          handleNextStage();
        } else if (game.phase === PHASE.GAME_OVER) {
          event.preventDefault();
          handleRestart();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [game.phase, handleDirection, handleNextStage, handlePause, handleRestart, handleStart, toggleMute]);

  const statusText = useMemo(() => {
    if (game.message) return game.message;
    if (game.powerModeTicks > 0) return 'MINJI MODE';
    return `${game.dots.size + game.powerSnacks.size} dots left`;
  }, [game.dots.size, game.message, game.powerModeTicks, game.powerSnacks.size]);

  if (game.phase === PHASE.TITLE) {
    return (
      <View style={styles.app}>
        <StatusBar style="light" />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.content, { width: contentWidth }]}> 
            <TitleScreen muted={muted} onStart={handleStart} onToggleMute={toggleMute} />
          </View>
        </ScrollView>
      </View>
    );
  }

  const gameIsPausable = [PHASE.PLAYING, PHASE.PAUSED].includes(game.phase);

  return (
    <View style={styles.app}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, { width: contentWidth }]}> 
          <View style={styles.gameHeader}>
            <View style={styles.gameBrandRow}>
              <Image source={SPRITES.minji} resizeMode="contain" style={styles.gameBrandSprite} />
              <View style={styles.gameBrandTextWrap}>
                <Text style={styles.gameEyebrow}>MINJI'S SNACK RUN • v0.3</Text>
                <Text style={styles.gameTitle}>STAGE {game.stage}</Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <SecondaryButton
                compact
                label={muted ? 'UNMUTE' : 'MUTE'}
                onPress={toggleMute}
              />
              {gameIsPausable ? (
                <PrimaryButton
                  compact
                  label={game.phase === PHASE.PAUSED ? 'RESUME' : 'PAUSE'}
                  onPress={handlePause}
                />
              ) : null}
            </View>
          </View>

          <Hud
            score={game.score}
            highScore={Math.max(highScore, game.score)}
            lives={game.lives}
            stage={game.stage}
          />

          <View style={styles.statusRow}>
            <Text style={[styles.statusText, game.powerModeTicks > 0 && styles.powerStatusText]}>
              {statusText}
            </Text>
            <Text style={styles.controlHint}>
              {Platform.OS === 'web' ? 'Arrows / WASD' : 'Swipe or D-pad'}
            </Text>
          </View>

          <View style={[styles.boardShell, { width: boardSize, height: boardSize }]}> 
            <GameBoard game={game} boardSize={boardSize} onSwipeDirection={handleDirection} />
            <GameOverlay
              game={game}
              onResume={handlePause}
              onRestart={handleRestart}
              onNextStage={handleNextStage}
              onTitle={handleTitle}
            />
          </View>

          <SnackTray collectedFood={game.collectedFood} />

          <Text style={styles.starHint}>
            ★ Clear  •  ★★ Full Course  •  ★★★ Full Course + no life lost
          </Text>

          {Platform.OS !== 'web' ? <DPad onDirection={handleDirection} /> : null}

          <View style={styles.footerRow}>
            <SecondaryButton compact label="RESTART GAME" onPress={handleRestart} />
            <SecondaryButton compact label="TITLE" onPress={handleTitle} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    backgroundColor: '#000000',
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 28,
    paddingTop: Platform.OS === 'web' ? 18 : 12,
  },
  content: {
    alignSelf: 'center',
    maxWidth: 680,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#f4de79',
    borderColor: '#fff4b0',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#0b0b18',
    borderColor: '#2445bd',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  compactButton: {
    minHeight: 36,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  primaryButtonText: {
    color: '#15100a',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  compactButtonText: {
    fontSize: 11,
  },
  buttonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  titleScreen: {
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 16,
  },
  titleSpriteRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  titleEnemy: {
    height: 48,
    marginHorizontal: 3,
    width: 48,
  },
  titleMinji: {
    height: 78,
    marginHorizontal: 7,
    width: 78,
  },
  titleVersion: {
    color: '#8292db',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 7,
  },
  titleLogo: {
    color: '#f4de79',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 1.5,
    lineHeight: 35,
    marginBottom: 14,
    textAlign: 'center',
  },
  storyText: {
    color: '#d2d7f3',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18,
    maxWidth: 520,
    textAlign: 'center',
  },
  titleButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  titleInfoCard: {
    backgroundColor: '#080814',
    borderColor: '#1c318f',
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
    maxWidth: 520,
    padding: 13,
    width: '100%',
  },
  titleInfoHeading: {
    color: '#f4de79',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  titleInfoText: {
    color: '#b9c1e6',
    fontSize: 12,
    lineHeight: 18,
    marginVertical: 1,
  },
  gameHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    marginLeft: 'auto',
  },
  gameBrandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    minWidth: 0,
  },
  gameBrandSprite: {
    height: 40,
    marginRight: 9,
    width: 40,
  },
  gameBrandTextWrap: {
    minWidth: 0,
  },
  gameEyebrow: {
    color: '#8292db',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  gameTitle: {
    color: '#f4de79',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 1,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
    minHeight: 18,
  },
  statusText: {
    color: '#bfc8ef',
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '800',
  },
  powerStatusText: {
    color: '#f4de79',
  },
  controlHint: {
    color: '#6673af',
    fontSize: 10,
    marginLeft: 8,
  },
  boardShell: {
    alignSelf: 'center',
    position: 'relative',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    padding: 14,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 20,
  },
  overlayCard: {
    alignItems: 'center',
    backgroundColor: '#080814',
    borderColor: '#2445bd',
    borderRadius: 13,
    borderWidth: 2,
    maxWidth: 330,
    paddingHorizontal: 18,
    paddingVertical: 16,
    width: '90%',
  },
  overlayMinji: {
    height: 58,
    marginBottom: 7,
    width: 58,
  },
  overlayTitle: {
    color: '#f4de79',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  overlaySubtitle: {
    color: '#c5ccec',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  overlayActions: {
    gap: 8,
    width: '100%',
  },
  starRow: {
    color: '#f4de79',
    fontSize: 28,
    letterSpacing: 3,
    marginTop: 7,
    textAlign: 'center',
  },
  starHint: {
    color: '#737eae',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 14,
  },
});
