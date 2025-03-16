const mongoose = require('mongoose');
const Product = require('./product'); 
const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    variant: {
      size: { type: String, required: true },
      price: { type: Number, required: true },
      discountedPrice: { type: Number, required: false }, 
      quantity: { type: Number, required: true }
    },
    image: {
      type: String,
      required: true
    }
  }],
   
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

cartSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});


const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
