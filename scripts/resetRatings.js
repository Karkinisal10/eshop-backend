const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const productModel = require('../models/productModel');

const resetRatings = async () => {
    try {
        await mongoose.connect(process.env.DB_URL || 'mongodb://127.0.0.1:27017/ec');
        console.log('Connected to database.');

        const result = await productModel.updateMany(
            {},
            { $set: { rating: 0 } }
        );

        console.log(`\n✅ Ratings reset complete!`);
        console.log(`   - Products updated: ${result.modifiedCount}`);

        process.exit(0);
    } catch (error) {
        console.error('Error resetting ratings:', error);
        process.exit(1);
    }
};

resetRatings();
