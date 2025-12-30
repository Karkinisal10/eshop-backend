const sellerModel = require('../../models/sellerModel')
const stripeModel = require('../../models/stripeModel')

const sellerWallet = require('../../models/sellerWallet')
const withdrowRequest = require('../../models/withdrowRequest') 

const {v4: uuidv4} = require('uuid')
const { responseReturn } = require('../../utiles/response')
const { mongo: {ObjectId}} = require('mongoose')
const stripe = require('stripe')('sk_test_51ShAOlCoOvK5Z9WmMJclQsrBIDIAYQJUv3yjm6zV4y4bi3xHhc3fndntcem9i8UOTwkUAB2hO2qroZB8xmUixy7U00HdPt9kg2')
const { sendPaymentReceipt } = require('../../utiles/sendEmail')


class paymentController{

    create_stripe_connect_account = async(req,res) => {
        const {id} = req 
        const uid = uuidv4()

    try {
        const stripeInfo = await stripeModel.findOne({ sellerId: id  })

        if (stripeInfo) {
            await stripeModel.deleteOne({ sellerId: id })
            const account = await stripe.accounts.create({ type: 'express' }) 

            const accountLink = await stripe.accountLinks.create({
                account: account.id,
                refresh_url: 'http://localhost:3001/refresh',
                return_url:  `http://localhost:3001/success?activeCode=${uid}`,
                type: 'account_onboarding'
            })
            await stripeModel.create({
                sellerId: id,
                stripeId: account.id,
                code: uid
            })
            responseReturn(res,201,{url:accountLink.url })

        }else{
            const account = await stripe.accounts.create({ type: 'express' }) 

            const accountLink = await stripe.accountLinks.create({
                account: account.id,
                refresh_url: 'http://localhost:3001/refresh',
                return_url:  `http://localhost:3001/success?activeCode=${uid}`,
                type: 'account_onboarding'
            })
            await stripeModel.create({
                sellerId: id,
                stripeId: account.id,
                code: uid
            })
            responseReturn(res,201,{url:accountLink.url })

        }
        
    } catch (error) {
        console.log('strpe connect account errror' + error.message)
     }
    }
    // End Method 


    active_stripe_connect_account = async (req, res) => {
       const {activeCode} = req.params 
       const {id} = req

       try {
            const userStripeInfo = await stripeModel.findOne({ code: activeCode })

            if (userStripeInfo) {
                await sellerModel.findByIdAndUpdate(id,{  
                  payment: 'active'
                })
                responseReturn(res, 200, {message: 'payment Active'})
            } else {
                responseReturn(res, 404, {message: 'payment Active Fails'})
            } 

       } catch (error) {
        responseReturn(res, 500, {message: 'Internal Server Error'})
       } 

    }
      // End Method 

    add_khalti_account = async (req, res) => {
        const { id } = req
        const { khaltiName, khaltiNumber } = req.body

        try {
            if (!khaltiName || !khaltiNumber) {
                return responseReturn(res, 400, { message: 'Khalti name and number are required' })
            }

            const updatedSeller = await sellerModel.findByIdAndUpdate(
                id,
                { khaltiName, khaltiNumber },
                { new: true, select: 'khaltiName khaltiNumber' }
            )

            responseReturn(res, 200, {
                message: 'Khalti account added',
                khaltiAccount: {
                    name: updatedSeller.khaltiName,
                    number: updatedSeller.khaltiNumber
                }
            })
        } catch (error) {
            responseReturn(res, 500, { message: 'Internal Server Error' })
        }
    }
      // End Method 

    sumAmount = (data) => {
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum = sum + data[i].amount;            
        }
        return sum
    }  


    get_seller_payment_details = async (req, res) => {
    const {sellerId} = req.params
    
    try {
        const payments = await sellerWallet.find({ sellerId }) 
        const seller = await sellerModel.findById(sellerId).select('khaltiName khaltiNumber')

        const pendingWithdrows = await withdrowRequest.find({
            $and: [
                {
                    sellerId: {
                        $eq: sellerId
                    }
                },
                {
                    status: {
                        $eq: 'pending'
                    }
                }
            ]
        })

        const successWithdrows = await withdrowRequest.find({
            $and: [
                {
                    sellerId: {
                        $eq: sellerId
                    }
                },
                {
                    status: {
                        $eq: 'success'
                    }
                }
            ]
        })

        const pendingAmount = this.sumAmount(pendingWithdrows)
        const withdrowAmount = this.sumAmount(successWithdrows)
        const totalAmount = this.sumAmount(payments)

        let availableAmount = 0;

        if (totalAmount > 0) {
            availableAmount = totalAmount - (pendingAmount + withdrowAmount)
        }

        responseReturn(res, 200,{
            totalAmount,
            pendingAmount,
            withdrowAmount,
            availableAmount,
            pendingWithdrows,
            successWithdrows,
            khaltiAccount: {
                name: seller?.khaltiName || '',
                number: seller?.khaltiNumber || ''
            }
        })
        
    } catch (error) {
        console.log(error.message)
    } 
     
    }
    // End Method 


    withdrowal_request = async (req, res) => {
        const {amount,sellerId} = req.body

        try {
            const withdrowal = await withdrowRequest.create({
                sellerId,
                amount: parseInt(amount)
            })
            responseReturn(res, 200,{ withdrowal, message: 'Withdrowal Request Send'})
        } catch (error) {
            responseReturn(res, 500,{ message: 'Internal Server Error'})
        }
    }
  // End Method 

  get_payment_request = async (req, res) => {
    try {
        const withdrowalRequest = await withdrowRequest.find({ status: 'pending'})
        
        // Populate seller details
        const requestsWithSeller = await Promise.all(
            withdrowalRequest.map(async (request) => {
                const seller = await sellerModel.findById(request.sellerId).select('name email shopInfo khaltiName khaltiNumber')
                return {
                    ...request.toObject(),
                    sellerInfo: seller
                }
            })
        )
        
        responseReturn(res, 200, {withdrowalRequest: requestsWithSeller })
    } catch (error) {
        responseReturn(res, 500,{ message: 'Internal Server Error'})
    }
  }
    // End Method 

    payment_request_confirm = async (req, res) => {
        const {paymentId} = req.body 
        try {
            const payment = await withdrowRequest.findById(paymentId)
            const seller = await sellerModel.findById(payment.sellerId).select('name email khaltiName khaltiNumber')

            // Check if seller has Khalti account
            if (!seller.khaltiName || !seller.khaltiNumber) {
                return responseReturn(res, 400, { message: 'Seller has not added Khalti account' })
            }

            // Generate receipt ID
            const receiptId = `RCP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

            // For Khalti, we'll mark as success (actual payment would be done manually via Khalti)
            // In production, integrate Khalti API here
             
            await withdrowRequest.findByIdAndUpdate(paymentId, {
                status: 'success',
                receiptId: receiptId,
                paidAt: new Date()
            })

            // Send payment receipt email to seller
            await sendPaymentReceipt(
                seller.email,
                seller.name,
                payment.amount,
                receiptId,
                seller.khaltiNumber
            )

            responseReturn(res, 200, {payment, message: 'Payment Sent Successfully'})

        } catch (error) {   
            console.log(error.message)
            responseReturn(res, 500,{ message: 'Internal Server Error'})
        }
    }
  // End Method 

}


module.exports = new paymentController()