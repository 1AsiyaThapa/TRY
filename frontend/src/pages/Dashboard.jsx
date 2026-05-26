import { useEffect, useState } from 'react'
import IncomePage from './IncomePage'
import ExpensePage from './ExpensePage'
import BudgetPage from './BudgetPage'
import ProfilePage from './ProfilePage'
import ReportsPage from './ReportsPage'
import Chatbot from '../components/Chatbot'
import RecurringNotifications from '../components/RecurringNotifications'
import BudgetAlert from '../components/BudgetAlert'
import { IncomeVsExpenseChart } from '../components/TransactionCharts'
import { requestNotificationPermission } from '../utils/pushNotification'

const navItems = [
  { label: 'Overview' },
  { label: 'Income' },
  { label: 'Expenses' },
  { label: 'Budgets' },
  { label: 'Reports' },
]

const API = (path) => {
  const token = localStorage.getItem('token')
  return fetch(`http://localhost:5000${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [activeNav, setActiveNav] = useState('Overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [stats, setStats] = useState({ income: 0, expenses: 0 })
  const [recent, setRecent] = useState([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [allIncome, setAllIncome] = useState([])
  const [allExpenses, setAllExpenses] = useState([])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get('token')
    if (urlToken) {
      localStorage.setItem('token', urlToken)
      window.history.replaceState({}, '', '/dashboard')
    }
    const token = urlToken || localStorage.getItem('token')
    if (!token) { window.location.href = '/login'; return }
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(atob(base64))
      setUser(payload)
      requestNotificationPermission()
      // Fetch full profile to get avatar
      fetch('http://localhost:5000/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()).then(p => setUser(prev => ({ ...prev, avatar: p.avatar, name: p.name })))
    } catch {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
  }, [])

  const [budgets, setBudgets] = useState([])

  useEffect(() => {
    if (!user || activeNav !== 'Overview') return
    const fetchStats = async () => {
      setLoadingStats(true)
      try {
        const [incRes, expRes] = await Promise.all([
          API('/api/transactions?type=income'),
          API('/api/transactions?type=expense'),
        ])
        const [incData, expData] = await Promise.all([incRes.json(), expRes.json()])

        const totalIncome = incData.reduce((s, t) => s + t.amount, 0)
        const totalExpenses = expData.reduce((s, t) => s + t.amount, 0)
        setStats({ income: totalIncome, expenses: totalExpenses })
        setAllIncome(incData)
        setAllExpenses(expData)

        // merge and sort by date, take latest 5
        const all = [
          ...incData.map(t => ({ ...t, txType: 'income' })),
          ...expData.map(t => ({ ...t, txType: 'expense' })),
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
        setRecent(all)

        // Fetch overall budget for current month
        const currentMonth = new Date().toISOString().slice(0, 7)
        const budgetRes = await fetch(`http://localhost:5000/api/budgets?month=${currentMonth}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
        if (budgetRes.ok) {
          const bd = await budgetRes.json()
          setBudgets(bd.budget ? [{ ...bd.budget, spent: bd.spent }] : [])
        }
      } catch {}
      setLoadingStats(false)
    }
    fetchStats()
  }, [user, activeNav === 'Overview'])

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/'
  }

  if (!user) return null

  const savings = stats.income - stats.expenses

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex">

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-gray-100 flex flex-col transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="px-6 py-5 border-b border-gray-100">
          <span className="text-lg font-bold text-primary">💰 PaisaTrack</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <button key={item.label}
              onClick={() => { setActiveNav(item.label); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${activeNav === item.label ? 'bg-indigo-50 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-100 space-y-1">
          <button onClick={() => setActiveNav('Profile')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeNav === 'Profile' ? 'bg-indigo-50 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}>
            Profile
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors">
            Log out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-gray-500" onClick={() => setSidebarOpen(true)}>☰</button>
            {activeNav === 'Overview' && <h1 className="text-lg font-semibold text-gray-800">Overview</h1>}
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-primary font-semibold text-base cursor-pointer hover:ring-2 hover:ring-primary/30 transition overflow-hidden"
            onClick={() => setActiveNav('Profile')}>
            {user?.avatar
              ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
              : user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
        </header>

        <main className="flex-1 p-6">

          {activeNav === 'Overview' && (
            <div className="space-y-6">
              <RecurringNotifications />
              <BudgetAlert />
              <p className="text-gray-500 text-sm">
                Welcome back{user?.name ? `, ${user.name}` : ''} 👋 Here's your financial summary.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Total Income', value: stats.income, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Total Expenses', value: stats.expenses, color: 'text-red-500', bg: 'bg-red-50' },
                  { label: 'Net Savings', value: savings, color: savings >= 0 ? 'text-primary' : 'text-red-500', bg: savings >= 0 ? 'bg-indigo-50' : 'bg-red-50' },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${s.bg} mb-3`}>
                      <span className={`text-lg font-bold ${s.color}`}>Rs.</span>
                    </div>
                    {loadingStats ? (
                      <div className="h-8 w-24 bg-gray-100 rounded-lg animate-pulse mb-1" />
                    ) : (
                      <p className={`text-2xl font-bold ${s.color}`}>Rs.{Math.abs(s.value).toFixed(2)}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Income vs Expense chart */}
              {(allIncome.length > 0 || allExpenses.length > 0) && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h2 className="font-semibold text-gray-800 mb-4">Income vs Expenses</h2>
                  <IncomeVsExpenseChart income={allIncome} expenses={allExpenses} />
                </div>
              )}

              {/* Budget overview */}
              {budgets.length > 0 && (() => {
                const b = budgets[0]
                const pct = b.amount > 0 ? Math.min((b.spent / b.amount) * 100, 100) : 0
                const over = b.spent > b.amount
                const warn = pct >= 80 && !over
                return (
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-gray-800">Monthly Budget</h2>
                      <button onClick={() => setActiveNav('Budgets')} className="text-xs text-primary hover:underline">Details →</button>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">Rs.{b.spent.toFixed(2)} spent</span>
                      <span className="text-gray-500">Rs.{b.amount.toFixed(2)} budget</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div className={`h-2.5 rounded-full ${over ? 'bg-red-500' : warn ? 'bg-amber-400' : 'bg-emerald-500'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                    <p className={`text-xs mt-2 font-medium ${over ? 'text-red-500' : 'text-emerald-600'}`}>
                      {over
                        ? `⚠ Rs.${(b.spent - b.amount).toFixed(2)} over budget`
                        : `Rs.${(b.amount - b.spent).toFixed(2)} remaining · ${pct.toFixed(0)}% used`}
                    </p>
                  </div>
                )
              })()}

              {budgets.length === 0 && !loadingStats && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 flex items-center justify-between">
                  <p className="text-sm text-indigo-700">No budgets set for this month.</p>
                  <button onClick={() => setActiveNav('Budgets')}
                    className="text-sm text-primary font-medium hover:underline">Set budget →</button>
                </div>
              )}

              {/* Recent transactions */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="font-semibold text-gray-800 mb-4">Recent Transactions</h2>
                {loadingStats ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : recent.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No transactions yet. Add income or expenses to get started.</p>
                ) : (
                  <div className="space-y-1">
                    {recent.map((t) => (
                      <div key={t._id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{t.category}</p>
                          <p className="text-xs text-gray-400">
                            {t.txType === 'income' ? 'Income' : 'Expense'} · {new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <span className={`text-sm font-semibold ${t.txType === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                          {t.txType === 'income' ? '+' : '-'}Rs.{t.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {activeNav === 'Income' && <IncomePage />}
          {activeNav === 'Expenses' && <ExpensePage />}
          {activeNav === 'Budgets' && <BudgetPage />}
          {activeNav === 'Reports' && <ReportsPage />}
          {activeNav === 'Profile' && <ProfilePage />}

          {activeNav !== 'Overview' && activeNav !== 'Income' && activeNav !== 'Expenses' && activeNav !== 'Budgets' && activeNav !== 'Reports' && activeNav !== 'Profile' && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-gray-400 text-sm">{activeNav} is coming soon.</p>
            </div>
          )}

        </main>
      </div>
    </div>
    {activeNav === 'Overview' && <Chatbot />}
    </>
  )
}
