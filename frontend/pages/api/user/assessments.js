// Forward POST and GET requests to backend /api/user/assessments
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Ensure auth0Id is present
      let body = req.body;
      if (!body.auth0Id) {
        const user = JSON.parse(req.cookies.user || '{}');
        if (user.sub) body.auth0Id = user.sub;
      }
      const backendRes = await fetch(`${process.env.BACKEND_URL}/api/user/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const text = await backendRes.text();
      let data;
      try { data = JSON.parse(text); } catch { data = text; }
      if (!backendRes.ok) {
        console.error('Backend error:', data);
      }
      return res.status(backendRes.status).json(data);
    } catch (error) {
      console.error('Frontend API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    try {
      const { auth0Id } = req.query;
      const backendRes = await fetch(`${process.env.BACKEND_URL}/api/user/assessments?auth0Id=${encodeURIComponent(auth0Id)}`);
      const text = await backendRes.text();
      let data;
      try { data = JSON.parse(text); } catch { data = text; }
      if (!backendRes.ok) {
        console.error('Backend error:', data);
      }
      return res.status(backendRes.status).json(data);
    } catch (error) {
      console.error('Frontend API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
