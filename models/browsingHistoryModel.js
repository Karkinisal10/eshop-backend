const { Schema, model } = require('mongoose');

const browsingHistorySchema = new Schema(
    {
        userId: {
            type: Schema.ObjectId,
            required: true,
            ref: 'customers' // Reference to customer model
        },
        productId: {
            type: Schema.ObjectId,
            required: true,
            ref: 'products'
        },
        viewedAt: {
            type: Date,
            default: Date.now
        },
        timeSpent: {
            type: Number,
            default: 0 // Time in seconds user spent viewing product
        },
        category: {
            type: String,
            default: '' // Category of viewed product for quick filtering
        },
        brand: {
            type: String,
            default: '' // Brand of viewed product for preference tracking
        },
        price: {
            type: Number,
            default: 0 // Price range for preference analysis
        }
    },
    { timestamps: true }
);

// Index for faster queries
browsingHistorySchema.index({ userId: 1, viewedAt: -1 });
browsingHistorySchema.index({ userId: 1, category: 1 });
browsingHistorySchema.index({ userId: 1, brand: 1 });

module.exports = model('browsingHistory', browsingHistorySchema);
