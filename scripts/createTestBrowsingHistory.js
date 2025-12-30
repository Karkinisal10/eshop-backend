const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const browsingHistoryModel = require('../models/browsingHistoryModel');
const customerModel = require('../models/customerModel');
const productModel = require('../models/productModel');

const createTestBrowsingHistory = async () => {
    try {
        await mongoose.connect(process.env.DB_URL || 'mongodb://127.0.0.1:27017/ec');
        console.log('Connected to database.');

        // Get or create a test customer
        let customer = await customerModel.findOne({ email: 'test@example.com' });
        if (!customer) {
            customer = await customerModel.create({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                method: 'manual'
            });
            console.log('Created test customer:', customer._id);
        } else {
            console.log('Using existing customer:', customer._id);
        }

        // Clear old history for this customer
        await browsingHistoryModel.deleteMany({ userId: customer._id });

        // Get 10 random products
        const products = await productModel.find({}).limit(10);

        if (products.length === 0) {
            console.log('No products found!');
            process.exit(1);
        }

        console.log(`\nAdding browsing history for ${products.length} products...`);

        // Create browsing history for these products
        for (const product of products) {
            await browsingHistoryModel.create({
                userId: customer._id,
                productId: product._id,
                category: product.category || '',
                brand: product.brand || '',
                price: product.price || 0,
                timeSpent: Math.floor(Math.random() * 10) + 1
            });
            console.log(`✓ Added history for: ${product.name}`);
        }

        console.log(`\n✅ Test browsing history created!`);
        console.log(`   Customer ID: ${customer._id}`);
        console.log(`   History entries: ${products.length}`);
        console.log(`\nUse this customer ID to test personalized recommendations.`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

createTestBrowsingHistory();
