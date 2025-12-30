const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const productModel = require('../models/productModel');
const reviewModel = require('../models/reviewModel');
const customerModel = require('../models/customerModel');

// Sample customer names for reviews
const customerNames = [
    'Sarah Johnson', 'Michael Chen', 'Emma Davis', 'James Wilson', 'Olivia Brown',
    'Robert Taylor', 'Sophia Martinez', 'William Anderson', 'Isabella Thomas', 'David Lee',
    'Mia Garcia', 'John Rodriguez', 'Ava Martinez', 'Daniel Hernandez', 'Emily Lopez',
    'Matthew Gonzalez', 'Charlotte Perez', 'Christopher Wilson', 'Amelia Moore', 'Andrew Jackson'
];

// Sample reviews by rating
const reviewTemplates = {
    5: [
        'Absolutely love this product! Best purchase I\'ve made this year.',
        'Excellent quality and fast shipping. Highly recommend!',
        'Perfect! Exactly what I was looking for. 5 stars!',
        'Outstanding product. Exceeded my expectations in every way.',
        'Amazing quality! Will definitely buy again.',
        'Top-notch product. Couldn\'t be happier with my purchase.',
        'Fantastic! Works perfectly and arrived quickly.',
        'Love it! Great value for money.',
        'Superb quality. Best in its category.',
        'Exceptional product! Highly satisfied.'
    ],
    4: [
        'Great product! Just minor issues but overall satisfied.',
        'Very good quality. Would recommend to others.',
        'Pretty good! Met most of my expectations.',
        'Solid product. A few small improvements could make it perfect.',
        'Good purchase. Happy with the quality.',
        'Nice product. Works well as described.',
        'Satisfied with this purchase. Good value.',
        'Good quality but shipping took a while.',
        'Works great! Just wish it came in more colors.',
        'Very pleased. Minor improvements needed.'
    ],
    3: [
        'It\'s okay. Does the job but nothing special.',
        'Average product. Met basic expectations.',
        'Decent quality but expected more for the price.',
        'It\'s fine. Not great, not terrible.',
        'Acceptable product. Could be better.',
        'Fair quality. Does what it says.',
        'Okay purchase. Nothing to complain about.',
        'Satisfactory. Gets the job done.',
        'Standard quality. Met expectations.',
        'Reasonable product for the price.'
    ],
    2: [
        'Not very impressed. Several issues with quality.',
        'Below expectations. Wouldn\'t buy again.',
        'Disappointed with the quality. Not as described.',
        'Not great. Had to return it.',
        'Poor quality for the price.',
        'Not satisfied. Too many problems.',
        'Expected better based on reviews.',
        'Not worth the money. Very disappointed.'
    ],
    1: [
        'Terrible product. Complete waste of money.',
        'Very poor quality. Do not recommend.',
        'Awful! Stopped working after a few days.',
        'Worst purchase ever. Requesting refund.',
        'Completely disappointed. Not usable.'
    ]
};

const getRandomReview = (rating) => {
    const templates = reviewTemplates[rating];
    return templates[Math.floor(Math.random() * templates.length)];
};

const getRandomRating = () => {
    // Weighted towards higher ratings (more realistic)
    const rand = Math.random();
    if (rand < 0.4) return 5;  // 40% chance
    if (rand < 0.7) return 4;  // 30% chance
    if (rand < 0.85) return 3; // 15% chance
    if (rand < 0.95) return 2; // 10% chance
    return 1;                   // 5% chance
};

const addReviewsToProducts = async () => {
    try {
        await mongoose.connect(process.env.DB_URL || 'mongodb://127.0.0.1:27017/ec');
        console.log('Connected to database.');

        // Get all products
        const allProducts = await productModel.find({}).select('_id name sellerId');
        
        if (allProducts.length === 0) {
            console.log('No products found!');
            process.exit(1);
        }

        // Shuffle and take 20 products
        const shuffled = allProducts.sort(() => 0.5 - Math.random());
        const selectedProducts = shuffled.slice(0, Math.min(20, allProducts.length));

        console.log(`\nAdding reviews to ${selectedProducts.length} products...\n`);

        // Get or create a dummy customer for reviews
        let customer = await customerModel.findOne({});
        if (!customer) {
            customer = await customerModel.create({
                name: 'John Doe',
                email: 'customer@test.com',
                password: 'password123',
                method: 'manual'
            });
        }

        let totalReviews = 0;

        for (let i = 0; i < selectedProducts.length; i++) {
            const product = selectedProducts[i];
            
            // Add 10-15 reviews per product
            const reviewCount = Math.floor(Math.random() * 6) + 10; // Random between 10-15
            const reviewRatings = [];

            for (let j = 0; j < reviewCount; j++) {
                const rating = getRandomRating();
                const reviewText = getRandomReview(rating);
                const customerName = customerNames[Math.floor(Math.random() * customerNames.length)];

                // Create random date within last 60 days
                const daysAgo = Math.floor(Math.random() * 60);
                const reviewDate = new Date();
                reviewDate.setDate(reviewDate.getDate() - daysAgo);

                await reviewModel.create({
                    productId: product._id,
                    customerId: customer._id,
                    sellerId: product.sellerId,
                    name: customerName,
                    rating: rating,
                    review: reviewText,
                    date: reviewDate.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })
                });

                reviewRatings.push(rating);
                totalReviews++;
            }

            // Calculate average rating for the product
            const avgRating = (reviewRatings.reduce((a, b) => a + b, 0) / reviewRatings.length).toFixed(1);
            
            // Update product rating
            await productModel.updateOne(
                { _id: product._id },
                { rating: parseFloat(avgRating) }
            );

            console.log(`✓ ${product.name}`);
            console.log(`  Added ${reviewCount} review(s), Average rating: ${avgRating}/5`);
        }

        console.log(`\n✅ Review generation complete!`);
        console.log(`   - Products updated: ${selectedProducts.length}`);
        console.log(`   - Total reviews added: ${totalReviews}`);

        process.exit(0);
    } catch (error) {
        console.error('Error adding reviews:', error);
        process.exit(1);
    }
};

addReviewsToProducts();
