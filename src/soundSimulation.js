import { gameState } from "./gameState.js?v=settings-fix-20260707-1";
import { soundStates } from "./assets.js?v=settings-fix-20260707-1";
import { resetDiscoveries, updateDiscoveries } from "./discoverySystem.js?v=settings-fix-20260707-1";

const VALID_SOUND_STATES = new Set(["calm", "warning", "too_loud", "paused"]);
const MICROPHONE_LEVEL_SMOOTHING = 0.78;
const MICROPHONE_UI_INTERVAL_MS = 140;
const DEFAULT_ROOM_SETTINGS = {
  roomType: "rest",
  workMode: "solo",
  windowState: "closed",
};
const ROOM_PROFILES = {
  rest_closed: {
    label: "Sehr sensibel",
    calmMax: 26,
    tooLoudMin: 54,
  },
  rest_open: {
    label: "Sehr sensibel, leicht tolerant",
    calmMax: 30,
    tooLoudMin: 58,
  },
  learning_solo_closed: {
    label: "Sensibel",
    calmMax: 34,
    tooLoudMin: 64,
  },
  learning_solo_open: {
    label: "Sensibel, leicht tolerant",
    calmMax: 38,
    tooLoudMin: 68,
  },
  learning_group_closed: {
    label: "Mittel tolerant",
    calmMax: 46,
    tooLoudMin: 78,
  },
  learning_group_open: {
    label: "Am tolerantesten",
    calmMax: 52,
    tooLoudMin: 86,
  },
};

let timerId = null;
let tickHandler = () => {};
let microphoneStream = null;
let microphoneAudioContext = null;
let microphoneSource = null;
let microphoneAnalyser = null;
let microphoneBuffer = null;
let microphoneFrameId = null;
let microphoneSmoothedLevel = soundStates.paused.defaultSoundLevel;
let lastMicrophoneUiUpdate = 0;

export function setTickHandler(handler) {
  tickHandler = typeof handler === "function" ? handler : () => {};
}

export function startQuietTimer() {
  if (timerId) {
    return;
  }

  timerId = window.setInterval(() => {
    if (gameState.soundState !== "calm") {
      tickHandler([]);
      return;
    }

    gameState.currentQuietSeconds += 1;
    gameState.totalQuietSeconds += 1;
    tickHandler(updateDiscoveries(gameState));
  }, 1000);
}

function stopMicrophoneMonitoring() {
  if (microphoneFrameId) {
    window.cancelAnimationFrame(microphoneFrameId);
    microphoneFrameId = null;
  }

  if (microphoneStream) {
    microphoneStream.getTracks().forEach((track) => track.stop());
    microphoneStream = null;
  }

  if (microphoneAudioContext && microphoneAudioContext.state !== "closed") {
    microphoneAudioContext.close().catch(() => {});
  }

  microphoneAudioContext = null;
  microphoneSource = null;
  microphoneAnalyser = null;
  microphoneBuffer = null;
  microphoneSmoothedLevel = soundStates.paused.defaultSoundLevel;
  lastMicrophoneUiUpdate = 0;
}

function applySoundState(nextState, soundLevel = soundStates[nextState]?.defaultSoundLevel ?? 0) {
  if (!VALID_SOUND_STATES.has(nextState)) {
    return;
  }

  const wasTooLoud = gameState.soundState === "too_loud";

  gameState.soundState = nextState;
  gameState.soundLevel = Math.max(0, Math.min(100, Math.round(soundLevel)));

  if (nextState === "too_loud" && !wasTooLoud) {
    gameState.currentQuietSeconds = 0;
  }

  tickHandler([]);
}

export function setSoundState(nextState) {
  stopMicrophoneMonitoring();
  applySoundState(nextState);
}

export function addQuietSeconds(seconds) {
  const safeSeconds = Number(seconds);

  if (!Number.isFinite(safeSeconds) || safeSeconds <= 0) {
    return;
  }

  stopMicrophoneMonitoring();
  gameState.soundState = "calm";
  gameState.soundLevel = soundStates.calm.defaultSoundLevel;
  gameState.currentQuietSeconds += safeSeconds;
  gameState.totalQuietSeconds += safeSeconds;
  tickHandler(updateDiscoveries(gameState));
}

export function resetSimulation() {
  stopMicrophoneMonitoring();
  gameState.soundState = "paused";
  gameState.soundLevel = soundStates.paused.defaultSoundLevel;
  gameState.currentQuietSeconds = 0;
  gameState.totalQuietSeconds = 0;
  resetDiscoveries(gameState);
  tickHandler([]);
}

function getAudioContextConstructor() {
  return window.AudioContext || window.webkitAudioContext;
}

function normalizeRoomSettings(settings = {}) {
  const roomType = settings.roomType === "learning" ? "learning" : "rest";
  const workMode = settings.workMode === "group" ? "group" : "solo";
  const windowState = settings.windowState === "open" ? "open" : "closed";

  return {
    roomType,
    workMode: roomType === "learning" ? workMode : "solo",
    windowState,
  };
}

function getRoomProfileKey(settings = gameState.roomSettings) {
  const normalizedSettings = normalizeRoomSettings(settings);

  if (normalizedSettings.roomType === "learning") {
    return `learning_${normalizedSettings.workMode}_${normalizedSettings.windowState}`;
  }

  return `rest_${normalizedSettings.windowState}`;
}

export function getCurrentRoomProfile() {
  const profileKey = getRoomProfileKey(gameState.roomSettings);
  return ROOM_PROFILES[profileKey] ?? ROOM_PROFILES.rest_closed;
}

export function setRoomSettings(nextSettings = {}) {
  gameState.roomSettings = normalizeRoomSettings({
    ...DEFAULT_ROOM_SETTINGS,
    ...gameState.roomSettings,
    ...nextSettings,
  });

  return getCurrentRoomProfile();
}

function getMicrophoneStateForLevel(level) {
  const roomProfile = getCurrentRoomProfile();

  if (level >= roomProfile.tooLoudMin) {
    return "too_loud";
  }

  if (level > roomProfile.calmMax) {
    return "warning";
  }

  return "calm";
}

function calculateMicrophoneLevel(buffer) {
  let sumSquares = 0;

  for (const value of buffer) {
    const centeredSample = (value - 128) / 128;
    sumSquares += centeredSample * centeredSample;
  }

  const rms = Math.sqrt(sumSquares / buffer.length);
  const decibels = 20 * Math.log10(Math.max(rms, 0.0001));
  const normalizedLevel = ((decibels + 55) / 37) * 100;

  return Math.max(0, Math.min(100, normalizedLevel));
}

function updateMicrophoneState(timestamp = window.performance.now()) {
  if (!microphoneAnalyser || !microphoneBuffer) {
    return;
  }

  microphoneAnalyser.getByteTimeDomainData(microphoneBuffer);

  const rawLevel = calculateMicrophoneLevel(microphoneBuffer);
  microphoneSmoothedLevel =
    microphoneSmoothedLevel * MICROPHONE_LEVEL_SMOOTHING + rawLevel * (1 - MICROPHONE_LEVEL_SMOOTHING);

  if (timestamp - lastMicrophoneUiUpdate >= MICROPHONE_UI_INTERVAL_MS) {
    lastMicrophoneUiUpdate = timestamp;
    applySoundState(getMicrophoneStateForLevel(microphoneSmoothedLevel), microphoneSmoothedLevel);
  }

  microphoneFrameId = window.requestAnimationFrame(updateMicrophoneState);
}

export async function requestMicrophoneAccess() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("microphone_unavailable");
  }

  const AudioContextConstructor = getAudioContextConstructor();

  if (!AudioContextConstructor) {
    throw new Error("audio_context_unavailable");
  }

  stopMicrophoneMonitoring();

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      autoGainControl: { ideal: false },
      echoCancellation: { ideal: false },
      noiseSuppression: { ideal: false },
    },
  });

  try {
    microphoneAudioContext = new AudioContextConstructor();
    microphoneSource = microphoneAudioContext.createMediaStreamSource(stream);
    microphoneAnalyser = microphoneAudioContext.createAnalyser();
    microphoneAnalyser.fftSize = 1024;
    microphoneAnalyser.smoothingTimeConstant = 0.65;
    microphoneBuffer = new Uint8Array(microphoneAnalyser.fftSize);
    microphoneSmoothedLevel = soundStates.calm.defaultSoundLevel;
    microphoneSource.connect(microphoneAnalyser);
    microphoneStream = stream;

    if (microphoneAudioContext.state === "suspended") {
      await microphoneAudioContext.resume();
    }

    applySoundState("calm", soundStates.calm.defaultSoundLevel);
    updateMicrophoneState();
  } catch (error) {
    stream.getTracks().forEach((track) => track.stop());
    stopMicrophoneMonitoring();
    throw error;
  }

  return true;
}
