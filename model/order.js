const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    orderNumber: { type: String, unique: true, required: true },
    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        image: { type: String }, 
        variants: [
          {
            size: { type: String, required: true },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true }, 
          },
        ], 
        discount: { type: Number, default: 0 },
        productStatus: {
          type: String,
          enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned' , 'Return Approved'],
          default: 'Pending',
        },
        reason:{
          type:String,
        },
      },
     
    
    ],
    address: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: false },
    shippingAddress: {
      fullName: { type: String,required:true },
      phoneNumber: { type: String  , required:true},
      houseAddress: { type: String , required:true},
      streetAddress: { type: String , required:true },
      city: { type: String , required:true},
      state: { type: String , required:true},
      zipCode: { type: String , required:true},
      country: { type: String, required:true },
    },
    coupon: {
      code: { type: String, default: null }, 
      discount: { type: Number, default: 0 }, 
    },
   
    payment: {
      method: { type: String, enum: ['COD', 'RAZORPAY','WALLET'], required: true },
      status: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
      orderId: { type: String }, 
      paymentId: { type: String },
      signature: { type: String },
    },
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    orderStatus: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned','Confirmed'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);


// OrderSchema.pre('save', async function (next) {
//   if (!this.isNew) return next();

//   const generateOrderNumber = () => {
//     return Math.random().toString(36).substring(2, 12).toUpperCase();
//   };

//   let orderNumber = generateOrderNumber();


//   const Order = mongoose.model('Order', OrderSchema);
//   while (await Order.exists({ order_number: orderNumber })) {
//     orderNumber = generateOrderNumber();
//   }

//   this.order_number = orderNumber;
//   next();
// });

module.exports = mongoose.model('Order', OrderSchema);
