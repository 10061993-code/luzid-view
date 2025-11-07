const OPENAI_API_URL = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
function assertEnv(){ if(!OPENAI_API_KEY) throw new Error('[model_client] OPENAI_API_KEY fehlt – in Railway setzen.'); }
export async function generateChat(opts){
  assertEnv();
  const { model='gpt-5', system, user, temperature=0.7, max_tokens=450 } = opts;
  const body = { model, messages:[{role:'system',content:system},{role:'user',content:user}], temperature, max_tokens };
  const res = await fetch(OPENAI_API_URL,{ method:'POST', headers:{ 'Authorization':`Bearer ${OPENAI_API_KEY}`, 'Content-Type':'application/json' }, body: JSON.stringify(body) });
  if(!res.ok){ const text=await res.text().catch(()=> ''); throw new Error(`[model_client] OpenAI HTTP ${res.status}: ${text}`); }
  const json = await res.json();
  return (json?.choices?.[0]?.message?.content ?? '').trim();
}
