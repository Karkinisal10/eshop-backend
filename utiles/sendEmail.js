const nodemailer = require('nodemailer')

const sendOTPEmail = async(email, otp, type = 'Login') => {
    try {
        const host = process.env.MAIL_HOST || 'smtp.mailtrap.io'
        const port = Number(process.env.MAIL_PORT || 2525)
        const user = process.env.MAIL_USER
        const pass = process.env.MAIL_PASS

        console.log('Mail config:', { host, port, user: !!user, pass: !!pass })
        if (!user || !pass) {
            console.log('OTP email skipped: MAIL_USER or MAIL_PASS not configured')
            return { success: false, error: 'Email not configured on server' }
        }

        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: false,
            auth: { user, pass }
        })

        const subject = type === 'Password Reset' 
            ? 'Password Reset OTP - Ecommerce' 
            : 'Your OTP for Ecommerce Login'

        const heading = type === 'Password Reset' 
            ? 'Password Reset Request' 
            : 'Email Verification'

        const description = type === 'Password Reset'
            ? 'Your OTP for password reset is:'
            : 'Your OTP for login is:'

        const mailOptions = {
            from: '"Ecommerce" <noreply@ecommerce.com>',
            to: email,
            subject: subject,
            html: `
                <h2>${heading}</h2>
                <p>${description}</p>
                <h1 style="color: #6f68d1; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
                <p>This OTP is valid for 10 minutes only.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        }

        const info = await transporter.sendMail(mailOptions)
        console.log('OTP Email sent successfully:', { to: email, messageId: info.messageId })
        return { success: true }
    } catch (error) {
        console.log('Email sending error:', error?.response || error?.message)
        return { success: false, error: error.message }
    }
}

const sendPaymentReceipt = async(email, sellerName, amount, receiptId, khaltiNumber) => {
    try {
        const host = process.env.MAIL_HOST || 'smtp.mailtrap.io'
        const port = Number(process.env.MAIL_PORT || 2525)
        const user = process.env.MAIL_USER
        const pass = process.env.MAIL_PASS

        if (!user || !pass) {
            console.log('Receipt email skipped: MAIL_USER or MAIL_PASS not configured')
            return { success: false, error: 'Email not configured on server' }
        }

        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: false,
            auth: { user, pass }
        })

        const mailOptions = {
            from: '"Ecommerce" <noreply@ecommerce.com>',
            to: email,
            subject: 'Payment Receipt - Withdrawal Successful',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #6f68d1; text-align: center;">Payment Receipt</h2>
                    <p>Dear ${sellerName},</p>
                    <p>Your withdrawal request has been processed successfully. The payment has been sent to your Khalti account.</p>
                    
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #333;">Payment Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>Receipt ID:</strong></td>
                                <td style="padding: 8px 0; color: #333;">${receiptId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>Amount:</strong></td>
                                <td style="padding: 8px 0; color: #333; font-size: 18px; font-weight: bold;">NPR ${amount}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>Khalti Number:</strong></td>
                                <td style="padding: 8px 0; color: #333;">${khaltiNumber}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>Date:</strong></td>
                                <td style="padding: 8px 0; color: #333;">${new Date().toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>Status:</strong></td>
                                <td style="padding: 8px 0;"><span style="background-color: #4caf50; color: white; padding: 4px 12px; border-radius: 4px;">Success</span></td>
                            </tr>
                        </table>
                    </div>

                    <p>Please check your Khalti account to confirm the payment.</p>
                    <p>If you have any questions, please contact our support team.</p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
                    <p style="color: #999; font-size: 12px; text-align: center;">This is an automated email. Please do not reply.</p>
                </div>
            `
        }

        const info = await transporter.sendMail(mailOptions)
        console.log('Payment Receipt Email sent successfully:', { to: email, messageId: info.messageId })
        return { success: true }
    } catch (error) {
        console.log('Receipt email sending error:', error?.response || error?.message)
        return { success: false, error: error.message }
    }
}

module.exports = { sendOTPEmail, sendPaymentReceipt }
