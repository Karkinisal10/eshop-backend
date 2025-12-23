const otpController = require('../controllers/otpController')
const router = require('express').Router()

router.post('/send-otp', otpController.send_otp)
router.post('/verify-otp', otpController.verify_otp)
router.post('/forgot-password', otpController.forgot_password)
router.post('/reset-password', otpController.reset_password)

module.exports = router
