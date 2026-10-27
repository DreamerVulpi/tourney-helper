import { AuthorizeStartgg } from "../../../../wailsjs/go/application/App.js";

export const authorizeStartgg = async ({
  clientID,
  secretClient,
  slotIndex,
}) => {
  return await AuthorizeStartgg(clientID, secretClient, slotIndex);
};