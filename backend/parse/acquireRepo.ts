import * as path from "path";
import { execSync } from "child_process";
import fixExtensions from "./fixExtensions";

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
