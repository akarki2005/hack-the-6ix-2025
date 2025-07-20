import { GoogleGenAI } from "@google/genai";
import { generate } from "../utils"; // adjust path as needed
import * as dotenv from "dotenv";
dotenv.config();

const key = process.env.GEMINI_API_KEY;

describe("generate", () => {
  it("returns a string response from Gemini", async () => {
    if (!key) throw new Error("Missing GEMINI_API_KEY");
    const ai = new GoogleGenAI({});
    const result = await generate(ai, "Say hello in French.");
    console.log(result);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  }, 10000); // optional timeout
});
