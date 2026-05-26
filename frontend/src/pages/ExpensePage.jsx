import { useState, useEffect, useRef } from 'react'
import ExpensePrediction from '../components/ExpensePrediction'
import { MonthlyBarChart, CategoryPieChart } from '../components/TransactionCharts'
import { triggerBudgetPushNotification } from '../utils/pushNotification'

const API = (path, options = {}) => {
  const token = localStorage.getItem('token')
  return fetch(`http://localhost:5000${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
  })
}

const LS_KEY = 'paisatrack_expense_categories'

function CategoryDropdown({ categories, selected, onSelect, onAdd }) {
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const ref = useRef(null)

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
      <button
        type="button"
        onClick={() => { setOpen(!open); setAdding(false); setError('') }}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition bg-white"
      >
        <span className={selected ? 'text-gray-800' : 'text-gray-400'}>
          {selected || 'Select category'}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
          <ul className="max-h-48 overflow-y-auto">
            {categories.length === 0 && (
              <li className="px-4 py-3 text-xs text-gray-400">No categories yet.</li>
            )}
            {categories.map((c) => (
              <li key={c._id || c.name}>
                <button
                  type="button"
                  onClick={() => { onSelect(c.name); setOpen(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 hover:text-red-600 transition-colors ${
                    selected === c.name ? 'bg-red-50 text-red-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-gray-100" />
          {!adding ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="w-full text-left px-4 py-2.5 text-sm text-red-500 font-medium hover:bg-red-50 transition-colors flex items-center gap-2"
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
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={handleAdd}
                  className="flex-1 bg-red-500 text-white rounded-lg py-1.5 text-xs font-medium hover:bg-red-600 transition-colors">
                  Add
                </button>
                <button type="button" onClick={() => { setAdding(false); setInput(''); setError('') }}
                  className="flex-1 bg-gray-100 text-gray-600 rounded-lg py-1.5 text-xs font-medium hover:bg-gray-200 transition-colors">
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

export default function ExpensePage() {
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    amount: '', category: '', date: new Date().toISOString().split('T')[0], note: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Receipt scanner state
  const [scanning, setScanning] = useState(false)
  const [scanLoading, setScanLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const fileRef = useRef(null)

  // Recurring state
  const [recurring, setRecurring] = useState([])
  const [showRecurring, setShowRecurring] = useState(false)
  const [recurringForm, setRecurringForm] = useState({
    category: '', amount: '', frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0], note: '',
  })
  const [recurringLoading, setRecurringLoading] = useState(false)

  const loadCategories = async () => {
    try {
      const res = await API('/api/categories?type=expense')
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
        localStorage.setItem(LS_KEY, JSON.stringify(data))
        if (data.length > 0) setForm(f => ({ ...f, category: data[0].name }))
        return
      }
    } catch {}
    const cached = localStorage.getItem(LS_KEY)
    if (cached) {
      const data = JSON.parse(cached)
      setCategories(data)
      if (data.length > 0) setForm(f => ({ ...f, category: data[0].name }))
    }
  }

  const loadExpenses = async () => {
    try {
      const res = await API('/api/transactions?type=expense')
      if (res.ok) setExpenses(await res.json())
    } catch {}
  }

  useEffect(() => {
    loadCategories()
    loadExpenses()
    loadRecurring()
    processRecurring()
  }, [])

  const loadRecurring = async () => {
    try {
      const res = await API('/api/recurring')
      if (res.ok) setRecurring(await res.json())
    } catch {}
  }

  const processRecurring = async () => {
    try {
      const res = await API('/api/recurring/process', { method: 'POST' })
      const data = await res.json()
      if (data.count > 0) loadExpenses()
    } catch {}
  }

  const handleAddRecurring = async (e) => {
    e.preventDefault()
    if (!recurringForm.category) return setError('Please select a category.')
    setRecurringLoading(true)
    try {
      const res = await API('/api/recurring', {
        method: 'POST',
        body: JSON.stringify({ ...recurringForm, type: 'expense', amount: parseFloat(recurringForm.amount) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setRecurring(prev => [...prev, data])
      setRecurringForm({ category: '', amount: '', frequency: 'monthly', startDate: new Date().toISOString().split('T')[0], note: '' })
      setShowRecurring(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setRecurringLoading(false)
    }
  }

  const handleDeleteRecurring = async (id) => {
    const res = await API(`/api/recurring/${id}`, { method: 'DELETE' })
    if (res.ok) setRecurring(prev => prev.filter(r => r._id !== id))
  }

  const handleScanUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setScanLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('receipt', file)
      const res = await fetch('http://localhost:5000/api/receipt/scan', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setForm(f => ({
        ...f,
        amount: data.amount || '',
        date: data.date || f.date,
        note: data.note || '',
        category: categories.find(c => c.name.toLowerCase() === data.category?.toLowerCase())?.name || f.category,
      }))
      setScanning(false)
      setShowForm(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setScanLoading(false)
    }
  }

  const handleAddCategory = async (name) => {
    try {
      const res = await API('/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name, type: 'expense' }),
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
    const local = { _id: Date.now().toString(), name, type: 'expense' }
    const updated = [...categories, local]
    setCategories(updated)
    localStorage.setItem(LS_KEY, JSON.stringify(updated))
    setForm(f => ({ ...f, category: name }))
  }

  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState('monthly')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.category) return setError('Please select or create a category.')
    setLoading(true)
    setError('')
    try {
      // Save as regular transaction
      const res = await API('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({ ...form, title: form.category, type: 'expense', amount: parseFloat(form.amount) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setExpenses(prev => [data, ...prev])

      // Trigger push notification if budget threshold crossed
      if (data.budgetAlert) triggerBudgetPushNotification(data.budgetAlert)

      // Also save as recurring if toggled
      if (isRecurring) {
        await API('/api/recurring', {
          method: 'POST',
          body: JSON.stringify({
            type: 'expense',
            category: form.category,
            amount: parseFloat(form.amount),
            frequency,
            startDate: form.date,
            note: form.note,
          }),
        })
        await loadRecurring()
      }

      setForm({ amount: '', category: categories[0]?.name || '', date: new Date().toISOString().split('T')[0], note: '' })
      setIsRecurring(false)
      setFrequency('monthly')
      setShowForm(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    const res = await API(`/api/transactions/${id}`, { method: 'DELETE' })
    if (res.ok) setExpenses(prev => prev.filter(e => e._id !== id))
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)

  const monthlyData = Object.entries(
    expenses.reduce((acc, t) => {
      const m = new Date(t.date).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
      acc[m] = (acc[m] || 0) + t.amount
      return acc
    }, {})
  ).map(([month, amount]) => ({ month, amount }))

  const categoryData = Object.entries(
    expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {})
  ).map(([category, amount]) => ({ category, amount }))

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Expenses</h2>
          <p className="text-sm text-gray-400 mt-0.5">Track where your money is going</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setScanning(!scanning); setShowForm(false); setError(''); setPreview(null) }}
            className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            Scan Receipt
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setScanning(false); setError('') }}
            className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
          >
            + Add Expense
          </button>
        </div>
      </div>

      {/* Receipt Scanner */}
      {scanning && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-800 mb-1">Scan Receipt</h3>
          <p className="text-xs text-gray-400 mb-4">Upload a photo of your receipt and AI will fill in the details automatically.</p>

          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleScanUpload} />

          {!scanLoading && !preview && (
            <button
              onClick={() => fileRef.current.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-12 flex flex-col items-center gap-3 hover:border-red-300 hover:bg-red-50 transition-colors group"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 group-hover:text-red-400 transition-colors">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span className="text-sm text-gray-400 group-hover:text-red-500 transition-colors">Click to upload receipt image</span>
              <span className="text-xs text-gray-300">JPG, PNG up to 5MB</span>
            </button>
          )}

          {scanLoading && (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Reading your receipt...</p>
            </div>
          )}

          {preview && !scanLoading && (
            <div className="flex items-center gap-4">
              <img src={preview} alt="Receipt" className="w-20 h-20 object-cover rounded-xl border border-gray-100" />
              <div>
                <p className="text-sm text-emerald-600 font-medium">✓ Receipt scanned successfully</p>
                <p className="text-xs text-gray-400 mt-1">Form has been filled in. Review and save.</p>
                <button onClick={() => fileRef.current.click()} className="text-xs text-primary hover:underline mt-1">
                  Upload different image
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
        <p className="text-sm text-red-700 font-medium">Total Expenses</p>
        <p className="text-3xl font-bold text-red-500 mt-1">Rs.{total.toFixed(2)}</p>
        <p className="text-xs text-red-400 mt-1">{expenses.length} record{expenses.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Charts */}
      {expenses.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-sm font-semibold text-gray-700 mb-4">Monthly Expenses</p>
            <MonthlyBarChart data={monthlyData} color="#EF4444" label="Expenses" />
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-sm font-semibold text-gray-700 mb-4">By Category</p>
            <CategoryPieChart data={categoryData} />
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-800 mb-4">New Expense</h3>
          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Rs.)</label>
              <input type="number" name="amount" value={form.amount} onChange={handleChange}
                placeholder="0.00" min="0.01" step="0.01" required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition" />
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
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
              <input type="text" name="note" value={form.note} onChange={handleChange}
                placeholder="Any additional details..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition" />
            </div>

            {/* Recurring toggle */}
            <div className="sm:col-span-2 bg-gray-50 rounded-xl p-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setIsRecurring(!isRecurring)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${isRecurring ? 'bg-red-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isRecurring ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">This is a recurring expense</span>
              </label>

              {isRecurring && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Repeat every</label>
                  <div className="flex gap-2">
                    {['daily', 'weekly', 'monthly', 'yearly'].map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFrequency(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
                          frequency === f
                            ? 'bg-red-500 text-white border-red-500'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sm:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition">Cancel</button>
              <button type="submit" disabled={loading}
                className="bg-red-500 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-60">
                {loading ? 'Saving...' : 'Save Expense'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {expenses.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No expense records yet. Add your first one.</div>
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
              {expenses.map((expense) => (
                <tr key={expense._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="bg-red-50 text-red-600 text-xs px-2.5 py-1 rounded-full">{expense.category}</span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">
                    {new Date(expense.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{expense.note || '—'}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-red-500">-Rs.{expense.amount.toFixed(2)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => handleDelete(expense._id)}
                      className="text-gray-300 hover:text-red-400 transition-colors text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ExpensePrediction />

      {/* Recurring Transactions */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <div>
            <h3 className="font-semibold text-gray-800">Recurring Expenses</h3>
            <p className="text-xs text-gray-400 mt-0.5">Auto-logged on their due date</p>
          </div>
          <button
            onClick={() => { setShowRecurring(!showRecurring); setError('') }}
            className="text-sm text-primary font-medium hover:underline"
          >
            + Add Recurring
          </button>
        </div>

        {showRecurring && (
          <div className="p-5 border-b border-gray-50">
            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
            <form onSubmit={handleAddRecurring} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <CategoryDropdown
                  categories={categories}
                  selected={recurringForm.category}
                  onSelect={(name) => setRecurringForm(f => ({ ...f, category: name }))}
                  onAdd={handleAddCategory}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Rs.)</label>
                <input type="number" value={recurringForm.amount}
                  onChange={(e) => setRecurringForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00" min="0.01" step="0.01" required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <select value={recurringForm.frequency}
                  onChange={(e) => setRecurringForm(f => ({ ...f, frequency: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition bg-white">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" value={recurringForm.startDate}
                  onChange={(e) => setRecurringForm(f => ({ ...f, startDate: e.target.value }))} required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition" />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
                <input type="text" value={recurringForm.note}
                  onChange={(e) => setRecurringForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="e.g. Monthly rent"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition" />
              </div>

              <div className="sm:col-span-2 flex gap-3 justify-end">
                <button type="button" onClick={() => setShowRecurring(false)}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition">Cancel</button>
                <button type="submit" disabled={recurringLoading}
                  className="bg-red-500 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-60">
                  {recurringLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        )}

        {recurring.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No recurring expenses set up yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Category</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Frequency</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Next Due</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">Amount</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recurring.map((r) => {
                const isOverdue = new Date(r.nextDue) <= new Date()
                return (
                  <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="bg-orange-50 text-orange-600 text-xs px-2.5 py-1 rounded-full">{r.category}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 capitalize">{r.frequency}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                        {isOverdue ? '⚠ ' : ''}{new Date(r.nextDue).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-red-500">-Rs.{r.amount.toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => handleDeleteRecurring(r._id)}
                        className="text-gray-300 hover:text-red-400 transition-colors text-xs">Delete</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
