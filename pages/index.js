import { useEffect, useMemo, useState } from "react";

const KEY = "video-factory-v4";
const ANGLES = [
  ["Problem → solution", "STOP scroll — ini alasan {p} layak dicoba"],
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
const MODELS = [
  ["h3_max", "H3 Max · murah", "5 cr/s · 480p"],
  ["wan3", "WAN 3", "10 cr/s · 720p"],
  ["seedance2_mini", "Seedance 2 Mini", "16 cr/s · 720p"],
  ["seedance2_fast", "Seedance 2 Fast", "29 cr/s · 720p"],
  ["seedance2_5", "Seedance 2.5", "30 cr/s · 720p"],
  ["seedance2", "Seedance 2", "36 cr/s · 720p"],
  ["hailuo3", "Hailuo 3", "10 cr/s · 768p"],
  ["grok_imagine_1_5", "Grok Imagine", "16 cr/s · 720p"],
  ["gen4.5", "Gen-4.5", "premium"],
  ["veo3.1", "Veo 3.1", "premium"],
  ["gemini_omni_flash", "Gemini Omni", "720p"],
];

function makeVideos(product = "") {
  return Array.from({ length: 10 }, (_, i) => ({
    id: i + 1, angle: ANGLES[i][0],
    hook: product ? ANGLES[i][1].replaceAll("{p}", product) : "",
    script: product ? `${ANGLES[i][1].replace("{p}", product)}\n\nBahas ${product} secara natural. Buka dengan masalah atau kebutuhan, berikan 2–3 poin yang bisa dibuktikan, tampilkan visual produk, lalu tutup dengan CTA singkat. Hindari klaim yang tidak terbukti.` : "",
    prompt: product ? `Vertical 9:16 social video about ${product}. Angle: ${ANGLES[i][0]}. Strong first 2 seconds, realistic product-focused visuals, authentic creator style, natural camera movement, clean composition, room for subtitles, no watermark, no generated text, no unsupported claims.` : "",
    caption: product ? `${product} — ${ANGLES[i][0]}. Simpan kalau berguna. #fyp #review #tips` : "",
    status: product ? "READY TO PRODUCE" : "DRAFT", taskId: "", output: ""
  }));
}

export default function Home() {
  const [product, setProduct] = useState("");
  const [videos, setVideos] = useState(makeVideos());
  const [model, setModel] = useState("h3_max");
  const [generating, setGenerating] = useState(false);
  const [current, setCurrent] = useState(0);
  const [notice, setNotice] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s?.product) setProduct(s.product);
      if (s?.model) setModel(s.model);
      if (Array.isArray(s?.videos) && s.videos.length === 10) setVideos(s.videos);
    } catch {}
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify({ product, model, videos }));
  }, [product, model, videos, hydrated]);

  const done = useMemo(() => videos.filter(v => v.status === "DONE").length, [videos]);
  const ready = useMemo(() => videos.filter(v => v.status === "READY TO PRODUCE").length, [videos]);
  const pct = Math.round((done / 10) * 100);

  const flash = m => { setNotice(m); clearTimeout(window.__tvf); window.__tvf = setTimeout(() => setNotice(""), 2200); };
  const makePlan = () => { if (!product.trim()) return; setVideos(makeVideos(product.trim())); flash("10 prompt siap diproduksi"); };
  const update = (id, field, value) => setVideos(xs => xs.map(v => v.id === id ? { ...v, [field]: value, status: field === "status" ? value : "DRAFT" } : v));

  async function generateOne(index) {
    const v = videos[index];
    setCurrent(index + 1);
    update(v.id, "status", "GENERATING");
    try {
      const r = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: v.prompt, model, duration: model === "h3_max" ? 5 : 5, resolution: model === "h3_max" ? "480p" : model === "hailuo3" ? "768p" : "720p", ratio: "480:854" }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || data.message || "Generate gagal");
      update(v.id, "taskId", data.id || data.taskId || "");
      return data.id || data.taskId;
    } catch (e) {
      update(v.id, "status", "ERROR");
      throw e;
    }
  }

  async function pollTask(id, index) {
    if (!id) return;
    for (let n = 0; n < 60; n++) {
      await new Promise(r => setTimeout(r, 5000));
      const r = await fetch(`/api/task?id=${encodeURIComponent(id)}`);
      const d = await r.json();
      if (d.status === "SUCCEEDED") {
        const url = d.output?.[0] || d.output?.[0]?.url || "";
        setVideos(xs => xs.map((v, i) => i === index ? { ...v, status: "DONE", output: url } : v));
        return url;
      }
      if (d.status === "FAILED" || d.status === "CANCELLED") throw new Error(d.failure || d.error || "Render gagal");
    }
    throw new Error("Render terlalu lama; task tetap bisa dicek nanti.");
  }

  async function generateAll() {
    if (!product.trim()) return;
    setGenerating(true); setCurrent(0); setVideos(makeVideos(product.trim()));
    flash(`Mulai 10 video dengan ${MODELS.find(x => x[0] === model)?.[1] || model}`);
    try {
      // Sequential queue prevents ten simultaneous jobs from overwhelming the account.
      for (let i = 0; i < 10; i++) {
        const id = await generateOne(i);
        await pollTask(id, i);
      }
      flash("🔥 10 VIDEO SELESAI");
    } catch (e) {
      flash(`Berhenti: ${e.message}`);
    } finally { setGenerating(false); }
  }

  function exportProject() {
    const blob = new Blob([JSON.stringify({ app: "10 Video Factory", version: 4, product, model, videos }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "10-video-factory.json"; a.click(); URL.revokeObjectURL(a.href);
  }
  function reset() { setProduct(""); setVideos(makeVideos()); setCurrent(0); setSelected(null); flash("Reset"); }

  return <main className="page">
    {notice && <div className="toast">✓ {notice}</div>}
    <header><div className="eyebrow">CREATOR WORKSPACE · V4</div><h1>1 Produk <i>→</i> 10 Video</h1><p>Generate video langsung dari dashboard melalui engine video yang dipilih.</p></header>

    <section className="card hero">
      <div className="row"><label>Produk / niche</label><span>autosave aktif</span></div>
      <input value={product} onChange={e => setProduct(e.target.value)} placeholder="Contoh: parfum pria, jersey, kopi..." />
      <div className="controls">
        <select value={model} onChange={e => setModel(e.target.value)}>{MODELS.map(m => <option key={m[0]} value={m[0]}>{m[1]} — {m[2]}</option>)}</select>
        <button onClick={makePlan}>BUAT 10 PROMPT</button>
      </div>
      <button className="primary" disabled={generating || !product.trim()} onClick={generateAll}>{generating ? `⚡ GENERATE ${current}/10...` : "⚡ GENERATE 10 VIDEO LANGSUNG"}</button>
      <small>Output target: vertical 9:16. Biaya generation mengikuti engine/account yang terhubung.</small>
    </section>

    <section className="stats"><div><b>10</b><span>slots</span></div><div><b>{ready}</b><span>ready</span></div><div><b>{done}</b><span>done</span></div></section>
    <div className="progress"><span style={{width:`${pct}%`}}/></div>

    <section className="toolbar"><div><b>Production Queue</b><small>{generating ? `Sedang mengerjakan video ${current}/10` : "Hook → Script → Prompt → Video → Post"}</small></div><div><button onClick={exportProject}>Export</button><button onClick={reset}>Reset</button></div></section>

    <section className="grid">{videos.map(v => <article className={`videoCard ${selected===v.id?"selected":""}`} key={v.id}>
      <div className="head"><div><b>VIDEO {String(v.id).padStart(2,"0")}</b><small>{v.angle}</small></div><em className={v.status.toLowerCase().replaceAll(" ","-")}>{v.status}</em></div>
      <label>Hook</label><textarea value={v.hook} onChange={e=>update(v.id,"hook",e.target.value)}/>
      <label>Script</label><textarea value={v.script} onChange={e=>update(v.id,"script",e.target.value)}/>
      <label>Video prompt</label><textarea value={v.prompt} onChange={e=>update(v.id,"prompt",e.target.value)}/>
      {v.output && <video className="result" controls playsInline src={v.output}/>} 
      <div className="actions"><button onClick={()=>navigator.clipboard?.writeText(v.prompt)}>Copy Prompt</button><button onClick={()=>setSelected(selected===v.id?null:v.id)}>{selected===v.id?"Tutup":"Preview"}</button><button onClick={()=>update(v.id,"status","DONE")}>✓ Selesai</button></div>
    </article>)}</section>

    <section className="card info"><b>Engine terpasang</b><p>H3 Max, WAN 3, Seedance 2/2.5/Fast/Mini, Hailuo 3, Grok Imagine, Gen-4.5, Veo 3.1, dan Gemini Omni tersedia sebagai pilihan API. LoreMotion tetap tersedia sebagai sesi eksternal, tetapi bukan engine backend.</p><p><b>Penting:</b> agar tombol generate benar-benar render, project Vercel membutuhkan environment variable <code>RUNWAYML_API_SECRET</code>. Jangan masukkan API key ke kode atau browser.</p></section>
    <footer>10 Video Factory · V4</footer>

    <style jsx>{`*{box-sizing:border-box}.page{min-height:100vh;background:#07070a;color:#f5f5f5;padding:18px;font-family:Inter,system-ui,sans-serif}.page>header,.card,.stats,.progress,.toolbar,.grid,footer{max-width:1120px;margin:auto}.eyebrow{font-size:11px;letter-spacing:2px;color:#858591;font-weight:800}h1{font-size:clamp(40px,8vw,76px);line-height:.95;letter-spacing:-4px;margin:10px 0}h1 i{font-style:normal;color:#777}header p{color:#92929d;max-width:650px}.card{background:#101014;border:1px solid #292930;border-radius:18px;padding:18px;margin-top:22px}.hero{box-shadow:0 20px 70px #0006}.row,.toolbar,.head,.controls,.actions{display:flex;gap:10px;align-items:center;justify-content:space-between}.row span,small{color:#858591;font-size:11px}label{display:block;color:#a7a7b0;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.5px;margin:0 0 7px}input,textarea,select{width:100%;background:#08080b;color:#fff;border:1px solid #303039;border-radius:10px;padding:12px;outline:none;font:inherit}textarea{min-height:78px;resize:vertical;line-height:1.4;margin-bottom:10px}select{margin-top:12px}.controls{margin-top:2px}.controls button,.actions button,.toolbar button{border:1px solid #303039;background:#15151b;color:#fff;border-radius:10px;padding:10px 12px}.controls button{white-space:nowrap}.primary{width:100%;margin-top:12px;border:0;border-radius:10px;padding:15px;background:#f5f5f5;color:#08080a;font-weight:900}.primary:disabled{opacity:.4}.hero>small{display:block;margin-top:9px}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}.stats div{background:#101014;border:1px solid #292930;border-radius:14px;padding:15px}.stats b{display:block;font-size:24px}.stats span{color:#858591;font-size:11px}.progress{height:6px;background:#19191f;border-radius:99px;overflow:hidden;margin-top:10px}.progress span{display:block;height:100%;background:#eee}.toolbar{margin-top:25px;padding:10px 2px}.toolbar small{display:block;margin-top:4px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.videoCard{background:#101014;border:1px solid #292930;border-radius:16px;padding:15px}.videoCard.selected{border-color:#777}.head{margin-bottom:14px}.head small{display:block;margin-top:4px}.head em{font-style:normal;font-size:9px;border:1px solid #38383f;border-radius:99px;padding:5px 7px;color:#aaa}.generating{color:#ffd}.done{color:#8fdf9b!important}.error{color:#ff8888!important}.result{width:100%;aspect-ratio:9/16;background:#050506;border-radius:12px;object-fit:cover;margin:4px 0 10px}.actions{justify-content:flex-start;flex-wrap:wrap}.actions button{font-size:11px}.info{color:#aaa;line-height:1.5}.info p{font-size:12px}.info code{color:#fff}.toast{position:fixed;z-index:9;top:15px;left:50%;transform:translateX(-50%);background:#f5f5f5;color:#08080a;padding:10px 14px;border-radius:99px;font-size:12px;font-weight:800;box-shadow:0 10px 40px #0008}footer{padding:30px 2px;color:#666;font-size:11px}@media(max-width:760px){.grid{grid-template-columns:1fr}.controls{flex-direction:column;align-items:stretch}.toolbar{align-items:flex-start}.toolbar>div:last-child{display:flex}.page{padding:12px}}`}</style>
  </main>;
}
