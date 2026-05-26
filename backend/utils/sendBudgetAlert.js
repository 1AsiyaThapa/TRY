import nodemailer from 'nodemailer'

export const sendBudgetAlertEmail = async (to, name, { pct, spent, budget, remaining, over }) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  })

  const subject = over
    ? '🔴 PaisaTrack: You\'ve exceeded your monthly budget!'
    : '⚠️ PaisaTrack: You\'ve used 80% of your monthly budget'

  const color = over ? '#EF4444' : '#F59E0B'
  const message = over
    ? `You have spent <strong>Rs.${spent.toFixed(2)}</strong> against your budget of <strong>Rs.${budget.toFixed(2)}</strong> — that's <strong>Rs.${(spent - budget).toFixed(2)} over your limit</strong>.`
    : `You have used <strong>${pct.toFixed(0)}%</strong> of your monthly budget. Only <strong>Rs.${remaining.toFixed(2)}</strong> remaining.`

  await transporter.sendMail({
    from: `"PaisaTrack" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:16px;">
        <h2 style="color:#4F46E5;margin-bottom:4px;">💰 PaisaTrack</h2>
        <p style="color:#6B7280;font-size:13px;margin-top:0;">Budget Alert</p>

        <div style="background:${over ? '#FEF2F2' : '#FFFBEB'};border:1px solid ${color};border-radius:12px;padding:20px;margin:24px 0;">
          <p style="color:${color};font-size:18px;font-weight:700;margin:0 0 8px;">
            ${over ? '🔴 Budget Exceeded' : '⚠️ Budget Warning'}
          </p>
          <p style="color:#374151;font-size:14px;margin:0;">${message}</p>
        </div>

        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
          <tr>
            <td style="padding:8px 0;color:#6B7280;">Monthly Budget</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">Rs.${budget.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6B7280;">Total Spent</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;color:${over ? '#EF4444' : '#111827'};">Rs.${spent.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6B7280;">${over ? 'Over by' : 'Remaining'}</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;color:${over ? '#EF4444' : '#10B981'};">
              Rs.${over ? (spent - budget).toFixed(2) : remaining.toFixed(2)}
            </td>
          </tr>
        </table>

        <p style="color:#6B7280;font-size:13px;">
          Log in to <a href="http://localhost:5173/dashboard" style="color:#4F46E5;">PaisaTrack</a> to review your expenses.
        </p>
      </div>
    `,
  })
}
