# Minji's Snack Run v0.3 - Validation Notes

v0.3 was checked as a focused Classic Arcade Polish build before packaging.

## Engine tests

A temporary JavaScript test harness was generated from the actual `constants.js`, enemy definition files, `layout.js`, and `engine.js` source. It executed successfully under Node.js 22.16.0.

Verified:

- fresh runs begin at Stage 1 with score 0 and 3 lives;
- all enemies begin in the WAITING house state;
- Red Joe, Purple Joe, Cyan Joe, and Milo all successfully follow their deterministic house paths and reach OUTSIDE state;
- no enemy ends the house-exit test inside a wall or outside the board;
- Stage 1 -> Stage 2 clear flow repopulates dots and all four power snacks;
- Stage 2 house-release timing is no later than Stage 1;
- enemy speed increases monotonically with stage until its configured cap;
- release delays decrease monotonically with stage until their configured floor;
- Minji Mode duration decreases monotonically with stage until its configured floor;
- bonking one enemy returns only that enemy to its house WAITING state;
- a bonked enemy gets its own reset token without globally snapping all actors;
- randomized 5,000-tick stress testing kept player/enemy indexes inside legal maze tiles;
- repeated Game Over -> fresh-game cycles reset Stage, score, and lives correctly.

Observed difficulty checkpoints:

- Stage 1 enemy speed multiplier: 1.00x
- Stage 5 enemy speed multiplier: 1.22x
- Stage 10+ capped enemy speed multiplier: 1.36x
- Stage 1 Minji Mode: 42 logic ticks
- Stage 10 Minji Mode: 24 logic ticks
- configured Minji Mode floor: 22 logic ticks

## Syntax / project checks

- `node --check` passed for all modified non-JSX JavaScript files, including the game engine and audio hook.
- TypeScript 5.8.3 was used as a JSX parser over `App.js` and all component files with `allowJs`/`jsx preserve`; no parser or JSX syntax errors were reported.
- `package.json` and `app.json` both parse as valid JSON.
- Package and Expo app versions are `0.3.0`.
- `START-WEB.bat` is present.
- `START-EXPO-GO.bat` is present.
- No `node_modules` directory is included in the release ZIP.

## Expo runtime limitation in this environment

`npm install --no-audit --no-fund` was attempted in the sandbox but timed out while contacting the package registry. Because the dependencies could not be installed here, the full Expo runtime was not launched in this environment.

The real-device/browser smoke test should therefore still include:

1. `START-WEB.bat`
2. movement through several turns and both tunnel directions
3. mute/unmute while playing and paused
4. Minji Mode audio speed + frightened enemy behavior
5. losing all lives and using PLAY AGAIN
6. `START-EXPO-GO.bat`
7. the same movement/restart checks on the phone

