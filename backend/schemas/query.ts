import { z } from "zod";

export const querySchema = z.object({
  criteria_label: z.string(),
  definition: z.string(),
  importance: z.number().min(1).max(10),
});

export type queryData = z.infer<typeof querySchema>;
