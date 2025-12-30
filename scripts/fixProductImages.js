const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const productModel = require('../models/productModel');

// Fallback images by category
const fallbackImagesByCategory = {
    'Electronics': [
        'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=400'
    ],
    'Fashion': [
        'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/267320/pexels-photo-267320.jpeg?auto=compress&cs=tinysrgb&w=400'
    ],
    'Clothing': [
        'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg?auto=compress&cs=tinysrgb&w=400'
    ],
    'Home': [
        'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=400'
    ],
    'Home & Garden': [
        'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=400'
    ],
    'Sports': [
        'https://images.pexels.com/photos/2291004/pexels-photo-2291004.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/3766211/pexels-photo-3766211.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg?auto=compress&cs=tinysrgb&w=400'
    ],
    'Beauty': [
        'https://images.pexels.com/photos/3373714/pexels-photo-3373714.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/2113855/pexels-photo-2113855.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/3018845/pexels-photo-3018845.jpeg?auto=compress&cs=tinysrgb&w=400'
    ],
    'Toys': [
        'https://images.pexels.com/photos/163036/mario-luigi-yoschi-figures-163036.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/1148998/pexels-photo-1148998.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/1422673/pexels-photo-1422673.jpeg?auto=compress&cs=tinysrgb&w=400'
    ],
    'Food': [
        'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/1537635/pexels-photo-1537635.jpeg?auto=compress&cs=tinysrgb&w=400'
    ],
    'Books': [
        'https://images.pexels.com/photos/159866/books-book-pages-read-literature-159866.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/46274/pexels-photo-46274.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/1301585/pexels-photo-1301585.jpeg?auto=compress&cs=tinysrgb&w=400'
    ]
};

const fixProductImages = async () => {
    try {
        await mongoose.connect(process.env.DB_URL || 'mongodb://127.0.0.1:27017/ec', { 
            useNewUrlParser: true 
        });
        console.log('Connected to database.');

        const products = await productModel.find({});
        console.log(`Found ${products.length} products to check.`);

        let fixedCount = 0;
        
        for (const product of products) {
            let needsUpdate = false;
            let newImages = product.images || [];

            // Check if images array is empty, has invalid URLs, or has Unsplash URLs
            const hasUnsplashUrls = newImages.some(img => img && img.includes('unsplash.com'));
            
            if (!newImages || newImages.length === 0 || newImages.some(img => !img || img.trim() === '') || hasUnsplashUrls) {
                needsUpdate = true;
                const categoryImages = fallbackImagesByCategory[product.category] || fallbackImagesByCategory['Electronics'];
                newImages = [...categoryImages];
            }

            if (needsUpdate) {
                await productModel.updateOne(
                    { _id: product._id },
                    { $set: { images: newImages } }
                );
                fixedCount++;
                console.log(`✓ Fixed images for: ${product.name} (${product.category})`);
            }
        }

        console.log(`\n✅ Image fix complete!`);
        console.log(`   - Products checked: ${products.length}`);
        console.log(`   - Products fixed: ${fixedCount}`);

        process.exit(0);
    } catch (error) {
        console.error('Error fixing product images:', error);
        process.exit(1);
    }
};

fixProductImages();
