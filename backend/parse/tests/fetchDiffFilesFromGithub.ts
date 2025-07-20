// testFetch.ts
import { fetchDiffFiles } from "../fetchDiffFiles";
import * as dotenv from "dotenv";
dotenv.config();

(async () => {
  // https://github.com/vercel/next.js/pull/81847
  const owner = "vercel";
  const repo = "next.js";
  const prNumber = 81847;
  const token = process.env.GITHUB_TOKEN!;
  if (!token) {
    console.error("Set GITHUB_TOKEN env var");
    process.exit(1);
  }

  const { diffFiles, error } = await fetchDiffFiles({
    owner,
    repo,
    prNumber,
    githubToken: token,
  });

  if (error) {
    console.error("Error fetching diffs:", error);
    process.exit(1);
  }
  console.log(JSON.stringify(diffFiles, null, 2));
})();
