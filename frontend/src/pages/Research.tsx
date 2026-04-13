import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { postJson } from '../api'
import { PainBadges } from '../components/Badges'
import type { BuildResponse, PainPoint, ResearchResponse } from '../types'

const AGENTS = [
  'Scan Reddit & Quora',
  'Mine YouTube & LinkedIn',
  'Read App Store & Amazon reviews',
  'Scan Twitter/X & job postings',
  'Check Google Trends & IndiaMART',
  'Cross-validate all eight sources',
  'Rank by TAM & demand',
  'Generate worldwide opportunity report',
]

const SOURCE_KEYS = [
  ['reddit', 'Reddit'],
  ['quora', 'Quora'],
  ['youtube', 'YouTube'],
  ['linkedin', 'LinkedIn'],
  ['reviews', 'App Store / Amazon'],
  ['twitter', 'Twitter / X'],
  ['googleTrends', 'Google Trends'],
  ['india', 'India signals'],
] as const

export default function Research() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agentDone, setAgentDone] = useState(0)
  const [result, setResult] = useState<ResearchResponse | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTick = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current)
      tickRef.current = null
    }
  }

  useEffect(() => () => clearTick(), [])

  async function runResearch() {
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setError(null)
    setResult(null)
    setAgentDone(0)
    clearTick()
    tickRef.current = setInterval(() => {
      setAgentDone((n) => (n < 7 ? n + 1 : n))
    }, 450)

    try {
      const data = await postJson<ResearchResponse>('/api/research', { query: q })
      setResult(data)
      setAgentDone(AGENTS.length)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
      setAgentDone(0)
    } finally {
      clearTick()
      setLoading(false)
    }
  }

  async function starPain(pain: PainPoint) {
    try {
      await postJson('/api/star', {
        query: query.trim(),
        painPoint: pain,
        buildPaths: null,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Star failed')
    }
  }

  async function createPaths(pain: PainPoint) {
    try {
      const data = await postJson<BuildResponse>('/api/build', {
        query: query.trim(),
        painPoint: pain,
      })
      navigate('/build', {
        state: { query: query.trim(), pain, build: data },
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Build failed')
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <h1 className="text-2xl font-bold text-zinc-900">Research engine</h1>
      <p className="mt-1 max-w-2xl text-sm text-zinc-600">
        One structured Claude run models eight agent-style passes, then stores this search in your
        local history.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label className="block text-xs font-medium uppercase text-zinc-500">Industry or niche</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. cold chain logistics for pharmacies in India"
            className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none ring-primary focus:border-primary focus:ring-2"
          />
        </div>
        <button
          type="button"
          disabled={loading || !query.trim()}
          onClick={() => void runResearch()}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Running…' : 'Research'}
        </button>
      </div>

      {(loading || result) && (
        <div className="mt-10 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Agent progress</h2>
          <ol className="mt-4 space-y-2">
            {AGENTS.map((label, i) => {
              const done = i < agentDone
              return (
                <li key={label} className="flex items-center gap-3 text-sm">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      done ? 'bg-green-600 text-white' : 'bg-zinc-100 text-zinc-400'
                    }`}
                  >
                    {done ? '✓' : i + 1}
                  </span>
                  <span className={done ? 'text-zinc-900' : 'text-zinc-400'}>{label}</span>
                </li>
              )
            })}
          </ol>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-10 space-y-10">
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Market overview</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">{result.market}</p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">Eight source signals</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {SOURCE_KEYS.map(([key, label]) => (
                <div
                  key={key}
                  className="rounded-xl border border-zinc-200 bg-white p-4 text-sm shadow-sm"
                >
                  <div className="font-medium text-zinc-900">{label}</div>
                  <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-zinc-600">
                    {result.sourceSignals[key] || '—'}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">Pain points</h2>
            <div className="space-y-4">
              {result.painPoints.map((pain, idx) => (
                <div
                  key={`${idx}-${pain.title}`}
                  className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-primary/40"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <p className="font-medium leading-snug text-zinc-900">{pain.title}</p>
                      <p className="mt-1 text-sm text-zinc-600">{pain.impact}</p>
                      <p className="mt-2 text-xs text-zinc-500">
                        <span className="font-medium text-zinc-700">Validated: </span>
                        {pain.sourceValidation}
                      </p>
                      <p className="mt-2 text-xs text-zinc-500">
                        <span className="font-medium text-zinc-700">AI angle: </span>
                        {pain.aiSolution}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                      <PainBadges pain={pain} />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void starPain(pain)}
                          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
                        >
                          Star
                        </button>
                        <button
                          type="button"
                          onClick={() => void createPaths(pain)}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
                        >
                          Create
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
