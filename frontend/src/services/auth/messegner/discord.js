import { AuthorizeDiscord } from "../../../../wailsjs/go/application/App.js";

export const authorizeDiscord = async ({
  clientID,
  secretClient,
  slotIndex,
}) => {
  return await AuthorizeDiscord(clientID, secretClient, slotIndex);
};