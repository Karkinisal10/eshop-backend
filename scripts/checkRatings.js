const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const productModel = require('../models/productModel');

const checkRatings = async () => {
    try {
        await mongoose.connect(process.env.DB_URL || 'mongodb://127.0.0.1:27017/ec');
        
        const products = await productModel.find({ rating: { $gt: 0 } })
            .select('name rating')
            .sort({ rating: -1 });
        
        console.log('\nProducts with ratings > 0:');
        products.forEach(p => console.log(`  ${p.name}: ${p.rating}`));
        
        console.log(`\nTotal products with ratings: ${products.length}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkRatings();
