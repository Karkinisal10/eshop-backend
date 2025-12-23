const nodemailer = require('nodemailer')

const sendOTPEmail = async(email, otp, type = 'Login') => {
    try {
        console.log('Mailtrap Config:', {
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT,
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS ? '***' : 'NOT SET'
        })

        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST || 'smtp.mailtrap.io',
            port: process.env.MAIL_PORT || 2525,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
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

        await transporter.sendMail(mailOptions)
        console.log('OTP Email sent successfully to:', email)
        return { success: true }
    } catch (error) {
        console.log('Email sending error:', error.message)
        console.log('Full error:', error)
        return { success: false, error: error.message }
    }
}

module.exports = sendOTPEmail
