const homeControllers = require('../../controllers/home/homeControllers') 
const { authMiddleware } = require('../../middlewares/authMiddleware')
const router = require('express').Router()

router.get('/get-categorys',homeControllers.get_categorys)
router.get('/get-products',homeControllers.get_products)
router.get('/price-range-latest-product',homeControllers.price_range_product)
router.get('/query-products',homeControllers.query_products)
router.get('/product-details/:slug',homeControllers.product_details)

router.get('/seller-products/:sellerId',homeControllers.get_seller_products)

router.post('/customer/submit-review',homeControllers.submit_review)
router.get('/customer/get-reviews/:productId',homeControllers.get_reviews)
router.post('/customer/can-review/:productId',homeControllers.can_review)
  

module.exports = router 