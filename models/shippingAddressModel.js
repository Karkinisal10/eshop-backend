const { Schema, model } = require("mongoose");

const shippingAddressSchema = new Schema({
    customerId: {
        type: Schema.ObjectId,
        required: true,
        ref: 'customers'
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^\d{10}$/.test(v);
            },
            message: props => `${props.value} is not a valid 10-digit phone number!`
        }
    },
    address: {
        type: String,
        required: true
    },
    province: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        default: ''
    },
    area: {
        type: String,
        default: ''
    },
    post: {
        type: String,
        default: ''
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = model('shippingAddresses', shippingAddressSchema);
