import { useState } from 'react'

const features = [
  {
    icon: "📷",
    title: "AI Receipt Scanner",
    desc: "Snap a photo of your receipt and let AI log the expense for you automatically.",
  },
  {
    icon: "📊",
    title: "Visual Insights",
    desc: "Interactive charts that show exactly where your money is going each month.",
  },
  {
    icon: "🔔",
    title: "Budget Alerts",
    desc: "Set monthly budgets and get notified before you overspend.",
  },
  {
    icon: "🤖",
    title: "AI Chatbot",
    desc: "Ask questions, get tips, and plan your finances with a smart assistant.",
  },
  {
    icon: "🔁",
    title: "Recurring Transactions",
    desc: "Track rent, subscriptions, and bills so nothing catches you off guard.",
  },
  {
    icon: "📥",
    title: "Downloadable Reports",
    desc: "Export your financial data as CSV or PDF anytime you need it.",
  },
]

const steps = [
  { step: "01", title: "Create an account", desc: "Sign up in seconds — no credit card needed." },
  { step: "02", title: "Add your transactions", desc: "Log manually or scan a receipt with AI." },
  { step: "03", title: "Set your budget", desc: "Define limits and let PaisaTrack keep you on track." },
  { step: "04", title: "Get insights", desc: "See charts, trends, and smart suggestions in real time." },
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="font-sans text-gray-800 bg-white">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-primary">💰 PaisaTrack</span>
          <div className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-600">
            <a href="/login" className="hover:text-primary transition-colors">Login</a>
            <a href="/signup" className="bg-primary text-white px-5 py-2 rounded-full hover:bg-indigo-700 transition-colors">
              Get Started
            </a>
          </div>
          <button className="md:hidden text-gray-600" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden px-6 pb-4 flex flex-col gap-4 text-sm font-medium text-gray-600 border-t border-gray-100">
            <a href="/login" onClick={() => setMenuOpen(false)}>Login</a>
            <a href="/signup" className="bg-primary text-white px-5 py-2 rounded-full text-center">Get Started</a>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 bg-gradient-to-br from-indigo-50 via-white to-emerald-50">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block bg-indigo-100 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            Smart Finance Tracking
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Take control of your <span className="text-primary">money</span>, finally.
          </h1>
          <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
            PaisaTrack helps you track expenses, scan receipts with AI, set budgets, and understand your spending — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/signup" className="bg-primary text-white px-8 py-3.5 rounded-full font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
              Start for free
            </a>
            <a href="#features" className="border border-gray-300 text-gray-700 px-8 py-3.5 rounded-full font-semibold hover:border-primary hover:text-primary transition-colors">
              See features
            </a>
          </div>
        </div>

        {/* Hero visual */}
        <div className="mt-16 max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-gray-700">April Overview</span>
            <span className="text-xs text-gray-400">2026</span>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Income", value: "Rs.3,200", color: "text-accent" },
              { label: "Expenses", value: "Rs.1,840", color: "text-red-500" },
              { label: "Savings", value: "Rs.1,360", color: "text-primary" },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-4 text-center">
                <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-gray-400 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {[
              { name: "Groceries", amount: "Rs.120", bar: "w-3/4", color: "bg-indigo-400" },
              { name: "Transport", amount: "Rs.45", bar: "w-1/3", color: "bg-emerald-400" },
              { name: "Dining Out", amount: "Rs.80", bar: "w-1/2", color: "bg-orange-400" },
            ].map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <span className="text-sm text-gray-500 w-24">{item.name}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className={`${item.bar} ${item.color} h-2 rounded-full`}></div>
                </div>
                <span className="text-sm font-medium text-gray-700">{item.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything you need</h2>
            <p className="text-gray-500 max-w-md mx-auto">Built for people who want to be smarter with money, without the complexity.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all group">
                <span className="text-3xl mb-4 block">{f.icon}</span>
                <h3 className="font-semibold text-gray-800 mb-2 group-hover:text-primary transition-colors">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-gray-500">Up and running in minutes.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {steps.map((s) => (
              <div key={s.step} className="flex gap-5 items-start">
                <span className="text-3xl font-extrabold text-indigo-100 leading-none">{s.step}</span>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">{s.title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-primary">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to track smarter?</h2>
          <p className="text-indigo-200 mb-8">Join PaisaTrack and start making sense of your finances today.</p>
          <a href="#" className="inline-block bg-white text-primary font-semibold px-8 py-3.5 rounded-full hover:bg-indigo-50 transition-colors shadow-lg">
            Create free account
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100 text-center text-sm text-gray-400">
        © 2026 PaisaTrack · Built by Asiya Thapa
      </footer>

    </div>
  )
}
