interface ValidatePrLinkInput {
  url: string;
}

interface ValidatePrLinkOutput {
  ok: boolean;
  owner?: string;
  repo?: string;
  prNumber?: number;
  cloneUrl?: string;
  error?: string;
}

export default function validatePrLink(
  input: ValidatePrLinkInput
): ValidatePrLinkOutput {
  const url = input.url.trim();
  const regex = /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/;
  const match = url.match(regex);
  if (!match) {
    return { ok: false, error: "Invalid GitHub PR URL" };
  }

  const [, owner, repo, prNumberStr] = match;
  const prNumber = Number(prNumberStr);

  if (!isNaN(prNumber)) {
    const cloneUrl = `https://github.com/${owner}/${repo}.git`;
    return { ok: true, owner, repo, prNumber, cloneUrl };
  }

  return { ok: false, error: "Invalid PR number in URL" };
}
