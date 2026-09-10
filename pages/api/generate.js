export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.RUNWAYML_API_SECRET) return res.status(503).json({ error: 'RUNWAYML_API_SECRET belum dipasang di Vercel.' });
  const { prompt, model = 'h3_max', duration = 5, resolution = '480p', ratio = '720:1280' } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Prompt wajib diisi.' });

  const body = {
    model,
    promptText: prompt,
    duration: Number(duration),
  };

  // Runway uses different sizing fields by model family.
  if (model === 'h3_max') {
    body.resolution = resolution === '768p' ? '768p' : '480p';
    body.promptExpansionMode = 'disabled';
  } else if (model === 'wan3' || model === 'hailuo3') {
    body.ratio = ratio;
    body.resolution = resolution === '1080p' ? '1080p' : resolution === '768p' ? '768p' : '720p';
  } else {
    body.ratio = ratio;
    body.resolution = resolution === '1080p' ? '1080p' : '720p';
  }

  try {
    const r = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RUNWAYML_API_SECRET}`,
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Runway request failed' });
  }
}
