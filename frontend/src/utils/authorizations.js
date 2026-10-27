const SLOTS_PER_PLATFORM = 5;

export function createEmptySlot(index) {
  return {
    name: `Client #${index + 1}`,
    clientID: "",
    secretClient: "",
    token: "",
    guildID: "",
    debugChannelID: "",
    roles: { default: "en", ru: "", en: "" },
    status: "unauthorized",
    statusReason: "",
    created: true,
  };
}

export function createBlankSlot() {
  return {
    name: "",
    clientID: "",
    secretClient: "",
    token: "",
    guildID: "",
    debugChannelID: "",
    roles: { default: "en", ru: "", en: "" },
    status: "unknown",
    statusReason: "",
    created: false,
  };
}

export function updatePlatformSlot(platform, slotIndex, patch) {
  if (slotIndex === null || slotIndex < 0) return platform;

  const slots = [...(platform?.slots || [])];
  while (slots.length < SLOTS_PER_PLATFORM) slots.push(createBlankSlot());

  if (patch === null) {
    slots[slotIndex] = createBlankSlot();
  } else {
    const isNew = !isSlotOccupied(slots[slotIndex]);
    const base = isNew ? createEmptySlot(slotIndex) : slots[slotIndex];

    // Убираем lastAuthAt из base, если он пустой
    const cleanBase = { ...base };
    if (!cleanBase.lastAuthAt) delete cleanBase.lastAuthAt;

    const cleanPatch = { ...patch };
    if (!cleanPatch.lastAuthAt) delete cleanPatch.lastAuthAt;

    const finalSlot = {
      ...cleanBase,
      ...cleanPatch,
      roles: {
        ...(cleanBase.roles || {}),
        ...(cleanPatch.roles || {}),
      },
    };
    if (!finalSlot.lastAuthAt) delete finalSlot.lastAuthAt;
    slots[slotIndex] = finalSlot;
  }

  return {
    activeSlot: platform?.activeSlot ?? -1,
    slots,
  };
}

export function isSlotOccupied(slot) {
  if (!slot) return false;
  if (slot.created === true) return true;
  return !!(
    slot.clientID ||
    slot.name ||
    slot.token ||
    slot.secretClient ||
    slot.guildID
  );
}