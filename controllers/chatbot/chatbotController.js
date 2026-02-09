const productModel = require('../../models/productModel');
const categoryModel = require('../../models/categoryModel');
const customerOrderModel = require('../../models/customerOrder');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Extract product-related keywords from query
const extractProductKeywords = (query) => {
    const lowercaseQuery = query.toLowerCase();
    const commonWords = ['can', 'you', 'give', 'me', 'i', 'want', 'need', 'looking', 'for', 'find', 'search', 'recommend', 'the', 'a', 'an', 'and', 'or', 'is', 'are', 'show', 'me', 'some', 'do', 'you', 'have', 'any'];
    const keywords = lowercaseQuery
        .split(/\s+/)
        .filter(word => !commonWords.includes(word) && word.length > 2);
    
    return keywords;
};

const extractOrderId = (query) => {
    if (!query) {
        return null;
    }
    const match = query.match(/[a-f0-9]{24}/i);
    return match ? match[0] : null;
};

// Use Gemini to determine user intent
const getUserIntent = async (query) => {
    try {
        const chatPatterns = ['hello', 'hi', 'hey', 'thanks', 'thank you', 'how are you', 'good morning', 'good afternoon', 'good evening', 'ok', 'okay', 'cool', 'nice', 'great'];
        const lowerQuery = query.toLowerCase().trim();

        // Fast-path greetings to avoid pointless searches
        if (chatPatterns.some(pattern => lowerQuery === pattern || lowerQuery.startsWith(pattern + ' ') || lowerQuery.endsWith(' ' + pattern))) {
            return { intent: 'chat' };
        }

        const intentPrompt = `You are an AI that classifies a user's message for an e-commerce chat assistant. Return ONLY valid JSON.

User message: "${query}"

Decide intent:
- "search" with searchTerm if asking for a specific product/type ("earbuds", "blue shirt", "iphone 14", "winter jacket").
- "categories" if they want to browse products generally ("show me products", "what do you have", "browse", "any products").
- "order" if they ask about order status, tracking, delivery, return, refund.
- "chat" for greetings or general conversation.

Respond with ONE of:
{"intent":"search","searchTerm":"earbuds"}
{"intent":"categories"}
{"intent":"order"}
{"intent":"chat"}`;

        const intentResult = await model.generateContent(intentPrompt);
        const intentText = intentResult.response.text().trim();
        const intent = JSON.parse(intentText);
        return intent;
    } catch (error) {
        console.error('Error determining intent:', error);
        return { intent: 'chat' };
    }
};

// Build a compact summary for Gemini without leaking extra info
const buildProductSummary = (products) => products.map((p, idx) => {
    const pricePart = typeof p.price === 'number' ? `NPR ${p.price}` : 'price N/A';
    const discountPart = p.discount ? ` (discount ${p.discount}%)` : '';
    return `${idx + 1}. ${p.name} | ${pricePart}${discountPart}`;
}).join('\n');

// Get product recommendations using Gemini AI
const getProductRecommendations = async (req, res) => {
    try {
        const { query, orderId: orderIdFromBody, mode } = req.body;

        if (!query || query.trim().length === 0) {
            return res.status(200).json({
                success: true,
                message: "Hey there! 👋 How can I help you today?",
                products: [],
                categories: [],
                isGreeting: true
            });
        }

        if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is not set');
            return res.status(500).json({
                success: false,
                message: 'Chatbot service is not configured. Please contact support.'
            });
        }

        const userIntent = mode === 'search' ? { intent: 'search', searchTerm: query } : await getUserIntent(query);

        // Order intent
        if (userIntent.intent === 'order') {
            const orderId = orderIdFromBody || userIntent.orderId || extractOrderId(query);
            if (!orderId) {
                return res.status(200).json({
                    success: true,
                    message: "Sure! Please share your 24-character order ID (example: 65f1c2a7b9d2e1f0a3b4c5d6) so I can check the status.",
                    products: [],
                    categories: [],
                    hasProducts: false,
                    hasCategories: false
                });
            }

            const order = await customerOrderModel.findById(orderId).select('delivery_status payment_status date price');
            if (!order) {
                return res.status(200).json({
                    success: true,
                    message: "I couldn’t find that order ID. Please double-check it and try again.",
                    products: [],
                    categories: [],
                    hasProducts: false,
                    hasCategories: false
                });
            }

            let orderMessage;
            try {
                const prompt = `You are talki, a friendly shopping assistant. Respond in 1-2 sentences, be helpful, and end with a question. Use only this order data and don't invent details.

Order ID: ${orderId}
Payment status: ${order.payment_status}
Delivery status: ${order.delivery_status}
Order date: ${order.date}
Total: NPR ${order.price}
`;
                const geminiResult = await model.generateContent(prompt);
                orderMessage = geminiResult.response.text();
            } catch (geminiError) {
                console.error('Gemini API Error:', geminiError);
                orderMessage = `Your order ${orderId} is ${order.delivery_status} and payment is ${order.payment_status}. Do you want help with anything else?`;
            }

            return res.status(200).json({
                success: true,
                message: orderMessage,
                products: [],
                categories: [],
                hasProducts: false,
                hasCategories: false
            });
        }

        // Product search intent
        if (userIntent.intent === 'search') {
            const searchTerm = userIntent.searchTerm || query;

            // Search MongoDB first (no hallucinations)
            const keywords = extractProductKeywords(searchTerm);
            let products = [];

            if (keywords.length > 0) {
                products = await productModel.find({
                    $or: [
                        { name: { $regex: keywords.join('|'), $options: 'i' } },
                        { category: { $regex: keywords.join('|'), $options: 'i' } },
                        { description: { $regex: keywords.join('|'), $options: 'i' } }
                    ]
                }).limit(6).select('name price discount images rating category slug');
            }

            if (products.length === 0) {
                products = await productModel.find({
                    $or: [
                        { name: { $regex: searchTerm, $options: 'i' } },
                        { category: { $regex: searchTerm, $options: 'i' } }
                    ]
                }).limit(6).select('name price discount images rating category slug');
            }

            let geminiResponse;
            try {
                const productSummary = buildProductSummary(products);
                const prompt = `You are talki, a friendly shopping assistant. Create a smart product suggestion in 1-2 sentences, friendly and concise, and end with a question. Mention up to 3 product names if available. Use ONLY the provided products and do NOT invent details, prices, or features.

User query: "${searchTerm}"
Products:
${productSummary || 'None found'}

If no products, apologize briefly and suggest browsing categories.`;
                const geminiResult = await model.generateContent(prompt);
                geminiResponse = geminiResult.response.text();
            } catch (geminiError) {
                console.error('Gemini API Error:', geminiError);
                geminiResponse = products.length > 0
                    ? `Gotcha! I found ${products.length} option(s). Want me to show more or add one to your cart?`
                    : `Sorry, I couldn't find matches for that. Want to try another term or browse categories?`;
            }

            return res.status(200).json({
                success: true,
                message: geminiResponse,
                products,
                categories: [],
                hasProducts: products.length > 0,
                hasCategories: false
            });
        }

        // Browse categories intent
        if (userIntent.intent === 'categories') {
            let geminiResponse;
            try {
                const prompt = `You are talki. User wants to browse. Be friendly, 1 sentence, casual, end with a question. Suggest picking a category. Avoid making up items.`;
                const geminiResult = await model.generateContent(prompt);
                geminiResponse = geminiResult.response.text();
            } catch (geminiError) {
                console.error('Gemini API Error:', geminiError);
                geminiResponse = 'Great! Pick a category and I will show you options. Which one should we start with?';
            }

            const categories = await categoryModel.find().select('name slug image').limit(8);

            return res.status(200).json({
                success: true,
                message: geminiResponse,
                categories,
                products: [],
                hasCategories: categories.length > 0,
                hasProducts: false
            });
        }

        // Default: casual chat
        let geminiResponse;
        try {
            const prompt = `You are talki, a friendly human-like shopping assistant. Keep it short (1-2 sentences), casual, empathetic, and end with a question. Offer help with shopping if natural.`;
            const geminiResult = await model.generateContent(prompt + `\nUser: "${query}"`);
            geminiResponse = geminiResult.response.text();
        } catch (geminiError) {
            console.error('Gemini API Error:', geminiError);
            geminiResponse = "No worries! I'm here to help with shopping. What are you looking for today?";
        }

        return res.status(200).json({
            success: true,
            message: geminiResponse,
            products: [],
            categories: [],
            hasProducts: false,
            hasCategories: false
        });

    } catch (error) {
        console.error('Chatbot error details:', error.message || error);
        return res.status(500).json({
            success: false,
            message: 'Sorry, I encountered an error. Please try again in a moment.'
        });
    }
};

// Get popular products for suggestions
const getPopularProducts = async (req, res) => {
    try {
        const products = await productModel
            .find()
            .sort({ rating: -1 })
            .limit(6)
            .select('name price discount images rating category slug');

        return res.status(200).json({
            success: true,
            products
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching popular products'
        });
    }
};

// Get products by category slug (when user selects a category)
const getProductsByCategory = async (req, res) => {
    try {
        const { categorySlug } = req.body;

        if (!categorySlug) {
            return res.status(400).json({
                success: false,
                message: 'Category is required'
            });
        }

        // Find category by slug
        const category = await categoryModel.findOne({ slug: categorySlug });
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Find products by category name
        const products = await productModel
            .find({ category: category.name })
            .limit(6)
            .select('name price discount images rating category slug');

        const message = products.length > 0
            ? `Great! I found ${products.length} products in ${category.name}. Would you like to view more or add any to your cart?`
            : `Sorry, no products found in ${category.name} category right now.`;

        return res.status(200).json({
            success: true,
            message,
            products,
            hasProducts: products.length > 0
        });

    } catch (error) {
        console.error('Error fetching products:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching products'
        });
    }
};

module.exports = {
    getProductRecommendations,
    getPopularProducts,
    getProductsByCategory
};
