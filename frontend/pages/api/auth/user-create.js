import { getSession } from '@auth0/nextjs-auth0';

export default async function handler(req, res) {
  const session = getSession(req, res);
  if (!session || !session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { sub, name, email } = session.user;
  try {
    // Forward user info to backend /signup endpoint
    const backendRes = await fetch(`${process.env.BACKEND_URL}/api/user/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ auth0Id: sub, name, email }),
    });
    const data = await backendRes.json();
    return res.status(backendRes.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
