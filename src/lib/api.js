// Calls to our own server. Every call has a timeout; if Pinch can't be reached,
// callers get { offline: true } instead of an exception.

async function post(url, body, timeoutMs) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
    if (!res.ok) return { offline: true, status: res.status }
    return await res.json()
  } catch {
    return { offline: true }
  } finally {
    clearTimeout(timer)
  }
}

// 30s leaves room for the server to fall back to a second model when one is busy.
export const postStep = (body) => post('/api/step', body, 30_000)
export const postAnswer = (body) => post('/api/answer', body, 30_000)
export const postCard = (body) => post('/api/card', body, 45_000)
