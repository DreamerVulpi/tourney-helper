import { Trophy, Mail, Send, Link2 } from "lucide-react";
import { isAuthorized, needsReauth } from "./authStatus";
import { isSlotOccupied } from "./authorizations";

export const PLATFORM_META = {
  startgg:    { label: "Start.gg",   icon: Trophy, category: "tournament" },
  challonge:  { label: "Challonge",  icon: Trophy, category: "tournament" },
  toornament: { label: "Toornament", icon: Trophy, category: "tournament" },
  discord:    { label: "Discord",    icon: Mail,   category: "delivery"  },
  telegram:   { label: "Telegram",   icon: Send,   category: "delivery"  },
  email:      { label: "E-mail",     icon: Mail,   category: "delivery"  },
};

const getMeta = (platformId) =>
  PLATFORM_META[platformId] || { label: platformId, icon: Link2, category: "other" };

export function buildAuthorizedIntegrationItems(authorizations) {
  const result = [];

  for (const [platformId, platform] of Object.entries(authorizations || {})) {
    const slots = platform?.slots || [];

    slots.forEach((slot, index) => {
      if (!isSlotOccupied(slot)) return;
      if (!isAuthorized(slot.status) && !needsReauth(slot.status)) return;

      const meta = getMeta(platformId);

      const clientName = slot.name || `Client #${index + 1}`;
      const shortName = truncate(clientName, 9);

      result.push({
        id: `${platformId}:${index}`,
        value: `${platformId}:${index}`,
        clientName,
        platform: meta.label,
        platformId,
        slotIndex: index,
        icon: meta.icon,
        category: meta.category,
        label: `${shortName} | ${meta.label}`,
        status: slot.status,
        needsReauth: needsReauth(slot.status),
      });
    });
  }

  result.sort((a, b) =>
    a.platformId === b.platformId
      ? a.slotIndex - b.slotIndex
      : a.platformId.localeCompare(b.platformId)
  );

  return result;
}

export function parseIntegrationValue(value) {
  const [platformId, slotIndexStr] = String(value).split(":");
  return { platformId, slotIndex: Number(slotIndexStr) };
}

export function filterValidSelection(selectedValues, items) {
  if (!selectedValues?.length) return [];
  const valid = new Set(items.map((i) => i.value));
  return selectedValues.filter((v) => valid.has(v));
}

export function truncate(str, max = 9) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + ".." : str;
}

export const getAllBusyIds = (selections, excludeTab, excludeField) => {
  const busy = new Set();
  for (const [tab, fields] of Object.entries(selections || {})) {
    for (const [key, ids] of Object.entries(fields || {})) {
      if (tab === excludeTab && key === excludeField) continue;
      (ids || []).forEach((id) => busy.add(id));
    }
  }
  return busy;
};

export function pruneSelections(selections, authorizations) {
  const allItems = buildAuthorizedIntegrationItems(authorizations);
  const validIds = new Set(allItems.map((i) => i.value));

  const next = {};
  for (const [tab, fields] of Object.entries(selections || {})) {
    next[tab] = {};
    for (const [key, ids] of Object.entries(fields || {})) {
      next[tab][key] = (ids || []).filter((id) => validIds.has(id));
    }
  }
  return next;
}