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
         responseReturn(res, 200, {
            totalProduct,
            totalOrder,
            totalSeller,
            messages,
            recentOrders,
            totalSale: totalSale.length > 0 ? totalSale[0].totalAmount : 0,

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

        responseReturn(res, 200, {
            totalProduct,
            totalOrder,
            totalPendingOrder,
            messages,
            recentOrders,
            totalSale: totalSale.length > 0 ? totalSale[0].totalAmount : 0,

         })

        } catch (error) {
            console.log(error.message)
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