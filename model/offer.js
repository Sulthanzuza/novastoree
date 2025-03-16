const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['products', 'category'],
    },
    start: {
      type: Date,
      required: true,
    },
    expiry: {
      type: Date,
      required: true,
      validate: {
        validator: function (v) {
          return v > this.start;
        },
        message: 'Expiry date must be after the start date.',
      },
    },
    status: {
      type: Boolean,
      default: true,
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, 
  }
);

const Offer = mongoose.model('Offer', OfferSchema);
module.exports = Offer;
