export const DEFAULT_SCOREBOARD_SIDE = {
  teamTag: "",
  name: "Player",
  resetIcon: "",
  resetIconData: "",
  resetIconScale: 1,
  logoPath: "",
  flag: "",
  plateImage: "",
  points: 0,
  scoreOffsetX: 0,
  scoreOffsetY: 0,
  scoreFontSize: 28,
  showLogo: true,
  showFlag: true,
  showReset: false,
};

export const defaultScoreboardSide = (side) => ({
  ...DEFAULT_SCOREBOARD_SIDE,
  name: side === "P2" ? "Player 2" : "Player 1",
});

export const createDefaultScoreboardSlot = () => ({
  theme: "default",
  titleMatch: "CUSTOM NAME",
  fontFamily: "",
  mainFontSize: 24,
  hideLogos: false,
  hideFlags: false,
  scale: 1.0,
  sideGap: 480,
  sideWidth: 460,
  plateMode: "builtin",
  format: "FT2",
  P1: defaultScoreboardSide("P1"),
  P2: defaultScoreboardSide("P2"),
});

export const createDefaultBracketSlot = () => ({
  urlToTournament: "",
  bracketId: "",
  theme: "Default",
  clearBackground: false,
  hideStages: false,
  bracketMode: "all",
  scale: 1.0,
  autoRefresh: false,
});
