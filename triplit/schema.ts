import { Schema as S, ClientSchema } from "@triplit/client";

export const schema = {
  entries: {
    schema: S.Schema({
      id: S.Id(),
      good: S.Number(),
      bad: S.Number(),
      naivete: S.Number(),

      created_at: S.Date(),
    }),
  },
  day_notes: {
    schema: S.Schema({
      id: S.Id(),
      note: S.String(),
    }),
  },
} satisfies ClientSchema;
