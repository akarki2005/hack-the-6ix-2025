// pages/api/webhooks.js
import crypto from 'crypto';

export const config = { api: { bodyParser: false } };

const secret = process.env.GITHUB_WEBHOOK_SECRET;

function buffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function verify(signature, raw) {
  if (!signature || !signature.startsWith('sha256=')) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(raw).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  const raw = await buffer(req);
  const sig = req.headers['x-hub-signature-256'];
  if (!verify(sig, raw)) return res.status(401).send('Bad signature');

  const event = req.headers['x-github-event'];
  const body = JSON.parse(raw.toString('utf8'));

  if (
    event === 'pull_request' &&
    ['opened'].includes(body.action) &&
    body.pull_request.base.ref === 'main'
  ) {
    console.log(body);

  }

  res.status(204).end();
}
