import { useMemo, useState } from "react";

const initialVideos = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  hook: "",
  script: "",
  prompt: "",
  status: "DRAFT",
}));

export default function Home() {
  const [product, setProduct] = useState("");
  const [videos, setVideos] = useState(initialVideos);
  const [generating, setGenerating] = useState(false);
  const [connected, setConnected] = useState(false);

  const ready = useMemo(
    () => videos.filter((v) => v.status === "READY TO POST").length,
    [videos]
  );

  function generateFactory() {
    if (!product.trim()) return;
    setGenerating(true);

    const clean = product.trim();
    const next = videos.map((v, i) => ({
      ...v,
      hook: [
        `STOP scroll — ini alasan kenapa ${clean} layak dicoba`,
        `3 hal yang bikin ${clean} menarik`,
        `Aku baru sadar ternyata ${clean} bisa begini`,
        `Sebelum beli ${clean}, lihat ini dulu`,
        `Ekspektasi vs realita memakai ${clean}`,
        `Kenapa orang mulai melirik ${clean}?`,
        `POV: kamu akhirnya mencoba ${clean}`,
        `Satu kesalahan saat memakai ${clean}`,
        `Review singkat ${clean} dalam 30 detik`,
        `Kalau kamu punya ${clean}, lakukan ini`,
      ][i],
      script: `Hook: ${["STOP scroll", "3 hal penting", "Aku baru sadar", "Sebelum beli", "Ekspektasi vs realita", "Kenapa mulai ramai", "POV pengalaman", "Jangan lakukan ini", "Review singkat", "Tips cepat"][i]}.\n\nProduk: ${clean}.\n\nJelaskan manfaat utama dengan bahasa natural, tampilkan bukti/visual produk, lalu tutup dengan CTA yang singkat.`,
      prompt: `Vertical 9:16 product video about ${clean}. Fast social-media pacing, clean composition, realistic product footage, natural camera movement, strong opening shot, room for subtitles, no watermark, no extra text in the generated scene.`,
      status: "READY TO POST",
    }));

    setTimeout(() => {
      setVideos(next);
      setGenerating(false);
    }, 500);
  }

  function updateVideo(id, field, value) {
    setVideos((current) =>
      current.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  }

  function connectLoreMotion() {
    window.open("https://loremotion.com", "_blank", "noopener,noreferrer");
    setConnected(true);
  }

  return (
    <main className="page">
      <section className="topAd">
        <div>
          <b>🎬 AI Video Factory</b>
          <span> Buat 10 konsep video dari 1 produk</span>
        </div>
        <button onClick={connectLoreMotion}>{connected ? "LoreMotion dibuka ✓" : "Buka LoreMotion →"}</button>
      </section>

      <header>
        <div className="eyebrow">10 VIDEO FACTORY</div>
        <h1>1 Produk → 10 Video</h1>
        <p>Riset ide, hook, script, prompt, dan siapkan 10 video dalam satu dashboard.</p>
      </header>

      <section className="card hero">
        <label>Produk / niche</label>
        <input
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          placeholder="Contoh: parfum pria, jersey, kopi, skincare..."
        />
        <button className="primary" onClick={generateFactory} disabled={generating || !product.trim()}>
          {generating ? "Membuat 10 video..." : "⚡ GENERATE 10 VIDEO"}
        </button>
        <div className="mini">Output target: 9:16 • 1080×1920 • subtitle-ready</div>
      </section>

      <section className="stats">
        <div><strong>10</strong><span>Video</span></div>
        <div><strong>{ready}</strong><span>Ready</span></div>
        <div><strong>{connected ? "ON" : "OFF"}</strong><span>LoreMotion</span></div>
      </section>

      <section className="toolbar">
        <div><b>Production Queue</b><span> Hook → Script → Prompt → Video</span></div>
        <button onClick={() => setVideos(initialVideos)}>Reset</button>
      </section>

      <section className="grid">
        {videos.map((v) => (
          <article className="videoCard" key={v.id}>
            <div className="videoHead">
              <b>VIDEO {String(v.id).padStart(2, "0")}</b>
              <span className={v.status === "READY TO POST" ? "ready" : "draft"}>{v.status}</span>
            </div>
            <label>Hook</label>
            <textarea value={v.hook} onChange={(e) => updateVideo(v.id, "hook", e.target.value)} placeholder="Hook video..." />
            <label>Script</label>
            <textarea value={v.script} onChange={(e) => updateVideo(v.id, "script", e.target.value)} placeholder="Script..." />
            <label>Video prompt</label>
            <textarea value={v.prompt} onChange={(e) => updateVideo(v.id, "prompt", e.target.value)} placeholder="Prompt untuk video engine..." />
            <div className="actions">
              <button onClick={() => navigator.clipboard?.writeText(v.prompt)}>Copy Prompt</button>
              <button onClick={() => updateVideo(v.id, "status", "READY TO POST")}>✓ Ready</button>
            </div>
          </article>
        ))}
      </section>

      <footer>
        <b>10 Video Factory</b> • MVP v1 • LoreMotion session launcher • bukan aplikasi resmi LoreMotion
      </footer>

      <style jsx>{`
        * { box-sizing: border-box; }
        .page { min-height:100vh; background:#07070a; color:#f5f5f5; padding:14px; font-family:Inter,Arial,sans-serif; }
        header,.card,.stats,.toolbar,.grid,footer { max-width:1100px; margin-left:auto; margin-right:auto; }
        .topAd { max-width:1100px; margin:0 auto 24px; padding:12px 14px; border:1px solid #2a2a31; background:#111116; border-radius:14px; display:flex; justify-content:space-between; gap:12px; align-items:center; font-size:13px; }
        .topAd span,.mini,header p,.toolbar span { color:#92929d; }
        button { border:1px solid #303039; background:#15151b; color:#fff; border-radius:10px; padding:10px 13px; cursor:pointer; }
        button:hover { border-color:#555563; }
        .topAd button { white-space:nowrap; }
        header { padding:22px 4px; }
        .eyebrow { font-size:12px; letter-spacing:2px; color:#8b8b98; font-weight:800; }
        h1 { font-size:clamp(32px,8vw,58px); line-height:1; margin:9px 0 12px; letter-spacing:-2px; }
        header p { margin:0; max-width:650px; line-height:1.5; }
        .card { background:#101014; border:1px solid #28282f; border-radius:18px; padding:18px; }
        label { display:block; color:#a6a6b1; font-size:12px; margin:0 0 7px; font-weight:700; }
        input,textarea { width:100%; background:#08080b; color:#fff; border:1px solid #303039; border-radius:10px; padding:12px; outline:none; font:inherit; }
        input:focus,textarea:focus { border-color:#777783; }
        input { font-size:15px; }
        textarea { min-height:78px; resize:vertical; line-height:1.4; margin-bottom:12px; }
        .primary { width:100%; margin-top:12px; padding:14px; font-size:16px; font-weight:800; background:#f5f5f5; color:#09090b; border:0; }
        .primary:disabled { opacity:.45; cursor:not-allowed; }
        .mini { margin-top:10px; font-size:11px; }
        .stats { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:12px; }
        .stats div { background:#101014; border:1px solid #28282f; border-radius:14px; padding:14px; }
        .stats strong { display:block; font-size:22px; }
        .stats span { color:#888894; font-size:11px; }
        .toolbar { display:flex; justify-content:space-between; align-items:center; padding:28px 3px 12px; }
        .toolbar span { font-size:12px; }
        .grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
        .videoCard { background:#101014; border:1px solid #28282f; border-radius:16px; padding:14px; }
        .videoHead { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
        .videoHead b { font-size:13px; }
        .ready,.draft { font-size:10px; padding:5px 7px; border-radius:999px; }
        .ready { background:#17351f; color:#9bf0ae; }
        .draft { background:#29292f; color:#aaaab5; }
        .actions { display:flex; gap:8px; }
        .actions button { flex:1; font-size:12px; }
        footer { color:#666672; font-size:10px; padding:25px 2px 40px; text-align:center; }
        @media(max-width:700px){ .topAd{align-items:flex-start}.topAd span{display:none}.topAd button{font-size:11px;padding:8px}.grid{grid-template-columns:1fr}.stats strong{font-size:19px} }
      `}</style>
    </main>
  );
}
