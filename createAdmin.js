const bcrypt = require('bcrypt');
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

async function createAdmin() {
    try {
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: 'admin@gmail.com' });
        if (existingAdmin) {
            console.log('❌ Admin already exists!');
            process.exit(0);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Create admin
        const admin = await Admin.create({
            name: 'Admin User',
            email: 'admin@gmail.com',
            password: hashedPassword,
            image: 'https://via.placeholder.com/150',
            role: 'admin'
        });

        console.log('✅ Admin created successfully!');
        console.log('Email:', admin.email);
        console.log('Password: admin123');
        console.log('\nYou can now login at: http://localhost:3000/admin/login');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin:', error);
        process.exit(1);
    }
}

createAdmin();
