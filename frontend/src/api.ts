const apiBase = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export function apiUrl(path: string): string {
  if (apiBase) return `${apiBase}${path.startsWith('/') ? path : `/${path}`}`
  return path.startsWith('/') ? path : `/${path}`
}

async function parseError(res: Response): Promise<string> {
  try {
    const j = await res.json()
    if (j && typeof j.detail === 'string') return j.detail
    return JSON.stringify(j)
  } catch {
    return await res.text()
  }
}

export async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path))
  if (!res.ok) throw new Error(await parseError(res))
  return res.json() as Promise<T>
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json() as Promise<T>
}

export async function deleteJson(path: string): Promise<void> {
  const res = await fetch(apiUrl(path), { method: 'DELETE' })
  if (!res.ok) throw new Error(await parseError(res))
}

export async function postPdf(path: string, body: unknown): Promise<Blob> {
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.blob()
}
