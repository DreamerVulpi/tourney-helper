import { authorizeDiscord } from "./discord.js";

const authHandlers = {
  discord: authorizeDiscord,
};

export const AuthorizeMessenger = async (
  messengerName,
  config
) => {
  const authHandler = authHandlers[messengerName];

  if (!authHandler) {
    throw new Error(
      `Authorization handler for ${messengerName} not found`
    );
  }

  return await authHandler(config);
};