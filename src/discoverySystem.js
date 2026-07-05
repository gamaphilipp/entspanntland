import { gameState } from "./gameState.js?v=status-panel-removed-20260705-1";

function getAllDiscoveries(state = gameState) {
  return [...Object.values(state.discoveries), ...(state.customDiscoveries ?? [])];
}

export function updateDiscoveries(state = gameState) {
  const newlyDiscovered = [];

  getAllDiscoveries(state).forEach((discovery) => {
    if (!discovery.discovered && state.totalQuietSeconds >= discovery.requiredTotalQuietSeconds) {
      discovery.discovered = true;
      newlyDiscovered.push(discovery);
    }
  });

  return newlyDiscovered;
}

export function resetDiscoveries(state = gameState) {
  getAllDiscoveries(state).forEach((discovery) => {
    discovery.discovered = false;
  });
}

export function getDiscoveryList(state = gameState) {
  return getAllDiscoveries(state);
}

export function addCustomDiscovery({ requiredTotalQuietSeconds, description }, state = gameState) {
  const safeSeconds = Math.max(60, Math.floor(Number(requiredTotalQuietSeconds) || 0));
  const safeDescription = String(description ?? "").trim().slice(0, 160);

  if (!safeDescription) {
    throw new Error("custom_discovery_description_required");
  }

  if (!Array.isArray(state.customDiscoveries)) {
    state.customDiscoveries = [];
  }

  const discovery = {
    id: `custom-${state.nextCustomDiscoveryId}`,
    label: "Eigene Entdeckung",
    description: safeDescription,
    discovered: false,
    custom: true,
    requiredTotalQuietSeconds: safeSeconds,
  };

  state.nextCustomDiscoveryId += 1;
  state.customDiscoveries.push(discovery);

  return discovery;
}
