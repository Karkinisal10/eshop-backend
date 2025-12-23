const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/ec', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const adminSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    image: String,
    role: String
});

const sellerSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: String,
    status: String
});

const Admin = mongoose.model('admins', adminSchema);
const Seller = mongoose.model('sellers', sellerSchema);

async function checkUsers() {
    try {
        console.log('=== Checking for email: admin@gmail.com ===\n');
        
        const admin = await Admin.findOne({ email: 'admin@gmail.com' });
        if (admin) {
            console.log('ADMIN FOUND:');
            console.log(`  Name: ${admin.name}`);
            console.log(`  Email: ${admin.email}`);
            console.log(`  Role: ${admin.role}`);
            console.log(`  ID: ${admin._id}`);
            console.log('');
        } else {
            console.log('No admin found with this email\n');
        }
        
        const seller = await Seller.findOne({ email: 'admin@gmail.com' });
        if (seller) {
            console.log('SELLER FOUND WITH SAME EMAIL:');
            console.log(`  Name: ${seller.name}`);
            console.log(`  Email: ${seller.email}`);
            console.log(`  Role: ${seller.role}`);
            console.log(`  Status: ${seller.status}`);
            console.log(`  ID: ${seller._id}`);
            console.log('');
            console.log('⚠️  WARNING: Same email exists in both admin and seller collections!');
            console.log('This will cause login issues.');
        } else {
            console.log('No seller found with this email (this is correct)\n');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUsers();
