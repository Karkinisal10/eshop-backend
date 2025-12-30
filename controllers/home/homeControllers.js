const categoryModel = require('../../models/categoryModel')
const productModel = require('../../models/productModel')
const reviewModel = require('../../models/reviewModel')
const customerOrderModel = require('../../models/customerOrder')
const authOrderModel = require('../../models/authOrder')
const sellerModel = require('../../models/sellerModel')
const { responseReturn } = require("../../utiles/response")
const queryProducts = require('../../utiles/queryProducts')
const recommendationEngine = require('../../utiles/recommendationEngine')
const moment = require('moment')
const { mongo: {ObjectId}} = require('mongoose')

class homeControllers{

    // Helper method to get active seller IDs
    getActiveSellerIds = async () => {
        const activeSellers = await sellerModel.find({ status: 'active' }).select('_id')
        return activeSellers.map(seller => seller._id)
    }

    formateProduct = (products) => {
        const productArray = [];
        let i = 0;
        while (i < products.length ) {
            let temp = []
            let j = i
            while (j < i + 3) {
                if (products[j]) {
                    temp.push(products[j])
                }
                j++
            }
            productArray.push([...temp])
            i = j
        }
        return productArray
    }

    get_categorys = async(req,res) => {
        try {
            const categorys = await categoryModel.find({})
            responseReturn(res,200, {
                categorys
            })
            
        } catch (error) {
            console.log(error.message)
        }
    }
    // end method 

    get_products = async(req, res) => {
        try {
            // Get active seller IDs
            const activeSellerIds = await this.getActiveSellerIds()
            
            // Get all products for recommendation engine from active sellers only
            const allProducts = await productModel.find({ sellerId: { $in: activeSellerIds } })
            
            // Feature: keep recommendation for featured
            let featuredProducts = recommendationEngine.getRecommendedProducts(
                allProducts,
                'featured',
                12
            )
            if (!featuredProducts || featuredProducts.length === 0) {
                featuredProducts = [...allProducts].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0,12)
            }

            // Ensure sections adhere to clear rules and avoid duplicates where possible
            const usedIds = new Set(featuredProducts.map(p => p._id.toString()))
            const takeWithFallback = (list, count) => {
                const out = []
                const localSeen = new Set()
                for (const p of list) {
                    const id = p._id?.toString?.() || String(p._id)
                    if (!usedIds.has(id) && !localSeen.has(id)) {
                        out.push(p)
                        localSeen.add(id)
                        usedIds.add(id)
                        if (out.length >= count) break
                    }
                }
                if (out.length < count) {
                    for (const p of list) {
                        const id = p._id?.toString?.() || String(p._id)
                        if (!localSeen.has(id)) {
                            out.push(p)
                            localSeen.add(id)
                            if (out.length >= count) break
                        }
                    }
                }
                if (out.length < count) {
                    for (const p of allProducts) {
                        const id = p._id?.toString?.() || String(p._id)
                        if (!localSeen.has(id)) {
                            out.push(p)
                            localSeen.add(id)
                            if (out.length >= count) break
                        }
                    }
                }
                return out
            }

            // Latest: newest by createdAt
            const latestPool = [...allProducts].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
            const latestProducts = takeWithFallback(latestPool, 9)

            // Top Rated: highest rating
            const ratingPool = [...allProducts]
                .filter(p => typeof p.rating === 'number')
                .sort((a,b) => (b.rating || 0) - (a.rating || 0))
            const topRatedProducts = takeWithFallback(ratingPool, 9)

            // Discount: highest discount, tie-breaker newest
            const discountPool = [...allProducts]
                .filter(p => (p.discount || 0) > 0)
                .sort((a,b) => {
                    const d = (b.discount || 0) - (a.discount || 0)
                    if (d !== 0) return d
                    return new Date(b.createdAt) - new Date(a.createdAt)
                })
            const bestDealsProducts = takeWithFallback(discountPool, 9)

            responseReturn(res, 200,{
                products: featuredProducts,
                latest_product: this.formateProduct(latestProducts),
                topRated_product: this.formateProduct(topRatedProducts),
                discount_product: this.formateProduct(bestDealsProducts)
            })
            
        } catch (error) {
            console.log(error.message)
        }
    }
   // end method 

   price_range_product = async (req, res) => {
    try {
        // Get active seller IDs
        const activeSellerIds = await this.getActiveSellerIds()
        
        const priceRange = {
            low: 0,
            high: 100,
        }
        const products = await productModel.find({ sellerId: { $in: activeSellerIds } }).limit(9).sort({
            createdAt: -1 // 1 for asc -1 is for Desc
        })
        const latest_product = this.formateProduct(products);
        const getForPrice = await productModel.find({ sellerId: { $in: activeSellerIds } }).sort({
            'price': 1
        })
        if (getForPrice.length > 0) {
            priceRange.low = getForPrice[0].price
            priceRange.high = getForPrice[getForPrice.length - 1].price
            // Ensure high is greater than low for the range slider
            if (priceRange.high === priceRange.low) {
                priceRange.high = priceRange.low + 100
            }
        }
        responseReturn(res, 200, {
            latest_product,
            priceRange
        })
        
    } catch (error) {
        console.log(error.message)
    }

   }

// end method 

query_products = async (req, res) => {
    const parPage = 12
    req.query.parPage = parPage

    try {
        // Get active seller IDs
        const activeSellerIds = await this.getActiveSellerIds()
        
        const products = await productModel.find({ sellerId: { $in: activeSellerIds } }).sort({
            createdAt: -1
        })
        const totalProduct = new queryProducts(products, req.query).categoryQuery().ratingQuery().searchQuery().priceQuery().sortByPrice().countProducts();

        const result = new queryProducts(products, req.query).categoryQuery().ratingQuery().priceQuery().searchQuery().sortByPrice().skip().limit().getProducts();
        
        responseReturn(res, 200, {
            products: result,
            totalProduct,
            parPage
        })

        
    } catch (error) {
        console.log(error.message)
    }
 
}
// end method 

product_details = async (req, res) => {
    const { slug } = req.params
    try {
        // Get active seller IDs
        const activeSellerIds = await this.getActiveSellerIds()
        
        const product = await productModel.findOne({ slug, sellerId: { $in: activeSellerIds } })
        
        if (!product) {
            return responseReturn(res, 404, { error: 'Product not found' })
        }

        // Increment view count
        await productModel.findByIdAndUpdate(product._id, {
            $inc: { views: 1 }
        })

        // Get all products for recommendation from active sellers only
        const allProducts = await productModel.find({ sellerId: { $in: activeSellerIds } })
        
        // Use content-based filtering for related products (same category)
        // Include the target product as the first item so the engine has a baseline
        const categoryProducts = allProducts.filter(
            p => p.category === product.category
        )

        // Build list with the current product to compute similarity, then exclude it from results
        const similarityPool = [product, ...categoryProducts.filter(p => p._id.toString() !== product._id.toString())]
        const relatedProducts = similarityPool.length > 1
            ? recommendationEngine
                .getSimilarProducts(product, similarityPool, 12)
                .filter(p => p._id.toString() !== product._id.toString())
            : []
        
        // Get more products from the same seller (already filtered by active seller)
        const moreProducts = await productModel.find({
            $and: [{
                _id: {
                    $ne: product.id
                }
            },
            {
                sellerId: {
                    $eq: product.sellerId
                }
            },
            {
                sellerId: {
                    $in: activeSellerIds
                }
            }
           ]
        }).limit(3)

        responseReturn(res, 200, {
            product,
            relatedProducts,
            moreProducts
        })

    } catch (error) {
        console.log(error.message)
    }
}
// end method 

get_seller_products = async (req, res) => {
    const { sellerId } = req.params;
    const { page = 1, parPage = 12 } = req.query;
    const skipPage = parseInt(parPage) * (parseInt(page) - 1);

    try {
        // Check if seller is active
        const seller = await sellerModel.findById(sellerId)
        if (!seller || seller.status !== 'active') {
            return responseReturn(res, 404, { error: 'Seller not found or inactive' })
        }
        
        const products = await productModel.find({ sellerId })
            .skip(skipPage)
            .limit(parseInt(parPage))
            .sort({ createdAt: -1 });

        const totalProducts = await productModel.countDocuments({ sellerId });
        
        let shopName = 'Shop';
        if (seller) {
            // First try to get from shopInfo, otherwise use seller name
            if (seller.shopInfo && seller.shopInfo.shopName) {
                shopName = seller.shopInfo.shopName;
            } else {
                shopName = seller.name;
            }
        } else if (products.length > 0 && products[0].shopName) {
            shopName = products[0].shopName;
        }

        responseReturn(res, 200, {
            products,
            totalProducts,
            sellerInfo: {
                shopName: shopName
            }
        });
    } catch (error) {
        console.log(error.message);
        responseReturn(res, 500, { error: 'Failed to fetch seller products' });
    }
}
// end method

submit_review = async (req, res) => {
     const {productId,rating,review,name, customerId, reviewId} = req.body

     try {
        console.log('DEBUG: submit_review - customerId:', customerId, 'productId:', productId, 'name:', name, 'reviewId:', reviewId)
        
        if (!customerId) {
            return responseReturn(res, 403, { message: 'Please login first' })
        }

        // If reviewId is provided, update existing review
        if (reviewId) {
            const existingReview = await reviewModel.findOne({ _id: reviewId, customerId: new ObjectId(customerId) })
            if (!existingReview) {
                return responseReturn(res, 403, { message: 'Review not found or not authorized' })
            }
            
            await reviewModel.findByIdAndUpdate(reviewId, {
                name,
                rating,
                review,
                date: moment(Date.now()).format('LL')
            })
            
            // Recalculate product rating
            let rat = 0;
            const reviews = await reviewModel.find({ productId: new ObjectId(productId) })
            for (let i = 0; i < reviews.length; i++) {
                rat = rat + reviews[i].rating 
            }
            let productRating = 0
            if (reviews.length !== 0) {
                productRating = (rat / reviews.length).toFixed(1)
            }
            await productModel.findByIdAndUpdate(productId, { rating: productRating })
            
            return responseReturn(res, 200, { message: "Review Updated Successfully" })
        }

        // Verify customer has purchased this product
        const orders = await customerOrderModel.find({
            customerId: new ObjectId(customerId),
            payment_status: 'paid'
        })
        
        let hasPurchased = false
        for (const order of orders) {
            if (order.products && Array.isArray(order.products)) {
                const found = order.products.some(item => String(item._id) === String(productId))
                if (found) {
                    hasPurchased = true
                    break
                }
            }
        }
        
        if (!hasPurchased) {
            return responseReturn(res, 403, { message: 'Only customers who purchased this product can leave a review' })
        }

        // Prevent duplicate review by same customer for same product
        const existing = await reviewModel.findOne({ productId: new ObjectId(productId), customerId: new ObjectId(customerId) })
        if (existing) {
            return responseReturn(res, 409, { message: 'You have already submitted a review for this product' })
        }

        // Get sellerId from product
        const prod = await productModel.findById(productId)
        const sellerId = prod?.sellerId

        await reviewModel.create({
            productId: new ObjectId(productId),
            customerId: new ObjectId(customerId),
            sellerId: new ObjectId(sellerId),
            name,
            rating,
            review,
            date: moment(Date.now()).format('LL')
        })

        let rat = 0;
        const reviews = await reviewModel.find({
            productId: new ObjectId(productId)
        })
        for (let i = 0; i < reviews.length; i++) {
            rat = rat + reviews[i].rating 
        }
        let productRating = 0
        if (reviews.length !== 0) {
            productRating = (rat / reviews.length).toFixed(1)
        }

        await productModel.findByIdAndUpdate(productId,{
            rating : productRating
        })
        responseReturn(res, 201, {
            message: "Review Added Successfully"
        })

        
     } catch (error) {
        console.log(error.message)
        responseReturn(res, 500, { message: 'Internal Server Error' })
     }
}
// end method 

get_reviews = async (req, res) => {
    const {productId} = req.params
    let {pageNo} = req.query 
    pageNo = parseInt(pageNo)
    const limit = 5
    const skipPage = limit * (pageNo - 1) 

    try {
        let getRating = await reviewModel.aggregate([{
            $match: {
                productId: {
                    $eq : new ObjectId(productId)
                },
                rating: {
                    $not: {
                        $size: 0
                    }
                }
            }
        },
        {
            $unwind: "$rating"
        },
        {
            $group: {
                _id: "$rating",
                count: {
                    $sum: 1
                }
            }
        } 
    ])
    let rating_review = [{
        rating: 5,
        sum : 0
    },
    {
        rating: 4,
        sum: 0
    },
    {
        rating: 3,
        sum: 0
    },
    {
        rating: 2,
        sum: 0
    },
    {
        rating: 1,
        sum: 0
    }
   ]
   for (let i = 0; i < rating_review.length; i++) {
        for (let j = 0; j < getRating.length; j++) {
            if (rating_review[i].rating === getRating[j]._id) {
                rating_review[i].sum = getRating[j].count
                break
            } 
        }  
   }

   const getAll = await reviewModel.find({
    productId: new ObjectId(productId)
   })
   const reviews = await reviewModel.find({
    productId: new ObjectId(productId)
   }).skip(skipPage).limit(limit).sort({createdAt: -1})

   responseReturn(res, 200, {
    reviews,
    totalReview: getAll.length,
    rating_review
   })
        
    } catch (error) {
        console.log(error.message)
    }
}
// end method

can_review = async (req, res) => {
    const { productId } = req.params
    const { customerId } = req.body
    
    try {
        if (!customerId) {
            return responseReturn(res, 200, { canReview: false })
        }

        // Check if already reviewed
        const existing = await reviewModel.findOne({ 
            productId: new ObjectId(productId), 
            customerId: new ObjectId(customerId) 
        })
        if (existing) {
            console.log('User already reviewed this product')
            return responseReturn(res, 200, { canReview: false, alreadyReviewed: true, existingReview: existing })
        }

        // Verify customer has purchased this product
        const orders = await customerOrderModel.find({
            customerId: new ObjectId(customerId),
            payment_status: 'paid'
        })
        
        console.log('=== CAN_REVIEW DEBUG ===')
        console.log('ProductId:', productId)
        console.log('CustomerId:', customerId)
        console.log('Found orders:', orders.length)
        
        let hasPurchased = false
        for (const order of orders) {
            console.log('Order ID:', order._id, 'Products count:', order.products?.length)
            if (order.products && Array.isArray(order.products)) {
                order.products.forEach((item, idx) => {
                    console.log(`  Product ${idx}: ${item._id} (looking for: ${productId})`)
                })
                const found = order.products.some(item => String(item._id) === String(productId))
                if (found) {
                    console.log('*** MATCH FOUND IN ORDER:', order._id)
                    hasPurchased = true
                    break
                }
            }
        }
        
        console.log('Final hasPurchased:', hasPurchased)
        console.log('=======================')
        
        responseReturn(res, 200, { canReview: hasPurchased })
    } catch (error) {
        console.log(error.message)
        responseReturn(res, 500, { canReview: false })
    }
}


}

module.exports = new homeControllers()