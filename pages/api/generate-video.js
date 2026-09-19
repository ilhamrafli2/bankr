export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"POST only"});
  const key=process.env.POLLINATIONS_KEY;
  if(!key) return res.status(500).json({error:"POLLINATIONS_KEY belum dipasang di Vercel."});
  const {prompt,model="ltx-2",duration=5,aspectRatio="9:16"}=req.body||{};
  if(!prompt) return res.status(400).json({error:"prompt wajib diisi"});
  const qs=new URLSearchParams({model,duration:String(duration),aspectRatio});
  const url="https://gen.pollinations.ai/video/"+encodeURIComponent(prompt)+"?"+qs.toString();
  try{
    const r=await fetch(url,{headers:{Authorization:"Bearer "+key}});
    if(!r.ok){const t=await r.text();return res.status(r.status).json({error:t||("Pollinations HTTP "+r.status)});}
    const type=r.headers.get("content-type")||"video/mp4";
    const buf=Buffer.from(await r.arrayBuffer());
    res.setHeader("Content-Type",type);
    res.setHeader("Cache-Control","no-store");
    return res.status(200).send(buf);
  }catch(e){return res.status(502).json({error:e.message||"Generation failed"});}
}