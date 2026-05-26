import { useState, useEffect, useRef } from 'react'
import { MonthlyBarChart, CategoryPieChart } from '../components/TransactionCharts'

const API = (path, options = {}) => {
  const token = localStorage.getItem('token')
  return fetch(`http://localhost:5000${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
  })
}

const LS_KEY = 'paisatrack_income_categories'

function CategoryDropdown({ categories, selected, onSelect, onAdd }) {
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setAdding(false) } }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleAdd = () => {
    const name = input.trim()
    if (!name) return setError('Category name cannot be empty.')
    if (categories.find(c => c.name.toLowerCase() === name.toLowerCase()))
      return setError('Category already exists.')
    onAdd(name)
    setInput('')
    setError('')
    setAdding(false)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(!open); setAdding(false); setError('') }}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-white"
      >
        <span className={selected ? 'text-gray-800' : 'text-gray-400'}>
          {selected || 'Select category'}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
          {/* Existing categories */}
          <ul className="max-h-48 overflow-y-auto">
            {categories.length === 0 && (
              <li className="px-4 py-3 text-xs text-gray-400">No categories yet.</li>
            )}
            {categories.map((c) => (
              <li key={c._id || c.name}>
                <button
                  type="button"
                  onClick={() => { onSelect(c.name); setOpen(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 hover:text-primary transition-colors ${
                    selected === c.name ? 'bg-indigo-50 text-primary font-medium' : 'text-gray-700'
                  }`}
                >
                  {c.name}
                </button>
              </li>
            ))}
          </ul>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Add new */}
          {!adding ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="w-full text-left px-4 py-2.5 text-sm text-primary font-medium hover:bg-indigo-50 transition-colors flex items-center gap-2"
            >
              <span className="text-lg leading-none">+</span> Add new category
            </button>
          ) : (
            <div className="p-3 space-y-2">
              <input
                autoFocus
                type="text"
                value={input}
                onChange={(e) => { setInput(e.target.value); setError('') }}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
                placeholder="Category name..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAdd}
                  className="flex-1 bg-primary text-white rounded-lg py-1.5 text-xs font-medium hover:bg-indigo-700 transition-colors"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => { setAdding(false); setInput(''); setError('') }}
                  className="flex-1 bg-gray-100 text-gray-600 rounded-lg py-1.5 text-xs font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function IncomePage() {
  const [incomes, setIncomes] = useState([])
  const [categories, setCategories] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '', amount: '', category: '', date: new Date().toISOString().split('T')[0], note: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load categories: try backend, fallback to localStorage
  const loadCategories = async () => {
    try {
      const res = await API('/api/categories?type=income')
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
        localStorage.setItem(LS_KEY, JSON.stringify(data))
        if (data.length > 0 && !form.category) setForm(f => ({ ...f, category: data[0].name }))
        return
      }
    } catch {}
    // fallback to localStorage
    const cached = localStorage.getItem(LS_KEY)
    if (cached) {
      const data = JSON.parse(cached)
      setCategories(data)
      if (data.length > 0) setForm(f => ({ ...f, category: data[0].name }))
    }
  }

  const loadIncomes = async () => {
    try {
      const res = await API('/api/transactions?type=income')
      if (res.ok) setIncomes(await res.json())
    } catch {}
  }

  useEffect(() => {
    loadCategories()
    loadIncomes()
  }, [])

  const handleAddCategory = async (name) => {
    try {
      const res = await API('/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name, type: 'income' }),
      })
      if (res.ok) {
        const data = await res.json()
        const updated = [...categories, data]
        setCategories(updated)
        localStorage.setItem(LS_KEY, JSON.stringify(updated))
        setForm(f => ({ ...f, category: data.name }))
        return
      }
    } catch {}
    // fallback: store locally only
    const local = { _id: Date.now().toString(), name, type: 'income' }
    const updated = [...categories, local]
    setCategories(updated)
    localStorage.setItem(LS_KEY, JSON.stringify(updated))
    setForm(f => ({ ...f, category: name }))
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.category) return setError('Please select or create a category.')
    setLoading(true)
    setError('')
    try {
      const res = await API('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({ ...form, title: form.category, type: 'income', amount: parseFloat(form.amount) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setIncomes(prev => [data, ...prev])
      setForm({ title: '', amount: '', category: categories[0]?.name || '', date: new Date().toISOString().split('T')[0], note: '' })
      setShowForm(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    const res = await API(`/api/transactions/${id}`, { method: 'DELETE' })
    if (res.ok) setIncomes(prev => prev.filter(i => i._id !== id))
  }

  const total = incomes.reduce((sum, i) => sum + i.amount, 0)

  // Chart data
  const monthlyData = Object.entries(
    incomes.reduce((acc, t) => {
      const m = new Date(t.date).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
      acc[m] = (acc[m] || 0) + t.amount
      return acc
    }, {})
  ).map(([month, amount]) => ({ month, amount }))

  const categoryData = Object.entries(
    incomes.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {})
  ).map(([category, amount]) => ({ category, amount }))

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Income</h2>
          <p className="text-sm text-gray-400 mt-0.5">Track all your income sources</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError('') }}
          className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + Add Income
        </button>
      </div>

      {/* Total */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
        <p className="text-sm text-emerald-700 font-medium">Total Income</p>
        <p className="text-3xl font-bold text-emerald-600 mt-1">Rs.{total.toFixed(2)}</p>
        <p className="text-xs text-emerald-500 mt-1">{incomes.length} record{incomes.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Charts */}
      {incomes.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-sm font-semibold text-gray-700 mb-4">Monthly Income</p>
            <MonthlyBarChart data={monthlyData} color="#10B981" label="Income" />
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-sm font-semibold text-gray-700 mb-4">By Category</p>
            <CategoryPieChart data={categoryData} />
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-800 mb-4">New Income</h3>
          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Rs.)</label>
              <input type="number" name="amount" value={form.amount} onChange={handleChange}
                placeholder="0.00" min="0.01" step="0.01" required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <CategoryDropdown
                categories={categories}
                selected={form.category}
                onSelect={(name) => setForm(f => ({ ...f, category: name }))}
                onAdd={handleAddCategory}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" name="date" value={form.date} onChange={handleChange} required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
              <input type="text" name="note" value={form.note} onChange={handleChange}
                placeholder="Any additional details..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
            </div>

            <div className="sm:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition">Cancel</button>
              <button type="submit" disabled={loading}
                className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60">
                {loading ? 'Saving...' : 'Save Income'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {incomes.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No income records yet. Add your first one.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Category</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Note</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">Amount</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {incomes.map((income) => (
                <tr key={income._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full">{income.category}</span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">
                    {new Date(income.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{income.note || '—'}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-emerald-600">+Rs.{income.amount.toFixed(2)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => handleDelete(income._id)}
                      className="text-gray-300 hover:text-red-400 transition-colors text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
