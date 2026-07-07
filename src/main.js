import { gameState } from "./gameState.js?v=settings-fix-20260707-1";
import {
  setTickHandler,
  setRoomSettings,
  startQuietTimer,
  setSoundState,
  addQuietSeconds,
  resetSimulation,
  requestMicrophoneAccess,
} from "./soundSimulation.js?v=settings-fix-20260707-1";
import { addCustomDiscovery, updateDiscoveries } from "./discoverySystem.js?v=settings-fix-20260707-1";
import {
  closeDialogById,
  formatTime,
  setupMapView,
  updateMapView,
  updateTextState,
} from "./mapView.js?v=settings-fix-20260707-1";

const elements = {
  startScreen: document.getElementById("startScreen"),
  islandScreen: document.getElementById("islandScreen"),
  startFeedback: document.getElementById("startFeedback"),
  startTestButton: document.getElementById("startTestButton"),
  startMicButton: document.getElementById("startMicButton"),
  privacyButton: document.getElementById("privacyButton"),
  privacyModal: document.getElementById("privacyModal"),
  collectionButton: document.getElementById("collectionButton"),
  collectionModal: document.getElementById("collectionModal"),
  exerciseChoiceButtons: document.querySelectorAll("[data-exercise-target]"),
  exercisePanels: document.querySelectorAll("[data-exercise-panel]"),
  addDiscoveryButton: document.getElementById("addDiscoveryButton"),
  customDiscoveryModal: document.getElementById("customDiscoveryModal"),
  customDiscoveryForm: document.getElementById("customDiscoveryForm"),
  customDiscoveryMinutes: document.getElementById("customDiscoveryMinutes"),
  customDiscoveryDescription: document.getElementById("customDiscoveryDescription"),
  customDiscoveryFeedback: document.getElementById("customDiscoveryFeedback"),
  customDiscoveryList: document.getElementById("customDiscoveryList"),
  customDiscoveryEmpty: document.getElementById("customDiscoveryEmpty"),
  customDiscoveryUnlockedModal: document.getElementById("customDiscoveryUnlockedModal"),
  customDiscoveryUnlockedDescription: document.getElementById("customDiscoveryUnlockedDescription"),
  settingsButton: document.getElementById("settingsButton"),
  settingsModal: document.getElementById("settingsModal"),
  resetButton: document.getElementById("resetButton"),
  soundStateLabel: document.getElementById("soundStateLabel"),
  soundStateDescription: document.getElementById("soundStateDescription"),
  loudnessLevelLabel: document.getElementById("loudnessLevelLabel"),
  loudnessMeter: document.getElementById("loudnessMeter"),
  loudnessFill: document.getElementById("loudnessFill"),
  loudnessMarker: document.getElementById("loudnessMarker"),
  currentQuietTime: document.getElementById("currentQuietTime"),
  totalQuietTime: document.getElementById("totalQuietTime"),
  roomTypeInputs: document.querySelectorAll("[name='roomType']"),
  workModeGroup: document.getElementById("workModeGroup"),
  workModeInputs: document.querySelectorAll("[name='workMode']"),
  windowStateInputs: document.querySelectorAll("[name='windowState']"),
};

const pendingCustomDiscoveryPopups = [];

function openDialog(dialog) {
  if (!dialog) {
    return;
  }

  if (typeof dialog.showModal === "function") {
    dialog.showModal();
    return;
  }

  dialog.setAttribute("open", "");
}

function enterIsland() {
  elements.startScreen.classList.add("is-hidden");
  elements.islandScreen.classList.remove("is-hidden");
  startQuietTimer();
  updateUI();
}

function getCheckedValue(inputs, fallback) {
  return [...inputs].find((input) => input.checked)?.value ?? fallback;
}

function syncRoomSettingsControls() {
  const { roomType, workMode, windowState } = gameState.roomSettings ?? {
    roomType: "rest",
    workMode: "solo",
    windowState: "closed",
  };
  const isLearningTime = roomType === "learning";

  elements.roomTypeInputs.forEach((input) => {
    input.checked = input.value === roomType;
  });

  elements.workModeInputs.forEach((input) => {
    input.checked = input.value === workMode;
    input.disabled = !isLearningTime;
  });

  elements.windowStateInputs.forEach((input) => {
    input.checked = input.value === windowState;
  });

  if (elements.workModeGroup) {
    elements.workModeGroup.hidden = !isLearningTime;
  }

}

function updateRoomSettingsFromControls() {
  setRoomSettings({
    roomType: getCheckedValue(elements.roomTypeInputs, "rest"),
    workMode: getCheckedValue(elements.workModeInputs, "solo"),
    windowState: getCheckedValue(elements.windowStateInputs, "closed"),
  });
  updateUI();
}

function renderCustomDiscoveryList() {
  if (!elements.customDiscoveryList || !elements.customDiscoveryEmpty) {
    return;
  }

  elements.customDiscoveryList.replaceChildren();

  const customDiscoveries = gameState.customDiscoveries ?? [];
  elements.customDiscoveryEmpty.hidden = customDiscoveries.length > 0;

  customDiscoveries.forEach((discovery) => {
    const item = document.createElement("li");
    const description = document.createElement("strong");
    const meta = document.createElement("span");

    item.className = "custom-discovery-item";
    item.dataset.status = discovery.discovered ? "unlocked" : "waiting";
    description.textContent = discovery.description;
    meta.textContent = `${formatTime(discovery.requiredTotalQuietSeconds)} - ${
      discovery.discovered ? "freigeschaltet" : "wartet"
    }`;

    item.append(description, meta);
    elements.customDiscoveryList.append(item);
  });
}

function queueCustomDiscoveryPopups(newlyDiscovered = []) {
  newlyDiscovered
    .filter((discovery) => discovery.custom)
    .forEach((discovery) => {
      if (!pendingCustomDiscoveryPopups.some((queuedDiscovery) => queuedDiscovery.id === discovery.id)) {
        pendingCustomDiscoveryPopups.push(discovery);
      }
    });
}

function flushCustomDiscoveryPopups() {
  if (!elements.customDiscoveryUnlockedModal || pendingCustomDiscoveryPopups.length === 0) {
    return;
  }

  if (document.querySelector("dialog[open]")) {
    return;
  }

  const discovery = pendingCustomDiscoveryPopups.shift();
  elements.customDiscoveryUnlockedDescription.textContent = discovery.description;
  openDialog(elements.customDiscoveryUnlockedModal);
}

function updateUI(newlyDiscovered = []) {
  updateTextState(elements);
  syncRoomSettingsControls();
  renderCustomDiscoveryList();
  updateMapView(gameState, { newlyDiscovered });
  queueCustomDiscoveryPopups(newlyDiscovered);
  flushCustomDiscoveryPopups();
}

function openDiscoveryModal(modalId) {
  openDialog(document.getElementById(modalId));
}

function showExercise(exerciseId) {
  elements.exerciseChoiceButtons.forEach((button) => {
    const isSelected = button.dataset.exerciseTarget === exerciseId;
    button.classList.toggle("is-active", isSelected);
    button.setAttribute("aria-selected", String(isSelected));
  });

  elements.exercisePanels.forEach((panel) => {
    const isSelected = panel.dataset.exercisePanel === exerciseId;
    panel.classList.toggle("is-active", isSelected);
    panel.hidden = !isSelected;
  });
}

function setupExerciseCollection() {
  elements.exerciseChoiceButtons.forEach((button) => {
    button.addEventListener("click", () => {
      showExercise(button.dataset.exerciseTarget);
    });
  });
}

function handleCustomDiscoverySubmit(event) {
  event.preventDefault();

  const minutes = Number(elements.customDiscoveryMinutes.value);
  const description = elements.customDiscoveryDescription.value.trim();

  if (!Number.isFinite(minutes) || minutes < 1) {
    elements.customDiscoveryFeedback.textContent = "Bitte mindestens 1 Minute eintragen.";
    return;
  }

  if (!description) {
    elements.customDiscoveryFeedback.textContent = "Bitte eine Beschreibung eintragen.";
    return;
  }

  try {
    const customDiscovery = addCustomDiscovery({
      requiredTotalQuietSeconds: minutes * 60,
      description,
    });
    const newlyDiscovered = updateDiscoveries(gameState);

    elements.customDiscoveryDescription.value = "";
    elements.customDiscoveryMinutes.value = "5";
    elements.customDiscoveryFeedback.textContent = "Entdeckung gespeichert.";

    if (newlyDiscovered.some((discovery) => discovery.id === customDiscovery.id)) {
      closeDialogById("customDiscoveryModal");
    }

    updateUI(newlyDiscovered);
  } catch (error) {
    elements.customDiscoveryFeedback.textContent = "Die Entdeckung konnte nicht gespeichert werden.";
  }
}

async function startWithMicrophone() {
  elements.startFeedback.textContent = "Mikrofonfreigabe wird angefragt...";

  try {
    await requestMicrophoneAccess();
    elements.startFeedback.textContent = "";
  } catch (error) {
    elements.startFeedback.textContent = "Mikrofon nicht verfügbar. Der Testmodus wird gestartet.";
    setSoundState("calm");
  }

  enterIsland();
}

setTickHandler(updateUI);
setupMapView({ onOpenDiscovery: openDiscoveryModal });
setRoomSettings(gameState.roomSettings);
setupExerciseCollection();
updateUI();

elements.startTestButton.addEventListener("click", () => {
  setSoundState("calm");
  enterIsland();
});

elements.startMicButton.addEventListener("click", startWithMicrophone);

elements.privacyButton.addEventListener("click", () => {
  openDialog(elements.privacyModal);
});

elements.collectionButton.addEventListener("click", () => {
  showExercise("fantasyJourney");
  openDialog(elements.collectionModal);
});

elements.addDiscoveryButton.addEventListener("click", () => {
  elements.customDiscoveryFeedback.textContent = "";
  renderCustomDiscoveryList();
  openDialog(elements.customDiscoveryModal);
});

elements.customDiscoveryForm.addEventListener("submit", handleCustomDiscoverySubmit);

elements.settingsButton.addEventListener("click", () => {
  updateUI();
  openDialog(elements.settingsModal);
});

[...elements.roomTypeInputs, ...elements.workModeInputs, ...elements.windowStateInputs].forEach((input) => {
  input.addEventListener("change", updateRoomSettingsFromControls);
});

document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => {
    closeDialogById(button.dataset.closeDialog);
    updateUI();
  });
});

document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("close", () => {
    updateUI();
  });
});

document.querySelectorAll("[data-state]").forEach((button) => {
  button.addEventListener("click", () => {
    setSoundState(button.dataset.state);
    updateUI();
  });
});

document.querySelectorAll("[data-add-quiet]").forEach((button) => {
  button.addEventListener("click", () => {
    addQuietSeconds(button.dataset.addQuiet);
    updateUI();
  });
});

if (elements.resetButton) {
  elements.resetButton.addEventListener("click", () => {
    resetSimulation();
    updateUI();
  });
}
