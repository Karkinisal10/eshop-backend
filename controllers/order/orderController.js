const authOrderModel = require('../../models/authOrder')
const customerOrder = require('../../models/customerOrder')
const sellerModel = require('../../models/sellerModel')

const myShopWallet = require('../../models/myShopWallet')
const sellerWallet = require('../../models/sellerWallet')

const cardModel = require('../../models/cardModel')
const moment = require("moment")
const axios = require('axios')
const { responseReturn } = require('../../utiles/response') 
const { mongo: {ObjectId}} = require('mongoose')
const sendReceiptEmail = require('../../utiles/sendReceiptEmail')
const stripe = require('stripe')('sk_test_51ShAOlCoOvK5Z9WmMJclQsrBIDIAYQJUv3yjm6zV4y4bi3xHhc3fndntcem9i8UOTwkUAB2hO2qroZB8xmUixy7U00HdPt9kg2')

const khaltiSecretKey = process.env.KHALTI_SECRET_KEY || ''
const khaltiBaseUrl = process.env.KHALTI_BASE_URL || 'https://dev.khalti.com/api/v2'
const khaltiReturnUrl = process.env.KHALTI_RETURN_URL || 'http://localhost:3000/khalti/confirm'
const khaltiWebsiteUrl = process.env.KHALTI_WEBSITE_URL || 'http://localhost:3000'

class orderController{

    paymentCheck = async (id) => {
        try {
            const order = await customerOrder.findById(id)
            if (order.payment_status === 'unpaid') {
                await customerOrder.findByIdAndUpdate(id, {
                    delivery_status: 'cancelled'
                })
                await authOrderModel.updateMany({
                    orderId: id
                },{
                    delivery_status: 'cancelled'
                })
            }
            return true
        } catch (error) {
            console.log(error)
        }
    }

    // end method 
      
    place_order = async (req,res) => {
        const {price,products,shipping_fee,shippingInfo,userId } = req.body
        let authorOrderData = []
        let cardId = []
        const tempDate = moment(Date.now()).format('LLL')

        let customerOrderProduct = []

        // Validate all sellers are active before placing order
        try {
            for (let i = 0; i < products.length; i++) {
                const sellerId = products[i].sellerId
                const seller = await sellerModel.findById(sellerId)
                if (!seller || seller.status !== 'active') {
                    return responseReturn(res, 400, { error: `One or more sellers are currently inactive. Please remove their products from your cart.` })
                }
            }
        } catch (error) {
            return responseReturn(res, 500, { error: 'Failed to validate sellers' })
        }

        for (let i = 0; i < products.length; i++) {
            const pro = products[i].products
            for (let j = 0; j < pro.length; j++) {
                const tempCusPro = pro[j].productInfo;
                tempCusPro.quantity = pro[j].quantity
                customerOrderProduct.push(tempCusPro)
                if (pro[j]._id) {
                    cardId.push(pro[j]._id)
                } 
            } 
        }

        try {
            const order = await customerOrder.create({
                customerId: userId,
                shippingInfo,
                products: customerOrderProduct,
                price: price + shipping_fee,
                payment_status: 'unpaid',
                delivery_status: 'pending',
                date: tempDate
            })
            for (let i = 0; i < products.length; i++) {
                const pro = products[i].products
                const pri = products[i].price
                const sellerId = products[i].sellerId
                let storePor = []
                for (let j = 0; j < pro.length; j++) {
                    const tempPro = pro[j].productInfo
                    tempPro.quantity = pro[j].quantity
                    storePor.push(tempPro)                    
                }

                authorOrderData.push({
                    orderId: order.id,sellerId,
                    products: storePor,
                    price:pri,
                    payment_status: 'unpaid',
                    shippingInfo: 'Easy Main Warehouse',
                    delivery_status: 'pending',
                    date: tempDate
                }) 
            }

            await authOrderModel.insertMany(authorOrderData)
            for (let k = 0; k < cardId.length; k++) {
                await cardModel.findByIdAndDelete(cardId[k]) 
            }
   
            setTimeout(() => {
                this.paymentCheck(order.id)
            }, 45000)

            responseReturn(res,200,{message: "Order Placed Success" , orderId: order.id })

            
        } catch (error) {
            console.log(error.message) 
        }
 
    }

    // End Method 
    
    get_customer_dashboard_data = async(req,res) => {
        const{ userId } = req.params 

        try {
            const recentOrders = await customerOrder.find({
                customerId: new ObjectId(userId) 
            }).limit(5)
            const pendingOrder = await customerOrder.find({
                customerId: new ObjectId(userId),delivery_status: 'pending'
             }).countDocuments()
             const totalOrder = await customerOrder.find({
                customerId: new ObjectId(userId)
             }).countDocuments()
             const cancelledOrder = await customerOrder.find({
                customerId: new ObjectId(userId),delivery_status: 'cancelled'
             }).countDocuments()
             responseReturn(res, 200,{
                recentOrders,
                pendingOrder,
                totalOrder,
                cancelledOrder
             })
            
        } catch (error) {
            console.log(error.message)
        } 

    }
     // End Method 

     get_orders = async (req, res) => {
        const {customerId, status} = req.params

        try {
            let orders = []
            if (status !== 'all') {
                orders = await customerOrder.find({
                    customerId: new ObjectId(customerId),
                    delivery_status: status
                })
            } else {
                orders = await customerOrder.find({
                    customerId: new ObjectId(customerId)
                })
            }
            responseReturn(res, 200,{
                orders
            })
            
        } catch (error) {
            console.log(error.message)
        }

     }
 // End Method 

 get_order_details = async (req, res) => {
    const {orderId} = req.params

    try {
        const order = await customerOrder.findById(orderId)
        responseReturn(res,200, {
            order
        })
        
    } catch (error) {
        console.log(error.message)
    }
 }
 // End Method 

 get_admin_orders = async(req, res) => {
    let {page,searchValue,parPage} = req.query
    page = parseInt(page)
    parPage= parseInt(parPage)

    const skipPage = parPage * (page - 1)

    try {
        if (searchValue) {
            
        } else {
            const orders = await customerOrder.aggregate([
                {
                    $lookup: {
                        from: 'authororders',
                        localField: "_id",
                        foreignField: 'orderId',
                        as: 'suborder'
                    }
                }
            ]).skip(skipPage).limit(parPage).sort({ createdAt: -1})

            const totalOrder = await customerOrder.aggregate([
                {
                    $lookup: {
                        from: 'authororders',
                        localField: "_id",
                        foreignField: 'orderId',
                        as: 'suborder'
                    }
                }
            ])

            responseReturn(res,200, { orders, totalOrder: totalOrder.length })
        }
    } catch (error) {
        console.log(error.message)
    } 

 }
  // End Method 
  
  get_admin_order = async (req, res) => {
    const { orderId } = req.params
    try {

        const order = await customerOrder.aggregate([
            {
                $match: {_id: new ObjectId(orderId)}
            },
            {
                $lookup: {
                    from: 'authororders',
                    localField: "_id",
                    foreignField: 'orderId',
                    as: 'suborder'
                }
            }
        ])
        responseReturn(res,200, { order: order[0] })
    } catch (error) {
        console.log('get admin order details' + error.message)
    }
  }
  // End Method 


  admin_order_status_update = async(req, res) => {
    const { orderId } = req.params
    const { status } = req.body

    try {
        await customerOrder.findByIdAndUpdate(orderId, {
            delivery_status : status
        })
        responseReturn(res,200, {message: 'order Status change success'})
    } catch (error) {
        console.log('get admin status error' + error.message)
        responseReturn(res,500, {message: 'internal server error'})
    }
     
  }
  // End Method 

  get_seller_orders = async (req,res) => {
        const {sellerId} = req.params
        let {page,searchValue,parPage} = req.query
        page = parseInt(page)
        parPage= parseInt(parPage)

        const skipPage = parPage * (page - 1)

        try {
            if (searchValue) {
                
            } else {
                const orders = await authOrderModel.find({
                    sellerId,
                }).skip(skipPage).limit(parPage).sort({ createdAt: -1})
                const totalOrder = await authOrderModel.find({
                    sellerId
                }).countDocuments()
                responseReturn(res,200, {orders,totalOrder})
            }
            
        } catch (error) {
         console.log('get seller Order error' + error.message)
         responseReturn(res,500, {message: 'internal server error'})
        }
        
  }
  // End Method 

  get_seller_order = async (req,res) => {
    const { orderId } = req.params
    
    try {
        const order = await authOrderModel.findById(orderId)
        responseReturn(res, 200, { order })
    } catch (error) {
        console.log('get seller details error' + error.message)
    }
  }
  // End Method 

  seller_order_status_update = async(req,res) => {
    const {orderId} = req.params
    const { status } = req.body

    try {
        const authOrder = await authOrderModel.findByIdAndUpdate(orderId,{
            delivery_status: status
        },{new:true})

        // keep customerOrder in sync
        if (authOrder?.orderId) {
            await customerOrder.findByIdAndUpdate(authOrder.orderId, {
                delivery_status: status
            })
        }
        responseReturn(res,200, {message: 'order status updated successfully'})
    } catch (error) {
        console.log('get seller Order error' + error.message)
        responseReturn(res,500, {message: 'internal server error'})
    }


  }
  // End Method 

  mark_order_paid = async (orderId, paymentMeta = {}) => {
    const order = await customerOrder.findById(orderId)
    if (!order) {
        throw new Error('Order not found')
    }
    if (order.payment_status === 'paid') {
        return { alreadyPaid: true, order }
    }

    const mergedInfo = {
        ...(order.payment_info || {}),
        ...(paymentMeta.info || {})
    }

    const update = {
        payment_status: 'paid',
        delivery_status: 'pending',
        payment_provider: paymentMeta.provider || order.payment_provider || 'stripe',
        payment_info: mergedInfo
    }

    await customerOrder.findByIdAndUpdate(orderId, update)
    await authOrderModel.updateMany({ orderId: new ObjectId(orderId)}, {
        payment_status: 'paid',
        delivery_status: 'pending'
    })

    const cuOrder = await customerOrder.findById(orderId)
    const auOrder = await authOrderModel.find({
        orderId: new ObjectId(orderId)
    })
    const time = moment(Date.now()).format('l')
    const splitTime = time.split('/')

    await myShopWallet.create({
        amount: cuOrder.price,
        month: splitTime[0],
        year: splitTime[2]
    })

    for (let i = 0; i < auOrder.length; i++) {
        await sellerWallet.create({
            sellerId: auOrder[i].sellerId.toString(),
            amount: auOrder[i].price,
            month: splitTime[0],
            year: splitTime[2]
        })
    }

    try {
        await sendReceiptEmail({
            to: cuOrder.shippingInfo?.email || 'customer@example.com',
            customerName: cuOrder.shippingInfo?.name || 'Valued Customer',
            orderId: cuOrder._id,
            total: cuOrder.price,
            shippingInfo: cuOrder.shippingInfo || {},
            items: cuOrder.products || []
        })
    } catch (emailError) {
        console.log('Email sending error:', emailError.message)
    }

    return { alreadyPaid: false, order: cuOrder }
  }
  // End Method

  create_payment = async (req, res) => {
    const { price } = req.body
    try {
        const payment = await stripe.paymentIntents.create({
            amount: price * 100,
            currency: 'npr',
            automatic_payment_methods: {
                enabled: true
            }
        })
        responseReturn(res, 200, { clientSecret: payment.client_secret })
    } catch (error) {
        console.log('Payment creation error:', error.message)
        responseReturn(res, 500, { message: 'Payment creation failed' })
    }
  }
  // End Method 

  order_confirm = async (req,res) => {
    const {orderId} = req.params
    try {
        const order = await customerOrder.findById(orderId)
        if (!order) {
            responseReturn(res, 404, {message: 'Order not found'})
            return
        }
        const paymentInfo = {
            ...(order.payment_info || {}),
            stripe: {
                status: 'succeeded'
            }
        }
        const result = await this.mark_order_paid(orderId, {
            provider: 'stripe',
            info: paymentInfo
        })
        responseReturn(res, 200, {message: result.alreadyPaid ? 'Payment already confirmed' : 'success'}) 
        
    } catch (error) {
        console.log(error.message)
        responseReturn(res, 500, {message: 'Internal Server Error'})
    }
     
  }
   // End Method 

  initiate_khalti_payment = async (req, res) => {
    const { orderId } = req.body
    if (!orderId) {
        responseReturn(res, 400, { message: 'orderId is required' })
        return
    }
    if (!khaltiSecretKey) {
        responseReturn(res, 500, { message: 'Khalti secret key is not configured on the server' })
        return
    }
    
    console.log('Khalti Secret Key:', khaltiSecretKey)
    console.log('Khalti Base URL:', khaltiBaseUrl)

    try {
        const order = await customerOrder.findById(orderId)
        if (!order) {
            responseReturn(res, 404, { message: 'Order not found' })
            return
        }
        if (order.payment_status === 'paid') {
            responseReturn(res, 400, { message: 'Order already paid' })
            return
        }

        const amountInPaisa = Math.round(Number(order.price || 0) * 100)
        if (amountInPaisa < 1000) {
            responseReturn(res, 400, { message: 'Amount should be at least NPR 10.00 (1000 paisa) for Khalti' })
            return
        }

        const productDetails = (order.products || []).map((item, index) => ({
            identity: item._id ? item._id.toString() : `item-${index + 1}`,
            name: item.name || item.productName || 'Item',
            total_price: (item.price || 0) * (item.quantity || 1),
            quantity: item.quantity || 1,
            unit_price: item.price || 0
        }))

        const payload = {
            // Use a clean return URL; Khalti will append purchase_order_id and pidx
            return_url: khaltiReturnUrl,
            website_url: khaltiWebsiteUrl,
            amount: amountInPaisa,
            purchase_order_id: orderId,
            purchase_order_name: `Order-${orderId}`,
            customer_info: {
                name: order.shippingInfo?.name || 'Customer',
                email: order.shippingInfo?.email || 'customer@example.com',
                phone: order.shippingInfo?.phone || '9800000000'
            },
            product_details: productDetails.slice(0, 10),
            merchant_extra: orderId
        }

        const { data } = await axios.post(`${khaltiBaseUrl}/epayment/initiate/`, payload, {
            headers: {
                Authorization: `Key ${khaltiSecretKey}`,
                'Content-Type': 'application/json'
            }
        })

        const mergedInfo = {
            ...(order.payment_info || {}),
            khalti: {
                pidx: data.pidx,
                status: 'Initiated',
                amount: amountInPaisa,
                expires_at: data.expires_at
            }
        }

        await customerOrder.findByIdAndUpdate(orderId, {
            payment_provider: 'khalti',
            payment_info: mergedInfo
        })

        responseReturn(res, 200, {
            paymentUrl: data.payment_url,
            pidx: data.pidx,
            expiresAt: data.expires_at
        })
    } catch (error) {
        console.log('Khalti initiate error:', error?.response?.data || error.message)
        const message = error?.response?.data || { message: error.message }
        responseReturn(res, 500, { message: 'Khalti initiate failed', error: message })
    }
  }
  // End Method

  verify_khalti_payment = async (req, res) => {
    const { pidx, orderId } = req.body
    
    console.log('=== Khalti Verify Called ===')
    console.log('pidx:', pidx)
    console.log('orderId:', orderId)
    
    if (!pidx || !orderId) {
        console.log('Missing pidx or orderId')
        responseReturn(res, 400, { message: 'pidx and orderId are required' })
        return
    }
    if (!khaltiSecretKey) {
        console.log('Missing Khalti secret key')
        responseReturn(res, 500, { message: 'Khalti secret key is not configured on the server' })
        return
    }

    try {
        const order = await customerOrder.findById(orderId)
        console.log('Order found:', order ? 'YES' : 'NO')
        console.log('Order payment_status:', order?.payment_status)
        
        if (!order) {
            console.log('Order not found with ID:', orderId)
            responseReturn(res, 404, { message: 'Order not found' })
            return
        }
        if (order.payment_status === 'paid') {
            responseReturn(res, 200, { message: 'Payment already confirmed' })
            return
        }

        const storedPidx = order.payment_info?.khalti?.pidx
        if (storedPidx && storedPidx !== pidx) {
            responseReturn(res, 400, { message: 'Payment session mismatch. Please initiate payment again.' })
            return
        }

        const { data } = await axios.post(`${khaltiBaseUrl}/epayment/lookup/`, { pidx }, {
            headers: {
                Authorization: `Key ${khaltiSecretKey}`,
                'Content-Type': 'application/json'
            }
        })

        const paymentInfo = {
            ...(order.payment_info || {}),
            khalti: {
                ...(order.payment_info?.khalti || {}),
                status: data.status,
                transaction_id: data.transaction_id,
                refunded: data.refunded,
                fee: data.fee
            }
        }

        const expectedAmount = order.payment_info?.khalti?.amount || Math.round(Number(order.price || 0) * 100)
        if (data.total_amount !== expectedAmount) {
            await customerOrder.findByIdAndUpdate(orderId, { payment_info: paymentInfo })
            responseReturn(res, 400, { message: 'Amount mismatch during verification' })
            return
        }

        if (data.status === 'Completed') {
            const result = await this.mark_order_paid(orderId, {
                provider: 'khalti',
                info: paymentInfo
            })
            responseReturn(res, 200, {
                message: result.alreadyPaid ? 'Payment already confirmed' : 'Khalti payment verified',
                transactionId: data.transaction_id
            })
            return
        }

        if (data.status === 'Pending' || data.status === 'Initiated') {
            await customerOrder.findByIdAndUpdate(orderId, { payment_info: paymentInfo, payment_provider: 'khalti' })
            responseReturn(res, 202, { message: 'Payment pending', status: data.status })
            return
        }

        await customerOrder.findByIdAndUpdate(orderId, { payment_info: paymentInfo, payment_provider: 'khalti' })
        responseReturn(res, 400, { message: 'Payment not completed', status: data.status })

    } catch (error) {
        console.log('Khalti verification error:', error?.response?.data || error.message)
        const message = error?.response?.data || { message: error.message }
        responseReturn(res, 500, { message: 'Khalti verification failed', error: message })
    }
  }
  // End Method

}

module.exports = new orderController()