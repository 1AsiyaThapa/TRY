import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const COLORS = [
  '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#14B8A6',
]

const CustomTooltip = ({ active, payload, label, prefix = 'Rs.' }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      {label && <p className="text-gray-500 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="font-semibold" style={{ color: p.color || p.fill }}>
          {p.name}: {prefix}{Number(p.value).toFixed(2)}
        </p>
      ))}
    </div>
  )
}

// Bar chart — monthly totals
export function MonthlyBarChart({ data, color = '#4F46E5', label = 'Amount' }) {
  if (!data?.length) return null
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
          tickFormatter={v => `Rs.${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="amount" name={label} fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Pie chart — by category
export function CategoryPieChart({ data }) {
  if (!data?.length) return null
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="amount" nameKey="category"
          cx="50%" cy="50%" outerRadius={80} innerRadius={45}
          paddingAngle={3}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={8}
          formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
      </PieChart>
    </ResponsiveContainer>
  )
}

// Grouped bar chart — income vs expenses per month
export function IncomeVsExpenseChart({ income, expenses }) {
  // Merge into monthly map
  const map = {}

  income.forEach(t => {
    const m = new Date(t.date).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
    if (!map[m]) map[m] = { month: m, income: 0, expenses: 0 }
    map[m].income += t.amount
  })

  expenses.forEach(t => {
    const m = new Date(t.date).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
    if (!map[m]) map[m] = { month: m, income: 0, expenses: 0 }
    map[m].expenses += t.amount
  })

  const data = Object.values(map).sort((a, b) => {
    const parse = s => new Date('01 ' + s)
    return parse(a.month) - parse(b.month)
  })

  if (!data.length) return null

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={4}>
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
          tickFormatter={v => `Rs.${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`} />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={8}
          formatter={(v) => <span className="text-xs text-gray-600 capitalize">{v}</span>} />
        <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
