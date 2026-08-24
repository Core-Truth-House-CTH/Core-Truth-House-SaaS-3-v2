export const SHOT_TYPES = {
  IDENTITY: "identity",
  BROLL: "broll",
  PRODUCT: "product",
  DIALOGUE: "dialogue",
  GRAPHIC: "graphic",
};

const IDENTITY_HINTS = ["shake", "asha", "founder", "ambassador", "character", "woman", "man", "person", "face", "portrait"];
const DIALOGUE_HINTS = ["speaks", "speaking", "talks", "talking", "dialogue", "says", "lip sync", "lip-sync"];
const PRODUCT_HINTS = ["laptop", "tablet", "phone", "screen", "dashboard", "interface", "book", "packaging", "product"];
const GRAPHIC_HINTS = ["title card", "lower third", "logo", "graphic", "text overlay", "end card", "case file"];

function includesAny(value, hints) {
  const text = String(value || "").toLowerCase();
  return hints.some((hint) => text.includes(hint));
}

export function classifyShot(scene = {}) {
  const combined = [scene.title, scene.direction, scene.voiceover].filter(Boolean).join(" ");
  if (includesAny(combined, GRAPHIC_HINTS)) return SHOT_TYPES.GRAPHIC;
  if (includesAny(combined, DIALOGUE_HINTS)) return SHOT_TYPES.DIALOGUE;
  if (includesAny(combined, PRODUCT_HINTS)) return SHOT_TYPES.PRODUCT;
  if (includesAny(combined, IDENTITY_HINTS)) return SHOT_TYPES.IDENTITY;
  return SHOT_TYPES.BROLL;
}

export function routeShot(scene = {}) {
  const type = scene.shot_type || classifyShot(scene);
  const identityCritical = scene.identity_critical ?? [SHOT_TYPES.IDENTITY, SHOT_TYPES.DIALOGUE].includes(type);

  const route = {
    shot_type: type,
    identity_critical: identityCritical,
    still_required: false,
    still_provider: null,
    motion_provider: null,
    audio_provider: null,
    compositor: "assembly",
    approval_required: false,
  };

  if (type === SHOT_TYPES.IDENTITY) {
    return { ...route, still_required: true, still_provider: "seedream-5-pro", motion_provider: "seedance", approval_required: true };
  }

  if (type === SHOT_TYPES.DIALOGUE) {
    return { ...route, still_required: true, still_provider: "seedream-5-pro", motion_provider: "seedance", audio_provider: "elevenlabs", approval_required: true };
  }

  if (type === SHOT_TYPES.PRODUCT) {
    return { ...route, still_required: true, still_provider: "reference-controlled-image", motion_provider: "seedance", approval_required: true };
  }

  if (type === SHOT_TYPES.GRAPHIC) {
    return { ...route, compositor: "cth-graphics" };
  }

  return { ...route, motion_provider: "best-fit-video" };
}

export function directStoryboard(storyboard) {
  const scenes = (storyboard?.scenes || []).map((scene, index) => {
    const route = routeShot(scene);
    return {
      ...scene,
      order: index,
      production: {
        ...route,
        frame_status: route.still_required ? "needs-frame" : "not-required",
        frame_approval: route.approval_required ? "pending" : "not-required",
        motion_status: route.approval_required ? "blocked" : "ready",
        continuity_status: route.identity_critical ? "pending" : "not-required",
      },
    };
  });

  return {
    ...storyboard,
    director_version: 1,
    production_status: "directed",
    scenes,
  };
}
