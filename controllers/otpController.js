const otpModel = require('../models/otpModel')
const sellerModel = require('../models/sellerModel')
const adminModel = require('../models/adminModel')
const customerModel = require('../models/customerModel')
const sendOTPEmail = require('../utiles/sendEmail')
const { responseReturn } = require('../utiles/response')
const { createToken } = require('../utiles/tokenCreate')

class otpController {
    
    send_otp = async(req, res) => {
        const { email, role, isRegistration, password } = req.body
        const bcrypt = require('bcrypt')
        
        try {
            let userId = null
            
            // For login, verify user exists and password is correct
            if (!isRegistration) {
                let user
                if (role === 'admin') {
                    user = await adminModel.findOne({ email }).select('+password')
                    console.log(`Admin login attempt - email: ${email}, found: ${!!user}`)
                } else if (role === 'seller') {
                    user = await sellerModel.findOne({ email }).select('+password')
                    console.log(`Seller login attempt - email: ${email}, found: ${!!user}`)
                } else if (role === 'customer') {
                    user = await customerModel.findOne({ email }).select('+password')
                    console.log(`Customer login attempt - email: ${email}, found: ${!!user}`)
                }

                if (!user) {
                    return responseReturn(res, 404, { error: `${role.charAt(0).toUpperCase() + role.slice(1)} account not found with this email` })
                }

                // Verify password before sending OTP
                if (password) {
                    const isPasswordValid = await bcrypt.compare(password, user.password)
                    if (!isPasswordValid) {
                        return responseReturn(res, 401, { error: 'Invalid password' })
                    }
                }
                
                console.log(`User found - ID: ${user._id}, Role: ${user.role}`)
                // Store user ID for login
                userId = user._id.toString()
            } else {
                // For registration, use email as temporary ID
                userId = email
            }

            // Generate 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString()

            // Delete existing OTP if any
            await otpModel.deleteOne({ email, role })

            // Create new OTP record
            await otpModel.create({
                email,
                otp,
                role,
                userId: userId
            })

            // Send OTP via email
            const emailResult = await sendOTPEmail(email, otp)

            if (emailResult.success) {
                responseReturn(res, 200, { message: 'OTP sent to your email' })
            } else {
                responseReturn(res, 500, { error: 'Failed to send OTP' })
            }
        } catch (error) {
            console.log('Send OTP error:', error)
            responseReturn(res, 500, { error: 'Internal Server Error' })
        }
    }

    verify_otp = async(req, res) => {
        const { email, otp, role, registrationData } = req.body
        const bcrpty = require('bcrypt')
        const sellerCustomerModel = require('../models/chat/sellerCustomerModel')

        try {
            // Find OTP record
            const otpRecord = await otpModel.findOne({ email, role })

            if (!otpRecord) {
                return responseReturn(res, 404, { error: 'OTP not found or expired' })
            }

            // Verify OTP
            if (otpRecord.otp !== otp) {
                return responseReturn(res, 401, { error: 'Invalid OTP' })
            }

            let user

            // If registrationData is provided, create new user
            if (registrationData) {
                const { name, password } = registrationData
                
                // Check if user already exists
                let existingUser
                if (role === 'customer') {
                    existingUser = await customerModel.findOne({ email })
                } else {
                    existingUser = await sellerModel.findOne({ email })
                }
                
                if (existingUser) {
                    return responseReturn(res, 400, { error: 'Email already registered' })
                }

                // Create new user based on role
                if (role === 'customer') {
                    user = await customerModel.create({
                        name,
                        email,
                        password: await bcrpty.hash(password, 10),
                        method: 'manual',
                        role: 'customer'
                    })
                } else if (role === 'seller') {
                    user = await sellerModel.create({
                        name,
                        email,
                        password: await bcrpty.hash(password, 10),
                        method: 'manual',
                        role: 'seller',
                        shopInfo: {}
                    })

                    // Create seller customer chat model
                    await sellerCustomerModel.create({
                        myId: user.id
                    })
                } else {
                    return responseReturn(res, 400, { error: 'Invalid role for registration' })
                }
            } else {
                // For login, get existing user - use role from OTP record to ensure consistency
                console.log(`Verifying OTP for ${otpRecord.role} login - userId: ${otpRecord.userId}`)
                if (otpRecord.role === 'admin') {
                    user = await adminModel.findById(otpRecord.userId)
                    console.log(`Admin user retrieved: ${user ? `ID=${user._id}, role=${user.role}` : 'NOT FOUND'}`)
                } else if (otpRecord.role === 'customer') {
                    user = await customerModel.findById(otpRecord.userId)
                    console.log(`Customer user retrieved: ${user ? `ID=${user._id}, role=${user.role}` : 'NOT FOUND'}`)
                } else if (otpRecord.role === 'seller') {
                    user = await sellerModel.findById(otpRecord.userId)
                    console.log(`Seller user retrieved: ${user ? `ID=${user._id}, role=${user.role}` : 'NOT FOUND'}`)
                } else {
                    return responseReturn(res, 400, { error: 'Invalid role' })
                }

                if (!user) {
                    console.log(`ERROR: User not found with ID ${otpRecord.userId} for role ${otpRecord.role}`)
                    return responseReturn(res, 404, { error: 'User not found' })
                }
            }

            // Verify the user's role matches the OTP record role
            if (user.role !== otpRecord.role) {
                console.log(`CRITICAL: Role mismatch! user.role=${user.role}, otpRecord.role=${otpRecord.role}`)
                return responseReturn(res, 401, { error: 'Authentication failed: role mismatch' })
            }

            console.log(`Creating token for user ${user._id} with role ${user.role}`)
            // Create token with user's role from database
            const token = await createToken({ id: user._id, role: user.role })

            // Delete OTP record
            await otpModel.deleteOne({ email, role })

            // Set cookie
            res.cookie('accessToken', token, {
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            })

            const message = registrationData ? 'Registration successful' : 'Login successful'
            
            responseReturn(res, 200, { 
                token, 
                message,
                userId: user._id
            })
        } catch (error) {
            console.log('Verify OTP error:', error)
            responseReturn(res, 500, { error: 'Internal Server Error' })
        }
    }

    // Forgot Password - Send OTP
    forgot_password = async(req, res) => {
        const { email, role } = req.body
        
        try {
            let user
            if (role === 'seller') {
                user = await sellerModel.findOne({ email })
            } else if (role === 'customer') {
                user = await customerModel.findOne({ email })
            } else {
                return responseReturn(res, 400, { error: 'Invalid role' })
            }

            if (!user) {
                return responseReturn(res, 404, { error: 'Email not found' })
            }

            // Generate 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString()

            // Delete existing OTP if any
            await otpModel.deleteOne({ email, role })

            // Create new OTP record for password reset
            await otpModel.create({
                email,
                otp,
                role,
                userId: user._id.toString(),
                type: 'password-reset' // Add type to differentiate
            })

            // Send OTP via email
            const emailResult = await sendOTPEmail(email, otp, 'Password Reset')

            if (emailResult.success) {
                responseReturn(res, 200, { message: 'Password reset OTP sent to your email' })
            } else {
                responseReturn(res, 500, { error: 'Failed to send OTP' })
            }
        } catch (error) {
            console.log('Forgot password error:', error)
            responseReturn(res, 500, { error: 'Internal Server Error' })
        }
    }

    // Reset Password - Verify OTP and update password
    reset_password = async(req, res) => {
        const { email, otp, newPassword, role } = req.body
        const bcrypt = require('bcrypt')
        
        try {
            // Find OTP record
            const otpRecord = await otpModel.findOne({ email, role })

            if (!otpRecord) {
                return responseReturn(res, 404, { error: 'OTP not found or expired' })
            }

            // Verify OTP
            if (otpRecord.otp !== otp) {
                return responseReturn(res, 401, { error: 'Invalid OTP' })
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10)

            // Update password based on role
            if (role === 'seller') {
                await sellerModel.findByIdAndUpdate(otpRecord.userId, {
                    password: hashedPassword
                })
            } else if (role === 'customer') {
                await customerModel.findByIdAndUpdate(otpRecord.userId, {
                    password: hashedPassword
                })
            }

            // Delete OTP record
            await otpModel.deleteOne({ email, role })

            responseReturn(res, 200, { message: 'Password reset successfully' })
        } catch (error) {
            console.log('Reset password error:', error)
            responseReturn(res, 500, { error: 'Internal Server Error' })
        }
    }
}

module.exports = new otpController()
