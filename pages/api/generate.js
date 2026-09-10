export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'Prompt wajib diisi.' });

  // Free/community engine: public Hugging Face Space running Wan 2.2 5B on ZeroGPU.
  // No API key is required. The Space itself enforces its own queue/quota/safety rules.
  const base = 'https://wan-ai-wan-2-2-5b.hf.space';
  try {
    const r = await fetch(`${base}/gradio_api/call/generate_video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [null, prompt.slice(0, 600), 1280, 704, 5, 30, 5, 5, -1] }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.error || 'Free Wan queue gagal', detail: data });
    if (!data.event_id) return res.status(502).json({ error: 'Free Wan tidak mengembalikan event id.', detail: data });
    return res.status(200).json({ id: data.event_id, engine: 'Wan 2.2 5B · Free ZeroGPU' });
  } catch (e) {
    return res.status(502).json({ error: e.message || 'Free Wan request failed' });
  }
}
