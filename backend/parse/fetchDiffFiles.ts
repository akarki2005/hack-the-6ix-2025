// 3. Fetch PR file diffs from GitHub
//    - Uses the GitHub REST API: GET /repos/{owner}/{repo}/pulls/{prNumber}/files

import { DiffFile, DiffFileSchema } from "../schemas/analysis";

//    - Requires a token with repo permissions.
interface FetchDiffFilesInput {
  owner: string;
  repo: string;
  prNumber: number;
  githubToken: string;
}

interface FetchDiffFilesOutput {
  diffFiles: DiffFile[];
  error?: string;
}

export async function fetchDiffFiles(
  input: FetchDiffFilesInput
): Promise<FetchDiffFilesOutput> {
  const { owner, repo, prNumber, githubToken } = input;
  let url = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=100`;
  const diffFiles: DiffFile[] = [];
  const headers = {
    Authorization: `token ${githubToken}`,
    Accept: "application/vnd.github.v3+json",
  };
  try {
    while (url) {
      const res = await fetch(url, { headers });
      if (!res.ok) {
        return { diffFiles: [], error: `HTTP error: ${res.status}` };
      }
      const data = await res.json();
      for (const item of data) {
        try {
          const parsed = DiffFileSchema.parse({
            path: item.filename,
            status: item.status === "added" || item.status === "removed" || item.status === "modified" || item.status === "renamed" ? item.status : "modified",
            patch: item.patch,
            additions: item.additions,
            deletions: item.deletions,
            previousPath: item.previous_filename,
          });
          diffFiles.push(parsed);
        } catch (e) {
          return { diffFiles: [], error: `Parse error: ${e}` };
        }
      }
      // Pagination: look for next link
      const link = res.headers.get("link");
      if (link) {
        const match = link.match(/<([^>]+)>; rel="next"/);
        url = match ? match[1] : "";
      } else {
        url = "";
      }
    }
    return { diffFiles };
  } catch (e) {
    return { diffFiles: [], error: String(e) };
  }
}
