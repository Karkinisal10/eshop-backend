const formidable = require("formidable")
const { responseReturn } = require("../../utiles/response")
const cloudinary = require('cloudinary').v2
const sellerModel = require('../../models/sellerModel')
const productModel = require('../../models/productModel')
const authOrder = require('../../models/authOrder')
const reviewModel = require('../../models/reviewModel')
const customerOrder = require('../../models/customerOrder')
const withdrowRequest = require('../../models/withdrowRequest')

class sellerController{ 

    request_seller_get = async (req, res) => {
        const {page,searchValue, parPage} = req.query 
        const skipPage = parseInt(parPage) * (parseInt(page) - 1)

        try {
            if (searchValue) {
                
            } else {
                const sellers = await sellerModel.find({ status:  'pending'}).skip(skipPage).limit(parPage).sort({ createdAt: -1})
                const totalSeller = await sellerModel.find({ status: 'pending' }).countDocuments()
                responseReturn(res, 200,{ sellers,totalSeller })
            }
        } catch (error) {
            responseReturn(res, 500,{ error: error.message }) 
        }
 
    }

    
    // end method 

    get_seller = async (req, res) => {
        const {sellerId} = req.params
        try {
            const seller = await sellerModel.findById(sellerId)
            responseReturn(res, 200,{ seller })
        } catch (error) {
            responseReturn(res, 500,{ error: error.message })
        }
    }

     // end method 
 
     seller_status_update = async (req, res) => {
        const {sellerId, status} = req.body
        try {
            await sellerModel.findByIdAndUpdate(sellerId,{status})
            const seller = await sellerModel.findById(sellerId)
            responseReturn(res, 200,{ seller,  message: 'Seller Status Updated Successfully' })
        } catch (error) {
            responseReturn(res, 500,{ error: error.message })
        }
    }

     // end method 

     get_active_sellers = async (req, res) => {
        let {page,searchValue,parPage} = req.query
        page = parseInt(page)
        parPage= parseInt(parPage)

        const skipPage = parPage * (page - 1)

        try {
            let sellers;
            let totalSeller;

            if (searchValue) {
                sellers = await sellerModel.find({
                    $text: { $search: searchValue},
                    status: 'active'
                }).skip(skipPage).limit(parPage).sort({createdAt : -1})

                totalSeller = await sellerModel.find({
                    $text: { $search: searchValue},
                    status: 'active'
                }).countDocuments()
            } else {
                sellers = await sellerModel.find({ status: 'active'
                }).skip(skipPage).limit(parPage).sort({createdAt : -1})

                totalSeller = await sellerModel.find({ status: 'active'
                }).countDocuments()
            }

            // Fetch statistics for each seller
            const sellersWithStats = await Promise.all(sellers.map(async (seller) => {
                const sellerObj = seller.toObject()
                
                // Get total products
                const totalProducts = await productModel.countDocuments({ sellerId: seller._id })
                
                // Get total orders and calculate total sales
                const orders = await authOrder.find({ 
                    sellerId: seller._id,
                    payment_status: { $in: ['paid', 'Paid'] }
                })
                const totalOrders = orders.length
                const totalSales = orders.reduce((sum, order) => sum + (order.price || 0), 0)
                
                // Get pending orders
                const pendingOrders = await authOrder.countDocuments({ 
                    sellerId: seller._id,
                    delivery_status: { $in: ['pending', 'processing', 'warehouse'] }
                })
                
                // Get average rating
                const reviews = await reviewModel.find({ sellerId: seller._id })
                const avgRating = reviews.length > 0 
                    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
                    : 0
                const totalReviews = reviews.length

                return {
                    ...sellerObj,
                    stats: {
                        totalProducts,
                        totalOrders,
                        totalSales: totalSales.toFixed(2),
                        pendingOrders,
                        avgRating,
                        totalReviews
                    }
                }
            }))
            
            responseReturn(res, 200, {totalSeller, sellers: sellersWithStats})
            
        } catch (error) {
            console.log('active seller get ' + error.message)
            responseReturn(res, 500, { error: error.message })
        }


     }
   // end method 

   get_deactive_sellers = async(req,res) => {
    let {page,searchValue,parPage} = req.query
    page = parseInt(page)
    parPage= parseInt(parPage)

    const skipPage = parPage * (page - 1)

    try {
        if (searchValue) {
            const sellers = await sellerModel.find({
                $text: { $search: searchValue},
                status: 'deactive'
            }).skip(skipPage).limit(parPage).sort({createdAt : -1})

            const totalSeller = await sellerModel.find({
                $text: { $search: searchValue},
                status: 'deactive'
            }).countDocuments()
            responseReturn(res, 200, {totalSeller,sellers})
        } else {
            const sellers = await sellerModel.find({ status: 'deactive'
            }).skip(skipPage).limit(parPage).sort({createdAt : -1})

            const totalSeller = await sellerModel.find({ status: 'deactive'
            }).countDocuments()
            responseReturn(res, 200, {totalSeller,sellers})
        }
        
    } catch (error) {
        console.log('deactive seller get ' + error.message)
    }
   }
// end method 

    // Get detailed seller statistics
    get_seller_statistics = async (req, res) => {
        const { sellerId } = req.params
        
        try {
            const seller = await sellerModel.findById(sellerId)
            if (!seller) {
                return responseReturn(res, 404, { error: 'Seller not found' })
            }

            // Get total products
            const totalProducts = await productModel.countDocuments({ sellerId })
            const activeProducts = await productModel.countDocuments({ sellerId, stock: { $gt: 0 } })
            const outOfStockProducts = await productModel.countDocuments({ sellerId, stock: 0 })
            
            // Get all orders
            const allOrders = await authOrder.find({ sellerId })
            const paidOrders = await authOrder.find({ 
                sellerId,
                payment_status: { $in: ['paid', 'Paid'] }
            })
            
            // Calculate total sales
            const totalSales = paidOrders.reduce((sum, order) => sum + (order.price || 0), 0)
            
            // Get order status breakdown
            const pendingOrders = await authOrder.countDocuments({ 
                sellerId,
                delivery_status: 'pending'
            })
            const processingOrders = await authOrder.countDocuments({ 
                sellerId,
                delivery_status: 'processing'
            })
            const deliveredOrders = await authOrder.countDocuments({ 
                sellerId,
                delivery_status: 'delivered'
            })
            const cancelledOrders = await authOrder.countDocuments({ 
                sellerId,
                delivery_status: 'cancelled'
            })
            
            // Compute unique customers for this seller via customer orders
            const orderIds = allOrders.map(o => o.orderId)
            let uniqueCustomers = 0
            let returningCustomers = 0
            if (orderIds.length) {
                const customerOrders = await customerOrder.find({ _id: { $in: orderIds } }).select('customerId')
                const customerCounts = {}
                for (const co of customerOrders) {
                    const cid = String(co.customerId)
                    customerCounts[cid] = (customerCounts[cid] || 0) + 1
                }
                uniqueCustomers = Object.keys(customerCounts).length
                returningCustomers = Object.values(customerCounts).filter(c => c > 1).length
            }

            // Get reviews
            const reviews = await reviewModel.find({ sellerId })
            const avgRating = reviews.length > 0 
                ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
                : 0

            // Get total paid to seller (successful withdrawals)
            const paidAgg = await withdrowRequest.aggregate([
                { $match: { sellerId: String(sellerId), status: 'success' } },
                { $group: { _id: null, totalPaid: { $sum: '$amount' }, paymentCount: { $sum: 1 } } }
            ])
            const totalPaid = paidAgg.length ? paidAgg[0].totalPaid : 0
            const paymentCount = paidAgg.length ? paidAgg[0].paymentCount : 0
            
            // Get sales by month (last 6 months)
            const sixMonthsAgo = new Date()
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
            
            const recentOrders = await authOrder.find({
                sellerId,
                payment_status: { $in: ['paid', 'Paid'] },
                createdAt: { $gte: sixMonthsAgo }
            }).sort({ createdAt: 1 })

            const salesByMonth = {}
            recentOrders.forEach(order => {
                const month = new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
                salesByMonth[month] = (salesByMonth[month] || 0) + order.price
            })

            const statistics = {
                seller: {
                    name: seller.name,
                    email: seller.email,
                    shopName: seller.shopInfo?.shopName,
                    status: seller.status,
                    payment: seller.payment,
                    createdAt: seller.createdAt
                },
                products: {
                    total: totalProducts,
                    active: activeProducts,
                    outOfStock: outOfStockProducts
                },
                orders: {
                    total: allOrders.length,
                    pending: pendingOrders,
                    processing: processingOrders,
                    delivered: deliveredOrders,
                    cancelled: cancelledOrders
                },
                sales: {
                    total: totalSales.toFixed(2),
                    average: allOrders.length > 0 ? (totalSales / allOrders.length).toFixed(2) : 0,
                    byMonth: salesByMonth
                },
                customers: {
                    total: uniqueCustomers,
                    returning: returningCustomers
                },
                reviews: {
                    total: reviews.length,
                    avgRating: parseFloat(avgRating)
                },
                payments: {
                    totalPaid,
                    paymentCount
                }
            }

            responseReturn(res, 200, { statistics })
        } catch (error) {
            console.log('seller statistics error: ' + error.message)
            responseReturn(res, 500, { error: error.message })
        }
    }
    // end method

}
 

module.exports = new sellerController()