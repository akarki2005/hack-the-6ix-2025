import validatePrLink from "../validatePr";

describe("validatePrLink", () => {
  it("should parse a valid GitHub PR URL", () => {
    const input = { url: "https://github.com/octocat/hello-world/pull/42" };
    const result = validatePrLink(input);
    expect(result.ok).toBe(true);
    expect(result.owner).toBe("octocat");
    expect(result.repo).toBe("hello-world");
    expect(result.prNumber).toBe(42);
    expect(result.error).toBeUndefined();
  });

  it("should trim and parse a valid URL with spaces", () => {
    const input = {
      url: "   https://github.com/octocat/hello-world/pull/123   ",
    };
    const result = validatePrLink(input);
    expect(result.ok).toBe(true);
    expect(result.owner).toBe("octocat");
    expect(result.repo).toBe("hello-world");
    expect(result.prNumber).toBe(123);
    expect(result.error).toBeUndefined();
  });

  it("should fail for a non-PR GitHub URL", () => {
    const input = { url: "https://github.com/octocat/hello-world/issues/42" };
    const result = validatePrLink(input);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Invalid GitHub PR URL");
  });

  it("should fail for a malformed URL", () => {
    const input = { url: "not a url" };
    const result = validatePrLink(input);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Invalid GitHub PR URL");
  });

  it("should fail for a PR URL with non-numeric PR number", () => {
    const input = { url: "https://github.com/octocat/hello-world/pull/abc" };
    const result = validatePrLink(input);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Invalid GitHub PR URL");
  });

  it("should fail for a PR URL with missing parts", () => {
    const input = { url: "https://github.com/octocat/hello-world/pull/" };
    const result = validatePrLink(input);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Invalid GitHub PR URL");
  });
});
