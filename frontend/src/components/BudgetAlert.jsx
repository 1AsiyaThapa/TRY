import { useState, useEffect } from 'react'
import { BASE_URL } from '../utils/api'

const API = (path) => {
  const token = localStorage.getItem('token')
  return fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export default function BudgetAlert() {
  const [alert, setAlert] = useState(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const checkBudget = async () => {
      try {
        const month = new Date().toISOString().slice(0, 7)

        // Check if already dismissed today
        const dismissKey = `budget_alert_dismissed_${month}`
        if (localStorage.getItem(dismissKey)) return

        const res = await API(`/api/budgets?month=${month}`)
        if (!res.ok) return
        const data = await res.json()

        if (!data.budget) return

        const pct = (data.spent / data.budget.amount) * 100

        if (pct >= 100) {
          setAlert({ type: 'over', pct, spent: data.spent, budget: data.budget.amount })
        } else if (pct >= 80) {
          setAlert({ type: 'warn', pct, spent: data.spent, budget: data.budget.amount })
        }
      } catch {}
    }
    checkBudget()
  }, [])

  const dismiss = () => {
    const month = new Date().toISOString().slice(0, 7)
    localStorage.setItem(`budget_alert_dismissed_${month}`, '1')
    setDismissed(true)
  }

  if (!alert || dismissed) return null

  const remaining = alert.budget - alert.spent

  return (
    <div className={`rounded-2xl border px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
      alert.type === 'over'
        ? 'bg-red-50 border-red-200'
        : 'bg-amber-50 border-amber-200'
    }`}>
      <div className="flex items-start gap-3 flex-1">
        <span className="text-xl mt-0.5">{alert.type === 'over' ? '🔴' : '⚠️'}</span>
        <div>
          <p className={`text-sm font-semibold ${alert.type === 'over' ? 'text-red-700' : 'text-amber-700'}`}>
            {alert.type === 'over'
              ? `You've exceeded your monthly budget!`
              : `You've used ${alert.pct.toFixed(0)}% of your monthly budget`}
          </p>
          <p className={`text-xs mt-0.5 ${alert.type === 'over' ? 'text-red-500' : 'text-amber-600'}`}>
            {alert.type === 'over'
              ? `Spent Rs.${alert.spent.toFixed(2)} of Rs.${alert.budget.toFixed(2)} — Rs.${(alert.spent - alert.budget).toFixed(2)} over limit`
              : `Rs.${remaining.toFixed(2)} remaining — spend carefully for the rest of the month`}
          </p>
        </div>
      </div>
      <button
        onClick={dismiss}
        className="text-gray-400 hover:text-gray-600 transition-colors p-1 flex-shrink-0"
        title="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}
