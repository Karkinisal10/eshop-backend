const {Schema, model} = require("mongoose");

const withdrowSchema = new Schema({
    sellerId: {
        type: String,
        required : true
    },
    amount: {
        type: Number,
        required : true
    },
    status: {
        type: String,
        default : 'pending'
    },
    receiptId: {
        type: String,
        default: ''
    },
    paidAt: {
        type: Date
    }
},{ timestamps: true })

module.exports = model('withdrowRequest',withdrowSchema)