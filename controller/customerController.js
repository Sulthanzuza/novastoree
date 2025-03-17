const User = require('../model/user')
const Order = require('../model/order')
const Product = require('../model/product');
const Wallet = require('../model/wallet')
const transporter = require('../config/emailService')


const showcustomer = async (req, res) => {
  try {

    const users = await User.find();


    res.status(200).render('admin/customers', {
      title: "Customers",
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('An error occurred while fetching customers');
  }
}


const userStatus = async (req, res) => {
  const { id, isBlocked } = req.body;
  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const userName = user.firstName;
  const email = user.email;
  const date = new Date().toLocaleString();

 
  let mailOptions;
  if (isBlocked) {
    
    mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: ' Account Temporarily Blocked - NOVA Store',
      text: `Hi ${userName},

We regret to inform you that your account on **NOVA Store** has been temporarily BLOCKED due to security reasons.

 **Blocked Details:**
- **Date & Time:** ${date}
- **Reason:** Suspicious activity detected or policy violation.

 **Possible Reasons:**
- Multiple failed login attempts.
- Violation of our terms and policies.
- Suspicious activities detected.

🚨 **What You Can Do Now:**
- If you did not perform any suspicious activity, kindly contact our support team.
- If you forgot your password, you may reset it once your account is unlocked.

⚠️ **IMPORTANT:** Until your account is reviewed, you will not be able to log in.

🛡️ **We prioritize your security!**
If you have any questions, please contact our support team.

Thank you,  
**NOVA Store Support Team**`
    };
  } else {
    
    mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: ' Account Unblocked - NOVA Store',
      text: `Hi ${userName},

Good News! Your account on **NOVA Store** has been successfully UNBLOCKED.

🎉 **Unblocked Details:**
- **Date & Time:** ${date}
- **Status:** Active

You may now log in to your account and continue shopping with us.

👉 **If you encounter any issues, please contact our support team immediately.**

💙 Thank you for choosing **NOVA Store**.
We’re always here to assist you.

Warm regards,  
**NOVA Store Support Team**`
    };
  }

 
  const sendEmail = (mailOptions) => {
    return new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          reject('Failed to send Email');
        } else {
          resolve(info);
        }
      });
    });
  };

  try {
    
    user.isBlocked = isBlocked;
    await user.save();

    
    await sendEmail(mailOptions);

   
    if (isBlocked) {
      req.session.destroy();
    }

    
    res.status(200).json({
      success: true,
      message: isBlocked ? 'User has been Blocked.' : 'User has been Unblocked.',
      isBlocked: isBlocked ? 'Blocked' : 'Active'
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ success: false, message: 'Error updating status' });
  }
};



const showOrderDetails = async (req, res) => {
  try {
    const orders = await Order.find().lean().sort({ createdAt: -1 });

    orders.forEach(order => {
      const allStatuses = order.products.map(p => p.productStatus);
      const isCompleted = allStatuses.every(status =>
        status === 'Delivered' || status === 'Cancelled'  || status === 'Return Approved'
      );
      order.completionStatus = isCompleted ? "Completed" : "Not Completed";
    });

    res.status(200).render("admin/order", { title: "Orders", orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).send("Server Error");
  }
};



const showEachOrder = async (req, res) => {
  try {
    const orderId = req.params.id;


    const order = await Order.findById(orderId).populate('products.productId').lean();
    if (!order) {
      return res.status(404).send('Order not found');
    }

    const user = await User.findById(order.userId).lean();
    if (!user) {
      return res.status(404).send('User not found');
    }


    order.formattedDate = new Date(order.createdAt).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });


    order.products = order.products.map((product) => {
      const variant = product.variants?.[0];
      const price = variant?.price || 0;
      const quantity = variant?.quantity || 1;
      const discount = product.discount || 0;

      product.price = price;
      product.totalPrice = (price * quantity) - discount;

      return product;
    });


    res.status(200).render('admin/order-details', {
      title: "Order Details",
      order, user
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).send('Internal Server Error');
  }
};







const updateProductStatus = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const { status, action } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const product = order.products.find(p => p._id.toString() === productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found in order" });
    }

    
    if (product.productStatus === 'Returned' && action) {
      if (action === 'approve') {
        product.returnActionStatus = "approved";
        product.productStatus = 'Return Approved';

      
        const productInDB = await Product.findById(product.productId);
        if (productInDB) {
          const variantInDB = productInDB.variants.find(v => v.size === product.variants[0].size);
          if (variantInDB) {
            variantInDB.quantity += product.variants[0].quantity;
            await productInDB.save();
          }
        }

        
        if (order.payment.method === "RAZORPAY" || order.payment.method === "WALLET") {
          let wallet = await Wallet.findOne({ userId: order.userId });

          if (!wallet) {
            wallet = new Wallet({ userId: order.userId, balance: 0, transactions: [] });
          }

          let refundAmount = product.variants[0].price * product.variants[0].quantity;

          if (product.discount) {
            refundAmount -= product.discount;
          }

          if (order.coupon && order.coupon.discount > 0) {
            const totalDiscount = order.coupon.discount;
            const totalOrderPrice = order.subtotal;
            const productContribution = (product.variants[0].price * product.variants[0].quantity) / totalOrderPrice;
            refundAmount -= totalDiscount * productContribution;
          }

          refundAmount = Math.max(refundAmount, 0);

          wallet.balance += refundAmount;
          wallet.transactions.push({
            amount: refundAmount,
            type: "Credit",
            description: `Refund for returned product: ${product.name} ${order.orderNumber}`
          });

          await wallet.save();
        }
      } else if (action === 'reject') {
        product.returnActionStatus = "rejected";
        product.productStatus = 'Delivered';
      }

     
      const allProductsCompleted = order.products.every(
        p => ['Delivered', 'Cancelled', 'Return Approved', 'Returned'].includes(p.productStatus)
      );

      if (allProductsCompleted) {
        order.orderStatus = 'Delivered';
      }

      await order.save();
      return res.status(200).json({ 
        success: true, 
        message: action === 'approve' ? 'Return approved' : 'Return rejected',
        productStatus: product.productStatus
      });
    }

 
    const validTransitions = {
      'Pending': ['Processing'],
      'Processing': ['Shipped'],
      'Shipped': ['Delivered'],
      'Delivered': [],
      'Cancelled': [],
      'Returned': []
    };

    if (!validTransitions[product.productStatus]?.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot change status from ${product.productStatus} to ${status}` 
      });
    }

    product.productStatus = status;

  
    const statusOrder = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Returned', 'Cancelled'];
    const productRank = statusOrder.indexOf(product.productStatus);
    const orderRank = statusOrder.indexOf(order.orderStatus);

    if (productRank > orderRank) {
      order.orderStatus = product.productStatus;
    }

    await order.save();
    return res.status(200).json({ 
      success: true, 
      message: "Product status updated successfully",
      productStatus: product.productStatus,
      orderStatus: order.orderStatus
    });
  } catch (error) {
    console.error("Error updating product status:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};


const getOrderProducts = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId).populate('products.productId').lean();
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
   
    const products = order.products.map(product => {
      const variant = product.variants?.[0];
      return {
        id: product._id,
        name: product.name,
        image: product.image,
        price: variant?.price || 0,
        quantity: variant?.quantity || 1,
        productStatus: product.productStatus,
        returnActionStatus: product.returnActionStatus,
        totalPrice: ((variant?.price || 0) * (variant?.quantity || 1)) - (product.discount || 0)
      };
    });
 
    return res.status(200).json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error fetching order products:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};



module.exports = {
  showcustomer,
  userStatus,
  showOrderDetails,
  showEachOrder,
  // updateOrderStatus,
  updateProductStatus,
  getOrderProducts
}