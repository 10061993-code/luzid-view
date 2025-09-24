/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import React, { useMemo, useState } from "react";

type Tokens = {
  font_family: string;
  font_size_base: string;
  color_fg: string;
  color_bg: string;
};

const FONTS = [
  "Inter","DM Sans","Poppins","Roboto","Open Sans",
  "Merriweather","Lora","Montserrat","Futura","System UI","SF Pro Text"
];

function todayISO() { return new Date().toISOString().slice(0,10); }
function dl(name:string, data:string, mime="application/octet-stream"){
  const blob = new Blob([data],{type:mime}); const url=URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url);
}

export default function Page(){
  // solide defaults
  const [slug, setSlug]     = useState("lena");
  const [date, setDate]     = useState(todayISO());
  const [apiBase, setApiBase] = useState("http://localhost:8787"); // << wichtig
  const [apiKey, setApiKey] = useState("test");

  const [tokens, setTokens] = useState<Tokens>({
    font_family: "Inter",
    font_size_base: "16px",
    color_fg: "#111111",
    color_bg: "#ffffff",
  });

  const [busy, setBusy] = useState(false);
  const [msg, setMsg]   = useState<{type:"ok"|"err", text:string}|null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  // simpler kontrast-hinweis (Text vs BG)
  const contrastWarn = useMemo(()=>{
    const L=(hex:string)=>{ const m=/^#?([0-9a-f]{6})$/i.exec(hex); if(!m) return 0;
      const h=m[1]; const c=(i:number)=>parseInt(h.slice(i,i+2),16)/255;
      const lin=(x:number)=> x<=0.03928? x/12.92 : Math.pow((x+0.055)/1.055,2.4);
      return 0.2126*lin(c(0))+0.7152*lin(c(2))+0.0722*lin(c(4));
    };
    const ratio=(a:number,b:number)=>(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
    return ratio(L(tokens.color_fg), L(tokens.color_bg)) < 4.5;
  },[tokens]);

  const previewUrl = `/view/${encodeURIComponent(slug)}/${encodeURIComponent(date)}`;

  async function publish(){
    setMsg(null);
    if(!slug){ setMsg({type:"err", text:"Bitte Slug setzen."}); return; }
    setBusy(true);
    try{
      const url = `${apiBase.replace(/\/+$/,"")}/tenants/${encodeURIComponent(slug)}/theme.tokens`;
      const res = await fetch(url,{
        method:"POST",
        headers:{ "Content-Type":"application/json", "X-API-Key": apiKey },
        body: JSON.stringify(tokens)
      });
      const text = await res.text();
      if(!res.ok){
        setMsg({type:"err", text:`Publish fehlgeschlagen (${res.status}): ${text.slice(0,200)}`});
      }else{
        // kleine success-meldung + preview reload
        setMsg({type:"ok", text:`Published ✅ ${text.slice(0,200)}`});
        setPreviewKey(k=>k+1); // iFrame neu laden
      }
    }catch(e:any){
      setMsg({type:"err", text:`Network/JS Error: ${e?.message || e}`});
    }finally{
      setBusy(false);
    }
  }

  function exportJson(){ dl(`${slug}.tokens.json`, JSON.stringify(tokens,null,2), "application/json"); }
  function exportCss(){
    const scope = `[data-tenant="${slug}"]`;
    const css = `
${scope}{
  --lz-font-family: ${tokens.font_family};
  --lz-font-size: ${tokens.font_size_base};
  --lz-fg: ${tokens.color_fg};
  --lz-bg: ${tokens.color_bg};
}
${scope}, ${scope} body{
  font-family: var(--lz-font-family), system-ui, -apple-system, Segoe UI, Roboto, Arial;
  color: var(--lz-fg);
  background: var(--lz-bg);
  font-size: var(--lz-font-size);
}
`.trim()+"\n";
    dl(`${slug}.local.css`, css, "text/css");
  }

  return (
    <div className="min-h-screen w-full p-6 space-y-4">
      <h1 className="text-xl font-semibold">Theme Configurator (Minimal)</h1>

      {msg && (
        <div className={`p-3 rounded-lg border ${msg.type==="ok" ? "bg-green-50 border-green-300 text-green-800" : "bg-red-50 border-red-300 text-red-800"}`}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            <button className="text-xs underline" onClick={()=>setMsg(null)}>close</button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {/* Controls */}
        <div className="space-y-3 p-4 rounded-xl border">
          <label className="block text-sm">Slug</label>
          <input className="w-full border rounded p-2" value={slug} onChange={e=>setSlug(e.target.value.toLowerCase())} />

          <label className="block text-sm">Date (YYYY-MM-DD)</label>
          <input className="w-full border rounded p-2" value={date} onChange={e=>setDate(e.target.value)} />

          <label className="block text-sm">API Base</label>
          <input className="w-full border rounded p-2" value={apiBase} onChange={e=>setApiBase(e.target.value)} placeholder="http://localhost:8787" />

          <label className="block text-sm">API Key</label>
          <input className="w-full border rounded p-2" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="test" />

          <hr/>

          <label className="block text-sm">Font</label>
          <select className="w-full border rounded p-2" value={tokens.font_family} onChange={e=>setTokens({...tokens, font_family:e.target.value})}>
            {FONTS.map(f=> <option key={f} value={f}>{f}</option>)}
          </select>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm">Textfarbe</label>
              <input type="color" className="w-full h-10" value={tokens.color_fg} onChange={e=>setTokens({...tokens, color_fg:e.target.value})}/>
            </div>
            <div>
              <label className="block text-sm">Hintergrund</label>
              <input type="color" className="w-full h-10" value={tokens.color_bg} onChange={e=>setTokens({...tokens, color_bg:e.target.value})}/>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={publish} disabled={busy} className="px-4 py-2 rounded bg-black text-white disabled:opacity-50">
              {busy ? "Publishing…" : "Publish"}
            </button>
            <button onClick={exportJson} className="px-4 py-2 rounded border">Export JSON</button>
            <button onClick={exportCss} className="px-4 py-2 rounded border">Export CSS</button>
          </div>

          {contrastWarn && (
            <p className="text-amber-600 text-xs pt-1">Hinweis: Kontrast Text↔Hintergrund könnte unter WCAG AA liegen.</p>
          )}
        </div>

        {/* Preview */}
        <div className="md:col-span-2 h-[80vh] border rounded-xl overflow-hidden">
          <iframe
            key={previewKey + ":" + previewUrl}
            src={previewUrl}
            className="w-full h-full border-0"
            referrerPolicy="no-referrer"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
      </div>
    </div>
  );
}

