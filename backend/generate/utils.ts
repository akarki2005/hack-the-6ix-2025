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
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-001",
      contents: query,
    });
    return response.text ?? "llm failed to generate";
  } catch (err) {
    if (err instanceof Error) {
      return err.message;
    } else {
      return "Unknown error";
    }
  }
}

export function stripCodeFences(output) {
  // Remove opening fence e.g. ``` or ```javascript
  const withoutOpening = output.replace(/^```(?:\w*)\s*\n/, "");
  // Remove closing fence ```
  return withoutOpening.replace(/```$/, "");
}

export function guessTestExtension(
  testCode: string,
  sourceFilePath?: string
): string {
  let hasTypeScript = false;
  let hasJSX = false;
  let hasReact = false;

  // Check source file extension first if available
  if (sourceFilePath) {
    const sourceExt = path.extname(sourceFilePath);
    if (sourceExt === ".ts") hasTypeScript = true;
    if (sourceExt === ".tsx") {
      hasTypeScript = true;
      hasJSX = true;
      hasReact = true;
    }
    if (sourceExt === ".jsx") {
      hasJSX = true;
      hasReact = true;
    }
  }

  // Analyze test code content
  // TypeScript indicators
  if (
    /: *[A-Za-z0-9_<>|\[\]]+\b/.test(testCode) || // type annotations
    /import type/.test(testCode) || // type imports
    /interface\s+\w+/.test(testCode) || // interfaces
    /type\s+\w+\s*=/.test(testCode) || // type aliases
    /<[A-Z]\w*>/.test(testCode) || // generic types
    /as\s+[A-Z]\w*/.test(testCode) // type assertions
  ) {
    hasTypeScript = true;
  }

  // JSX/React indicators
  if (
    /import.*React/.test(testCode) || // React imports
    /from\s+['"]react['"]/.test(testCode) || // React imports
    /<[A-Z]\w*[\s/>]/.test(testCode) || // JSX components
    /jsx\s*\(/i.test(testCode) || // jsx function calls
    /render\s*\(/.test(testCode) || // React testing
    /screen\./.test(testCode) || // React testing library
    /fireEvent\./.test(testCode) // React testing library
  ) {
    hasJSX = true;
    hasReact = true;
  }

  // Determine extension based on analysis
  if (hasTypeScript && hasJSX) {
    return "tsx";
  } else if (hasTypeScript) {
    return "ts";
  } else if (hasJSX) {
    return "jsx";
  } else {
    return "js";
  }
}

export function copyTestsFolder(
  repoRoot: string,
  studentRepoRoot: string
): void {
  const src = path.join(repoRoot, "tests");
  const dest = path.join(studentRepoRoot, "tests");

  if (!fs.existsSync(src)) {
    throw new Error(`Source tests folder not found at ${src}`);
  }

  // ensure destination parent exists
  fs.mkdirSync(path.dirname(dest), { recursive: true });

  // Node 16+ has fs.cpSync
  if (typeof fs.cpSync === "function") {
    fs.cpSync(src, dest, { recursive: true, force: true });
  } else {
    // fallback for older Node versions
    const copyDir = (srcDir: string, destDir: string) => {
      fs.mkdirSync(destDir, { recursive: true });
      for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
        const srcPath = path.join(srcDir, entry.name);
        const destPath = path.join(destDir, entry.name);
        if (entry.isDirectory()) {
          copyDir(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    };
    copyDir(src, dest);
  }
}
