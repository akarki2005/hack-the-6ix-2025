import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import * as dotenv from "dotenv";
dotenv.config();

// Define a custom check instead of instanceof
export const LLMSchema = z.object({
  ai: z.custom<GoogleGenAI>((val) => val instanceof GoogleGenAI, {
    message: "ai must be an instance of GoogleGenAI",
  }),
});

export type LLM = z.infer<typeof LLMSchema>;

export function createLLMFromEnv(): LLM {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set in environment");
  return { ai: new GoogleGenAI({}) };
}
