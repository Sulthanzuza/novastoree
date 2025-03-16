const mongoose = require('mongoose');
const CategorySchema = new mongoose.Schema(
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
    offers: {
      type: String, 
      default: null,
    },
    icon: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /\.(jpg|jpeg|png|gif|webp)$/.test(v); 
        },
        message: (props) => `${props.value} is not a valid image format!`,
      },
    },
    isDeleted: {
      type: Boolean,
      default: false, 
  },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);



const Category = mongoose.model('Category', CategorySchema);
module.exports = Category;
