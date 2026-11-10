import nodemailer from "nodemailer"
import dotenv from "dotenv"

dotenv.config({ quiet: true })

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USER || "4665d56e7845b6",
    pass: process.env.MAILTRAP_PASS || "90a70a81c86b81",
  },
})

export const sendOtpEmail = async (toEmail, otp) => {
  const mailOptions = {
    from: '"Ecomstore Security" <security@ecomstore.com>',
    to: toEmail,
    subject: "Your Ecomstore Password Reset Verification Code",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF8F5; padding: 40px 20px; color: #1A1816;">
        <div style="max-width: 520px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E5DFD5; padding: 36px 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="text-align: center; border-bottom: 1px solid #E5DFD5; padding-bottom: 20px; margin-bottom: 28px;">
            <h1 style="font-family: Georgia, serif; font-size: 24px; letter-spacing: 0.2em; text-transform: uppercase; margin: 0; color: #1A1816;">ECOMSTORE</h1>
            <p style="font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #C5A059; margin: 6px 0 0 0; font-weight: bold;">Authentication Services</p>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #4A453E; margin-bottom: 20px;">
            A request was received to reset the password for your Ecomstore account. Please use the verification code below to complete the procedure:
          </p>

          <div style="text-align: center; background-color: #F8F5F0; border: 1px solid #E5DFD5; padding: 22px; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; font-family: monospace; color: #1A1816;">${otp}</span>
          </div>

          <p style="font-size: 12px; color: #8E877E; line-height: 1.5; margin-bottom: 28px;">
            This one-time verification code is strictly valid for <strong>10 minutes</strong>. If you did not initiate this request, you can safely disregard this notification.
          </p>

          <div style="border-top: 1px solid #E5DFD5; padding-top: 16px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #8E877E; text-align: center;">
            &copy; ${new Date().getFullYear()} Ecomstore. All Rights Reserved.
          </div>
        </div>
      </div>
    `,
  }

  return transporter.sendMail(mailOptions)
}
