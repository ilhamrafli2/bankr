import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "ten-video-factory-v3";
const LOREMOTION = "https://loremotion.com";

const ANGLES = [
  ["Problem → solution", "STOP scroll — ini alasan kenapa {p} layak dicoba"],
  ["3 manfaat", "3 hal yang bikin {p} menarik"],
  ["Curiosity", "Aku baru sadar ternyata {p} bisa begini"],
  ["Buyer warning", "Sebelum beli {p}, lihat ini dulu"],
  ["Expectation vs reality", "Ekspektasi vs realita memakai {p}"],
  ["Social proof", "Kenapa orang mulai melirik {p}?"],
  ["POV", "POV: kamu akhirnya mencoba {p}"],
  ["Education", "Satu kesalahan saat memakai {p}"],
  ["Quick review", "Review singkat {p} dalam 30 detik"],
  ["Quick tip", "Kalau kamu punya {p}, lakukan ini"],
];

function makeVideos(product = "") {
  return Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    angle: ANGLES[i][0],
    hook: product ? ANGLES[i][1].replaceAll("{p}", product) : "",
    script: product ? `${ANGLES[i][1].replace("{p}", product)}\n\nBahas ${product} secara natural. Buka dengan masalah atau kebutuhan, berikan 2–3 poin yang bisa dibuktikan, tampilkan visual produk, lalu tutup dengan CTA singkat. Hindari klaim yang tidak terbukti.` : "",
    prompt: product ? `Original vertical 9:16 social video about ${product}. Angle: ${ANGLES[i][0]}. Strong first 2 seconds, realistic product-focused visuals, authentic creator style, natural camera movement, clean composition, room for subtitles, no watermark, no generated text, no logos, no unsupported claims.` : "",
    caption: product ? `${product} — ${ANGLES[i][0]}. Simpan kalau berguna. #fyp #review #tips` : "",
    status: product ? "READY TO PRODUCE" : "DRAFT",
    copied: false,
  }));
}

export default function Home() {
  const [product, setProduct] = useState("");
  const [videos, setVideos] = useState(() => makeVideos());
  const [generating, setGenerating] = useState(false);
  const [connected, setConnected] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved?.product) setProduct(saved.product);
      if (Array.isArray(saved?.videos) && saved.videos.length === 10) setVideos(saved.videos);
      if (saved?.connected) setConnected(true);
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ product, videos, connected })); } catch {}
  }, [product, videos, connected, hydrated]);

  const ready = useMemo(() => videos.filter(v => v.status === "READY TO PRODUCE").length, [videos]);
  const completed = useMemo(() => videos.filter(v => v.status === "DONE").length, [videos]);
  const progress = Math.round(((ready + completed) / 10) * 100);
  const visible = useMemo(() => videos.filter(v => {
    const matchesFilter = filter === "ALL" || (filter === "READY" ? v.status === "READY TO PRODUCE" : v.status === "DONE");
    const q = query.trim().toLowerCase();
    return matchesFilter && (!q || `${v.hook} ${v.script} ${v.angle}`.toLowerCase().includes(q));
  }), [videos, filter, query]);

  function flash(message) {
    setNotice(message);
    window.clearTimeout(window.__tvfToast);
    window.__tvfToast = window.setTimeout(() => setNotice(""), 1800);
  }

  function generateFactory() {
    const clean = product.trim();
    if (!clean) return;
    setGenerating(true);
    window.setTimeout(() => {
      setVideos(makeVideos(clean));
      setGenerating(false);
      flash("10 video plan selesai dibuat");
      window.scrollTo({ top: document.querySelector(".queue")?.offsetTop || 0, behavior: "smooth" });
    }, 350);
  }

  function updateVideo(id, field, value) {
    setVideos(current => current.map(v => v.id === id ? { ...v, [field]: value, status: field === "status" ? value : "DRAFT" } : v));
  }

  async function copy(text, id, field = "copied") {
    try {
      await navigator.clipboard.writeText(text);
      setVideos(current => current.map(v => v.id === id ? { ...v, [field]: true } : v));
      window.setTimeout(() => setVideos(current => current.map(v => v.id === id ? { ...v, [field]: false } : v)), 1200);
    } catch { flash("Clipboard tidak tersedia"); }
  }

  function openLoreMotion(id) {
    const v = videos.find(x => x.id === id);
    if (v?.prompt) copy(v.prompt, id).catch(() => {});
    window.open(LOREMOTION, "loremotion-session", "noopener,noreferrer");
    setConnected(true);
    flash("Sesi LoreMotion dibuka — prompt sudah disalin");
  }

  function openSession() {
    window.open(LOREMOTION, "loremotion-session", "noopener,noreferrer");
    setConnected(true);
    flash("LoreMotion session dibuka");
  }

  function markDone(id) { updateVideo(id, "status", "DONE"); flash(`Video ${String(id).padStart(2, "0")} selesai`); }

  function reset() {
    if (!window.confirm("Reset project ini?")) return;
    setProduct(""); setVideos(makeVideos()); setConnected(false); setSelected(null); setFilter("ALL"); setQuery(""); flash("Project di-reset");
  }

  function exportProject() {
    const data = { app: "10 Video Factory", version: 3, product, videos, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `${(product || "video-factory").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-project.json`; a.click(); URL.revokeObjectURL(url); flash("Project diekspor");
  }

  function copyAll() { copy(videos.map(v => `VIDEO ${v.id}\nHOOK: ${v.hook}\nSCRIPT:\n${v.script}\nPROMPT:\n${v.prompt}\nCAPTION: ${v.caption}`).join("\n\n---\n\n"), 0, "copied"); flash("Semua konten disalin"); }

  return (
    <main className="page">
      {notice && <div className="toast">✓ {notice}</div>}
      <section className="topAd">
        <div><b>🎬 10 VIDEO FACTORY</b><span> · workspace produksi konten</span></div>
        <button onClick={openSession}>{connected ? "LoreMotion ✓" : "Buka Sesi LoreMotion →"}</button>
      </section>

      <header>
        <div className="eyebrow">CREATOR WORKSPACE · V3</div>
        <h1>1 Produk <i>→</i> 10 Video</h1>
        <p>Satu dashboard untuk menyusun ide, hook, script, prompt, caption, dan antrean produksi.</p>
      </header>

      <section className="card hero">
        <div className="labelRow"><label>Produk / niche</label><small>💾 otomatis tersimpan di browser</small></div>
        <input value={product} onChange={e => setProduct(e.target.value)} onKeyDown={e => e.key === "Enter" && generateFactory()} placeholder="Contoh: parfum pria, jersey, kopi, skincare..." />
        <button className="primary" disabled={generating || !product.trim()} onClick={generateFactory}>{generating ? "⚡ MENYUSUN 10 VIDEO..." : "⚡ GENERATE 10 VIDEO"}</button>
        <div className="mini">Format target <b>9:16 · 1080×1920</b> · subtitle-ready · original content</div>
      </section>

      <section className="stats">
        <div><strong>10</strong><span>Video slots</span></div>
        <div><strong>{ready}/10</strong><span>Ready to produce</span></div>
        <div><strong>{completed}/10</strong><span>Completed</span></div>
      </section>
      <div className="progress"><span style={{ width: `${progress}%` }} /></div>

      <section className="toolbar queue">
        <div><b>Production Queue</b><small>Hook → Script → Prompt → Video → Subtitle → Post</small></div>
        <div className="toolbarActions"><button onClick={copyAll}>Copy All</button><button onClick={exportProject}>Export</button><button onClick={reset}>Reset</button></div>
      </section>

      <section className="filters">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari video, hook, angle..." />
        <div>{["ALL", "READY", "DONE"].map(x => <button key={x} className={filter === x ? "active" : ""} onClick={() => setFilter(x)}>{x === "ALL" ? "Semua 10" : x === "READY" ? "Ready" : "Selesai"}</button>)}</div>
      </section>

      <section className="grid">
        {visible.map(v => (
          <article className={`videoCard ${selected === v.id ? "selected" : ""}`} key={v.id}>
            <div className="videoHead">
              <div><b>VIDEO {String(v.id).padStart(2, "0")}</b><small>{v.angle}</small></div>
              <span className={v.status === "DONE" ? "done" : v.status === "READY TO PRODUCE" ? "ready" : "draft"}>{v.status}</span>
            </div>
            <label>Hook</label><textarea value={v.hook} onChange={e => updateVideo(v.id, "hook", e.target.value)} placeholder="Hook..." />
            <label>Script</label><textarea value={v.script} onChange={e => updateVideo(v.id, "script", e.target.value)} placeholder="Script 20–45 detik..." />
            <label>Video prompt</label><textarea value={v.prompt} onChange={e => updateVideo(v.id, "prompt", e.target.value)} placeholder="Prompt video engine..." />
            <label>Caption</label><textarea className="caption" value={v.caption} onChange={e => updateVideo(v.id, "caption", e.target.value)} placeholder="Caption + hashtag..." />
            {selected === v.id && <div className="preview"><div className="phone"><span>PREVIEW</span><strong>{v.hook || "Hook video"}</strong><small>9:16 · subtitle area</small></div><div><b>Checklist</b><p>✓ Hook<br/>✓ Script<br/>✓ Prompt<br/>✓ Caption<br/>○ Video render<br/>○ Subtitle<br/>○ Publish</p></div></div>}
            <div className="actions">
              <button onClick={() => copy(v.prompt, v.id)}>{v.copied ? "✓ Copied" : "Copy Prompt"}</button>
              <button onClick={() => setSelected(selected === v.id ? null : v.id)}>{selected === v.id ? "Tutup" : "Preview"}</button>
              <button onClick={() => openLoreMotion(v.id)}>LoreMotion</button>
              <button className="readyBtn" onClick={() => markDone(v.id)}>✓ Selesai</button>
            </div>
          </article>
        ))}
      </section>

      <section className="workflow card">
        <div className="workflowTitle"><b>🚀 Alur kerja</b><span>{connected ? "LoreMotion session aktif" : "Belum membuka session"}</span></div>
        <div className="steps"><span>01 Riset</span><span>02 Hook</span><span>03 Script</span><span>04 Prompt</span><span>05 Video</span><span>06 Subtitle</span><span>07 Post</span></div>
        <p><b>Session LoreMotion:</b> tombol LoreMotion membuka situs dalam named browser window dan menyalin prompt video. Login dilakukan langsung oleh kamu di LoreMotion. Dashboard ini tidak membaca password/cookie dan tidak melewati CAPTCHA, paywall, rate limit, atau keamanan situs.</p>
      </section>

      <footer><b>10 Video Factory</b> · v3 · local autosave · bukan aplikasi resmi LoreMotion</footer>

      <style jsx>{`
        *{box-sizing:border-box}.page{min-height:100vh;background:#07070a;color:#f5f5f5;padding:14px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.page button,.page input,.page textarea{font:inherit}.topAd,header,.card,.stats,.toolbar,.filters,.grid,.progress,footer{max-width:1120px;margin-left:auto;margin-right:auto}.topAd{margin-bottom:24px;padding:12px 14px;border:1px solid #292930;background:#111116;border-radius:14px;display:flex;justify-content:space-between;gap:12px;align-items:center;font-size:13px}.topAd span,header p,.toolbar small,.workflow span,.mini,footer{color:#888894}.topAd button,button{border:1px solid #303039;background:#15151b;color:#fff;border-radius:10px;padding:10px 13px;cursor:pointer;transition:.15s}.page button:hover{border-color:#686872;transform:translateY(-1px)}header{padding:22px 4px}header .eyebrow{font-size:11px;letter-spacing:2px;color:#8b8b98;font-weight:800}h1{font-size:clamp(38px,8vw,72px);line-height:.95;margin:9px 0 14px;letter-spacing:-3px}h1 i{font-style:normal;color:#777780}header p{margin:0;max-width:720px;line-height:1.5}.card{background:#101014;border:1px solid #28282f;border-radius:18px;padding:18px}.hero{box-shadow:0 18px 70px #0005}.labelRow{display:flex;justify-content:space-between;align-items:center}.labelRow small{color:#777782;font-size:10px}label{display:block;color:#a6a6b1;font-size:11px;margin:0 0 7px;font-weight:800;text-transform:uppercase;letter-spacing:.5px}input,textarea{width:100%;background:#08080b;color:#fff;border:1px solid #303039;border-radius:10px;padding:12px;outline:none}input:focus,textarea:focus{border-color:#777783;box-shadow:0 0 0 2px #fff1}input{font-size:15px}textarea{min-height:76px;resize:vertical;line-height:1.42;margin-bottom:11px}.caption{min-height:58px}.primary{width:100%;margin-top:12px;padding:14px;font-size:15px;font-weight:900;background:#f5f5f5;color:#09090b;border:0}.primary:disabled{opacity:.45;cursor:not-allowed;transform:none}.mini{margin-top:10px;font-size:10px}.mini b{color:#c9c9d0}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}.stats div{background:#101014;border:1px solid #28282f;border-radius:14px;padding:14px}.stats strong{display:block;font-size:22px}.stats span{color:#888894;font-size:10px}.progress{height:5px;background:#17171c;border-radius:99px;overflow:hidden;margin-top:10px}.progress span{display:block;height:100%;background:#eee;transition:width .3s}.toolbar{display:flex;justify-content:space-between;align-items:center;padding:28px 3px 12px}.toolbar small{display:block;font-size:10px;margin-top:3px}.toolbarActions{display:flex;gap:7px}.toolbarActions button{font-size:10px;padding:8px 10px}.filters{display:flex;gap:8px;margin-bottom:12px}.filters>input{flex:1}.filters>div{display:flex;gap:6px}.filters button{font-size:10px;white-space:nowrap}.filters button.active{background:#eee;color:#09090b;border-color:#eee}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.videoCard{background:#101014;border:1px solid #28282f;border-radius:16px;padding:14px;transition:.2s}.videoCard.selected{border-color:#777783;box-shadow:0 0 0 1px #77778333}.videoHead{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:14px}.videoHead b{font-size:13px;display:block}.videoHead small{display:block;color:#777782;font-size:10px;margin-top:3px;text-transform:capitalize}.ready,.draft,.done{font-size:9px;padding:5px 7px;border-radius:999px;white-space:nowrap}.ready{background:#17351f;color:#9bf0ae}.done{background:#173348;color:#9bd8ff}.draft{background:#29292f;color:#aaaab5}.actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}.actions button{font-size:10px;padding:9px 7px}.actions .readyBtn{border-color:#315c3b;background:#132118;color:#a7efb5}.preview{display:grid;grid-template-columns:110px 1fr;gap:12px;margin:2px 0 13px;padding:10px;border:1px solid #292930;border-radius:12px;background:#0a0a0d}.phone{height:190px;border:1px solid #41414a;border-radius:16px;padding:9px;display:flex;flex-direction:column;justify-content:flex-end;background:linear-gradient(#17171d,#08080a)}.phone span{font-size:7px;color:#777782;align-self:center;margin-bottom:auto}.phone strong{font-size:10px;line-height:1.2}.phone small{font-size:7px;color:#777782;margin-top:8px}.preview p{font-size:10px;line-height:1.7;color:#8f8f9a}.workflow{margin-top:14px}.workflowTitle{display:flex;justify-content:space-between;gap:8px;align-items:center}.steps{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}.steps span{border:1px solid #2b2b32;background:#0b0b0e;border-radius:999px;padding:7px 9px;font-size:10px;color:#bbb}.workflow p{font-size:10px;line-height:1.6;color:#70707b;margin:15px 0 0}.toast{position:fixed;z-index:20;right:16px;bottom:16px;background:#f5f5f5;color:#08080b;border-radius:12px;padding:11px 14px;font-size:12px;font-weight:800;box-shadow:0 15px 50px #0008}footer{text-align:center;font-size:10px;padding:25px 2px 40px}@media(max-width:700px){.topAd{align-items:flex-start}.topAd span{display:none}.topAd button{font-size:10px;padding:8px}.grid{grid-template-columns:1fr}.stats strong{font-size:19px}.toolbar{align-items:flex-start;gap:8px}.toolbarActions{flex-wrap:wrap;justify-content:flex-end}.filters{flex-direction:column}.filters>div{width:100%}.filters button{flex:1}.preview{grid-template-columns:90px 1fr}.phone{height:155px}.actions{grid-template-columns:1fr 1fr}.workflowTitle{align-items:flex-start;flex-direction:column}}
      `}</style>
    </main>
  );
}
