const m = {
  requests_total: 0,
  errors_total: 0,
  by_provider: { azure: { ok:0, err:0 }, openai: { ok:0, err:0 } },
  latency_ms_sum: 0,
  last_provider: null,
  last_switch_at: 0
};

export function metricsIncRequest(){ m.requests_total++; }
export function metricsIncError(){ m.errors_total++; }
export function metricsRecord(provider, ok, latency){
  if (!m.by_provider[provider]) m.by_provider[provider] = { ok:0, err:0 };
  m.by_provider[provider][ok ? 'ok':'err']++;
  m.latency_ms_sum += Math.max(0, latency|0);
  if (m.last_provider && m.last_provider !== provider) m.last_switch_at = Date.now();
  m.last_provider = provider;
}
export function getMetrics(){
  const avgLatency = m.requests_total ? Math.round(m.latency_ms_sum / m.requests_total) : 0;
  return { ...m, avg_latency_ms: avgLatency };
}
