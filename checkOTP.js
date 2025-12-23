const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/ec', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const otpSchema = new mongoose.Schema({
    email: String,
    otp: String,
    role: String,
    userId: String,
    createdAt: Date
});

const OTP = mongoose.model('otps', otpSchema);

async function checkOTPs() {
    try {
        const otps = await OTP.find({});
        console.log('=== All OTP Records ===\n');
        
        if (otps.length === 0) {
            console.log('No OTP records found.');
        } else {
            otps.forEach(otp => {
                console.log(`Email: ${otp.email}`);
                console.log(`Role: ${otp.role}`);
                console.log(`UserID: ${otp.userId}`);
                console.log(`OTP: ${otp.otp}`);
                console.log(`Created: ${otp.createdAt}`);
                console.log('---');
            });
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkOTPs();
