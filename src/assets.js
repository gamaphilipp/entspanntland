export const soundStates = {
  paused: {
    label: "Messung gestoppt",
    description: "Die Messung ist pausiert.",
    loudnessLabel: "Pausiert",
    defaultSoundLevel: 0,
  },
  calm: {
    label: "Die Insel lauscht",
    description: "Die ruhige Zeit macht leise Dinge hörbar.",
    loudnessLabel: "Leise",
    defaultSoundLevel: 18,
  },
  warning: {
    label: "Es wird unruhiger",
    description: "Die feinen Klänge werden schwerer hörbar.",
    loudnessLabel: "Unruhiger",
    defaultSoundLevel: 56,
  },
  too_loud: {
    label: "Zu laut zum Lauschen",
    description: "Die leisen Details sind gerade kaum wahrnehmbar.",
    loudnessLabel: "Zu laut",
    defaultSoundLevel: 88,
  },
};

const animationFrames = (folder) =>
  Array.from({ length: 9 }, (_, index) => `${folder}/frame_${String(index).padStart(3, "0")}.png`);

export const discoveryContent = {
  orgelfels: {
    id: "orgelfels",
    modalId: "orgelfelsModal",
    title: "Orgelstein",
    lockedSrc: "design/Felsorgel/Felsorgel_locked/rotations/unknown.png",
    unlockedSrc: "design/Felsorgel/Felsorgel_unlocked/rotations/unknown.png",
    animationFrames: animationFrames(
      "design/Felsorgel/Felsorgel_unlocked/animations/Felsorgel_unlocked_animation/unknown",
    ),
    popupSrc: "design/Felsorgel/Orgelstein_popup.png",
  },
  wiesenstreicher: {
    id: "wiesenstreicher",
    modalId: "wiesenstreicherModal",
    title: "Wiesenstreicher",
    lockedSrc: "design/Wiesenstreicher/Wiesenstreicher_locked/rotations/unknown.png",
    unlockedSrc: "design/Wiesenstreicher/Wiesenstreicher_unlocked/rotations/unknown.png",
    animationFrames: animationFrames(
      "design/Wiesenstreicher/Wiesenstreicher_unlocked/animations/Wiesenstreicher_unlocked_animation/unknown",
    ),
    popupSrc: "design/Wiesenstreicher/Wiesenstreicher_popup.png",
  },
  schilffloeter: {
    id: "schilffloeter",
    modalId: "schilffloeterModal",
    title: "Schilfflöter",
    lockedSrc: "design/Schilffloeter/Schilffloeter_locked/rotations/unknown.png",
    unlockedSrc: "design/Schilffloeter/Schilffloeter_unlocked/rotations/unknown.png",
    animationFrames: animationFrames(
      "design/Schilffloeter/Schilffloeter_unlocked/animations/Schilffloeter_unlocked_animation/unknown",
    ),
    popupSrc: "design/Schilffloeter/Schilffloeter_popup.png",
  },
  gischtpauke: {
    id: "gischtpauke",
    modalId: "gischtpaukeModal",
    title: "Gischtpauke",
    lockedSrc: "design/Gischtpauke/Gischtpauke_locked/rotations/unknown.png",
    unlockedSrc: "design/Gischtpauke/Gischtpauke_unlocked/rotations/unknown.png",
    animationFrames: animationFrames(
      "design/Gischtpauke/Gischtpauke_unlocked/animations/Gischtpauke_unlocked_animation/unknown",
    ),
    popupSrc: "design/Gischtpauke/Gischtpauke_popup.png",
  },
  zwitscherchor: {
    id: "zwitscherchor",
    modalId: "zwitscherchorModal",
    title: "Zwitscherchor",
    lockedSrc: "design/Zwitscherchor/Zwitscherchor_locked/rotations/unknown.png",
    unlockedSrc: "design/Zwitscherchor/Zwitscherchor_unlocked/rotations/unknown.png",
    animationFrames: animationFrames(
      "design/Zwitscherchor/Zwitscherchor_unlocked/animations/Zwitscherchor_unlocked_animation/unknown",
    ),
    popupSrc: "design/Zwitscherchor/Zwitscherchor_popup.png",
  },
};
