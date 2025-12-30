const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '../.env' });

const sellerModel = require('../models/sellerModel');
const productModel = require('../models/productModel');
const { dbConnect } = require('../utiles/db');

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
            'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=400',
            'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=400',
            'https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=400'
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
            'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400',
            'https://images.pexels.com/photos/3587478/pexels-photo-3587478.jpeg?auto=compress&cs=tinysrgb&w=400',
            'https://images.pexels.com/photos/577769/pexels-photo-577769.jpeg?auto=compress&cs=tinysrgb&w=400'
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
            'https://images.pexels.com/photos/1201996/pexels-photo-1201996.jpeg?auto=compress&cs=tinysrgb&w=400',
            'https://images.pexels.com/photos/1444416/pexels-photo-1444416.jpeg?auto=compress&cs=tinysrgb&w=400',
            'https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=400'
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
            'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=400',
            'https://images.pexels.com/photos/374074/pexels-photo-374074.jpeg?auto=compress&cs=tinysrgb&w=400',
            'https://images.pexels.com/photos/1229861/pexels-photo-1229861.jpeg?auto=compress&cs=tinysrgb&w=400'
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
    
    // More Beauty Products
    { 
        name: 'Fenty Beauty Foundation', 
        category: 'Beauty', 
        brand: 'Fenty', 
        price: 39.00, 
        stock: 180, 
        discount: 12, 
        description: 'Soft matte longwear foundation with buildable coverage. 50 shades available for all skin tones.',
        images: [
            'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Urban Decay Eyeshadow Palette', 
        category: 'Beauty', 
        brand: 'Urban Decay', 
        price: 54.00, 
        stock: 95, 
        discount: 18, 
        description: 'Naked palette with 12 neutral shades. Highly pigmented, blendable formula with creamy texture.',
        images: [
            'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1583241800698-2d14e30ec5c8?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1596704017254-9b121068ec31?w=400&h=400&fit=crop'
        ]
    },
    
    // Toys
    { 
        name: 'LEGO Star Wars Millennium Falcon', 
        category: 'Toys', 
        brand: 'LEGO', 
        price: 159.99, 
        stock: 45, 
        discount: 10, 
        description: 'Build the legendary Corellian freighter with 1,351 pieces. Includes 7 minifigures and rotating gun turrets.',
        images: [
            'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1611087487887-0b4a36cd4b1b?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Hot Wheels Track Builder Set', 
        category: 'Toys', 
        brand: 'Hot Wheels', 
        price: 49.99, 
        stock: 120, 
        discount: 15, 
        description: 'Mega stunt track set with motorized booster, loops, and curves. Includes 2 Hot Wheels cars.',
        images: [
            'https://images.unsplash.com/photo-1586296835409-fe3fe6b35b56?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Barbie Dreamhouse', 
        category: 'Toys', 
        brand: 'Barbie', 
        price: 199.99, 
        stock: 35, 
        discount: 12, 
        description: '3-story dollhouse with 8 rooms, elevator, pool, and slide. Over 70 accessories included.',
        images: [
            'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1611087487887-0b4a36cd4b1b?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Nerf Elite 2.0 Blaster', 
        category: 'Toys', 
        brand: 'Nerf', 
        price: 34.99, 
        stock: 150, 
        discount: 20, 
        description: 'Motorized blaster with 30-dart drum. Fires darts up to 90 feet with rapid-fire action.',
        images: [
            'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Play-Doh Modeling Set', 
        category: 'Toys', 
        brand: 'Play-Doh', 
        price: 24.99, 
        stock: 200, 
        discount: 8, 
        description: 'Super color set with 50 cans of Play-Doh compound. Non-toxic and perfect for creative play.',
        images: [
            'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1611087487887-0b4a36cd4b1b?w=400&h=400&fit=crop'
        ]
    },
    
    // Food Products
    { 
        name: 'Organic Almond Butter', 
        category: 'Food', 
        brand: 'Justin\'s', 
        price: 12.99, 
        stock: 175, 
        discount: 5, 
        description: 'Creamy organic almond butter made from roasted almonds. No added sugars, gluten-free.',
        images: [
            'https://images.unsplash.com/photo-1585334175032-ff3602dd0bda?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1599599810694-b5ac4dd7aeba?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1585394838944-a0114d1e96aa?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Organic Honey Raw Unfiltered', 
        category: 'Food', 
        brand: 'Nature Nate\'s', 
        price: 15.99, 
        stock: 140, 
        discount: 10, 
        description: '100% pure raw and unfiltered honey. Rich flavor with natural enzymes and antioxidants.',
        images: [
            'https://images.unsplash.com/photo-1587049352846-4a222e784422?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Premium Olive Oil Extra Virgin', 
        category: 'Food', 
        brand: 'Filippo Berio', 
        price: 18.99, 
        stock: 160, 
        discount: 12, 
        description: 'Cold-pressed extra virgin olive oil from Italy. Perfect for cooking and dressings.',
        images: [
            'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1608181078200-590fbe84bb51?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1582441660091-9b0e2fe5f0b8?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Himalayan Pink Salt', 
        category: 'Food', 
        brand: 'Sherpa Pink', 
        price: 9.99, 
        stock: 220, 
        discount: 7, 
        description: 'Pure Himalayan pink salt with 84 trace minerals. Fine grain for cooking and seasoning.',
        images: [
            'https://images.unsplash.com/photo-1598514983318-2f64f8f6afbb?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1599492875111-6d2c267cea3e?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Organic Quinoa Grain', 
        category: 'Food', 
        brand: 'Ancient Harvest', 
        price: 11.99, 
        stock: 190, 
        discount: 8, 
        description: 'Certified organic quinoa. High in protein and fiber, gluten-free superfood.',
        images: [
            'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1599599813162-c665ff79f8c5?w=400&h=400&fit=crop'
        ]
    },
    
    // More Sports Products
    { 
        name: 'Spalding NBA Basketball', 
        category: 'Sports', 
        brand: 'Spalding', 
        price: 59.99, 
        stock: 85, 
        discount: 10, 
        description: 'Official NBA game basketball. Premium composite leather cover with superior grip.',
        images: [
            'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'TRX Suspension Training', 
        category: 'Sports', 
        brand: 'TRX', 
        price: 199.99, 
        stock: 50, 
        discount: 15, 
        description: 'Professional suspension training system. Full-body workout anywhere, includes guide.',
        images: [
            'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1517438476312-10d79c077509?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Fitbit Charge 5 Fitness Tracker', 
        category: 'Sports', 
        brand: 'Fitbit', 
        price: 149.99, 
        stock: 120, 
        discount: 18, 
        description: 'Advanced fitness tracker with GPS, heart rate monitor, and stress management tools.',
        images: [
            'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1557438159-51eec7a6c9e8?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1523395243481-163f8f6155ab?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Yeti Rambler Water Bottle', 
        category: 'Sports', 
        brand: 'Yeti', 
        price: 39.99, 
        stock: 200, 
        discount: 12, 
        description: '36oz stainless steel water bottle. Keeps drinks cold for 24 hours, hot for 12 hours.',
        images: [
            'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=400&fit=crop'
        ]
    },
    
    // Clothing
    { 
        name: 'Champion Hoodie Pullover', 
        category: 'Clothing', 
        brand: 'Champion', 
        price: 44.99, 
        stock: 180, 
        discount: 15, 
        description: 'Classic fleece hoodie with kangaroo pocket. Soft cotton blend, iconic C logo.',
        images: [
            'https://images.unsplash.com/photo-1556821552-17943f3b7e96?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1556821561-74fc1b8d9b45?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Carhartt Work Jacket', 
        category: 'Clothing', 
        brand: 'Carhartt', 
        price: 129.99, 
        stock: 75, 
        discount: 10, 
        description: 'Durable canvas work jacket with quilted lining. Water-repellent finish, multiple pockets.',
        images: [
            'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Columbia Fleece Jacket', 
        category: 'Clothing', 
        brand: 'Columbia', 
        price: 64.99, 
        stock: 140, 
        discount: 18, 
        description: 'Warm fleece jacket with zippered pockets. Breathable and comfortable for outdoor activities.',
        images: [
            'https://images.unsplash.com/photo-1601333144130-8cbb312386b6?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Under Armour Tech T-Shirt', 
        category: 'Clothing', 
        brand: 'Under Armour', 
        price: 24.99, 
        stock: 250, 
        discount: 12, 
        description: 'Performance t-shirt with moisture-wicking fabric. Anti-odor technology, loose fit.',
        images: [
            'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Timberland Boots Classic', 
        category: 'Clothing', 
        brand: 'Timberland', 
        price: 189.99, 
        stock: 90, 
        discount: 15, 
        description: 'Premium waterproof leather boots. Iconic yellow boot design, padded collar for comfort.',
        images: [
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1605812830455-cd2a490b1585?w=400&h=400&fit=crop'
        ]
    },
    
    // Books
    { 
        name: 'Atomic Habits by James Clear', 
        category: 'Books', 
        brand: 'Penguin', 
        price: 16.99, 
        stock: 300, 
        discount: 10, 
        description: 'Proven framework for improving every day. Transform your habits and achieve remarkable results.',
        images: [
            'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'The Psychology of Money', 
        category: 'Books', 
        brand: 'Harriman House', 
        price: 18.99, 
        stock: 250, 
        discount: 12, 
        description: 'Timeless lessons on wealth, greed, and happiness. How we think about money affects our lives.',
        images: [
            'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Sapiens by Yuval Noah Harari', 
        category: 'Books', 
        brand: 'Harper', 
        price: 19.99, 
        stock: 220, 
        discount: 15, 
        description: 'Brief history of humankind from the Stone Age to the modern age. International bestseller.',
        images: [
            'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Educated by Tara Westover', 
        category: 'Books', 
        brand: 'Random House', 
        price: 17.99, 
        stock: 200, 
        discount: 8, 
        description: 'Memoir about a girl who leaves her survivalist family for education. Powerful and inspiring.',
        images: [
            'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'The Midnight Library', 
        category: 'Books', 
        brand: 'Canongate', 
        price: 15.99, 
        stock: 280, 
        discount: 10, 
        description: 'Novel about life, death, and all the possible lives in between. Heartwarming and thought-provoking.',
        images: [
            'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&h=400&fit=crop'
        ]
    },
    
    // Home & Garden
    { 
        name: 'Ninja Air Fryer', 
        category: 'Home & Garden', 
        brand: 'Ninja', 
        price: 119.99, 
        stock: 95, 
        discount: 20, 
        description: '5.5-quart air fryer with rapid air technology. Fry, roast, reheat, and dehydrate with little to no oil.',
        images: [
            'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1585659722563-8bc5b687a7f9?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Instant Pot Duo Crisp', 
        category: 'Home & Garden', 
        brand: 'Instant Pot', 
        price: 149.99, 
        stock: 80, 
        discount: 18, 
        description: '11-in-1 multi-cooker with air fryer lid. Pressure cook, slow cook, steam, and more.',
        images: [
            'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1585659722563-8bc5b687a7f9?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'iRobot Roomba Vacuum', 
        category: 'Home & Garden', 
        brand: 'iRobot', 
        price: 399.99, 
        stock: 55, 
        discount: 15, 
        description: 'Smart robot vacuum with mapping technology. Auto-recharge, app control, works with Alexa.',
        images: [
            'https://images.unsplash.com/photo-1558317374-067fb2c261c6?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1628744404730-e0b5c32f7c2e?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Vitamix Professional Blender', 
        category: 'Home & Garden', 
        brand: 'Vitamix', 
        price: 549.99, 
        stock: 40, 
        discount: 12, 
        description: 'Professional-grade blender with 2.2 peak horsepower. Variable speed control, self-cleaning.',
        images: [
            'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1578843906907-7d2c02f49530?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Cuisinart Food Processor', 
        category: 'Home & Garden', 
        brand: 'Cuisinart', 
        price: 179.99, 
        stock: 70, 
        discount: 15, 
        description: '14-cup food processor with powerful motor. Slice, dice, chop, shred with ease.',
        images: [
            'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1578843906907-7d2c02f49530?w=400&h=400&fit=crop'
        ]
    },
    
    // More Electronics
    { 
        name: 'Canon EOS R6 Camera', 
        category: 'Electronics', 
        brand: 'Canon', 
        price: 2499.99, 
        stock: 25, 
        discount: 8, 
        description: 'Full-frame mirrorless camera with 20MP sensor. 4K video, dual card slots, in-body stabilization.',
        images: [
            'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1606982801524-1767b3e8a8aa?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'iPad Air 5th Generation', 
        category: 'Electronics', 
        brand: 'Apple', 
        price: 599.99, 
        stock: 80, 
        discount: 10, 
        description: '10.9-inch Liquid Retina display with M1 chip. Apple Pencil and Magic Keyboard compatible.',
        images: [
            'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1585790050230-5dd28404f1a1?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400&h=400&fit=crop'
        ]
    },
    { 
        name: 'Bose SoundLink Speaker', 
        category: 'Electronics', 
        brand: 'Bose', 
        price: 149.99, 
        stock: 110, 
        discount: 15, 
        description: 'Portable Bluetooth speaker with 360-degree sound. Waterproof, 12-hour battery life.',
        images: [
            'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1545127398-14699f92334b?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=400&h=400&fit=crop'
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
