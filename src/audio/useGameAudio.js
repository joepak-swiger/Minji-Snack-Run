import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

import { AUDIO_EVENT, PHASE } from '../game/constants';

const BACKGROUND_MUSIC = require('../../assets/audio/background-music.mp3');
const WAKKA_SOUND = require('../../assets/audio/wakka.wav');
const DEATH_SOUND = require('../../assets/audio/death.wav');
const POWER_SOUND = require('../../assets/audio/power-up.wav');

const VOLUME = Object.freeze({
  MUSIC: 0.58,
  WAKKA: 0.50,
  DEATH: 0.90,
  POWER: 0.90,
});

function replay(player) {
  if (!player) return;
  Promise.resolve(player.seekTo(0))
    .then(() => player.play())
    .catch(() => {});
}

function resetEffect(player) {
  if (!player) return;
  try {
    player.pause();
  } catch (_error) {
    // Optional audio polish should never interrupt gameplay.
  }
  Promise.resolve(player.seekTo(0)).catch(() => {});
}

function setMusicRate(player, rate) {
  if (!player) return;
  try {
    player.shouldCorrectPitch = false;
    player.setPlaybackRate(rate);
  } catch (_error) {
    // Audio is optional polish. A platform audio quirk should never stop gameplay.
  }
}

export default function useGameAudio(game) {
  const musicPlayer = useAudioPlayer(BACKGROUND_MUSIC, { downloadFirst: true });
  const wakkaPlayer = useAudioPlayer(WAKKA_SOUND, { downloadFirst: true });
  const deathPlayer = useAudioPlayer(DEATH_SOUND, { downloadFirst: true });
  const powerPlayer = useAudioPlayer(POWER_SOUND, { downloadFirst: true });
  const [muted, setMuted] = useState(false);
  const musicStartedRef = useRef(false);
  const lastAudioEventIdRef = useRef(0);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const volumeMultiplier = muted ? 0 : 1;
    musicPlayer.loop = true;
    musicPlayer.volume = VOLUME.MUSIC * volumeMultiplier;
    musicPlayer.shouldCorrectPitch = false;
    wakkaPlayer.volume = VOLUME.WAKKA * volumeMultiplier;
    deathPlayer.volume = VOLUME.DEATH * volumeMultiplier;
    powerPlayer.volume = VOLUME.POWER * volumeMultiplier;
  }, [deathPlayer, musicPlayer, muted, powerPlayer, wakkaPlayer]);

  const restartMusic = useCallback(() => {
    musicStartedRef.current = true;
    lastAudioEventIdRef.current = 0;
    resetEffect(wakkaPlayer);
    resetEffect(deathPlayer);
    resetEffect(powerPlayer);
    musicPlayer.pause();
    musicPlayer.loop = true;
    setMusicRate(musicPlayer, 1.0);
    Promise.resolve(musicPlayer.seekTo(0))
      .then(() => musicPlayer.play())
      .catch(() => musicPlayer.play());
  }, [deathPlayer, musicPlayer, powerPlayer, wakkaPlayer]);

  const stopMusic = useCallback(() => {
    musicStartedRef.current = false;
    lastAudioEventIdRef.current = 0;
    musicPlayer.pause();
    setMusicRate(musicPlayer, 1.0);
    Promise.resolve(musicPlayer.seekTo(0)).catch(() => {});
    resetEffect(wakkaPlayer);
    resetEffect(deathPlayer);
    resetEffect(powerPlayer);
  }, [deathPlayer, musicPlayer, powerPlayer, wakkaPlayer]);

  const toggleMute = useCallback(() => {
    setMuted((previous) => !previous);
  }, []);

  useEffect(() => {
    if (!musicStartedRef.current) return;

    if (game.phase === PHASE.PAUSED) {
      setMusicRate(musicPlayer, 0.5);
      musicPlayer.play();
      return;
    }

    if ([PHASE.READY, PHASE.PLAYING].includes(game.phase)) {
      setMusicRate(musicPlayer, game.powerModeTicks > 0 ? 2.0 : 1.0);
      musicPlayer.play();
      return;
    }

    // Life-lost, stage-clear and game-over states silence the loop. Reset the
    // playback rate now so the next READY state can never inherit a stale rate.
    musicPlayer.pause();
    setMusicRate(musicPlayer, 1.0);
  }, [game.phase, game.powerModeTicks, musicPlayer]);

  useEffect(() => {
    const event = game.audioEvent;
    if (!event || event.id === lastAudioEventIdRef.current) return;

    lastAudioEventIdRef.current = event.id;

    if (event.type === AUDIO_EVENT.WAKKA) {
      replay(wakkaPlayer);
    } else if (event.type === AUDIO_EVENT.POWER) {
      replay(powerPlayer);
    } else if (event.type === AUDIO_EVENT.DEATH) {
      replay(deathPlayer);
    }
  }, [deathPlayer, game.audioEvent, powerPlayer, wakkaPlayer]);

  return {
    muted,
    restartMusic,
    stopMusic,
    toggleMute,
  };
}
