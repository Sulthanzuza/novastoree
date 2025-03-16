const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2')



const VariantSchema = new mongoose.Schema({
  _id: { 
    type: mongoose.Schema.Types.ObjectId, 
    default: () => new mongoose.Types.ObjectId(), 
  },
  size: {
    type: String,
    required: true,
    trim: true,
  },
  price: {  
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
  },
});
const ProductSchema = new mongoose.Schema(
  {

    name: {
      type: String,
      required: true,
      trim: true,
    },
    
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
    },
    offers: {
      type: String, 
      default: null,
    },
    discount:{
      type:Number
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    
    variants: {
      type: [VariantSchema], 
      required: true,
    },
    image: {
      type: [String], 
      validate: {
        validator: function (v) {
          return v.every((image) => /\.(jpg|jpeg|webp|png|gif)$/.test(image));
        },
        message: (props) => `${props.value} is not a valid image format!`,
      },
    },
    stockStatus: {
      type: String, 
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);


ProductSchema.plugin(mongoosePaginate);


ProductSchema.index({ category: 1 });  
ProductSchema.index({ price: 1 });

const Product = mongoose.model('Product', ProductSchema);
module.exports = Product;
