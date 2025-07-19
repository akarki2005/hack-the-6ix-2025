import * as fs from "fs";
import * as path from "path";
import { GoogleGenAI } from "@google/genai";

// Helper: read JSON if exists
export function readJSON(filePath: string): any {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Helper: recursively walk directory for code files
export function walkFiles(
  dir: string,
  exts: Set<string>,
  ignore: Set<string> = new Set()
): string[] {
  const results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const name of list) {
    if (ignore.has(name)) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results.push(...walkFiles(full, exts, ignore));
    } else if (exts.has(path.extname(name))) {
      results.push(full);
    }
  }
  return results;
}

export async function generate(
  ai: GoogleGenAI,
  query: string
): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-001",
    contents: query,
  });
  return response.text ?? "";
}
