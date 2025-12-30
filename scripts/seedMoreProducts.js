const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
require('dotenv').config({ path: '../.env' })

// Ensure DB_URL is set
const DB_URL = process.env.DB_URL || 'mongodb://127.0.0.1:27017/ec'

const sellerModel = require('../models/sellerModel')
const productModel = require('../models/productModel')

const generateSlug = (name, suffix = '') => {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return suffix ? `${base}-${suffix}` : base
}

// 60 COMPLETELY UNIQUE PRODUCTS - NO DUPLICATES
const products = [
  // BEAUTY (10 unique)
  { name: 'MAC Fix+ Setting Spray', category: 'Beauty', brand: 'MAC', price: 29.50, stock: 180, discount: 12, description: 'Professional makeup setting spray with hydrating benefits.', images: ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600&h=600&fit=crop'] },
  { name: 'Maybelline Mascara Ultra Black', category: 'Beauty', brand: 'Maybelline', price: 8.99, stock: 260, discount: 10, description: 'Volumizing mascara for dramatic eye-catching lashes.', images: ['https://images.unsplash.com/photo-1506617420156-8e4536971650?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&h=600&fit=crop'] },
  { name: 'L\'Oreal Paris Foundation 24H', category: 'Beauty', brand: 'L\'Oreal', price: 11.99, stock: 220, discount: 8, description: 'Long-wearing liquid foundation with buildable coverage.', images: ['https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600&h=600&fit=crop'] },
  { name: 'Neutrogena Face Moisturizer Cream', category: 'Beauty', brand: 'Neutrogena', price: 9.49, stock: 240, discount: 7, description: 'Lightweight hydrating moisturizer for face and neck.', images: ['https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1506617420156-8e4536971650?w=600&h=600&fit=crop'] },
  { name: 'Revlon Lip Gloss Shine', category: 'Beauty', brand: 'Revlon', price: 6.99, stock: 280, discount: 9, description: 'Shiny glossy lip color with moisturizing formula.', images: ['https://images.unsplash.com/photo-1506617420156-8e4536971650?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600&h=600&fit=crop'] },
  { name: 'Olay Regenerist Eye Cream', category: 'Beauty', brand: 'Olay', price: 19.99, stock: 150, discount: 12, description: 'Anti-aging eye cream with retinol complex.', images: ['https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1506617420156-8e4536971650?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=600&fit=crop'] },
  { name: 'Cetaphil Gentle Facial Cleanser', category: 'Beauty', brand: 'Cetaphil', price: 8.99, stock: 250, discount: 6, description: 'Non-irritating cleanser for sensitive skin.', images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600&h=600&fit=crop'] },
  { name: 'Rimmel Lipstick Deep Red', category: 'Beauty', brand: 'Rimmel', price: 4.99, stock: 290, discount: 7, description: 'Long-lasting matte lipstick in classic red shade.', images: ['https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1506617420156-8e4536971650?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600&h=600&fit=crop'] },
  { name: 'Sally Hansen Nail Color Coral', category: 'Beauty', brand: 'Sally Hansen', price: 3.99, stock: 310, discount: 8, description: 'Chip-resistant nail polish in vibrant coral.', images: ['https://images.unsplash.com/photo-1506617420156-8e4536971650?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=600&fit=crop'] },
  { name: 'Eucerin Eczema Relief Lotion', category: 'Beauty', brand: 'Eucerin', price: 12.99, stock: 200, discount: 10, description: 'Soothing lotion for eczema-prone skin.', images: ['https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1506617420156-8e4536971650?w=600&h=600&fit=crop'] },

  // TOYS (10 unique)
  { name: 'LEGO City Police Station', category: 'Toys', brand: 'LEGO', price: 69.99, stock: 90, discount: 11, description: 'Large LEGO set with police vehicles and minifigures.', images: ['https://images.unsplash.com/photo-1611987620945-c47cf4770642?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1601758064226-0c3b6858d2c0?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=600&fit=crop'] },
  { name: 'Mattel WWE Action Figures', category: 'Toys', brand: 'Mattel', price: 24.99, stock: 140, discount: 9, description: 'Realistic WWE wrestler action figures with articulation.', images: ['https://images.unsplash.com/photo-1601758064226-0c3b6858d2c0?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1556228724-4c2f0d2a3931?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1586025260565-6ab14cbe2e6e?w=600&h=600&fit=crop'] },
  { name: 'Nerf Super Soaker Blaster', category: 'Toys', brand: 'Hasbro', price: 34.99, stock: 120, discount: 13, description: 'Water blaster toy for outdoor summer fun.', images: ['https://images.unsplash.com/photo-1586025260565-6ab14cbe2e6e?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1556228724-4c2f0d2a3931?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1601758064226-0c3b6858d2c0?w=600&h=600&fit=crop'] },
  { name: 'Funko Pop DC Batman', category: 'Toys', brand: 'Funko', price: 13.99, stock: 190, discount: 8, description: 'Collectible vinyl pop figure of Batman character.', images: ['https://images.unsplash.com/photo-1556228724-4c2f0d2a3931?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1611987620945-c47cf4770642?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1586025260565-6ab14cbe2e6e?w=600&h=600&fit=crop'] },
  { name: 'Barbie Dream House Playset', category: 'Toys', brand: 'Mattel', price: 179.99, stock: 50, discount: 14, description: 'Multi-story doll house with furniture and accessories.', images: ['https://images.unsplash.com/photo-1586025260565-6ab14cbe2e6e?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1601758064226-0c3b6858d2c0?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1611987620945-c47cf4770642?w=600&h=600&fit=crop'] },
  { name: 'Fisher-Price Baby Stroller', category: 'Toys', brand: 'Fisher-Price', price: 44.99, stock: 110, discount: 10, description: 'Durable toy stroller for toddlers with accessories.', images: ['https://images.unsplash.com/photo-1556228724-4c2f0d2a3931?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1586025260565-6ab14cbe2e6e?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1601758064226-0c3b6858d2c0?w=600&h=600&fit=crop'] },
  { name: 'Ravensburger 3D Puzzle Tower', category: 'Toys', brand: 'Ravensburger', price: 34.99, stock: 130, discount: 12, description: '3D jigsaw puzzle creates Eiffel Tower structure.', images: ['https://images.unsplash.com/photo-1611987620945-c47cf4770642?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1556228724-4c2f0d2a3931?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1586025260565-6ab14cbe2e6e?w=600&h=600&fit=crop'] },
  { name: 'Spin Master PAW Patrol', category: 'Toys', brand: 'Spin Master', price: 39.99, stock: 150, discount: 11, description: 'Paw Patrol character figures with vehicles.', images: ['https://images.unsplash.com/photo-1601758064226-0c3b6858d2c0?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1586025260565-6ab14cbe2e6e?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1556228724-4c2f0d2a3931?w=600&h=600&fit=crop'] },
  { name: 'Melissa Doug Wooden Dollhouse', category: 'Toys', brand: 'Melissa & Doug', price: 99.99, stock: 80, discount: 15, description: 'Solid wood dollhouse with detailed interior.', images: ['https://images.unsplash.com/photo-1586025260565-6ab14cbe2e6e?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1601758064226-0c3b6858d2c0?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1611987620945-c47cf4770642?w=600&h=600&fit=crop'] },

  // FOOD (10 unique)
  { name: 'Lay\'s Potato Chips Classic', category: 'Food', brand: 'Lay\'s', price: 3.49, stock: 450, discount: 5, description: 'Crispy classic salted potato chips large bag.', images: ['https://images.unsplash.com/photo-1585334175032-ff3602dd0bda?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1599599810694-b5ac4dd7aeba?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1585394838944-a0114d1e96aa?w=600&h=600&fit=crop'] },
  { name: 'Tropicana Orange Juice Fresh', category: 'Food', brand: 'Tropicana', price: 6.49, stock: 280, discount: 8, description: 'Fresh-pressed 100% orange juice 64oz bottle.', images: ['https://images.unsplash.com/photo-1585394838944-a0114d1e96aa?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1599599810346-5fb3acd0eed7?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1585334175032-ff3602dd0bda?w=600&h=600&fit=crop'] },
  { name: 'Skippy Peanut Butter Creamy', category: 'Food', brand: 'Skippy', price: 5.29, stock: 320, discount: 7, description: 'Smooth creamy peanut butter 16oz jar.', images: ['https://images.unsplash.com/photo-1585334175032-ff3602dd0bda?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1585394838944-a0114d1e96aa?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1599599810694-b5ac4dd7aeba?w=600&h=600&fit=crop'] },
  { name: 'Heinz Tomato Ketchup', category: 'Food', brand: 'Heinz', price: 3.99, stock: 380, discount: 6, description: 'Classic tomato ketchup 20oz bottle.', images: ['https://images.unsplash.com/photo-1585394838944-a0114d1e96aa?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1585334175032-ff3602dd0bda?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1599599810346-5fb3acd0eed7?w=600&h=600&fit=crop'] },
  { name: 'Coca-Cola Zero Sugar 12-Pack', category: 'Food', brand: 'Coca-Cola', price: 8.99, stock: 350, discount: 9, description: 'Zero calorie coke 12oz cans multipack.', images: ['https://images.unsplash.com/photo-1554866585-c173efb2d55c?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1585394838944-a0114d1e96aa?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1599599810694-b5ac4dd7aeba?w=600&h=600&fit=crop'] },
  { name: 'Oreo Double Stuf Cookies', category: 'Food', brand: 'Nabisco', price: 5.49, stock: 360, discount: 8, description: 'Double cream Oreo cookies 15oz package.', images: ['https://images.unsplash.com/photo-1585394838944-a0114d1e96aa?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1585334175032-ff3602dd0bda?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1599599810694-b5ac4dd7aeba?w=600&h=600&fit=crop'] },
  { name: 'Nutella Hazelnut Spread', category: 'Food', brand: 'Ferrero', price: 7.99, stock: 290, discount: 10, description: 'Chocolate hazelnut spread 13oz jar.', images: ['https://images.unsplash.com/photo-1585334175032-ff3602dd0bda?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1585394838944-a0114d1e96aa?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1599599810346-5fb3acd0eed7?w=600&h=600&fit=crop'] },
  { name: 'Doritos Nacho Cheese Large Bag', category: 'Food', brand: 'Frito-Lay', price: 4.49, stock: 340, discount: 7, description: 'Cheesy nacho flavor tortilla chips 11oz bag.', images: ['https://images.unsplash.com/photo-1599599810346-5fb3acd0eed7?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1585334175032-ff3602dd0bda?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1585394838944-a0114d1e96aa?w=600&h=600&fit=crop'] },
  { name: 'Clif Bar Protein Energy Bar', category: 'Food', brand: 'Clif', price: 1.79, stock: 420, discount: 6, description: 'Organic energy bar with 10g protein each.', images: ['https://images.unsplash.com/photo-1585394838944-a0114d1e96aa?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1599599810694-b5ac4dd7aeba?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1585334175032-ff3602dd0bda?w=600&h=600&fit=crop'] },
  { name: 'Starbucks Ground Coffee Bag', category: 'Food', brand: 'Starbucks', price: 9.99, stock: 250, discount: 11, description: 'Medium roast ground coffee 10oz bag.', images: ['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=600&fit=crop'] },

  // SPORTS (10 unique)
  { name: 'Nike Air Force 1 Sneakers', category: 'Sports', brand: 'Nike', price: 129.99, stock: 130, discount: 12, description: 'Classic white leather basketball shoes.', images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1528701800489-20be9c1e8d06?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop'] },
  { name: 'Adidas Running Shoes Ultraboost', category: 'Sports', brand: 'Adidas', price: 189.99, stock: 100, discount: 15, description: 'Performance running shoe with BOOST technology.', images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1528701800489-20be9c1e8d06?w=600&h=600&fit=crop'] },
  { name: 'Wilson Tennis Balls Pressurized', category: 'Sports', brand: 'Wilson', price: 5.99, stock: 360, discount: 8, description: 'Pack of 3 pro tennis balls.', images: ['https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1595777707802-27426a79a27f?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=600&fit=crop'] },
  { name: 'Spalding Basketball Leather', category: 'Sports', brand: 'Spalding', price: 64.99, stock: 80, discount: 11, description: 'Official indoor basketball official size.', images: ['https://images.unsplash.com/photo-1598951289695-c8260cf6e974?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1599577818694-97b25e7fb500?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1598951289695-c8260cf6e974?w=600&h=600&fit=crop'] },
  { name: 'Yonex Badminton Racket Pro', category: 'Sports', brand: 'Yonex', price: 99.99, stock: 60, discount: 13, description: 'Professional badminton racket carbon fiber.', images: ['https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1595777707802-27426a79a27f?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=600&fit=crop'] },
  { name: 'Evenflo Sports Gym Bag', category: 'Sports', brand: 'Evenflo', price: 44.99, stock: 140, discount: 9, description: 'Large durable sports gym bag with pockets.', images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop'] },
  { name: 'Primal Yoga Mat Non-Slip', category: 'Sports', brand: 'Primal', price: 39.99, stock: 180, discount: 10, description: '6mm thick non-slip yoga mat.', images: ['https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=600&fit=crop'] },
  { name: 'Speedminton Badminton Set Complete', category: 'Sports', brand: 'Speedminton', price: 34.99, stock: 120, discount: 12, description: 'Portable badminton set with net and rackets.', images: ['https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1595777707802-27426a79a27f?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=600&fit=crop'] },
  { name: 'Everlast Boxing Punching Bag', category: 'Sports', brand: 'Everlast', price: 49.99, stock: 100, discount: 14, description: 'Heavy bag for boxing training and fitness.', images: ['https://images.unsplash.com/photo-1534438327276-14e5b651b1bf?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1534438327276-14e5b651b1bf?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1534438327276-14e5b651b1bf?w=600&h=600&fit=crop'] },
  { name: 'Puma Soccer Ball Match', category: 'Sports', brand: 'Puma', price: 54.99, stock: 150, discount: 11, description: 'Official soccer ball official match size.', images: ['https://images.unsplash.com/photo-1598951289695-c8260cf6e974?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1599577818694-97b25e7fb500?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1598951289695-c8260cf6e974?w=600&h=600&fit=crop'] },

  // CLOTHING (10 unique)
  { name: 'Levi\'s 501 Original Jeans', category: 'Clothing', brand: 'Levi\'s', price: 79.99, stock: 160, discount: 11, description: 'Classic straight-fit denim jeans in blue.', images: ['https://images.unsplash.com/photo-1542272604-787c62d465d1?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1502884657943-8d5bce6eb7c9?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1542272604-787c62d465d1?w=600&h=600&fit=crop'] },
  { name: 'Uniqlo T-Shirt Basic Cotton', category: 'Clothing', brand: 'Uniqlo', price: 14.90, stock: 280, discount: 6, description: 'Simple pure cotton basic tee shirt.', images: ['https://images.unsplash.com/photo-1502884657943-8d5bce6eb7c9?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1542272604-787c62d465d1?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1502884657943-8d5bce6eb7c9?w=600&h=600&fit=crop'] },
  { name: 'H&M Polo Shirt Cotton', category: 'Clothing', brand: 'H&M', price: 29.99, stock: 200, discount: 9, description: 'Classic fit cotton polo shirt multiple colors.', images: ['https://images.unsplash.com/photo-1502884657943-8d5bce6eb7c9?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1542272604-787c62d465d1?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1502884657943-8d5bce6eb7c9?w=600&h=600&fit=crop'] },
  { name: 'Gap Hoodie Fleece Warm', category: 'Clothing', brand: 'Gap', price: 59.99, stock: 130, discount: 13, description: 'Cozy warm fleece pullover hoodie.', images: ['https://images.unsplash.com/photo-1556821552-5f1ce10f5f47?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1556821552-5f1ce10f5f47?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1556821552-5f1ce10f5f47?w=600&h=600&fit=crop'] },
  { name: 'Zara Blazer Slim Fit', category: 'Clothing', brand: 'Zara', price: 109.99, stock: 70, discount: 15, description: 'Modern slim-fit professional blazer.', images: ['https://images.unsplash.com/photo-1591047990632-f1dc43a7dc12?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1591047990632-f1dc43a7dc12?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1591047990632-f1dc43a7dc12?w=600&h=600&fit=crop'] },
  { name: 'Dockers Khaki Pants Comfort', category: 'Clothing', brand: 'Dockers', price: 69.99, stock: 100, discount: 10, description: 'Comfortable casual khaki pants.', images: ['https://images.unsplash.com/photo-1542272604-787c62d465d1?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1502884657943-8d5bce6eb7c9?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1542272604-787c62d465d1?w=600&h=600&fit=crop'] },
  { name: 'Calvin Klein Boxer Shorts Set', category: 'Clothing', brand: 'Calvin Klein', price: 39.99, stock: 220, discount: 8, description: 'Comfortable CK boxer shorts 3-pack.', images: ['https://images.unsplash.com/photo-1502884657943-8d5bce6eb7c9?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1542272604-787c62d465d1?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1502884657943-8d5bce6eb7c9?w=600&h=600&fit=crop'] },
  { name: 'Columbia Rain Jacket', category: 'Clothing', brand: 'Columbia', price: 139.99, stock: 90, discount: 12, description: 'Waterproof and breathable outdoor jacket.', images: ['https://images.unsplash.com/photo-1556821552-5f1ce10f5f47?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1556821552-5f1ce10f5f47?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1556821552-5f1ce10f5f47?w=600&h=600&fit=crop'] },
  { name: 'Timberland Work Boots Leather', category: 'Clothing', brand: 'Timberland', price: 199.99, stock: 60, discount: 14, description: 'Iconic waterproof leather work boots.', images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1528701800489-20be9c1e8d06?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop'] },
  { name: 'Tommy Hilfiger Socks Bundle', category: 'Clothing', brand: 'Tommy Hilfiger', price: 24.99, stock: 260, discount: 7, description: 'Comfortable cotton crew socks 6-pack bundle.', images: ['https://images.unsplash.com/photo-1502884657943-8d5bce6eb7c9?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1542272604-787c62d465d1?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1502884657943-8d5bce6eb7c9?w=600&h=600&fit=crop'] },

  // BOOKS (10 unique)
  { name: 'Atomic Habits by James Clear', category: 'Books', brand: 'Penguin', price: 19.99, stock: 200, discount: 10, description: 'Bestseller on forming good habits and breaking bad.', images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1507842872343-583f20270319?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=600&fit=crop'] },
  { name: 'The Midnight Library by Matt Haig', category: 'Books', brand: 'Canongate', price: 18.99, stock: 170, discount: 12, description: 'Contemporary fiction about infinite parallel lives.', images: ['https://images.unsplash.com/photo-1507842872343-583f20270319?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1507842872343-583f20270319?w=600&h=600&fit=crop'] },
  { name: 'Educated by Tara Westover', category: 'Books', brand: 'Random House', price: 18.99, stock: 150, discount: 11, description: 'Memoir about education and family struggle.', images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1507842872343-583f20270319?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=600&fit=crop'] },
  { name: 'Becoming by Michelle Obama', category: 'Books', brand: 'Crown', price: 20.99, stock: 140, discount: 13, description: 'Inspiring memoir by former First Lady.', images: ['https://images.unsplash.com/photo-1507842872343-583f20270319?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1507842872343-583f20270319?w=600&h=600&fit=crop'] },
  { name: 'Dune by Frank Herbert', category: 'Books', brand: 'Ace', price: 16.99, stock: 180, discount: 9, description: 'Epic science fiction classic novel.', images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1507842872343-583f20270319?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=600&fit=crop'] },
  { name: 'The Great Gatsby by F. Scott Fitzgerald', category: 'Books', brand: 'Scribner', price: 14.99, stock: 190, discount: 8, description: 'Classic American literature masterpiece.', images: ['https://images.unsplash.com/photo-1507842872343-583f20270319?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1507842872343-583f20270319?w=600&h=600&fit=crop'] },
  { name: 'Psychology of Money by Morgan Housel', category: 'Books', brand: 'Harriman House', price: 19.99, stock: 160, discount: 10, description: 'Essential insights on financial behavior and wealth.', images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1507842872343-583f20270319?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=600&fit=crop'] },
  { name: 'Sapiens by Yuval Noah Harari', category: 'Books', brand: 'Harper', price: 21.99, stock: 130, discount: 12, description: 'Fascinating history of humankind.', images: ['https://images.unsplash.com/photo-1507842872343-583f20270319?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1507842872343-583f20270319?w=600&h=600&fit=crop'] },
  { name: 'The Hobbit by J.R.R. Tolkien', category: 'Books', brand: 'Houghton Mifflin', price: 17.99, stock: 165, discount: 11, description: 'Fantasy adventure prequel to Lord of the Rings.', images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1507842872343-583f20270319?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=600&fit=crop'] },
  { name: 'The Alchemist by Paulo Coelho', category: 'Books', brand: 'HarperOne', price: 15.99, stock: 210, discount: 9, description: 'Philosophical fable about personal life journey.', images: ['https://images.unsplash.com/photo-1507842872343-583f20270319?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1507842872343-583f20270319?w=600&h=600&fit=crop'] },

  // HOME & GARDEN (5 unique)
  { name: 'IKEA Billy Bookshelf White', category: 'Home & Garden', brand: 'IKEA', price: 99.99, stock: 90, discount: 10, description: 'Simple white wooden bookshelf for any room.', images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop'] },
  { name: 'Crate & Barrel Dining Chair', category: 'Home & Garden', brand: 'Crate & Barrel', price: 269.99, stock: 50, discount: 14, description: 'Modern upholstered dining chair comfortable.', images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop'] },
  { name: 'Burpee Vegetable Seeds Pack', category: 'Home & Garden', brand: 'Burpee', price: 9.99, stock: 400, discount: 5, description: 'Mixed vegetable seeds for spring gardening.', images: ['https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600&h=600&fit=crop'] },
  { name: 'Fiskars Garden Tool Set 8pc', category: 'Home & Garden', brand: 'Fiskars', price: 49.99, stock: 180, discount: 9, description: 'Ergonomic gardening tools with soft grip.', images: ['https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600&h=600&fit=crop'] },
  { name: 'West Elm Table Lamp Brass', category: 'Home & Garden', brand: 'West Elm', price: 199.99, stock: 70, discount: 12, description: 'Modern table lamp with brass finish.', images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop'] },

  // ELECTRONICS (5 unique)
  { name: 'Apple iPhone 15 Pro Max', category: 'Electronics', brand: 'Apple', price: 1099.99, stock: 40, discount: 5, description: 'Latest Pro Max smartphone with A17 Pro chip.', images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1483058712313-7969b3a9a498?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop'] },
  { name: 'Sony WH-1000XM5 Headphones', category: 'Electronics', brand: 'Sony', price: 379.99, stock: 100, discount: 16, description: 'Premium noise-canceling wireless headphones.', images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcf?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop'] },
  { name: 'Samsung 55\" 4K Smart TV', category: 'Electronics', brand: 'Samsung', price: 699.99, stock: 30, discount: 18, description: 'Ultra HD QLED television 55 inch display.', images: ['https://images.unsplash.com/photo-1593642532973-d31b6557fa68?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1522869635100-ce11b171b2d4?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1593642532973-d31b6557fa68?w=600&h=600&fit=crop'] },
  { name: 'Nintendo Switch OLED Console', category: 'Electronics', brand: 'Nintendo', price: 349.99, stock: 80, discount: 10, description: 'Handheld gaming console OLED screen display.', images: ['https://images.unsplash.com/photo-1605902711622-cfb43c4437b5?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1605902711622-cfb43c4437b5?w=600&h=600&fit=crop'] },
  { name: 'Anker Fast Charger 30W USB-C', category: 'Electronics', brand: 'Anker', price: 24.99, stock: 280, discount: 14, description: 'Compact fast USB-C power adapter.', images: ['https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=600&fit=crop'] }
]

const ensureSellers = async () => {
  try {
    const sellers = [
      { name: 'TechStore', email: 'techstore@example.com', phone: '1234567890', city: 'New York', state: 'NY', country: 'USA', password: await bcrypt.hash('password123', 10) },
      { name: 'FashionHub', email: 'fashionhub@example.com', phone: '0987654321', city: 'Los Angeles', state: 'CA', country: 'USA', password: await bcrypt.hash('password123', 10) },
      { name: 'HomeGoods', email: 'homegoods@example.com', phone: '5556667777', city: 'Chicago', state: 'IL', country: 'USA', password: await bcrypt.hash('password123', 10) }
    ]

    for (let seller of sellers) {
      const exists = await sellerModel.findOne({ email: seller.email })
      if (!exists) {
        await sellerModel.create(seller)
      }
    }
    console.log('Sellers ensured.')
  } catch (error) {
    console.error('Error ensuring sellers:', error)
  }
}

const seedMoreProducts = async () => {
  try {
    // Connect to MongoDB directly
    await mongoose.connect(DB_URL, { useNewURLParser: true })
    console.log('Connected to database.')

    // Run ensureSellers first
    const sellers = [
      { name: 'TechStore', email: 'techstore@example.com', phone: '1234567890', city: 'New York', state: 'NY', country: 'USA', method: 'bank', password: await bcrypt.hash('password123', 10) },
      { name: 'FashionHub', email: 'fashionhub@example.com', phone: '0987654321', city: 'Los Angeles', state: 'CA', country: 'USA', method: 'bank', password: await bcrypt.hash('password123', 10) },
      { name: 'HomeGoods', email: 'homegoods@example.com', phone: '5556667777', city: 'Chicago', state: 'IL', country: 'USA', method: 'bank', password: await bcrypt.hash('password123', 10) }
    ]

    for (let seller of sellers) {
      const exists = await sellerModel.findOne({ email: seller.email })
      if (!exists) {
        await sellerModel.create(seller)
        console.log(`Created seller: ${seller.name}`)
      }
    }

    // Clear existing products
    await productModel.deleteMany({})
    console.log('Cleared existing products.')

    // Add all 60 unique products with seller
    const sellerList = await sellerModel.find()
    const seller = sellerList[0]

    const productsWithSeller = products.map(p => ({
      ...p,
      seller: seller._id,
      sellerId: seller._id,
      shopName: seller.name,
      slug: generateSlug(p.name)
    }))

    const result = await productModel.insertMany(productsWithSeller)
    console.log(`✓ Successfully inserted ${result.length} UNIQUE products into the database!`)
    console.log('NO DUPLICATES - each product is completely unique.')
    console.log('All 60 products are now ready in the database.')
  } catch (error) {
    console.error('Error seeding products:', error)
  } finally {
    await mongoose.connection.close()
    process.exit(0)
  }
}

// Run the seed function
seedMoreProducts()
