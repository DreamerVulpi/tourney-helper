import { create } from 'zustand';
import type {
  Settings,
  TournamentCfg,
  WidgetsCfg,
  Authorizations,
  AuthStatus,
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
  tournament: TournamentCfg | null;
  widgets: WidgetsCfg | null;
  authorizations: Authorizations | null;
  authStatus: AuthStatus;

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
  setTournament: (v: Updater<TournamentCfg>) => void;
  setWidgets: (v: Updater<WidgetsCfg>) => void;
  setAuthorizations: (v: Updater<Authorizations>) => void;
  setAuthStatus: (v: AuthStatus | ((prev: AuthStatus) => AuthStatus)) => void;

  toggleAuthorizationSettings: (s: string | null) => void;
}

const defaultAuthStatus: AuthStatus = {
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
  settings:       {} as Settings,
  tournament:     {} as TournamentCfg,
  widgets:        {} as WidgetsCfg,
  authorizations: {} as Authorizations,
  authStatus:     defaultAuthStatus,

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
      activeSlotIndex: null, // сбрасываем выбранный слот при смене платформы
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

  // ---- Config setters (универсальные) ----
  setSettings: (v) =>
    set((state) => ({
      settings: typeof v === 'function' ? v(state.settings) : v,
    })),
  setTournament: (v) =>
    set((state) => ({
      tournament: typeof v === 'function' ? v(state.tournament) : v,
    })),
  setWidgets: (v) =>
    set((state) => ({
      widgets: typeof v === 'function' ? v(state.widgets) : v,
    })),
  setAuthorizations: (v) =>
    set((state) => ({
      authorizations: typeof v === 'function' ? v(state.authorizations) : v,
    })),
  setAuthStatus: (v) =>
    set((state) => ({
      authStatus: typeof v === 'function' ? v(state.authStatus) : v,
    })),
}));