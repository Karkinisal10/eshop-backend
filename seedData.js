const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const sellerModel = require('./models/sellerModel');
const productModel = require('./models/productModel');
const { dbConnect } = require('./utiles/db');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret,
    secure: true
});

// Sample sellers data
const sellers = [
    { name: 'TechVision Electronics', email: 'techvision@test.com', shopName: 'TechVision', category: 'Electronics' },
    { name: 'Urban Fashion Store', email: 'urbanfashion@test.com', shopName: 'Urban Fashion', category: 'Fashion' },
    { name: 'HomeComfort Essentials', email: 'homecomfort@test.com', shopName: 'HomeComfort', category: 'Home' },
    { name: 'ActiveLife Sports', email: 'activelife@test.com', shopName: 'ActiveLife', category: 'Sports' },
    { name: 'Pure Beauty Co', email: 'purebeauty@test.com', shopName: 'Pure Beauty', category: 'Beauty' },
];

// Realistic products data with actual product images
const productTemplates = [
    // Electronics
    { 
        name: 'Apple iPhone 15 Pro Max', 
        category: 'Electronics', 
        brand: 'Apple', 
        price: 1199.99, 
        stock: 50, 
        discount: 5, 
        description: 'The latest iPhone 15 Pro Max with A17 Pro chip, titanium design, and advanced camera system. Features 6.7-inch Super Retina XDR display, ProMotion technology, and all-day battery life.',
        images: [
            'https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1695048064988-7e488c8c4e1e?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1695048133832-31b370c1c3eb?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Sony WH-1000XM5 Headphones', 
        category: 'Electronics', 
        brand: 'Sony', 
        price: 399.99, 
        stock: 75, 
        discount: 10, 
        description: 'Industry-leading noise canceling wireless headphones with premium sound quality. 30-hour battery life, multipoint connection, and speak-to-chat technology.',
        images: [
            'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcf?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1545127398-14699f92334b?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Samsung 65" 4K Smart TV', 
        category: 'Electronics', 
        brand: 'Samsung', 
        price: 899.99, 
        stock: 30, 
        discount: 15, 
        description: 'Crystal UHD 4K Smart TV with HDR, Tizen OS, and voice assistant compatibility. Features Quantum Processor 4K, Motion Xcelerator, and built-in apps.',
        images: [
            'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1593359677277-f5f161b38bff?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1601944177325-f8867652a553?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Apple MacBook Air M2', 
        category: 'Electronics', 
        brand: 'Apple', 
        price: 1099.99, 
        stock: 40, 
        discount: 8, 
        description: '13.6-inch MacBook Air with M2 chip, 8GB RAM, and 256GB SSD. Liquid Retina display, all-day battery life, and fanless design.',
        images: [
            'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop'
        ]
    },
    
    // Fashion
    { 
        name: 'Nike Air Max 270 Sneakers', 
        category: 'Fashion', 
        brand: 'Nike', 
        price: 150.00, 
        stock: 120, 
        discount: 20, 
        description: 'Iconic Nike Air Max 270 featuring the brand\'s biggest heel Air unit yet. Breathable mesh upper with synthetic overlays for support and durability.',
        images: [
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: "Levi's 501 Original Jeans", 
        category: 'Fashion', 
        brand: "Levi's", 
        price: 89.99, 
        stock: 200, 
        discount: 15, 
        description: 'The original blue jean since 1873. Classic straight fit with signature button fly. Made from premium denim with a lived-in look.',
        images: [
            'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1475178626620-a4d074967452?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Ray-Ban Aviator Sunglasses', 
        category: 'Fashion', 
        brand: 'Ray-Ban', 
        price: 154.99, 
        stock: 90, 
        discount: 12, 
        description: 'Classic Ray-Ban Aviator sunglasses with 100% UV protection. Metal frame with adjustable nose pads and G-15 green lenses.',
        images: [
            'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Adidas Ultraboost Running Shoes', 
        category: 'Fashion', 
        brand: 'Adidas', 
        price: 180.00, 
        stock: 85, 
        discount: 18, 
        description: 'Premium running shoes with responsive Boost cushioning. Primeknit upper adapts to your foot, Continental™ rubber outsole for superior traction.',
        images: [
            'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop'
        ]
    },
    
    // Home
    { 
        name: 'Dyson V15 Cordless Vacuum', 
        category: 'Home', 
        brand: 'Dyson', 
        price: 649.99, 
        stock: 45, 
        discount: 10, 
        description: 'Powerful cordless vacuum with laser dust detection and LCD screen. Up to 60 minutes run time, HEPA filtration, and advanced whole-machine filtration.',
        images: [
            'https://images.unsplash.com/photo-1558317374-067fb2c261c6?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1628744404730-e0b5c32f7c2e?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Nespresso Vertuo Coffee Maker', 
        category: 'Home', 
        brand: 'Nespresso', 
        price: 199.99, 
        stock: 70, 
        discount: 15, 
        description: 'Premium coffee and espresso maker with Centrifusion technology. Brews 5 cup sizes, automatic blend recognition, and 40-second heat-up time.',
        images: [
            'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'KitchenAid Stand Mixer', 
        category: 'Home', 
        brand: 'KitchenAid', 
        price: 379.99, 
        stock: 55, 
        discount: 12, 
        description: 'Professional 5-quart stand mixer with 10 speeds. Includes flat beater, dough hook, and wire whip. Tilt-head design for easy bowl access.',
        images: [
            'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1578843906907-7d2c02f49530?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Philips Air Purifier', 
        category: 'Home', 
        brand: 'Philips', 
        price: 299.99, 
        stock: 60, 
        discount: 18, 
        description: 'Advanced air purifier with HEPA and activated carbon filter. Removes 99.97% of airborne particles, covers up to 700 sq ft, smart sensor technology.',
        images: [
            'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop'
        ]
    },
    
    // Sports
    { 
        name: 'Bowflex Adjustable Dumbbells', 
        category: 'Sports', 
        brand: 'Bowflex', 
        price: 349.99, 
        stock: 40, 
        discount: 15, 
        description: 'SelectTech 552 adjustable dumbbells replace 15 sets of weights. Adjusts from 5 to 52.5 lbs per dumbbell, space-saving design.',
        images: [
            'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Manduka Pro Yoga Mat', 
        category: 'Sports', 
        brand: 'Manduka', 
        price: 120.00, 
        stock: 95, 
        discount: 10, 
        description: 'Premium 6mm yoga mat with superior grip and cushioning. High-density cushion for comfort and stability, lifetime guarantee.',
        images: [
            'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Wilson NFL Football', 
        category: 'Sports', 
        brand: 'Wilson', 
        price: 79.99, 
        stock: 110, 
        discount: 12, 
        description: 'Official size and weight NFL football. Premium leather construction with ACL laces for superior grip and control.',
        images: [
            'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400&h=400&fit=crop'
        ]
    },
    
    // Beauty
    { 
        name: 'Dyson Airwrap Hair Styler', 
        category: 'Beauty', 
        brand: 'Dyson', 
        price: 599.99, 
        stock: 35, 
        discount: 8, 
        description: 'Multi-styler for multiple hair types. Curls, waves, smooths and dries with no extreme heat. Includes 6 attachments for various styling needs.',
        images: [
            'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Olaplex Hair Treatment Set', 
        category: 'Beauty', 
        brand: 'Olaplex', 
        price: 90.00, 
        stock: 125, 
        discount: 15, 
        description: 'Professional hair repair treatment system. Repairs damaged hair, strengthens, and protects hair structure. Suitable for all hair types.',
        images: [
            'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'The Ordinary Skincare Set', 
        category: 'Beauty', 
        brand: 'The Ordinary', 
        price: 45.00, 
        stock: 150, 
        discount: 10, 
        description: 'Complete skincare routine with hyaluronic acid, niacinamide, and vitamin C. Clinically proven formulas for healthy, glowing skin.',
        images: [
            'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
        ]
    },
];

// Function to generate slug
const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

// Function to seed database
const seedDatabase = async () => {
    try {
        await dbConnect();
        console.log('Database connected successfully!');

        // Clear existing data
        console.log('Clearing existing test data...');
        await sellerModel.deleteMany({ email: { $regex: '@test.com$' } });
        await productModel.deleteMany({});

        console.log('Creating sellers...');
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        const createdSellers = [];
        for (const seller of sellers) {
            const newSeller = await sellerModel.create({
                name: seller.name,
                email: seller.email,
                password: hashedPassword,
                role: 'seller',
                status: 'active',
                payment: 'active',
                method: 'khalti',
                image: 'https://via.placeholder.com/150',
                shopInfo: {
                    shopName: seller.shopName,
                    address: 'Kathmandu, Nepal',
                    division: 'Bagmati',
                    district: 'Kathmandu',
                },
                khaltiName: seller.shopName,
                khaltiNumber: '98XXXXXXXX'
            });
            createdSellers.push(newSeller);
            console.log(`✓ Created seller: ${seller.name}`);
        }

        console.log('\nCreating realistic products with high-quality images...\n');
        let productCount = 0;
        
        for (const template of productTemplates) {
            const randomSeller = createdSellers[Math.floor(Math.random() * createdSellers.length)];
            
            const product = await productModel.create({
                sellerId: randomSeller._id,
                name: template.name,
                slug: generateSlug(template.name),
                category: template.category,
                brand: template.brand,
                price: template.price,
                stock: template.stock,
                discount: template.discount,
                description: template.description,
                shopName: randomSeller.shopInfo.shopName,
                images: template.images,
                rating: Math.floor(Math.random() * 2) + 4 // Random rating between 4-5
            });
            
            productCount++;
            console.log(`✓ Created: ${template.name}`);
        }

        console.log(`\n✅ Database seeded successfully!`);
        console.log(`📊 Summary:`);
        console.log(`   - Sellers created: ${createdSellers.length}`);
        console.log(`   - Products created: ${productCount}`);
        console.log(`\n🔐 You can login with any seller using:`);
        console.log(`   Email: techvision@test.com (or any other seller email)`);
        console.log(`   Password: password123`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

// Run the seed function
seedDatabase();
