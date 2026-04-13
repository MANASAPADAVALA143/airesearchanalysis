import type { PainPoint } from '../types'

function toneDifficulty(d: string) {
  const x = d.toLowerCase()
  if (x.includes('easy')) return 'bg-green-100 text-green-800 ring-green-600/20'
  if (x.includes('hard')) return 'bg-red-100 text-red-800 ring-red-600/20'
  return 'bg-amber-100 text-amber-900 ring-amber-600/20'
}

function toneDemand(d: string) {
  const x = d.toLowerCase()
  if (x.includes('explosive')) return 'bg-purple-100 text-purple-900'
  if (x.includes('very')) return 'bg-violet-50 text-violet-900'
  return 'bg-zinc-100 text-zinc-800'
}

function toneTam(t: string) {
  const x = t.toLowerCase()
  if (x.includes('massive')) return 'bg-indigo-100 text-indigo-900'
  if (x.includes('large')) return 'bg-sky-100 text-sky-900'
  return 'bg-stone-100 text-stone-800'
}

export function PainBadges({ pain }: { pain: PainPoint }) {
  return (
    <div className="flex flex-wrap gap-2">
      <span
        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${toneDifficulty(pain.difficulty)}`}
      >
        {pain.difficulty}
      </span>
      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${toneTam(pain.tam)}`}>{pain.tam}</span>
      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${toneDemand(pain.demand)}`}>
        {pain.demand}
      </span>
    </div>
  )
}
