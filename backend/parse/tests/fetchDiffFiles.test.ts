import { fetchDiffFiles } from "../fetchDiffFiles";
import { DiffFileSchema } from "../../schemas/analysis";
import * as nock from "nock";

describe("fetchDiffFiles", () => {
  const owner = "test-owner";
  const repo = "test-repo";
  const prNumber = 123;
  const githubToken = "test-token";
  const apiUrl = `https://api.github.com`;

  const mockFiles = [
    {
      filename: "src/file1.ts",
      status: "added",
      patch: "@@ ...",
      additions: 10,
      deletions: 0,
    },
    {
      filename: "src/file2.ts",
      status: "modified",
      patch: "@@ ...",
      additions: 2,
      deletions: 1,
      previous_filename: undefined,
    },
  ];

  afterEach(() => {
    nock.cleanAll();
  });

  it("fetches and parses diff files", async () => {
    nock(apiUrl)
      .get(`/repos/${owner}/${repo}/pulls/${prNumber}/files`)
      .query(true)
      .reply(200, mockFiles);

    const { diffFiles, error } = await fetchDiffFiles({
      owner,
      repo,
      prNumber,
      githubToken,
    });
    expect(error).toBeUndefined();
    expect(diffFiles.length).toBe(2);
    for (const file of diffFiles) {
      expect(() => DiffFileSchema.parse(file)).not.toThrow();
    }
    expect(diffFiles[0].path).toBe("src/file1.ts");
    expect(diffFiles[1].status).toBe("modified");
  });

  it("handles pagination", async () => {
    const page1 = [mockFiles[0]];
    const page2 = [mockFiles[1]];
    nock(apiUrl)
      .get(`/repos/${owner}/${repo}/pulls/${prNumber}/files`)
      .query(true)
      .reply(200, page1, {
        Link: `<${apiUrl}/repos/${owner}/${repo}/pulls/${prNumber}/files?page=2>; rel="next", <${apiUrl}/repos/${owner}/${repo}/pulls/${prNumber}/files?page=2>; rel="last"`,
      });
    nock(apiUrl)
      .get(`/repos/${owner}/${repo}/pulls/${prNumber}/files`)
      .query({ page: "2" })
      .reply(200, page2);

    const { diffFiles, error } = await fetchDiffFiles({
      owner,
      repo,
      prNumber,
      githubToken,
    });
    expect(error).toBeUndefined();
    expect(diffFiles.length).toBe(2);
    expect(diffFiles[0].path).toBe("src/file1.ts");
    expect(diffFiles[1].path).toBe("src/file2.ts");
  });

  it("returns error on HTTP failure", async () => {
    nock(apiUrl)
      .get(`/repos/${owner}/${repo}/pulls/${prNumber}/files`)
      .query(true)
      .reply(404, { message: "Not found" });
    const { diffFiles, error } = await fetchDiffFiles({
      owner,
      repo,
      prNumber,
      githubToken,
    });
    expect(diffFiles).toEqual([]);
    expect(error).toMatch(/HTTP error/);
  });

  it("returns error on parse failure", async () => {
    nock(apiUrl)
      .get(`/repos/${owner}/${repo}/pulls/${prNumber}/files`)
      .query(true)
      .reply(200, [
        {
          filename: "src/file3.ts",
          status: "unknown-status",
          patch: "@@ ...",
          additions: 1,
          deletions: 1,
        },
      ]);
    const { diffFiles, error } = await fetchDiffFiles({
      owner,
      repo,
      prNumber,
      githubToken,
    });
    expect(diffFiles).toEqual([]);
    expect(error).toMatch(/Parse error/);
  });
});
