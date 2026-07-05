export const gameState = {
  soundState: "paused", // calm, warning, too_loud, paused
  soundLevel: 0, // qualitative orientation value from 0 to 100, not a dB value

  currentQuietSeconds: 0,
  totalQuietSeconds: 0,

  roomSettings: {
    roomType: "rest",
    workMode: "solo",
    windowState: "closed",
  },

  nextCustomDiscoveryId: 1,
  customDiscoveries: [],

  discoveries: {
    orgelfels: {
      id: "orgelfels",
      label: "Orgelstein",
      discovered: false,
      requiredTotalQuietSeconds: 1200,
    },
    wiesenstreicher: {
      id: "wiesenstreicher",
      label: "Wiesenstreicher",
      discovered: false,
      requiredTotalQuietSeconds: 2100,
    },
    schilffloeter: {
      id: "schilffloeter",
      label: "Schilfflöter",
      discovered: false,
      requiredTotalQuietSeconds: 3000,
    },
    gischtpauke: {
      id: "gischtpauke",
      label: "Gischtpauke",
      discovered: false,
      requiredTotalQuietSeconds: 3900,
    },
    zwitscherchor: {
      id: "zwitscherchor",
      label: "Zwitscherchor",
      discovered: false,
      requiredTotalQuietSeconds: 4800,
    },
  },
};
