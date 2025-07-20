import * as path from "path";
import { execSync } from "child_process";
import fixExtensions from "./fixExtensions";
import * as fs from "fs";

export interface AcquireRepoInput {
  cloneUrl: string; // e.g. "https://github.com/octocat/hello-world.git"
  destination?: string; // local folder (default: "./repo")
}
export interface AcquireRepoOutput {
  repoRoot: string; // absolute path on disk
  error?: string; // if clone/download fails
}

export default function acquireRepo(
  input: AcquireRepoInput
): AcquireRepoOutput {
  const dest = input.destination || "./repo";

  try {
    // If destination already exists, attempt to update it instead of cloning
    if (fs.existsSync(dest)) {
      try {
        // Perform a fast-forward pull if possible
        execSync(`git -C ${dest} pull --ff-only`, { stdio: "ignore" });
        const repoRoot = path.resolve(dest);
        try {
          fixExtensions(repoRoot);
        } catch (err) {
          console.error("fixExtensions failed", err);
        }
        return { repoRoot };
      } catch (pullErr) {
        // Pull failed (maybe not a git repo or diverged). Wipe and reclone.
        try {
          fs.rmSync(dest, { recursive: true, force: true });
        } catch {
          /* ignore */
        }
      }
    }

    // Fresh clone path
    execSync(`git clone ${input.cloneUrl} ${dest}`, { stdio: "ignore" });
    const repoRoot = path.resolve(dest);
    try {
      fixExtensions(repoRoot);
    } catch (err) {
      console.error("fixExtensions failed", err);
    }
    return { repoRoot };
  } catch (err: any) {
    return { repoRoot: "", error: err.message || String(err) };
  }
}
