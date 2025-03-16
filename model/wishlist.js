const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    variantId: {
        type: mongoose.Schema.Types.ObjectId, 
        required: true
    },
    
}, { timestamps: true });

wishlistSchema.index({ userId: 1, productId: 1, variantId: 1 }, { unique: true });


module.exports = mongoose.model('Wishlist', wishlistSchema);