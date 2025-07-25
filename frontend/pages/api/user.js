export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { auth0Id, name, email } = req.body;
    if (!auth0Id || !name || !email) {
      return res.status(400).json({ error: 'Missing user info' });
    }
    try {
      console.log("POST /api/user", req.body);
      console.log("NEXT_PUBLIC_BACKEND_URL", process.env.NEXT_PUBLIC_BACKEND_URL);
      // Forward user info to backend /api/user/login endpoint
      const backendRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ auth0Id, name, email }),
      });
      const data = await backendRes.json();
      return res.status(backendRes.status).json(data);
    } catch (error) {
      console.error("POST /api/user → fetch failed:", error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
