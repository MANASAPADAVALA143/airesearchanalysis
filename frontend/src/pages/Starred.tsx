import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteJson, getJson, postPdf } from '../api'
import { PainBadges } from '../components/Badges'
import type { PainPoint, StarredRow } from '../types'

function toPain(row: StarredRow): PainPoint {
  return {
    title: row.pain_title,
    impact: row.pain_impact,
    sourceValidation: '—',
    difficulty: row.difficulty,
    tam: row.tam,
    demand: row.demand,
    aiSolution: row.ai_solution,
  }
}

export default function Starred() {
  const [rows, setRows] = useState<StarredRow[]>([])
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await getJson<StarredRow[]>('/api/starred')
      setRows(data)
      setErr(null)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function remove(id: number) {
    try {
      await deleteJson(`/api/starred/${id}`)
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  async function exportPdf() {
    if (!rows.length) return
    try {
      const blob = await postPdf('/api/export-pdf', {
        starred_ideas: rows.map((r) => ({
          query: r.query,
          pain_title: r.pain_title,
          pain_impact: r.pain_impact,
          difficulty: r.difficulty,
          tam: r.tam,
          demand: r.demand,
          ai_solution: r.ai_solution,
          buildPaths: r.buildPaths,
        })),
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'starred-ideas.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Export failed')
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Starred ideas</h1>
          <p className="mt-1 text-sm text-zinc-600">Saved from research or build pages.</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/research"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800"
          >
            Back to research
          </Link>
          <button
            type="button"
            disabled={!rows.length}
            onClick={() => void exportPdf()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            Export PDF
          </button>
        </div>
      </div>
      {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
      <div className="mt-8 space-y-4">
        {rows.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase text-zinc-400">Query</p>
                <p className="text-sm text-zinc-700">{r.query}</p>
                <p className="mt-3 font-medium text-zinc-900">{r.pain_title}</p>
                <p className="mt-1 text-sm text-zinc-600">{r.pain_impact}</p>
                <p className="mt-2 text-xs text-zinc-500">{r.ai_solution}</p>
              </div>
              <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                <PainBadges pain={toPain(r)} />
                <button
                  type="button"
                  onClick={() => void remove(r.id)}
                  className="text-xs font-medium text-red-700 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && !err && (
          <p className="text-center text-sm text-zinc-500">Nothing starred yet.</p>
        )}
      </div>
    </div>
  )
}
