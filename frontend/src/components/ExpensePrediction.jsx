import { useState } from 'react'

const API = (path) => {
  const token = localStorage.getItem('token')
  return fetch(`http://localhost:5000${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

const trendIcon = (trend) =>
  trend === 'increasing' ? '↑' : trend === 'decreasing' ? '↓' : '→'

const trendColor = (trend) =>
  trend === 'increasing' ? 'text-red-500' : trend === 'decreasing' ? 'text-emerald-600' : 'text-gray-500'

export default function ExpensePrediction() {
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  const fetchPrediction = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await API('/api/prediction')
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      if (data.message) { setError(data.message); return }
      setPrediction(data.prediction)
      setOpen(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <h3 className="font-semibold text-gray-800">Next Month Prediction</h3>
          <p className="text-xs text-gray-400 mt-0.5">Trained on your spending history using regression analysis</p>
        </div>
        <button
          onClick={open ? () => setOpen(false) : fetchPrediction}
          disabled={loading}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60"
        >
          {loading ? (
            <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analysing...</>
          ) : open ? 'Hide' : '✦ Predict'}
        </button>
      </div>

      {error && <div className="px-5 pb-4 text-sm text-red-500">{error}</div>}

      {open && prediction && (
        <div className="border-t border-gray-50 px-5 py-5 space-y-5">

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <p className="text-xs text-red-400 mb-1">Predicted</p>
              <p className="text-xl font-bold text-red-600">Rs.{prediction.predictedTotal?.toFixed(0)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Monthly Avg</p>
              <p className="text-xl font-bold text-gray-700">Rs.{prediction.avgMonthly?.toFixed(0)}</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-3 text-center">
              <p className="text-xs text-indigo-400 mb-1">Confidence</p>
              <p className="text-xl font-bold text-primary">{prediction.confidence}%</p>
            </div>
          </div>

          {/* Model info */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="bg-gray-100 px-2 py-1 rounded-full">{prediction.method}</span>
            <span>{prediction.monthsAnalysed} month{prediction.monthsAnalysed !== 1 ? 's' : ''} of data</span>
            <span className={`font-medium ${trendColor(prediction.trend)}`}>
              {trendIcon(prediction.trend)} Overall trend {prediction.trend}
            </span>
          </div>

          {/* Category breakdown */}
          {prediction.breakdown?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Category Breakdown</p>
              <div className="space-y-2.5">
                {prediction.breakdown.map((item, i) => {
                  const pct = Math.min((item.amount / prediction.predictedTotal) * 100, 100)
                  return (
                    <div key={i}>
                      <div className="flex justify-between items-center text-sm mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700 font-medium">{item.category}</span>
                          <span className={`text-xs font-semibold ${trendColor(item.trend)}`}>
                            {trendIcon(item.trend)}
                          </span>
                        </div>
                        <span className="text-gray-500 font-medium">Rs.{item.amount?.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-red-400 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <button onClick={fetchPrediction} disabled={loading}
            className="text-xs text-gray-400 hover:text-primary transition-colors">
            ↻ Recalculate
          </button>
        </div>
      )}
    </div>
  )
}
