import acquireRepo from "../acquireRepo";
import * as child_process from "child_process";
import * as path from "path";

describe("acquireRepo", () => {
  let execSyncSpy: jest.SpyInstance;

  afterEach(() => {
    if (execSyncSpy) execSyncSpy.mockRestore();
  });

  it("should clone the repo and return the resolved path", () => {
    execSyncSpy = jest
      .spyOn(child_process, "execSync")
      .mockImplementation(() => undefined as any);
    const input = {
      cloneUrl: "https://github.com/octocat/hello-world.git",
      destination: "./test-repo",
    };
    const result = acquireRepo(input);
    expect(execSyncSpy).toHaveBeenCalledWith(
      `git clone ${input.cloneUrl} ${input.destination}`,
      { stdio: "ignore" }
    );
    expect(result.repoRoot).toBe(path.resolve(input.destination));
    expect(result.error).toBeUndefined();
  });

  it("should use default destination if not provided", () => {
    execSyncSpy = jest
      .spyOn(child_process, "execSync")
      .mockImplementation(() => undefined as any);
    const input = {
      cloneUrl: "https://github.com/octocat/hello-world.git",
    };
    const result = acquireRepo(input);
    expect(execSyncSpy).toHaveBeenCalledWith(
      `git clone ${input.cloneUrl} ./repo`,
      { stdio: "ignore" }
    );
    expect(result.repoRoot).toBe(path.resolve("./repo"));
    expect(result.error).toBeUndefined();
  });

  it("should return error if git clone fails", () => {
    const errorMsg = "git error";
    execSyncSpy = jest
      .spyOn(child_process, "execSync")
      .mockImplementation(() => {
        throw new Error(errorMsg);
      });
    const input = {
      cloneUrl: "https://github.com/octocat/hello-world.git",
      destination: "./fail-repo",
    };
    const result = acquireRepo(input);
    expect(result.repoRoot).toBe("");
    expect(result.error).toContain(errorMsg);
  });
});
