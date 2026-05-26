import { useState, useEffect } from 'react'
import { BASE_URL } from '../utils/api'

const API = (path, options = {}) => {
  const token = localStorage.getItem('token')
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
  })
}

const monthLabel = (m) => new Date(m + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

const monthOptions = Array.from({ length: 12 }, (_, i) => {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() + i)
  return d.toISOString().slice(0, 7)
})

export default function BudgetPage() {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [data, setData] = useState({ budget: null, spent: 0 })
  const [form, setForm] = useState({ amount: '', month: currentMonth })
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchBudget = async () => {
    try {
      const res = await API(`/api/budgets?month=${currentMonth}`)
      if (res.ok) setData(await res.json())
    } catch {}
  }

  useEffect(() => { fetchBudget() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await API('/api/budgets', {
        method: 'POST',
        body: JSON.stringify({ amount: parseFloat(form.amount), month: form.month }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message)
      await fetchBudget()
      setEditing(false)
      setForm({ amount: '', month: currentMonth })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    await API(`/api/budgets/${currentMonth}`, { method: 'DELETE' })
    setData({ budget: null, spent: 0 })
  }

  const budget = data.budget?.amount || 0
  const spent = data.spent || 0
  const remaining = budget - spent
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
  const over = spent > budget && budget > 0
  const warn = pct >= 80 && !over

  return (
    <div className="space-y-6 max-w-xl">

      <div>
        <h2 className="text-xl font-bold text-gray-900">Budget</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          {monthLabel(currentMonth)} · resets automatically each month
        </p>
      </div>

      {/* Current budget card */}
      {data.budget ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Monthly Budget</p>
              <p className="text-4xl font-bold text-gray-900 mt-1">Rs.{budget.toFixed(2)}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setForm({ amount: budget, month: currentMonth }); setEditing(true) }}
                className="text-xs text-primary hover:underline">Edit</button>
              <button onClick={handleDelete}
                className="text-xs text-gray-400 hover:text-red-400 transition-colors">Remove</button>
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Spent so far</span>
              <span className={`font-semibold ${over ? 'text-red-500' : 'text-gray-700'}`}>
                Rs.{spent.toFixed(2)}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${over ? 'bg-red-500' : warn ? 'bg-amber-400' : 'bg-emerald-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-400">{pct.toFixed(0)}% used</span>
              <span className={`text-xs font-medium ${over ? 'text-red-500' : 'text-emerald-600'}`}>
                {over
                  ? `Rs.${(spent - budget).toFixed(2)} over budget`
                  : `Rs.${remaining.toFixed(2)} remaining`}
              </span>
            </div>
          </div>

          {/* Status message */}
          {over && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
              ⚠ You've exceeded your budget by Rs.{(spent - budget).toFixed(2)} this month.
            </div>
          )}
          {warn && !over && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
              You've used {pct.toFixed(0)}% of your budget. Spend carefully!
            </div>
          )}
          {!warn && !over && budget > 0 && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-700">
              You're on track. Rs.{remaining.toFixed(2)} left for the rest of the month.
            </div>
          )}
        </div>
      ) : (
        !editing && (
          <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-8 text-center">
            <p className="text-gray-400 text-sm mb-4">No budget set for {monthLabel(currentMonth)}.</p>
            <button onClick={() => setEditing(true)}
              className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
              Set Monthly Budget
            </button>
          </div>
        )
      )}

      {/* Form */}
      {editing && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            {data.budget ? 'Update Budget' : 'Set Budget'}
          </h3>
          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Budget Amount (Rs.)</label>
              <input
                type="number"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="e.g. 50000"
                min="1" step="0.01" required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-white">
                {monthOptions.map(m => (
                  <option key={m} value={m}>{monthLabel(m)}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setEditing(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition">Cancel</button>
              <button type="submit" disabled={loading}
                className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60">
                {loading ? 'Saving...' : 'Save Budget'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
