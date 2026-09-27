# Minji's Snack Run - Changelog

## v0.3.0 - Classic Arcade Polish

### Movement
- Changed neighboring-tile animation to linear movement.
- Increased movement tween duration slightly beyond the game tick to eliminate the tiny stop between cells.
- Enemy visual movement now uses an animation duration derived from each enemy's speed instead of one universal short tween.
- Preserved buffered turns, responsive board measurement, and instant tunnel wraps.

### Enemy house
- Added explicit WAITING, EXITING, and OUTSIDE enemy house states.
- Added a deterministic exit path for each Joe/Milo starting position.
- Bonked enemies return to their own spawn position, wait briefly, and leave through the correct house route again.
- Per-enemy reset tokens prevent one returning enemy from visually snapping every other actor.

### Enemy behavior
- Added alternating SCATTER / CHASE behavior outside the house.
- Scatter mode sends each enemy toward a different maze corner.
- Chase mode preserves Red Joe's direct chase, Purple Joe's prediction, Cyan Joe's interception, and Milo's chaos behavior.
- Replaced random Joe tie-breaking with deterministic direction priority to reduce intersection jitter.
- Removed enemy-to-enemy tile blocking that could cause house/intersection deadlocks.
- Added enemy tunnel slowdown.
- Added crossing-path collision detection.

### Stage difficulty
- Enemy movement speed increases gradually each stage, capped at 1.36x Stage 1 speed.
- House release delays shrink gradually, capped so releases never become immediate.
- Scatter windows shorten and chase windows lengthen as stages rise.
- Minji Mode decreases from 42 ticks on Stage 1 toward a 22-tick minimum.

### Audio
- Lowered wakka volume from 0.72 to 0.50, approximately 30% quieter.
- Added MUTE / UNMUTE controls on title and gameplay screens.
- Added web keyboard shortcut `M` for mute.
- Mute is session-only and intentionally not saved.

### Game Over / restart
- PLAY AGAIN now hard-resets all gameplay state to a fresh Stage 1 run.
- Background music seeks back to the beginning and returns to 1x playback.
- Wakka, death, and power-up players are stopped/reset on restart.
- Audio event IDs reset so first-run sounds after a restart cannot be swallowed by stale state.

### Workflow
- `START-WEB.bat` retained.
- `START-EXPO-GO.bat` retained.
- Still one Expo project for browser, Android, and iOS testing.

## v0.2.1 - Make It Solid

- Unified board coordinate math across mobile/web.
- Fixed mobile actor drift and out-of-bounds rendering.
- Fixed cross-screen tunnel tweening.
- Added resize/reset snapping and blinking power snacks.

## v0.2.0 - Classic Polish Pass

- Added stage progression, classic-style lives, one 10,000-point bonus life, smooth movement, title screen, star ratings, audio, Minji Mode music speed, pause slowdown, and Windows batch launchers.
