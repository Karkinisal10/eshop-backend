const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const reviewModel = require('../models/reviewModel');

const checkReviews = async () => {
    try {
        await mongoose.connect(process.env.DB_URL || 'mongodb://127.0.0.1:27017/ec');
        
        const reviews = await reviewModel.find({})
            .limit(5)
            .select('name rating review date');
        
        console.log('\nSample Reviews:\n');
        reviews.forEach(r => {
            console.log(`- ${r.name} (${r.rating} stars): "${r.review}"`);
            console.log(`  Date: ${r.date}\n`);
        });
        
        const totalReviews = await reviewModel.countDocuments({});
        console.log(`Total reviews in database: ${totalReviews}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkReviews();
