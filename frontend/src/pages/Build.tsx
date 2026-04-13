import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { postJson } from '../api'
import type { BuildPath, BuildResponse, PainPoint } from '../types'

type LocState = {
  query: string
  pain: PainPoint
  build: BuildResponse
} | null

const EVIDENCE_KEYS = [
  ['reddit', 'Reddit'],
  ['quora', 'Quora'],
  ['youtube', 'YouTube'],
  ['linkedin', 'LinkedIn'],
  ['reviews', 'Reviews'],
  ['twitter', 'Twitter / X'],
  ['googleTrends', 'Google Trends'],
  ['india', 'India'],
] as const

function cardAccent(type: string) {
  if (type.includes('Software')) return 'border-t-primary'
  if (type.includes('Coaching')) return 'border-t-amber-500'
  return 'border-t-green-600'
}

export default function Build() {
  const navigate = useNavigate()
  const location = useLocation()
  const [state, setState] = useState<LocState>(null)

  useEffect(() => {
    const s = location.state as LocState
    if (s?.build && s?.pain && s?.query) setState(s)
    else setState(null)
  }, [location.state])

  if (!state) {
    return (
      <div className="mx-auto max-w-lg px-8 py-16 text-center">
        <p className="text-zinc-600">Open this page from Research after clicking Create on a pain point.</p>
        <Link to="/research" className="mt-6 inline-block text-sm font-semibold text-primary">
          Go to research →
        </Link>
      </div>
    )
  }

  const { query, pain, build } = state

  async function saveStar() {
    await postJson('/api/star', {
      query,
      painPoint: pain,
      buildPaths: build.buildPaths,
    })
    navigate('/starred')
  }

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <Link to="/research" className="text-sm font-medium text-primary">
          ← Research
        </Link>
        <button
          type="button"
          onClick={() => void saveStar()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
        >
          Star with build paths
        </button>
      </div>

      <header className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-medium uppercase text-zinc-400">Selected pain</p>
        <h1 className="mt-1 text-xl font-bold text-zinc-900">{pain.title}</h1>
        <p className="mt-2 text-sm text-zinc-600">{pain.impact}</p>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">{build.painDeep}</p>
      </header>

      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
        <span className="font-semibold">Competitor gap: </span>
        {build.competitorGap}
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-zinc-900">Eight-source evidence</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {EVIDENCE_KEYS.map(([key, label]) => (
            <div key={key} className="rounded-lg border border-zinc-200 bg-white p-4 text-xs text-zinc-700">
              <div className="font-semibold text-zinc-900">{label}</div>
              <p className="mt-2 whitespace-pre-wrap leading-relaxed">{build.sourceEvidence[key] || '—'}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Build paths</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {build.buildPaths.map((path: BuildPath) => (
            <article
              key={path.type}
              className={`flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm ${cardAccent(path.type)} border-t-[3px]`}
            >
              <p className="text-xs font-semibold uppercase text-zinc-400">{path.type}</p>
              <h3 className="mt-1 text-lg font-bold text-zinc-900">{path.name || 'Untitled'}</h3>
              <p className="mt-1 text-sm text-primary">{path.tagline}</p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-600">{path.description}</p>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-zinc-400">Build time</dt>
                  <dd className="font-medium text-zinc-800">{path.buildTime || '—'}</dd>
                </div>
                <div>
                  <dt className="text-zinc-400">Price range</dt>
                  <dd className="font-medium text-zinc-800">{path.priceRange || '—'}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-zinc-400">Revenue target</dt>
                  <dd className="font-medium text-zinc-800">{path.revenueTarget || '—'}</dd>
                </div>
              </dl>
              <div className="mt-4">
                <p className="text-xs font-medium text-zinc-500">Features</p>
                <ul className="mt-1 list-inside list-disc text-xs text-zinc-700">
                  {(path.features || []).slice(0, 4).map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-3">
                <p className="text-xs font-medium text-zinc-500">Stack / tools</p>
                <p className="text-xs text-zinc-700">{(path.tools || []).join(' · ') || '—'}</p>
              </div>
              <p className="mt-3 text-xs text-zinc-600">
                <span className="font-semibold text-zinc-800">ICP: </span>
                {path.idealCustomer}
              </p>
              <p className="mt-2 rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-800">
                <span className="font-semibold">Unfair advantage: </span>
                {path.unfairAdvantage}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
