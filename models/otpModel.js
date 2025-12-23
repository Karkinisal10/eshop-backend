const { Schema, model } = require('mongoose')

const otpSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    otp: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
        index: { expires: 0 } // Auto-delete after expiry
    },
    role: {
        type: String,
        enum: ['seller', 'admin', 'customer'],
        required: true
    },
    userId: {
        type: String,
        required: false
    }
}, {timestamps: true})

module.exports = model('otps', otpSchema)
