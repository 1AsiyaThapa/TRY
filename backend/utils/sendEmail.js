import nodemailer from 'nodemailer'

export const sendVerificationEmail = async (to, otp) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  await transporter.sendMail({
    from: `"PaisaTrack" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verify your PaisaTrack account',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:16px;">
        <h2 style="color:#4F46E5;margin-bottom:8px;">PaisaTrack</h2>
        <p style="color:#374151;font-size:16px;">Your verification code is:</p>
        <div style="font-size:36px;font-weight:800;letter-spacing:8px;color:#111827;margin:24px 0;">${otp}</div>
        <p style="color:#6B7280;font-size:14px;">This code expires in <strong>10 minutes</strong>. If you didn't sign up, you can ignore this email.</p>
      </div>
    `,
  })
}
