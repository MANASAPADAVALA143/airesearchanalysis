import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getJson } from '../api'
import type { StatsResponse } from '../types'

export default function Home() {
  const [stats, setStats] = useState<StatsResponse | null>(null)

  useEffect(() => {
    let c = false
    ;(async () => {
      try {
        const s = await getJson<StatsResponse>('/api/stats')
        if (!c) setStats(s)
      } catch {
        if (!c) setStats(null)
      }
    })()
    return () => {
      c = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-4xl px-8 py-12">
      <h1 className="text-left text-4xl font-bold tracking-tight text-zinc-900">
        Pain point research
      </h1>
      <p className="mt-3 max-w-2xl text-left text-lg text-zinc-600">
        Run an eight-source style market scan (via Claude), surface ten ranked pain points, then turn
        any insight into three build paths: SaaS, coaching, or services.
      </p>
      <Link
        to="/research"
        className="mt-8 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
      >
        Start research →
      </Link>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total searches', value: stats?.totalSearches ?? '—' },
          { label: 'Opportunities surfaced', value: stats?.opportunitiesFound ?? '—' },
          { label: 'Pain points (all runs)', value: stats?.painPoints ?? '—' },
          { label: 'Starred w/ build paths', value: stats?.buildPaths ?? '—' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <div className="text-2xl font-semibold text-zinc-900">{s.value}</div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {[
          {
            title: 'AI software',
            desc: 'SaaS-shaped offers with pricing, stack, and feature wedges.',
            border: 'border-t-[3px] border-t-primary',
          },
          {
            title: 'AI coaching',
            desc: 'Programs and curricula anchored to the same demand signals.',
            border: 'border-t-[3px] border-t-amber-500',
          },
          {
            title: 'AI services',
            desc: 'Done-for-you delivery models with proof and positioning.',
            border: 'border-t-[3px] border-t-green-600',
          },
        ].map((c) => (
          <div
            key={c.title}
            className={`rounded-xl border border-zinc-200 bg-white p-5 shadow-sm ${c.border}`}
          >
            <h2 className="text-lg font-semibold text-zinc-900">{c.title}</h2>
            <p className="mt-2 text-sm text-zinc-600">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
