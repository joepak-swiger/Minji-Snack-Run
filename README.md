# Minji's Snack Run v0.3

A lightweight Minji-themed maze-chase game rebuilt from the old Mrs. Minji-Woman browser prototype as one Expo project for web, Android, and iOS.

v0.3 is the **Classic Arcade Polish** release. It keeps the game intentionally simple while improving the parts testers actually feel: movement, enemy-house behavior, enemy pacing, difficulty progression, sound control, and restart reliability.

## What changed in v0.3

### Smoother movement
- Reduced the old stop-start feel between neighboring tiles.
- Player movement now uses a linear tween that slightly overlaps the next game tick, eliminating the tiny visual pause between cells.
- Enemy animation duration is matched to each enemy's actual movement cadence so slower enemies glide instead of jumping, waiting, and jumping again.
- Buffered turning, tunnel snapping, mobile board alignment, and responsive sizing from v0.2.1 remain intact.

### Enemy house and behavior polish
- Every enemy now has a deterministic route from its starting spot through the center house and out the door.
- Waiting enemies no longer wander around the house while trying to find the exit.
- Bonked enemies return to their own home spot and later re-enter through the same clean exit route.
- Enemy movement no longer blocks on another enemy's tile, avoiding awkward deadlocks at intersections and around the house.
- Outside enemies alternate between classic-style SCATTER and CHASE periods.
- Existing personalities remain in chase mode: Red Joe chases Minji, Purple Joe predicts ahead, Cyan Joe intercepts, and Milo keeps his chaos behavior.
- Direction tie-breaking is now deterministic for Joe behavior, reducing visible jitter at intersections.
- Enemies slow down in the side tunnels.
- Crossing-path collisions are handled so Minji and an enemy cannot pass through one another between ticks.

### Stage difficulty ramp
Each cleared stage keeps the same basic rules but gradually gets harder:
- enemies become a little faster;
- enemies leave the house a little sooner;
- chase periods become longer;
- scatter periods become shorter;
- Minji Mode gradually becomes shorter.

The ramp is capped so later stages get harder without becoming instant nonsense.

### Audio
- Wakka volume is now 70% of its previous setting, approximately 0.50 instead of 0.72.
- Added a session-only MUTE / UNMUTE button on the title screen and game header.
- Web also supports the `M` key for mute/unmute.
- Normal music remains 1x, Minji Mode remains 2x, and pause remains 0.5x.

### Game Over restart
- PLAY AGAIN now creates a completely fresh Stage 1 run.
- Score, lives, dots, power snacks, food collection, player position, enemy house state, enemy mode, and power state reset cleanly.
- Music restarts from the beginning at normal speed.
- Active sound effects are stopped/reset.
- The internal sound-event counter resets so the first wakka/power/death sound of a new run cannot be accidentally skipped.
- Session high score intentionally remains until the app/page is closed.

## Star ratings

- ★ Clear the stage.
- ★★ Clear the stage + collect the Full Course.
- ★★★ Collect the Full Course and clear the stage without losing a life.

## Run on Windows - easiest way

### Browser
Double-click:

`START-WEB.bat`

The first launch installs dependencies automatically if `node_modules` does not exist, then starts Expo Web.

### Expo Go phone testing
Double-click:

`START-EXPO-GO.bat`

Then scan the QR code with Expo Go.

## Manual commands

```powershell
npm install
npx expo start --go
```

For web:

```powershell
npm run web
```

## Requirements

- Node.js 22.13 or newer.
- npm.
- Expo Go for phone testing.

## Controls

### Web
- Arrow keys or WASD: steer.
- P, Escape, or Space: pause/resume.
- M: mute/unmute.
- Enter: start, continue after a cleared stage, or restart after game over.

### Mobile
- Swipe on the maze or use the D-pad.
- Use Pause and Mute buttons at the top of the game screen.

## Audio

See `CREDITS.md` for OpenGameArt authors, source pages, and licenses.
