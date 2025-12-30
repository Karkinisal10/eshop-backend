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

const Admin = mongoose.model('admins', adminSchema);

async function checkAdmin() {
    try {
        const admins = await Admin.find({});
        console.log('=== Admin Accounts in Database ===');
        admins.forEach(admin => {
            console.log(`Name: ${admin.name}`);
            console.log(`Email: ${admin.email}`);
            console.log(`Role: ${admin.role}`);
            console.log(`ID: ${admin._id}`);
            console.log('---');
        });
        
        if (admins.length === 0) {
            console.log('No admin accounts found!');
        } else {
            console.log(`\nTotal admins: ${admins.length}`);
            console.log('\nYou can login with:');
            console.log('Email: admin@gmail.com');
            console.log('Password: admin123');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAdmin();
