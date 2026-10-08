import { create } from 'zustand';
import type {
  Settings,
  WidgetsCfg,
  Authorizations,
  AuthFlags,
  ToolsCfg,
  NotificationSystemCfg,
} from "../types/index.ts";
import { SERVICE_STATUS } from '../utils/listStatus.js';

type Updater<T> = T | null | ((prev: T | null) => T | null);

interface AppState {
  // UI
  theme: string;
  lang: string;
  activeTab: string;
  activeModal: string | null;
  activeAuthorizationSettings: string | null;
  activeSlotIndex: number | null;

  // Initialization
  isLoaded: boolean;

  // Profile
  activeProfile: string;

  // Side panel
  sidePanelCollapsed: boolean;
  isSidePanelHovered: boolean;

  // Statuses
  statusNotificationSystem: string;
  statusDatabase: string;
  statusWidgetBracket: string;

  // Selection
  activeTournamentPlatform: string;
  activeDeliveryMethod: string;
  selectedGame: string;

  // Configs
  settings: Settings | null;
  widgets: WidgetsCfg | null;
  tools: ToolsCfg | null;
  authorizations: Authorizations | null;
  authFlags: AuthFlags;
  integrationsSelections: Record<string, Record<string, string[]>>;
  selectionsHydrated: boolean;

  // Actions
  setIsLoaded: (v: boolean) => void;
  setTheme: (t: string) => void;
  setLang: (l: string) => void;
  setActiveTab: (tab: string) => void;
  setActiveModal: (m: string | null) => void;
  setActiveAuthorizationSettings: (s: string | null) => void;
  setActiveSlotIndex: (i: number | null) => void;

  setActiveProfile: (p: string) => void;

  setSidePanelCollapsed: (v: boolean) => void;
  setIsSidePanelHovered: (v: boolean) => void;

  setStatusNotificationSystem: (s: string) => void;
  setStatusDatabase: (s: string) => void;
  setStatusWidgetBracket: (s: string) => void;

  setActiveTournamentPlatform: (p: string) => void;
  setActiveDeliveryMethod: (m: string) => void;
  setSelectedGame: (g: string) => void;

  setSettings: (v: Updater<Settings>) => void;
  setWidgets: (v: Updater<WidgetsCfg>) => void;
  setAuthorizations: (v: Updater<Authorizations>) => void;
  setAuthFlags: (v: AuthFlags | ((prev: AuthFlags) => AuthFlags)) => void;

  toggleAuthorizationSettings: (s: string | null) => void;
  setTools: (v: Updater<ToolsCfg>) => void;

  
  // Integrations selections
  setSelection: (tab: string, fieldKey: string, ids: string[]) => void;
  setIntegrationsSelections: (
    selections: Record<string, Record<string, string[]>>
  ) => void;
  clearSelectionsForSlot: (platform: string, slotIndex: number) => void;
  setSelectionsHydrated: (v: boolean) => void;
}

const defaultAuthFlags: AuthFlags = {
  startgg: false,
  discord: false,
  telegram: false,
};

export const useAppStore = create<AppState>((set) => ({
  // UI
  theme: 'dark',
  lang: 'EN',
  activeTab: 'notifications',
  activeModal: null,
  activeAuthorizationSettings: null,
  activeSlotIndex: null,

  // Initialization
  isLoaded: false,

  // Profile
  activeProfile: '',

  // Side panel
  sidePanelCollapsed: false,
  isSidePanelHovered: false,

  // Statuses
  statusNotificationSystem: SERVICE_STATUS.OFF,
  statusDatabase: SERVICE_STATUS.RUNNING,
  statusWidgetBracket: SERVICE_STATUS.OFF,

  // Selection
  activeTournamentPlatform: '',
  activeDeliveryMethod: '',
  selectedGame: 'Tekken8',

  // Configs
  // TODO: Add settings && widgets
  settings:       {} as Settings,
  widgets:        {} as WidgetsCfg,
  tools: {
    notificationSystem: {
      tournamentClientId: "",
      deliveryClients: [],
      urlToTournament: "",
      rules: { standardFormat: 2, finalsFormat: 3, rounds: 3, duration: 60, stage: "Random" },
      stream: { area: "Any", language: "EN", conn: "Wired", crossplatform: false, passcode: "0000", linkToLobby: "" },
      logo: { img: "" },
      csv: { nameFile: "" },
      game: { name: "tekken" },
    },
  },
  authorizations: {} as Authorizations,
  authFlags:      defaultAuthFlags,
  integrationsSelections: {},
  selectionsHydrated: false,

  // Actions
  setIsLoaded: (isLoaded) => set({ isLoaded }),
  setTheme: (theme) => set({ theme }),
  setLang: (lang) => set({ lang }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setActiveModal: (activeModal) => set({ activeModal }),

  setActiveAuthorizationSettings: (activeAuthorizationSettings) =>
    set({ activeAuthorizationSettings, activeSlotIndex: null }),

  setActiveSlotIndex: (activeSlotIndex) => set({ activeSlotIndex }),

  toggleAuthorizationSettings: (id) =>
    set((state) => ({
      activeAuthorizationSettings:
        state.activeAuthorizationSettings === id ? null : id,
      activeSlotIndex: null,
    })),

  setActiveProfile: (activeProfile) => set({ activeProfile }),

  setSidePanelCollapsed: (sidePanelCollapsed) => set({ sidePanelCollapsed }),
  setIsSidePanelHovered: (isSidePanelHovered) => set({ isSidePanelHovered }),

  setStatusNotificationSystem: (statusNotificationSystem) =>
    set({ statusNotificationSystem }),
  setStatusDatabase: (statusDatabase) => set({ statusDatabase }),
  setStatusWidgetBracket: (statusWidgetBracket) =>
    set({ statusWidgetBracket }),

  setActiveTournamentPlatform: (activeTournamentPlatform) =>
    set({ activeTournamentPlatform }),
  setActiveDeliveryMethod: (activeDeliveryMethod) =>
    set({ activeDeliveryMethod }),
  setSelectedGame: (selectedGame) => set({ selectedGame }),

  setSettings: (v) =>
    set((state) => ({
      settings: typeof v === 'function' ? v(state.settings) : v,
    })),
  setWidgets: (v) =>
    set((state) => ({
      widgets: typeof v === 'function' ? v(state.widgets) : v,
    })),
  setAuthorizations: (v) =>
    set((state) => ({
      authorizations: typeof v === 'function' ? v(state.authorizations) : v,
    })),
  setAuthFlags: (v) =>
    set((state) => ({
      authFlags: typeof v === 'function' ? v(state.authFlags) : v,
    })),
  setTools: (v) =>
    set((state) => ({
      tools: typeof v === 'function' ? v(state.tools) : v,
    })),

    // ============================================================
  // Integrations selections
  // ============================================================
  setSelection: (tab, fieldKey, ids) =>
    set((state) => ({
      integrationsSelections: {
        ...state.integrationsSelections,
        [tab]: {
          ...(state.integrationsSelections[tab] || {}),
          [fieldKey]: ids,
        },
      },
    })),

  clearSelectionsForSlot: (platform, slotIndex) => {
    const deadId = `${platform}:${slotIndex}`;
    set((state) => {
      const next: Record<string, Record<string, string[]>> = {};
      for (const [tab, fields] of Object.entries(state.integrationsSelections || {})) {
        next[tab] = {};
        for (const [key, ids] of Object.entries(fields || {})) {
          next[tab][key] = (ids || []).filter((id) => id !== deadId);
        }
      }
      return { integrationsSelections: next };
    });
  },

  setIntegrationsSelections: (selections) =>
    set({ integrationsSelections: selections }),
  setSelectionsHydrated: (selectionsHydrated) => set({selectionsHydrated}),
}));