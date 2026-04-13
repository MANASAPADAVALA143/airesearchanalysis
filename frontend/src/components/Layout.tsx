import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { getJson } from '../api'
import type { SearchHistoryRow } from '../types'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
  }`

export default function Layout() {
  const [recent, setRecent] = useState<SearchHistoryRow[]>([])
  const location = useLocation()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const rows = await getJson<SearchHistoryRow[]>('/api/history')
        if (!cancelled) setRecent(rows.slice(0, 5))
      } catch {
        if (!cancelled) setRecent([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [location.pathname])

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col bg-[#111111] px-4 py-6 text-white">
        <div className="mb-8">
          <div className="text-lg font-semibold tracking-tight">Research</div>
          <div className="text-xs uppercase tracking-widest text-zinc-500">Pain point platform</div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          <NavLink to="/" end className={navClass}>
            Home
          </NavLink>
          <NavLink to="/research" className={navClass}>
            Research
          </NavLink>
          <NavLink to="/starred" className={navClass}>
            Starred ideas
          </NavLink>
          <NavLink to="/history" className={navClass}>
            Search history
          </NavLink>
        </nav>
        <div className="mt-6 border-t border-white/10 pt-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Recent searches
          </div>
          <ul className="space-y-1 text-xs text-zinc-400">
            {recent.length === 0 && <li className="text-zinc-600">None yet</li>}
            {recent.map((r) => (
              <li key={r.id} className="truncate" title={r.query}>
                {r.query}
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-auto pt-6 text-[10px] leading-relaxed text-zinc-600">
          Local app · FastAPI + React + Claude
        </p>
      </aside>
      <main className="min-w-0 flex-1 bg-page">
        <Outlet />
      </main>
    </div>
  )
}
