export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.RUNWAYML_API_SECRET) return res.status(503).json({ error: 'RUNWAYML_API_SECRET belum dipasang di Vercel.' });
  const id = String(req.query.id || '');
  if (!id) return res.status(400).json({ error: 'Task id wajib diisi.' });
  try {
    const r = await fetch(`https://api.dev.runwayml.com/v1/tasks/${encodeURIComponent(id)}`, {
      headers: {
        Authorization: `Bearer ${process.env.RUNWAYML_API_SECRET}`,
        'X-Runway-Version': '2024-11-06',
      },
    });
    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Task lookup failed' });
  }
}
