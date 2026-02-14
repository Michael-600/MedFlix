const PERPLEXITY_BASE_URL = 'https://api.perplexity.ai'

export function getPerplexityKey() {
  return process.env.PERPLEXITY_API_KEY || process.env.PPLX_API_KEY || null
}

export async function perplexitySonarChat({
  apiKey,
  model = 'sonar',
  messages,
  max_tokens = 900,
  temperature = 0.2,
  search_recency_filter = 'month',
  timeout_ms = 45_000,
}) {
  if (!apiKey) {
    return { ok: false, error: 'missing_api_key' }
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, error: 'missing_messages' }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeout_ms)

  try {
    const res = await fetch(`${PERPLEXITY_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages,
        max_tokens,
        temperature,
        search_recency_filter,
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      return { ok: false, error: `http_${res.status}`, detail }
    }

    const json = await res.json().catch(() => null)
    const content = json?.choices?.[0]?.message?.content ?? null

    return {
      ok: true,
      data: {
        content,
        raw: json,
      },
    }
  } catch (e) {
    const isAbort = e?.name === 'AbortError'
    return { ok: false, error: isAbort ? 'timeout' : 'request_failed', detail: e?.message }
  } finally {
    clearTimeout(timeout)
  }
}
