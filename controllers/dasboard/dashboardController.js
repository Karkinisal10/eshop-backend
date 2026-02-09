const { responseReturn } = require("../../utiles/response") 
const myShopWallet = require('../../models/myShopWallet')
const productModel = require('../../models/productModel')
const customerOrder = require('../../models/customerOrder')
const sellerModel = require('../../models/sellerModel') 
const adminSellerMessage = require('../../models/chat/adminSellerMessage') 
const sellerWallet = require('../../models/sellerWallet') 
const authOrder = require('../../models/authOrder') 
const sellerCustomerMessage = require('../../models/chat/sellerCustomerMessage') 
const bannerModel = require('../../models/bannerModel') 
const reviewModel = require('../../models/reviewModel')
const withdrowRequest = require('../../models/withdrowRequest')
const moment = require("moment")
const { mongo: {ObjectId}} = require('mongoose')
const cloudinary = require('cloudinary').v2
const formidable = require("formidable")

class dashboardController{


    get_admin_dashboard_data = async(req, res) => {
        const {id} = req 
        try {
            const totalSale = await myShopWallet.aggregate([
                {
                    $group: {
                        _id:null,
                        totalAmount: {$sum: '$amount'}
                    }
                }
            ])
         const totalProduct = await productModel.find({}).countDocuments()
         const totalOrder = await customerOrder.find({}).countDocuments()
         const totalSeller = await sellerModel.find({}).countDocuments()
         const messages = await adminSellerMessage.find({}).limit(3)
         const recentOrders = await customerOrder.find({}).limit(5)

         const topSellers = await authOrder.aggregate([
            {
                $group: {
                    _id: '$sellerId',
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$price' }
                }
            },
            {
                $lookup: {
                    from: 'sellers',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'sellerInfo'
                }
            },
            { $unwind: '$sellerInfo' },
            {
                $project: {
                    sellerId: '$_id',
                    sellerName: '$sellerInfo.name',
                    sellerEmail: '$sellerInfo.email',
                    shopName: '$sellerInfo.shopInfo.shopName',
                    totalOrders: 1,
                    totalRevenue: 1
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 5 }
         ])

         const topProducts = await authOrder.aggregate([
            { $unwind: '$products' },
            {
                $project: {
                    productName: {
                        $ifNull: [
                            '$products.name',
                            { $ifNull: ['$products.productName', { $ifNull: ['$products.productTitle', 'Unknown'] }] }
                        ]
                    },
                    quantity: { $ifNull: ['$products.quantity', 0] },
                    price: { $ifNull: ['$products.price', 0] }
                }
            },
            {
                $group: {
                    _id: '$productName',
                    totalSold: { $sum: '$quantity' },
                    totalRevenue: { $sum: { $multiply: ['$price', '$quantity'] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
         ])

         // Get seller payment statistics
         const sellerPayments = await withdrowRequest.aggregate([
            {
                $match: { status: 'success' }
            },
            {
                $group: {
                    _id: '$sellerId',
                    totalPaid: { $sum: '$amount' },
                    paymentCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'sellers',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'sellerInfo'
                }
            },
            {
                $unwind: '$sellerInfo'
            },
            {
                $project: {
                    sellerId: '$_id',
                    sellerName: '$sellerInfo.name',
                    sellerEmail: '$sellerInfo.email',
                    shopName: '$sellerInfo.shopInfo.shopName',
                    totalPaid: 1,
                    paymentCount: 1
                }
            },
            {
                $sort: { totalPaid: -1 }
            },
            {
                $limit: 10
            }
         ])

         const totalPaidToSellers = await withdrowRequest.aggregate([
            {
                $match: { status: 'success' }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
         ])

         responseReturn(res, 200, {
            totalProduct,
            totalOrder,
            totalSeller,
            messages,
            recentOrders,
            totalSale: totalSale.length > 0 ? totalSale[0].totalAmount : 0,
                sellerPayments,
                totalPaidToSellers: totalPaidToSellers.length > 0 ? totalPaidToSellers[0].total : 0,
                topSellers,
                topProducts
         })

        } catch (error) {
            console.log(error.message)
        }
         
    }
    //end Method 


    get_seller_dashboard_data = async (req, res) => {
        const {id} = req 
        try {
            const totalSale = await sellerWallet.aggregate([
                {
                    $match: { 
                        sellerId: {
                            $eq: id
                        } 
                    }
                },{
                    $group: {
                        _id:null,
                        totalAmount: {$sum: '$amount'}
                    }
                }
            ])

        const totalProduct = await productModel.find({ 
          sellerId: new ObjectId(id) }).countDocuments()
        
        const totalOrder = await authOrder.find({
            sellerId: new ObjectId(id) }).countDocuments()

        const totalPendingOrder = await authOrder .find({
            $and:[
                {
                    sellerId: {
                        $eq: new ObjectId(id)
                    }
                },
                {
                    delivery_status :{
                        $eq: 'pending'
                    }
                }
            ]
        }).countDocuments()
        const messages = await sellerCustomerMessage.find({
            $or: [
                {
                    senderId: {
                        $eq: id
                    } 
                },{
                    receverId: {
                        $eq: id
                    }
                }
            ]
        }).limit(3)   

        const recentOrders = await authOrder.find({
            sellerId: new ObjectId(id)
        }).limit(5)

        const lowStockProducts = await productModel.find({
            sellerId: new ObjectId(id),
            stock: { $lte: 5 }
        }).sort({ stock: 1, updatedAt: -1 }).limit(6).select('name stock images')

        responseReturn(res, 200, {
            totalProduct,
            totalOrder,
            totalPendingOrder,
            messages,
            recentOrders,
            lowStockProducts,
            totalSale: totalSale.length > 0 ? totalSale[0].totalAmount : 0,

         })

        } catch (error) {
            console.log(error.message)
        }
        
    }
    //end Method 

    get_seller_monthly_analytics = async (req, res) => {
        const { id } = req
        try {
            // Get monthly sales data for last 12 months
            const monthlyData = await authOrder.aggregate([
                {
                    $match: {
                        sellerId: new ObjectId(id)
                    }
                },
                {
                    $group: {
                        _id: {
                            month: { $month: '$createdAt' },
                            year: { $year: '$createdAt' }
                        },
                        totalOrders: { $sum: 1 },
                        totalRevenue: { $sum: '$price' }
                    }
                },
                {
                    $sort: { '_id.year': 1, '_id.month': 1 }
                }
            ])

            // Format data for chart - fill in missing months with 0
            const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            const ordersData = new Array(12).fill(0)
            const revenueData = new Array(12).fill(0)
            const salesData = new Array(12).fill(0)

            monthlyData.forEach(item => {
                const monthIndex = item._id.month - 1
                ordersData[monthIndex] = item.totalOrders
                revenueData[monthIndex] = Math.round(item.totalRevenue)
                salesData[monthIndex] = item.totalOrders * 10 // Estimated sales count
            })

            // Get product performance data
            const productPerformance = await authOrder.aggregate([
                {
                    $match: {
                        sellerId: new ObjectId(id)
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        productName: {
                            $ifNull: [
                                '$products.name',
                                { $ifNull: ['$products.productName', { $ifNull: ['$products.productTitle', 'Unknown'] }] }
                            ]
                        },
                        quantity: { $ifNull: ['$products.quantity', 0] },
                        price: { $ifNull: ['$products.price', 0] }
                    }
                },
                {
                    $group: {
                        _id: '$productName',
                        totalSold: { $sum: '$quantity' },
                        revenue: { $sum: { $multiply: ['$price', '$quantity'] } }
                    }
                },
                {
                    $sort: { totalSold: -1 }
                },
                {
                    $limit: 5
                }
            ])

            // Get order status distribution
            const orderStatusDistribution = await authOrder.aggregate([
                {
                    $match: {
                        sellerId: new ObjectId(id)
                    }
                },
                {
                    $group: {
                        _id: '$delivery_status',
                        count: { $sum: 1 }
                    }
                }
            ])

            responseReturn(res, 200, {
                monthlyData: {
                    categories: monthLabels,
                    orders: ordersData,
                    revenue: revenueData,
                    sales: salesData
                },
                productPerformance,
                orderStatusDistribution
            })

        } catch (error) {
            console.log('get_seller_monthly_analytics error: ' + error.message)
            responseReturn(res, 500, { message: 'Internal server error' })
        }
    }
    //end Method 

    add_banner = async(req,res) => {
       const form = formidable({multiples:true})
       form.parse(req, async(err, field, files) => {
        const {productId} = field
        const { mainban } = files

        cloudinary.config({
            cloud_name: process.env.cloud_name,
            api_key: process.env.api_key,
            api_secret: process.env.api_secret,
            secure: true
        })
        
        try {
            const {slug} = await productModel.findById(productId) 
            const result = await cloudinary.uploader.upload(mainban.filepath, {folder: 'banners'})
            const banner = await bannerModel.create({
                productId,
                banner: result.url,
                link: slug 
            })
            responseReturn(res, 200, {banner,message: "Banner Add Success"})
        } catch (error) {
            responseReturn(res, 500, { error: error.message})
        } 
        
       })
    }
 //end Method 

 get_banner = async(req,res) => {
    const {productId} = req.params
    try {
        const banner = await bannerModel.findOne({ productId: new ObjectId(productId) })
        responseReturn(res,200, {banner})
    } catch (error) {
        responseReturn(res, 500, { error: error.message})
    }

 }
  //end Method 

  update_banner = async(req, res) => {
    const { bannerId } = req.params
    const form = formidable({})

    form.parse(req, async(err,_,files)=> {
        const {mainban} = files

        cloudinary.config({
            cloud_name: process.env.cloud_name,
            api_key: process.env.api_key,
            api_secret: process.env.api_secret,
            secure: true
        })

        try {
            let banner = await bannerModel.findById(bannerId)
            let temp = banner.banner.split('/')
            temp = temp[temp.length - 1]
            const imageName = temp.split('.')[0]
            await cloudinary.uploader.destroy(imageName)

            const {url } =  await cloudinary.uploader.upload(mainban.filepath, {folder: 'banners'})

            await bannerModel.findByIdAndUpdate(bannerId,{
                banner: url
            })

            banner = await bannerModel.findById(bannerId)
            responseReturn(res,200, {banner, message: "Banner Updated Success"})

        } catch (error) {
            responseReturn(res, 500, { error: error.message})
        }

    })
  }
    //end Method 

    get_banners = async(req, res) => {

        try {
            const banners = await bannerModel.aggregate([
                {
                    $sample: {
                        size: 5
                    }
                }
            ])
            responseReturn(res,200,{ banners })
        } catch (error) {
            responseReturn(res, 500, { error: error.message})
        }

    }
    //end Method 


}

// Seller reply to a customer review
dashboardController.prototype.reply_review = async function(req, res) {
    const { id } = req
    const { reviewId, message } = req.body

    try {
        console.log('DEBUG reply_review - id from auth:', id, 'reviewId:', reviewId, 'message:', message)
        
        const review = await reviewModel.findById(reviewId)
        console.log('DEBUG review found:', review)
        
        if (!review) {
            return responseReturn(res, 404, { message: 'Review not found' })
        }
        // Only product owner (seller) can reply
        console.log('DEBUG comparing sellerId:', String(review.sellerId), 'vs id:', String(id))
        if (String(review.sellerId) !== String(id)) {
            return responseReturn(res, 403, { message: 'Not authorized to reply to this review' })
        }

        const now = moment(Date.now()).format('LL')
        await reviewModel.findByIdAndUpdate(reviewId, {
            $push: {
                replies: {
                    sellerId: id,
                    message,
                    date: now
                }
            }
        })
        responseReturn(res, 200, { message: 'Reply added successfully' })
    } catch (error) {
        console.log(error.message)
        responseReturn(res, 500, { message: 'Internal Server Error' })
    }
}

module.exports = new dashboardController()