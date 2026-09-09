import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "ten-video-factory-v2";

const HOOKS = [
  "STOP scroll — ini alasan kenapa {p} layak dicoba",
  "3 hal yang bikin {p} menarik",
  "Aku baru sadar ternyata {p} bisa begini",
  "Sebelum beli {p}, lihat ini dulu",
  "Ekspektasi vs realita memakai {p}",
  "Kenapa orang mulai melirik {p}?",
  "POV: kamu akhirnya mencoba {p}",
  "Satu kesalahan saat memakai {p}",
  "Review singkat {p} dalam 30 detik",
  "Kalau kamu punya {p}, lakukan ini",
];

const ANGLES = [
  "problem → solution",
  "3 manfaat utama",
  "curiosity / discovery",
  "buyer warning",
  "expectation vs reality",
  "trend / social proof",
  "POV experience",
  "mistake / education",
  "quick review",
  "quick tip / CTA",
];

function blankVideos() {
  return Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    angle: ANGLES[i],
    hook: "",
    script: "",
    prompt: "",
    caption: "",
    status: "DRAFT",
    copied: false,
  }));
}

export default function Home() {
  const [product, setProduct] = useState("");
  const [videos, setVideos] = useState(blankVideos);
  const [generating, setGenerating] = useState(false);
  const [connected, setConnected] = useState(false);
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.product) setProduct(data.product);
      if (Array.isArray(data.videos) && data.videos.length === 10) setVideos(data.videos);
      if (data.connected) setConnected(true);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ product, videos, connected }));
      setSaved(true);
      const t = setTimeout(() => setSaved(false), 1000);
      return () => clearTimeout(t);
    } catch {}
  }, [product, videos, connected]);

  const ready = useMemo(() => videos.filter((v) => v.status === "READY TO POST").length, [videos]);
  const filled = useMemo(() => videos.filter((v) => v.hook && v.script && v.prompt).length, [videos]);
  const progress = Math.round((filled / 10) * 100);

  function flash(message) {
    setNotice(message);
    setTimeout(() => setNotice(""), 1800);
  }

  function generateFactory() {
    if (!product.trim()) return;
    setGenerating(true);
    const clean = product.trim();
    const next = videos.map((v, i) => ({
      ...v,
      hook: HOOKS[i].replaceAll("{p}", clean),
      script: `${HOOKS[i].replace("{p}", clean)}\n\nBahas ${clean} dengan gaya natural dan singkat. Tunjukkan masalah atau kebutuhan di awal, berikan 2–3 poin yang benar-benar relevan, lalu tutup dengan CTA yang tidak memaksa. Hindari klaim yang tidak bisa dibuktikan.`,
      prompt: `Create an original vertical 9:16 social video about ${clean}. Angle: ${ANGLES[i]}. Fast first 2 seconds, realistic product-focused visuals, natural camera movement, clean composition, authentic creator style, room for subtitles, no logos, no watermark, no generated text, no unsupported claims.`,
      caption: `${clean} — ${ANGLES[i]}. Simpan kalau berguna. #fyp #review #tips`,
      status: "READY TO POST",
      copied: false,
    }));
    setTimeout(() => {
      setVideos(next);
      setGenerating(false);
      flash("10 konsep video selesai dibuat");
    }, 450);
  }

  function updateVideo(id, field, value) {
    setVideos((current) => current.map((v) => (v.id === id ? { ...v, [field]: value, status: field === "status" ? value : "DRAFT" } : v)));
  }

  async function copyPrompt(v) {
    try {
      await navigator.clipboard.writeText(v.prompt);
      setVideos((current) => current.map((x) => x.id === v.id ? { ...x, copied: true } : x));
      setTimeout(() => setVideos((current) => current.map((x) => x.id === v.id ? { ...x, copied: false } : x)), 1200);
    } catch {
      flash("Clipboard tidak tersedia di browser ini");
    }
  }

  function connectLoreMotion() {
    window.open("https://loremotion.com", "_blank", "noopener,noreferrer");
    setConnected(true);
    flash("Sesi LoreMotion dibuka");
  }

  function resetAll() {
    if (!window.confirm("Reset semua 10 video dan data produk?")) return;
    setProduct("");
    setVideos(blankVideos());
    setConnected(false);
    setSelected(null);
    flash("Project di-reset");
  }

  function exportProject() {
    const blob = new Blob([JSON.stringify({ product, videos }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(product || "video-factory").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-project.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash("Project JSON berhasil diekspor");
  }

  return (
    <main className="page">
      {notice && <div className="toast">✓ {notice}</div>}
      <section className="topAd">
        <div><b>🎬 AI VIDEO FACTORY</b><span> 1 produk → 10 konten siap produksi</span></div>
        <button onClick={connectLoreMotion}>{connected ? "LoreMotion ✓" : "Buka LoreMotion →"}</button>
      </section>

      <header>
        <div className="eyebrow">10 VIDEO FACTORY · CREATOR WORKSPACE</div>
        <h1>1 Produk <i>→</i> 10 Video</h1>
        <p>Bangun hook, script, prompt, caption, dan production queue dari satu dashboard.</p>
      </header>

      <section className="card hero">
        <div className="labelRow"><label>Produk / niche</label><span>{saved ? "Tersimpan otomatis ✓" : "Local save"}</span></div>
        <input value={product} onChange={(e) => setProduct(e.target.value)} onKeyDown={(e) => e.key === "Enter" && generateFactory()} placeholder="Contoh: parfum pria, jersey, kopi, skincare..." />
        <button className="primary" onClick={generateFactory} disabled={generating || !product.trim()}>{generating ? "⚡ MENYUSUN 10 VIDEO..." : "⚡ GENERATE 10 VIDEO"}</button>
        <div className="mini"><span>9:16</span> · <span>1080×1920</span> · subtitle-ready · original content</div>
      </section>

      <section className="stats">
        <div><strong>10</strong><span>Video slots</span></div>
        <div><strong>{ready}/10</strong><span>Ready</span></div>
        <div><strong>{progress}%</strong><span>Production progress</span></div>
      </section>

      <section className="progress"><div style={{ width: `${progress}%` }} /></section>

      <section className="toolbar">
        <div><b>Production Queue</b><span> Hook → Script → Prompt → Caption</span></div>
        <div className="toolbarActions"><button onClick={exportProject}>Export JSON</button><button onClick={resetAll}>Reset</button></div>
      </section>

      <section className="grid">
        {videos.map((v) => (
          <article className={`videoCard ${selected === v.id ? "selected" : ""}`} key={v.id}>
            <div className="videoHead">
              <div><b>VIDEO {String(v.id).padStart(2, "0")}</b><small>{v.angle}</small></div>
              <span className={v.status === "READY TO POST" ? "ready" : "draft"}>{v.status}</span>
            </div>
            <label>Hook</label>
            <textarea value={v.hook} onChange={(e) => updateVideo(v.id, "hook", e.target.value)} placeholder="Hook yang menghentikan scroll..." />
            <label>Script</label>
            <textarea value={v.script} onChange={(e) => updateVideo(v.id, "script", e.target.value)} placeholder="Script 20–45 detik..." />
            <label>Video prompt</label>
            <textarea value={v.prompt} onChange={(e) => updateVideo(v.id, "prompt", e.target.value)} placeholder="Prompt untuk video engine..." />
            <label>Caption</label>
            <textarea className="caption" value={v.caption} onChange={(e) => updateVideo(v.id, "caption", e.target.value)} placeholder="Caption + hashtag..." />
            <div className="actions">
              <button onClick={() => copyPrompt(v)}>{v.copied ? "✓ Copied" : "Copy Prompt"}</button>
              <button onClick={() => setSelected(selected === v.id ? null : v.id)}>{selected === v.id ? "Tutup" : "Preview"}</button>
              <button className="readyBtn" onClick={() => updateVideo(v.id, "status", "READY TO POST")}>✓ Ready</button>
            </div>
          </article>
        ))}
      </section>

      <section className="workflow card">
        <div><b>Workflow</b><span> Yang sudah siap tinggal diproduksi di video engine.</span></div>
        <div className="steps"><span>01 Riset</span><span>02 Hook</span><span>03 Script</span><span>04 Video</span><span>05 Subtitle</span><span>06 Post</span></div>
        <p><b>LoreMotion:</b> tombol di atas membuka sesi LoreMotion. Dashboard ini tidak mengambil password atau melewati CAPTCHA/paywall/rate limit. Integrasi generate otomatis membutuhkan API atau mekanisme resmi dari engine.</p>
      </section>

      <footer><b>10 Video Factory</b> · v2 · local autosave · bukan aplikasi resmi LoreMotion</footer>

      <style jsx>{`
        *{box-sizing:border-box}.page{min-height:100vh;background:#07070a;color:#f5f5f5;padding:14px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.page button,.page input,.page textarea{font:inherit}.topAd,header,.card,.stats,.toolbar,.grid,.progress,.workflow,footer{max-width:1120px;margin-left:auto;margin-right:auto}.topAd{margin-bottom:24px;padding:12px 14px;border:1px solid #292930;background:#111116;border-radius:14px;display:flex;justify-content:space-between;gap:12px;align-items:center;font-size:13px}.topAd span,.mini,header p,.toolbar span,.workflow span{color:#92929d}.topAd button,button{border:1px solid #303039;background:#15151b;color:#fff;border-radius:10px;padding:10px 13px;cursor:pointer}.topAd button{white-space:nowrap}.page button:hover{border-color:#676772;transform:translateY(-1px)}header{padding:22px 4px}header .eyebrow{font-size:11px;letter-spacing:2px;color:#8b8b98;font-weight:800}h1{font-size:clamp(38px,8vw,72px);line-height:.95;margin:9px 0 14px;letter-spacing:-3px}h1 i{font-style:normal;color:#777780}header p{margin:0;max-width:720px;line-height:1.5}.card{background:#101014;border:1px solid #28282f;border-radius:18px;padding:18px}.hero{box-shadow:0 18px 70px #0005}.labelRow{display:flex;justify-content:space-between;align-items:center}.labelRow span{font-size:10px;color:#777782}label{display:block;color:#a6a6b1;font-size:11px;margin:0 0 7px;font-weight:800;text-transform:uppercase;letter-spacing:.5px}input,textarea{width:100%;background:#08080b;color:#fff;border:1px solid #303039;border-radius:10px;padding:12px;outline:none}input:focus,textarea:focus{border-color:#777783;box-shadow:0 0 0 2px #fff1}input{font-size:15px}textarea{min-height:76px;resize:vertical;line-height:1.42;margin-bottom:11px}.caption{min-height:58px}.primary{width:100%;margin-top:12px;padding:14px;font-size:15px;font-weight:900;background:#f5f5f5;color:#09090b;border:0}.primary:disabled{opacity:.45;cursor:not-allowed;transform:none}.mini{margin-top:10px;font-size:10px}.mini span{color:#c9c9d0}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}.stats div{background:#101014;border:1px solid #28282f;border-radius:14px;padding:14px}.stats strong{display:block;font-size:22px}.stats span{color:#888894;font-size:10px}.progress{height:5px;background:#17171c;border-radius:99px;overflow:hidden;margin-top:10px}.progress div{height:100%;background:#eee;transition:width .3s}.toolbar{display:flex;justify-content:space-between;align-items:center;padding:28px 3px 12px}.toolbar span{font-size:11px}.toolbarActions{display:flex;gap:7px}.toolbarActions button{font-size:11px;padding:8px 10px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.videoCard{background:#101014;border:1px solid #28282f;border-radius:16px;padding:14px;transition:.2s}.videoCard.selected{border-color:#777783;box-shadow:0 0 0 1px #77778333}.videoHead{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:14px}.videoHead b{font-size:13px;display:block}.videoHead small{display:block;color:#777782;font-size:10px;margin-top:3px;text-transform:capitalize}.ready,.draft{font-size:9px;padding:5px 7px;border-radius:999px;white-space:nowrap}.ready{background:#17351f;color:#9bf0ae}.draft{background:#29292f;color:#aaaab5}.actions{display:flex;gap:7px}.actions button{flex:1;font-size:10px;padding:9px 7px}.actions .readyBtn{border-color:#315c3b;background:#132118;color:#a7efb5}.workflow{margin-top:14px}.workflow>div:first-child{display:flex;gap:8px;align-items:center}.steps{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}.steps span{border:1px solid #2b2b32;background:#0b0b0e;border-radius:999px;padding:7px 9px;font-size:10px;color:#bbb}.workflow p{font-size:10px;line-height:1.6;color:#70707b;margin:15px 0 0}.toast{position:fixed;z-index:10;right:16px;bottom:16px;background:#f5f5f5;color:#08080b;border-radius:12px;padding:11px 14px;font-size:12px;font-weight:800;box-shadow:0 15px 40px #0008}footer{color:#666672;font-size:10px;padding:25px 2px 40px;text-align:center}@media(max-width:700px){.topAd{align-items:flex-start}.topAd span{display:none}.topAd button{font-size:10px;padding:8px}.grid{grid-template-columns:1fr}h1{letter-spacing:-2px}.stats strong{font-size:19px}.toolbar{align-items:flex-end}.toolbarActions button{font-size:9px}.workflow>div:first-child{display:block}.workflow>div:first-child span{display:block;margin-top:5px}}
      `}</style>
    </main>
  );
}
