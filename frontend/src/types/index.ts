export interface Settings {
    Language?: string;
    Theme?: string;
    CheckUpdatesOnStartUp?: boolean;
    IgnoredVersion?: string;
    SidePanelCollapsed?: boolean;
}

export interface DiscordRoles {
    default: string;
    ru: string;
    en: string;
}

export interface DiscordCfg {
    token?: string;
    roles?: Partial<DiscordRoles>;
    clientID?: string;
    secretClient?: string;
    guildID?: string;
    debugChannelID?: string;
}

export interface TelegramRoles {
    default: string;
    ru: string;
    en: string;
}

export interface TelegramCfg {
    token?: string;
    roles?: Partial<DiscordRoles>;
    clientID?: string;
    secretClient?: string;
    guildID?: string;
    debugChannelID?: string;
}

export interface DebugCfg {
    mode: boolean;
}

export interface DatabaseCfg {
    dsn: string;
}

export interface SystemCfg {
    discord?: DiscordCfg;
    telegram?: TelegramCfg;

    debug?: DebugCfg;
    database?: DatabaseCfg;
}

export interface WidgetBracketCfg {
  urlToTournament: string;
  bracketId: string;
  bracket: string;
  theme: string;              // "Default"
  hideStages: boolean;
  clearBackground: boolean;
  bracketMode: string;        // "all" | ... (см. ниже)
  scale: number;              // 1.0
}

export interface StartggCfg {
  clientID: string;
  secretClient: string;
  name: string;               // "startgg"
}

export interface ChallongeCfg {
  clientID: string;
  secretClient: string;
  name: string;               // "challonge"
}

export interface LogoCfg {
  img: string;
}

export interface RulesCfg {
  standardFormat: number;     // 2
  finalsFormat: number;       // 3
  rounds: number;             // 3
  duration: number;           // 60 (минут)
  stage: string;              // "Any"
  crossplatform: boolean;
}

export interface StreamCfg {
  area: string;
  language: string;
  connection: string;
  crossplatform: boolean;
  passcode: string;
  linkToLobby: string;
}

export interface GameCfg {
  name: string;
}

export interface TourneyCfg {
  widgetBracket: WidgetBracketCfg;

  urlToTournament: string;

  startgg: StartggCfg;
  challonge: ChallongeCfg;
  logo: LogoCfg;
  rules: RulesCfg;
  stream: StreamCfg;
  game: GameCfg;
}

export interface AuthStatus {
    startgg: boolean;
    discord: boolean;
    telegram: boolean;
}