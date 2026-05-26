/**
 * Expense Prediction Engine
 * Uses weighted moving average + linear regression trained on user's own transaction data
 */

// Simple linear regression: y = mx + b
function linearRegression(points) {
  const n = points.length
  if (n < 2) return { slope: 0, intercept: points[0]?.y || 0 }

  const sumX = points.reduce((s, p) => s + p.x, 0)
  const sumY = points.reduce((s, p) => s + p.y, 0)
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0)
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) || 0
  const intercept = (sumY - slope * sumX) / n

  return { slope, intercept }
}

// Weighted moving average — recent months get higher weight
function weightedMovingAverage(values) {
  if (values.length === 0) return 0
  const weights = values.map((_, i) => i + 1) // 1,2,3... (recent = higher)
  const totalWeight = weights.reduce((s, w) => s + w, 0)
  return values.reduce((s, v, i) => s + v * weights[i], 0) / totalWeight
}

// Detect seasonality: compare same month across years
function detectSeasonality(monthlyData, targetMonth) {
  const sameMonthValues = Object.entries(monthlyData)
    .filter(([key]) => parseInt(key.split('-')[1]) === targetMonth)
    .map(([, v]) => v.total)

  if (sameMonthValues.length < 2) return null
  return sameMonthValues.reduce((s, v) => s + v, 0) / sameMonthValues.length
}

export function trainAndPredict(transactions, recurringTotal = 0) {
  if (transactions.length === 0) return null

  // Build monthly totals
  const monthlyData = {}
  const categoryMonthly = {}

  transactions.forEach(t => {
    const d = new Date(t.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!monthlyData[key]) monthlyData[key] = { total: 0, categories: {} }
    monthlyData[key].total += t.amount
    monthlyData[key].categories[t.category] = (monthlyData[key].categories[t.category] || 0) + t.amount

    if (!categoryMonthly[t.category]) categoryMonthly[t.category] = {}
    if (!categoryMonthly[t.category][key]) categoryMonthly[t.category][key] = 0
    categoryMonthly[t.category][key] += t.amount
  })

  const sortedMonths = Object.keys(monthlyData).sort()
  const monthlyTotals = sortedMonths.map(k => monthlyData[k].total)

  // Next month index
  const lastDate = new Date(sortedMonths[sortedMonths.length - 1] + '-01')
  lastDate.setMonth(lastDate.getMonth() + 1)
  const nextMonth = lastDate.getMonth() + 1 // 1-12

  // 1. Weighted moving average on last 6 months
  const recent = monthlyTotals.slice(-6)
  const wma = weightedMovingAverage(recent)

  // 2. Linear regression trend
  const points = monthlyTotals.map((y, x) => ({ x, y }))
  const { slope, intercept } = linearRegression(points)
  const nextX = monthlyTotals.length
  const trendPrediction = intercept + slope * nextX

  // 3. Seasonality adjustment
  const seasonal = detectSeasonality(monthlyData, nextMonth)

  // Blend: 50% WMA + 30% trend + 20% seasonal (if available)
  let predicted
  if (seasonal !== null) {
    predicted = wma * 0.5 + trendPrediction * 0.3 + seasonal * 0.2
  } else {
    predicted = wma * 0.6 + trendPrediction * 0.4
  }

  // Add recurring
  predicted = Math.max(predicted, recurringTotal)

  // Per-category prediction
  const breakdown = []
  const allCategories = [...new Set(transactions.map(t => t.category))]

  allCategories.forEach(cat => {
    const catMonths = categoryMonthly[cat]
    const catSorted = Object.keys(catMonths).sort()
    const catValues = catSorted.map(k => catMonths[k])

    const catWma = weightedMovingAverage(catValues.slice(-6))
    const catPoints = catValues.map((y, x) => ({ x, y }))
    const catReg = linearRegression(catPoints)
    const catTrend = catReg.intercept + catReg.slope * catValues.length

    const catPredicted = catValues.length >= 3
      ? catWma * 0.6 + catTrend * 0.4
      : catWma

    if (catPredicted > 0) {
      // Trend direction
      const avg = catValues.reduce((s, v) => s + v, 0) / catValues.length
      const recent3 = catValues.slice(-3)
      const recentAvg = recent3.reduce((s, v) => s + v, 0) / recent3.length
      const trend = recentAvg > avg * 1.1 ? 'increasing' : recentAvg < avg * 0.9 ? 'decreasing' : 'stable'

      breakdown.push({ category: cat, amount: Math.round(catPredicted * 100) / 100, trend })
    }
  })

  // Sort by amount desc
  breakdown.sort((a, b) => b.amount - a.amount)

  // Confidence score based on data quantity
  const confidence = Math.min(Math.round((sortedMonths.length / 6) * 100), 95)

  // Trend summary
  const overallTrend = slope > 10 ? 'increasing' : slope < -10 ? 'decreasing' : 'stable'
  const avgMonthly = monthlyTotals.reduce((s, v) => s + v, 0) / monthlyTotals.length

  return {
    predictedTotal: Math.round(predicted * 100) / 100,
    breakdown,
    confidence,
    trend: overallTrend,
    avgMonthly: Math.round(avgMonthly * 100) / 100,
    monthsAnalysed: sortedMonths.length,
    method: 'Weighted Moving Average + Linear Regression',
  }
}
