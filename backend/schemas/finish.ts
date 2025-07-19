import { z } from "zod";

export const finishedRequestSchema = z.object({
  id: z.number(),
});

export type finishedRequestData = z.infer<typeof finishedRequestSchema>;

export const finishedResponseSchema = z.object({
  completed: z.boolean(),
});

export type finishedResponseData = z.infer<typeof finishedResponseSchema>;
