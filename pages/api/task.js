export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const id = String(req.query.id || '');
  if (!id) return res.status(400).json({ error: 'Task id wajib diisi.' });

  const base = 'https://wan-ai-wan-2-2-5b.hf.space';
  try {
    const r = await fetch(`${base}/gradio_api/call/generate_video/${encodeURIComponent(id)}`);
    const text = await r.text();
    if (!r.ok) return res.status(r.status).json({ error: 'Free Wan task lookup gagal', detail: text.slice(-1000) });

    // Gradio returns Server-Sent Events. We only need the final "data" event.
    const events = text.split('\n\n').filter(Boolean);
    let lastData = null;
    let sawComplete = false;
    for (const block of events) {
      const lines = block.split('\n');
      const event = lines.find(x => x.startsWith('event:'))?.slice(6).trim();
      const dataLine = lines.find(x => x.startsWith('data:'));
      if (event === 'complete') sawComplete = true;
      if (dataLine) {
        try { lastData = JSON.parse(dataLine.slice(5).trim()); } catch {}
      }
    }

    if (!sawComplete) return res.status(200).json({ status: 'PROCESSING' });

    const item = Array.isArray(lastData) ? lastData[0] : lastData;
    const url = typeof item === 'string' ? item : item?.url || item?.path || item?.video || '';
    if (!url) return res.status(502).json({ status: 'FAILED', error: 'Free Wan selesai tetapi URL video tidak ditemukan.', detail: lastData });
    return res.status(200).json({ status: 'SUCCEEDED', output: [url] });
  } catch (e) {
    return res.status(502).json({ error: e.message || 'Free Wan task lookup failed' });
  }
}
