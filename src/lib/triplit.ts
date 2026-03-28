import { TriplitClient } from "@triplit/client";
import { schema } from "../../triplit/schema";

export const client = new TriplitClient({
  schema,
  storage: "indexeddb",
  ...(import.meta.env.VITE_TRIPLIT_SERVER_URL
    ? {
        serverUrl: import.meta.env.VITE_TRIPLIT_SERVER_URL,
        token: import.meta.env.VITE_TRIPLIT_TOKEN,
      }
    : {}),
});
