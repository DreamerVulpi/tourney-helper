export interface Settings {
  Language: string;
  Theme: string;
  CheckUpdatesOnStartUp: boolean;
  IgnoredVersion: string;
  SidePanelCollapsed: boolean;
  DebugMode: boolean;
}

export interface WidgetBracket {
  urlToTournament: string;
  bracketId: string;
  theme: string;
  clearBackground: boolean;
  hideStages: boolean;
  bracketMode: string;
  scale: number;
  autoRefresh: boolean;
  clientId: string | null;
}

export interface WidgetsCfg {
  bracket: WidgetBracket;
}

export interface ToolsCfg {
  notificationSystem: NotificationSystemCfg;
}

export interface RulesMatches {
  standardFormat: number;
  finalsFormat: number;
  stage: string;
  rounds: number;
  duration: number;
}

export interface StreamLobby {
  area: string;
  language: string;
  conn: string;
  crossplatform: boolean;
  passcode: string;
  linkToLobby: string;
}

export interface DeliveryClientRef {
  platform: string;
  clientId: string;
}

export interface NotificationSystemCfg {
  deliveryClients: DeliveryClientRef[];
  urlToTournament: string;
  rules: RulesMatches;
  stream: StreamLobby;
  logo: { img: string };
  csv: { nameFile: string };
  game: { name: string };
}

/** Статус одного клиента/слота */
export type AuthSlotStatus =
  | "unknown"
  | "pending"
  | "authorized"
  | "unauthorized"
  | "expired"
  | "error"
  | "invalid";

export interface ClientCredentials {
  id: string;
  name: string;
  clientID: string;
  secretClient: string;
  token: string;
  guildID: string;
  debugChannelID: string;
  roles: { default: string; ru: string; en: string };
  status: AuthSlotStatus;
  statusReason: string;
  lastAuthAt?: string;
}

export interface PlatformAuthorizations {
  activeSlot: number;
  slots: ClientCredentials[];
}

export interface Authorizations {
  startgg: PlatformAuthorizations;
  challonge: PlatformAuthorizations;
  discord: PlatformAuthorizations;
  telegram: PlatformAuthorizations;
}

/** Флаги «есть ли хотя бы один авторизованный слот» по платформам */
export interface AuthFlags {
  startgg: boolean;
  discord: boolean;
  telegram: boolean;
}