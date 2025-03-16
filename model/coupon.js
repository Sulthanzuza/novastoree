const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: { type: String },
  start: { type: Date, required: true },
  expiry: { type: Date, required: true },
  discountAmount:{type:Number, required:true},
  minAmount: { type: Number, required: true },
  maxAmount: { type: Number, required: true },
  status: { type: Boolean, default: true },
  limit: { type: Number, required: true },
  usageType: { type: String, enum: ['single', 'multiple'], required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Coupon', couponSchema);
