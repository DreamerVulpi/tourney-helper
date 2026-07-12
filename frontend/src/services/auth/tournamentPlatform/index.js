import { authorizeStartgg } from "./startgg.js";

const platformHandlers = {
  startgg: authorizeStartgg,
};

export const authorizeTournamentPlatform = async (
  platformName,
  config
) => {
  const handler = platformHandlers[platformName];

  if (!handler) {
    throw new Error(
      `Tournament platform ${platformName} is not supported`
    );
  }

  return await handler(config);
};