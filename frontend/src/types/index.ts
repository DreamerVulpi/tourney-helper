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
}

export interface WidgetsCfg {
  bracket: WidgetBracket;
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
  connection: string;
  crossplatform: boolean;
  passcode: string;
  linkToLobby: string;
}

export interface TournamentCfg {
  urlToTournament: string;
  rules: RulesMatches;
  stream: StreamLobby;
  logo: { img: string };
  csv: { nameFile: string };
  game: { name: string };
}

export interface ClientCredentials {
  name: string;
  clientID: string;
  secretClient: string;
  token: string;
  guildID: string;
  debugChannelID: string;
  roles: {
    default: string;
    ru: string;
    en: string;
  };
}

export interface PlatformAuthorizations {
  activeSlot: number;
  slots: ClientCredentials[]; // всегда длина 5
}

export interface Authorizations {
  startgg: PlatformAuthorizations;
  challonge: PlatformAuthorizations;
  discord: PlatformAuthorizations;
  telegram: PlatformAuthorizations;
}

export type AuthStatus =
  | "unknown"
  | "pending"
  | "authorized"
  | "unauthorized"
  | "expired"
  | "error"
  | "invalid";

export interface ClientCredentials {
  name: string;
  clientID: string;
  secretClient: string;
  token: string;
  guildID: string;
  debugChannelID: string;
  roles: { default: string; ru: string; en: string };
  status: AuthStatus;
  statusReason: string;
  lastAuthAt?: string;
}