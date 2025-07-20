import { z } from "zod";

export const requestResultsRequestSchema = z.object({
  id: z.string(),
});

export type requestResultsRequestData = z.infer<
  typeof requestResultsRequestSchema
>;

export const requestResultsResponseSchema = z.object({
  comments: z.string(),
  grade: z.number().min(1).max(100),
});

export type requestResultsResponseData = z.infer<
  typeof requestResultsResponseSchema
>;
