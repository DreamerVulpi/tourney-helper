import { AuthorizeStartgg } from "../../../../wailsjs/go/application/App.js";

export const authorizeStartgg = async ({
  clientID,
  secretClient,
}) => {
  return await AuthorizeStartgg(clientID, secretClient);
};