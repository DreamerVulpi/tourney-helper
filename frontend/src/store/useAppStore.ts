import { create } from 'zustand';
import type {
    Settings,
    SystemCfg,
    TourneyCfg,
    AuthStatus,
} from "../types/index.ts";
import { SERVICE_STATUS } from '../utils/listStatus.js';

type Updater<T> = T | null | ((prev: T | null) => T | null);

interface AppState {
  // ---- UI ----
  theme: string;
  lang: string;
  activeTab: string;
  activeModal: string | null;
  activeAuthorizationSettings: string | null;

  // ---- Side panel ----
  sidePanelCollapsed: boolean;
  isSidePanelHovered: boolean;

  // ---- Statuses ----
  statusNotificationSystem: string;
  statusDatabase: string;
  statusWidgetBracket: string;

  // ---- Selection ----
  activeTournamentPlatform: string;
  activeDeliveryMethod: string;
  selectedGame: string;

  // ---- Configs ----
  settings: Settings | null;
  systemCfg: SystemCfg | null;
  tourneyCfg: TourneyCfg | null;
  authStatus: AuthStatus;

  // ---- Actions ----
  setTheme: (t: string) => void;
  setLang: (l: string) => void;
  setActiveTab: (tab: string) => void;
  setActiveModal: (m: string | null) => void;
  setActiveAuthorizationSettings: (s: string | null) => void;

  setSidePanelCollapsed: (v: boolean) => void;
  setIsSidePanelHovered: (v: boolean) => void;

  setStatusNotificationSystem: (s: string) => void;
  setStatusDatabase: (s: string) => void;
  setStatusWidgetBracket: (s: string) => void;

  setActiveTournamentPlatform: (p: string) => void;
  setActiveDeliveryMethod: (m: string) => void;
  setSelectedGame: (g: string) => void;

  setSettings: (v: Updater<Settings>) => void;
  setSystemCfg: (v: Updater<SystemCfg>) => void;
  setTourneyCfg: (v: Updater<TourneyCfg>) => void;
  setAuthStatus: (v: AuthStatus | ((prev: AuthStatus) => AuthStatus)) => void;
}

const defaultAuthStatus: AuthStatus = {
  startgg: false,
  discord: false,
  telegram: false,
};

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  lang: 'EN',
  activeTab: 'notifications',
  activeModal: null,
  activeAuthorizationSettings: null,

  sidePanelCollapsed: false,
  isSidePanelHovered: false,

  statusNotificationSystem: SERVICE_STATUS.OFF,
  statusDatabase: SERVICE_STATUS.RUNNING,
  statusWidgetBracket: SERVICE_STATUS.OFF,

  activeTournamentPlatform: '',
  activeDeliveryMethod: '',
  selectedGame: 'Tekken8',

  settings:   {} as Settings,
  systemCfg:  {} as SystemCfg,
  tourneyCfg: {} as TourneyCfg,
  authStatus: defaultAuthStatus,

  setTheme: (theme) => set({ theme }),
  setLang: (lang) => set({ lang }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setActiveModal: (activeModal) => set({ activeModal }),
  setActiveAuthorizationSettings: (activeAuthorizationSettings) =>
    set({ activeAuthorizationSettings }),

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
  setSystemCfg: (v) =>
    set((state) => ({
      systemCfg: typeof v === 'function' ? v(state.systemCfg) : v,
    })),
  setTourneyCfg: (v) =>
    set((state) => ({
      tourneyCfg: typeof v === 'function' ? v(state.tourneyCfg) : v,
    })),
  setAuthStatus: (v) =>
    set((state) => ({
      authStatus: typeof v === 'function' ? v(state.authStatus) : v,
    })),
}));