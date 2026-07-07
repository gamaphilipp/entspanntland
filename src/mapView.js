import { discoveryContent, soundStates } from "./assets.js?v=settings-fix-20260707-1";
import { gameState } from "./gameState.js?v=settings-fix-20260707-1";

const discoveryAnimationTimers = new Map();
const pendingDiscoveryAnimationIds = new Set();
const animationFrameDuration = 180;

export function formatTime(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function setupMapView({ onOpenDiscovery }) {
  document.querySelectorAll(".discovery-location").forEach((locationButton) => {
    const discoveryId = locationButton.dataset.discoveryId;
    const discovery = discoveryContent[discoveryId];
    const label = locationButton.querySelector(".location-label");

    if (discovery) {
      locationButton.dataset.modalId = discovery.modalId;
      setLocationImage(locationButton, discovery.lockedSrc);

      if (label) {
        label.textContent = discovery.title;
      }
    }

    locationButton.addEventListener("click", () => {
      const discovery = gameState.discoveries[discoveryId];

      if (!discovery?.discovered) {
        return;
      }

      onOpenDiscovery(locationButton.dataset.modalId);
    });
  });

  preloadDiscoveryImages();
}

export function updateMapView(state = gameState, { newlyDiscovered = [] } = {}) {
  document.body.dataset.soundState = state.soundState;
  newlyDiscovered.forEach((discovery) => pendingDiscoveryAnimationIds.add(discovery.id));

  const canPlayDiscoveryAnimations = !document.querySelector(".settings-dialog[open], .privacy-dialog[open]");

  document.querySelectorAll(".discovery-location").forEach((locationButton) => {
    const discoveryId = locationButton.dataset.discoveryId;
    const discovery = state.discoveries[discoveryId];
    const discoveryAssets = discoveryContent[discoveryId];

    if (!discovery || !discoveryAssets) {
      return;
    }

    locationButton.classList.toggle("discovered", discovery.discovered);
    locationButton.disabled = !discovery.discovered;
    locationButton.setAttribute(
      "aria-label",
      discovery.discovered ? `${discovery.label} öffnen` : `${discovery.label} noch nicht entdeckt`,
    );

    if (!discovery.discovered) {
      pendingDiscoveryAnimationIds.delete(discoveryId);
      stopDiscoveryAnimation(locationButton);
      setLocationImage(locationButton, discoveryAssets.lockedSrc);
      return;
    }

    if (pendingDiscoveryAnimationIds.has(discoveryId)) {
      if (!canPlayDiscoveryAnimations) {
        return;
      }

      pendingDiscoveryAnimationIds.delete(discoveryId);
      startDiscoveryAnimationLoop(locationButton, discoveryAssets);
      return;
    }

    if (!locationButton.classList.contains("is-animating") && canPlayDiscoveryAnimations) {
      startDiscoveryAnimationLoop(locationButton, discoveryAssets);
    }
  });
}

function setLocationImage(locationButton, src) {
  const image = locationButton.querySelector(".location-image");

  if (image && image.getAttribute("src") !== src) {
    image.src = src;
  }
}

function startDiscoveryAnimationLoop(locationButton, discoveryAssets) {
  const image = locationButton.querySelector(".location-image");
  const frames = discoveryAssets.animationFrames;

  if (!image || !frames?.length) {
    setLocationImage(locationButton, discoveryAssets.unlockedSrc);
    return;
  }

  stopDiscoveryAnimation(locationButton);

  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    setLocationImage(locationButton, discoveryAssets.unlockedSrc);
    return;
  }

  let frameIndex = 0;
  locationButton.classList.add("is-animating");

  const showNextFrame = () => {
    image.src = frames[frameIndex];
    frameIndex = (frameIndex + 1) % frames.length;
  };

  showNextFrame();
  discoveryAnimationTimers.set(locationButton.dataset.discoveryId, window.setInterval(showNextFrame, animationFrameDuration));
}

function stopDiscoveryAnimation(locationButton) {
  const discoveryId = locationButton.dataset.discoveryId;
  const timerId = discoveryAnimationTimers.get(discoveryId);

  if (timerId) {
    window.clearInterval(timerId);
    discoveryAnimationTimers.delete(discoveryId);
  }

  locationButton.classList.remove("is-animating");
}

function preloadDiscoveryImages() {
  Object.values(discoveryContent).forEach((discovery) => {
    [discovery.lockedSrc, discovery.unlockedSrc, discovery.popupSrc, ...discovery.animationFrames].forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  });
}

export function updateTextState({
  soundStateLabel,
  soundStateDescription,
  loudnessLevelLabel,
  loudnessMeter,
  loudnessFill,
  loudnessMarker,
  currentQuietTime,
  totalQuietTime,
  settingsState,
  settingsCurrentTime,
  settingsTotalTime,
  settingsLoudness,
}) {
  const status = soundStates[gameState.soundState] ?? soundStates.paused;
  const soundLevel = Math.max(0, Math.min(100, Math.round(gameState.soundLevel)));

  if (soundStateLabel) {
    soundStateLabel.textContent = status.label;
  }

  if (soundStateDescription) {
    soundStateDescription.textContent = status.description;
  }

  loudnessLevelLabel.textContent = status.loudnessLabel;
  loudnessMeter.setAttribute("aria-valuenow", String(soundLevel));
  loudnessMeter.dataset.level = gameState.soundState;
  loudnessFill.style.width = `${soundLevel}%`;
  loudnessMarker.style.left = `${soundLevel}%`;
  currentQuietTime.textContent = formatTime(gameState.currentQuietSeconds);
  totalQuietTime.textContent = formatTime(gameState.totalQuietSeconds);
  if (settingsState) {
    settingsState.textContent = status.label;
  }

  if (settingsCurrentTime) {
    settingsCurrentTime.textContent = formatTime(gameState.currentQuietSeconds);
  }

  if (settingsTotalTime) {
    settingsTotalTime.textContent = formatTime(gameState.totalQuietSeconds);
  }

  if (settingsLoudness) {
    settingsLoudness.textContent = status.loudnessLabel.toLowerCase();
  }
}

export function closeDialogById(dialogId) {
  const dialog = document.getElementById(dialogId);

  if (dialog?.open) {
    dialog.close();
  }
}
