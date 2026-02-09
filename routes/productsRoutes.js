const router = require('express').Router();
const homeControllers = require('../controllers/home/homeControllers');

router.get('/products/search', homeControllers.search_products);

module.exports = router;
