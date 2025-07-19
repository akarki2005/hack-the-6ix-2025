// 1. Validate & parse a PR URL
interface ValidatePrLinkInput {
  url: string;
}
interface ValidatePrLinkOutput {
  ok: boolean;
  // when ok=true, these are filled:
  owner?: string; // e.g. "octocat"
  repo?: string; // e.g. "hello-world"
  prNumber?: number; // e.g. 42
  error?: string; // on ok=false
}

export default function validatePrLink(
  input: ValidatePrLinkInput
): ValidatePrLinkOutput {
  const url = input.url.trim();
  const regex = /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/;
  const match = url.match(regex);
  if (match) {
    const [, owner, repo, prNumberStr] = match;
    const prNumber = Number(prNumberStr);
    if (!isNaN(prNumber)) {
      return { ok: true, owner, repo, prNumber };
    }
    return { ok: false, error: "Invalid PR number in URL" };
  }
  return { ok: false, error: "Invalid GitHub PR URL" };
}
