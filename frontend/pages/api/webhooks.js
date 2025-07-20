// pages/api/webhooks.js
import crypto from "crypto";

export const config = { api: { bodyParser: false } };

const secret = process.env.GITHUB_WEBHOOK_SECRET;

function buffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function verify(signature, raw) {
  if (!signature || !signature.startsWith("sha256=")) return false;
  const expected =
    "sha256=" + crypto.createHmac("sha256", secret).update(raw).digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  const raw = await buffer(req);
  const sig = req.headers["x-hub-signature-256"];
  if (!verify(sig, raw)) return res.status(401).send("Bad signature");

  const event = req.headers["x-github-event"];
  const body = JSON.parse(raw.toString("utf8"));

  if (
    event === "pull_request" &&
    ["opened"].includes(body.action) &&
    body.pull_request.base.ref === "main"
  ) {
    // NEW: forward the PR link to the backend /grade route
    const prLink = body.pull_request?.html_url;
    const user = body.pull_request.user.login;
    const repo = body.repository.name;
    try {
      const backendBase = process.env.BACKEND_URL || "http://localhost:4000";
      const resp = await fetch(`${backendBase}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prLink, user, repo }),
      });

      if (!resp.ok) {
        console.error(
          `/grade responded with ${resp.status} ${resp.statusText}`
        );
      }
    } catch (err) {
      console.error("Failed to call /grade:", err);
    }
  }

  res.status(204).end();
}
