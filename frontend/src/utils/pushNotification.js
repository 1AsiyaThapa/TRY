export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export const showPushNotification = (title, body, icon = '/favicon.ico') => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  new Notification(title, { body, icon })
}

export const triggerBudgetPushNotification = (alert) => {
  if (!alert) return
  const { pct, spent, budgetAmount, over } = alert

  const title = over
    ? '🔴 Budget Exceeded — PaisaTrack'
    : '⚠️ Budget Warning — PaisaTrack'

  const body = over
    ? `You've spent Rs.${spent.toFixed(2)} of Rs.${budgetAmount.toFixed(2)}. Over by Rs.${(spent - budgetAmount).toFixed(2)}.`
    : `You've used ${pct.toFixed(0)}% of your monthly budget. Rs.${(budgetAmount - spent).toFixed(2)} remaining.`

  showPushNotification(title, body)
}
