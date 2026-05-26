import { useState, useEffect } from 'react'

const API = (path, options = {}) => {
  const token = localStorage.getItem('token')
  return fetch(`http://localhost:5000${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
  })
}

const daysUntil = (date) => {
  const diff = new Date(date) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function RecurringNotifications() {
  const [upcoming, setUpcoming] = useState([])
  const [dismissed, setDismissed] = useState(() => {
    const saved = localStorage.getItem('dismissed_recurring')
    return saved ? JSON.parse(saved) : []
  })

  const fetchUpcoming = async () => {
    try {
      const res = await API('/api/recurring/upcoming')
      if (res.ok) setUpcoming(await res.json())
    } catch {}
  }

  useEffect(() => { fetchUpcoming() }, [])

  const dismiss = (id) => {
    const updated = [...dismissed, id]
    setDismissed(updated)
    localStorage.setItem('dismissed_recurring', JSON.stringify(updated))
  }

  const handleLog = async (id) => {
    const res = await API(`/api/recurring/${id}/log`, { method: 'POST' })
    if (res.ok) { dismiss(id); fetchUpcoming() }
  }

  const handleSkip = async (id) => {
    const res = await API(`/api/recurring/${id}/skip`, { method: 'POST' })
    if (res.ok) { dismiss(id); fetchUpcoming() }
  }

  const handleDisable = async (id) => {
    const res = await API(`/api/recurring/${id}/toggle`, { method: 'PATCH' })
    if (res.ok) { dismiss(id); fetchUpcoming() }
  }

  const visible = upcoming.filter(r => !dismissed.includes(r._id))
  if (visible.length === 0) return null

  return (
    <div className="space-y-2 mb-6">
      {visible.map((r) => {
        const days = daysUntil(r.nextDue)
        const isOverdue = days < 0
        const isToday = days === 0

        return (
          <div key={r._id}
            className={`rounded-2xl border px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
              isOverdue ? 'bg-red-50 border-red-200' : isToday ? 'bg-orange-50 border-orange-200' : 'bg-amber-50 border-amber-200'
            }`}>

            {/* Icon + text */}
            <div className="flex items-start gap-3 flex-1">
              <span className="text-xl mt-0.5">{isOverdue ? '🔴' : isToday ? '🟠' : '🔔'}</span>
              <div>
                <p className={`text-sm font-semibold ${isOverdue ? 'text-red-700' : isToday ? 'text-orange-700' : 'text-amber-700'}`}>
                  {isOverdue
                    ? `Overdue: ${r.category}`
                    : isToday
                    ? `Due today: ${r.category}`
                    : `Due in ${days} day${days !== 1 ? 's' : ''}: ${r.category}`}
                </p>
                <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-500' : isToday ? 'text-orange-500' : 'text-amber-600'}`}>
                  Rs.{r.amount.toFixed(2)} · {r.frequency} · {new Date(r.nextDue).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => handleLog(r._id)}
                className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Mark paid
              </button>
              <button
                onClick={() => handleSkip(r._id)}
                className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={() => handleDisable(r._id)}
                className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Disable
              </button>
              <button
                onClick={() => dismiss(r._id)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                title="Dismiss"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
