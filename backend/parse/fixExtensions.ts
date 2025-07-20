import * as fs from "fs";
import * as path from "path";
import { walkFiles, guessTestExtension } from "../generate/utils";

/**
 * Scan the cloned repository and rename files so their extension matches
 * the syntax they actually contain (js/jsx/ts/tsx).
 *
 * This solves problems where React components are stored in `.js` files
 * but contain JSX, which breaks TypeScript tooling.  We reuse the existing
 * `guessTestExtension` heuristic to decide the right extension.
 */
export default function fixExtensions(repoRoot: string): void {
  // consider typical code file extensions
  const codeExts = new Set([".js", ".jsx", ".ts", ".tsx"]);
  // ignore large/irrelevant directories
  const ignore = new Set(["node_modules", ".git"]);

  const files = walkFiles(repoRoot, codeExts, ignore);

  for (const absPath of files) {
    try {
      const currentExt = path.extname(absPath).toLowerCase(); // includes leading '.'
      const code = fs.readFileSync(absPath, "utf8");
      const suggestedExtWithoutDot = guessTestExtension(code, absPath);
      const suggestedExt = "." + suggestedExtWithoutDot;

      if (suggestedExt === currentExt) continue; // already correct

      const targetPath = absPath.slice(0, -currentExt.length) + suggestedExt;
      // If a file with the desired name already exists, skip to avoid overwrite
      if (fs.existsSync(targetPath)) continue;

      fs.renameSync(absPath, targetPath);
    } catch (err) {
      // Log and continue; we don't want a single failure to abort the pipeline
      console.error(`fixExtensions: failed processing ${absPath}:`, err);
    }
  }
} 