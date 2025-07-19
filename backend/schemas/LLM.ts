import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

export const LLMSchema = z.object({
  ai: GoogleGenAI,
});

export type LLM = z.infer<typeof LLMSchema>;
