import { useEffect, useState } from 'react'
import { getJson } from '../api'
import type { SearchHistoryRow } from '../types'

export default function History() {
  const [rows, setRows] = useState<SearchHistoryRow[]>([])
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let c = false
    ;(async () => {
      try {
        const data = await getJson<SearchHistoryRow[]>('/api/history')
        if (!c) setRows(data)
      } catch (e) {
        if (!c) setErr(e instanceof Error ? e.message : 'Failed to load')
      }
    })()
    return () => {
      c = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <h1 className="text-2xl font-bold text-zinc-900">Search history</h1>
      <p className="mt-1 text-sm text-zinc-600">Successful research runs stored in SQLite.</p>
      {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs font-semibold uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Query</th>
              <th className="px-4 py-3">Pain points</th>
              <th className="px-4 py-3">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((r) => (
              <tr key={r.id} className="text-zinc-800">
                <td className="px-4 py-3 font-medium">{r.query}</td>
                <td className="px-4 py-3">{r.pain_count}</td>
                <td className="px-4 py-3 text-zinc-500">{r.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && !err && (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">No history yet.</p>
        )}
      </div>
    </div>
  )
}
