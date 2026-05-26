import { useState, useEffect } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { BASE_URL } from '../utils/api'

const API = (path) => {
  const token = localStorage.getItem('token')
  return fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

const PRESETS = [
  { label: 'This month', getValue: () => { const d = new Date(); return { from: `${d.toISOString().slice(0,7)}-01`, to: new Date(d.getFullYear(), d.getMonth()+1, 0).toISOString().slice(0,10) } } },
  { label: 'Last month', getValue: () => { const d = new Date(); d.setMonth(d.getMonth()-1); return { from: `${d.toISOString().slice(0,7)}-01`, to: new Date(d.getFullYear(), d.getMonth()+1, 0).toISOString().slice(0,10) } } },
  { label: 'Last 3 months', getValue: () => { const to = new Date(); const from = new Date(); from.setMonth(from.getMonth()-3); return { from: from.toISOString().slice(0,10), to: to.toISOString().slice(0,10) } } },
  { label: 'Last 6 months', getValue: () => { const to = new Date(); const from = new Date(); from.setMonth(from.getMonth()-6); return { from: from.toISOString().slice(0,10), to: to.toISOString().slice(0,10) } } },
  { label: 'This year', getValue: () => { const y = new Date().getFullYear(); return { from: `${y}-01-01`, to: `${y}-12-31` } } },
  { label: 'Custom', getValue: () => null },
]

export default function ReportsPage() {
  const [transactions, setTransactions] = useState([])
  const [filter, setFilter] = useState({ type: 'all', from: '', to: '', preset: 'This month' })
  const [loading, setLoading] = useState(false)

  // Apply preset on mount
  useEffect(() => {
    const preset = PRESETS.find(p => p.label === 'This month')
    const range = preset.getValue()
    setFilter(f => ({ ...f, ...range }))
  }, [])

  useEffect(() => {
    if (!filter.from || !filter.to) return
    const fetchData = async () => {
      setLoading(true)
      try {
        const [incRes, expRes] = await Promise.all([
          API('/api/transactions?type=income'),
          API('/api/transactions?type=expense'),
        ])
        const [inc, exp] = await Promise.all([incRes.json(), expRes.json()])
        const all = [
          ...inc.map(t => ({ ...t, txType: 'income' })),
          ...exp.map(t => ({ ...t, txType: 'expense' })),
        ]
        setTransactions(all)
      } catch {}
      setLoading(false)
    }
    fetchData()
  }, [])

  const filtered = transactions.filter(t => {
    const date = new Date(t.date)
    const from = filter.from ? new Date(filter.from) : null
    const to = filter.to ? new Date(filter.to + 'T23:59:59') : null
    if (from && date < from) return false
    if (to && date > to) return false
    if (filter.type !== 'all' && t.txType !== filter.type) return false
    return true
  }).sort((a, b) => new Date(b.date) - new Date(a.date))

  const totalIncome = filtered.filter(t => t.txType === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpenses = filtered.filter(t => t.txType === 'expense').reduce((s, t) => s + t.amount, 0)
  const net = totalIncome - totalExpenses

  const handlePreset = (label) => {
    const preset = PRESETS.find(p => p.label === label)
    const range = preset.getValue()
    setFilter(f => ({ ...f, preset: label, ...(range || {}) }))
  }

  // CSV download
  const downloadCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Amount (Rs.)', 'Note']
    const rows = filtered.map(t => [
      new Date(t.date).toLocaleDateString('en-GB'),
      t.txType,
      t.category,
      t.amount.toFixed(2),
      t.note || '',
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `paisatrack-report-${filter.from}-to-${filter.to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // PDF download
  const downloadPDF = () => {
    const doc = new jsPDF()

    // Header
    doc.setFontSize(18)
    doc.setTextColor(79, 70, 229)
    doc.text('PaisaTrack — Financial Report', 14, 18)

    doc.setFontSize(10)
    doc.setTextColor(107, 114, 128)
    doc.text(`Period: ${filter.from} to ${filter.to}`, 14, 26)
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 14, 32)

    // Summary
    doc.setFontSize(11)
    doc.setTextColor(30, 30, 30)
    doc.text(`Total Income: Rs.${totalIncome.toFixed(2)}`, 14, 44)
    doc.text(`Total Expenses: Rs.${totalExpenses.toFixed(2)}`, 14, 51)
    doc.text(`Net Savings: Rs.${net.toFixed(2)}`, 14, 58)

    // Table
    autoTable(doc, {
      startY: 66,
      head: [['Date', 'Type', 'Category', 'Amount (Rs.)', 'Note']],
      body: filtered.map(t => [
        new Date(t.date).toLocaleDateString('en-GB'),
        t.txType.charAt(0).toUpperCase() + t.txType.slice(1),
        t.category,
        t.amount.toFixed(2),
        t.note || '—',
      ]),
      headStyles: { fillColor: [79, 70, 229], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 248, 255] },
      columnStyles: { 3: { halign: 'right' } },
    })

    doc.save(`paisatrack-report-${filter.from}-to-${filter.to}.pdf`)
  }

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-xl font-bold text-gray-900">Reports</h2>
        <p className="text-sm text-gray-400 mt-0.5">Filter and export your financial data</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">

        {/* Preset chips */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => handlePreset(p.label)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filter.preset === p.label
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
              }`}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Date range + type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input type="date" value={filter.from}
              onChange={e => setFilter(f => ({ ...f, from: e.target.value, preset: 'Custom' }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input type="date" value={filter.to}
              onChange={e => setFilter(f => ({ ...f, to: e.target.value, preset: 'Custom' }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
            <select value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-white">
              <option value="all">All</option>
              <option value="income">Income only</option>
              <option value="expense">Expenses only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Income', value: totalIncome, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Expenses', value: totalExpenses, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Net', value: net, color: net >= 0 ? 'text-primary' : 'text-red-500', bg: 'bg-indigo-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-lg font-bold ${s.color}`}>Rs.{Math.abs(s.value).toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* Table + export */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <p className="text-sm font-medium text-gray-700">{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</p>
          <div className="flex gap-2">
            <button onClick={downloadCSV} disabled={!filtered.length}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              CSV
            </button>
            <button onClick={downloadPDF} disabled={!filtered.length}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              PDF
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14 text-gray-400 text-sm">No transactions found for this period.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Type</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Category</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Note</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(t => (
                <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      t.txType === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                    }`}>
                      {t.txType}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-700">{t.category}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{t.note || '—'}</td>
                  <td className={`px-5 py-3 text-right font-semibold ${t.txType === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {t.txType === 'income' ? '+' : '-'}Rs.{t.amount.toFixed(2)}
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
