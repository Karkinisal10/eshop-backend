const express = require('express');
const router = express.Router();
const { 
    getProductRecommendations, 
    getPopularProducts,
    getProductsByCategory 
} = require('../controllers/chatbot/chatbotController');

// POST /api/chatbot/chat - Get product recommendations based on query
router.post('/chat', getProductRecommendations);

// GET /api/chatbot/popular - Get popular products
router.get('/popular', getPopularProducts);

// POST /api/chatbot/category - Get products by category
router.post('/category', getProductsByCategory);

module.exports = router;
