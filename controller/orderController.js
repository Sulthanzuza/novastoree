const User = require('../model/user')
const Address = require('../model/address')
const Cart = require('../model/cart')
const Product = require('../model/product')
const Order = require('../model/order')
const Coupon = require('../model/coupon')
const Razorpay = require('razorpay')
const Wallet = require('../model/wallet')
const PDFDocument = require("pdfkit");
const Offer= require('../model/offer')
const Category = require('../model/category')


const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const showCheckoutPage = async (req, res) => {
  try {
      const userId = req.session.user.id;
      const savedAddresses = await Address.find({ user: userId, deleted: false });
      const cart = await Cart.findOne({ user: userId }).populate('products.product');
     
      if (!cart || !cart.products.length) {
        return res.status(400).redirect('/cart'); 
    }

      let subtotal = 0;
      let discountedSubtotal = 0;
      let isFirstOrder = false;
      const now = new Date();
      
      const orderCount = await Order.countDocuments({  userId: userId });
      if (orderCount === 0) {
          isFirstOrder = true;
      }
      
      

      
      const user = await User.findById(userId);
      const isReferred = user.isReferred

      
      if (cart && cart.products.length) {
        for (const item of cart.products) {
            const variant = item.variant;
            const product = item.product;
            const originalPrice = variant.price * variant.quantity;
            let maxDiscount = 0; 

            
            if (product.offers) {
                const productOffer = await Offer.findOne({ name: product.offers, status: true });
                if (productOffer && new Date(productOffer.expiry) > now) {
                    const productDiscount = (variant.price * productOffer.discount) / 100;
                    if (productDiscount > maxDiscount) {
                        maxDiscount = productDiscount;
                    }
                }
            }

           
            const category = await Category.findOne({ name: product.category, isDeleted: false });
            if (category && category.offers) {
                const categoryOffer = await Offer.findOne({ name: category.offers, type: 'category', status: true });
                if (categoryOffer && new Date(categoryOffer.expiry) > now) {
                    const categoryDiscount = (variant.price * categoryOffer.discount) / 100;
                    if (categoryDiscount > maxDiscount) {
                        maxDiscount = categoryDiscount;
                    }
                }
            }

            const finalPrice = originalPrice - (maxDiscount * variant.quantity); 
            subtotal += originalPrice;
            discountedSubtotal += finalPrice;
        }
    }

      let discount = subtotal - discountedSubtotal; 
      const tax = (subtotal * 0.02).toFixed(2);
      let total = (discountedSubtotal + parseFloat(tax)).toFixed(2);

      
      if (isFirstOrder && isReferred) {
          const firstOrderDiscount = (subtotal * 0.10); 
          discountedSubtotal -= firstOrderDiscount; 
          discount += firstOrderDiscount; 
          total = (discountedSubtotal + parseFloat(tax)).toFixed(2); 
      }

      const coupons = await Coupon.find({ status: true }); 

      
      res.status(200).render('user/checkout-page', {
        title:"Checkout Page",
          savedAddresses,
          cart: cart ? cart.products : [],
          subtotal: subtotal.toFixed(2), 
          discount: discount.toFixed(2), 
          tax,
          total,
          coupons,
          firstOrderDiscount: isFirstOrder && isReferred ? (subtotal * 0.10).toFixed(2) : null, 
      });

  } catch (error) {
      console.error('Error loading checkout page:', error);
      res.status(500).send( {
          message: 'An error occurred while loading the checkout page. Please try again later.',
      });
  }
};

const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const cart = await Cart.findOne({ user: userId }).populate('products.product');

    if (!cart || cart.products.length === 0) {
      return res.status(400).send('Cart is empty.');
    }

    const {
      shipping: { fullName, phoneNumber, houseAddress, streetAddress, city, state, zipCode, country },
      payment,
      couponCode
    } = req.body;

    if (!fullName || !phoneNumber || !houseAddress || !streetAddress || !city || !state || !zipCode || !country) {
      return res.status(400).redirect('/checkout?error=All+shipping+fields+are+required.');
    }

   
    let subtotal = 0;
    let discountedTotal = 0;
    let isFirstOrder = false;
    
    
    const orderCount = await Order.countDocuments({  userId : userId });
    if (orderCount === 0) {
        isFirstOrder = true; 
    }
    
    
    const user = await User.findById(userId);
    const isReferred = user.isReferred;
    
    
    const cartProducts = cart.products.map(item => {
        const originalPrice = item.variant.price * item.variant.quantity;
        const discountedPrice = item.variant.discountedPrice
            ? item.variant.discountedPrice * item.variant.quantity
            : originalPrice;
    
        subtotal += originalPrice;
        discountedTotal += discountedPrice;
    
        return {
            productId: item.product._id,
            name: item.product.name,
            image: item.image,
            variants: [{
                size: item.variant.size,
                price: item.variant.price,
                quantity: item.variant.quantity,
            }],
            discount: originalPrice - discountedPrice,
        };
    });
    
    
    let couponDiscount = 0;
    let appliedCoupon = null;
    
    if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode, status: true });
        if (coupon) {
            couponDiscount = (subtotal * coupon.discountAmount) / 100;
            appliedCoupon = coupon;
        }
    }
    
    let discountedPrice = subtotal - discountedTotal;
    let allDiscount = discountedPrice + couponDiscount;
    const tax = parseFloat(((subtotal) * 0.02).toFixed(2));
    
   
    let total = (discountedTotal - couponDiscount + tax).toFixed(2);
    
    
    if (isFirstOrder && isReferred) {
        const firstOrderDiscount = (subtotal * 0.10); 
        discountedTotal -= firstOrderDiscount; 
        allDiscount += firstOrderDiscount; 
        total = (discountedTotal + parseFloat(tax)).toFixed(2);
    }

    
    const shippingAddress = { fullName, phoneNumber, houseAddress, streetAddress, city, state, zipCode, country };

    
    const generateOrderNumber = () => Math.random().toString(36).substring(2, 12).toUpperCase();
    let orderNumber = generateOrderNumber();

    while (await Order.findOne({ orderNumber: orderNumber })) {
      orderNumber = generateOrderNumber();
    }

    
    if (payment.method === 'COD') {
      const newOrder = new Order({
        userId: userId,
        orderNumber: orderNumber,
        products: cartProducts,
        shippingAddress: shippingAddress,
        payment: { method: 'COD', status: 'Paid' },
        subtotal: subtotal.toFixed(2),
        coupon: appliedCoupon ? { code: appliedCoupon.code, discount: couponDiscount } : null,
        tax,
        discount: (allDiscount).toFixed(2), 
        total,
        orderStatus: 'Pending',
      });

      await newOrder.save();
    }

    if (payment.method === 'RAZORPAY') {
      const razorpayOrder = await instance.orders.create({
        amount: Math.round(total * 100),
        currency: 'INR',
        receipt: `receipt_${orderNumber}`,
        payment_capture: 1,
      });

      const newOrder = new Order({
        userId: userId,
        orderNumber: orderNumber,
        products: cartProducts,
        shippingAddress: shippingAddress,
        payment: { method: 'RAZORPAY', status: 'Pending', orderId: razorpayOrder.id },
        subtotal: subtotal.toFixed(2),
        coupon: appliedCoupon ? { code: appliedCoupon.code, discount: couponDiscount } : null,
        tax,
        discount: (allDiscount).toFixed(2), 
        total,
        orderStatus: 'Pending',
      });

      await newOrder.save();
      for (const item of cartProducts) {
        const product = await Product.findById(item.productId);
        if (product) {
          const variant = product.variants.find(v => v.size === item.variants[0].size);
          if (variant) {
            variant.quantity -= item.variants[0].quantity;
            await product.save();
          }
        }
      }
  
      
      if (appliedCoupon) {
        if (appliedCoupon.usageType === 'single') {
          appliedCoupon.status = false;
        }
        appliedCoupon.limit -= 1;
        await appliedCoupon.save();
      }
  
      
      await Cart.deleteOne({ user: userId });

      return  res.status(200).json({
        success: true,
        orderId: razorpayOrder.id,
        orderNumber: orderNumber,
        amount: Math.round(total * 100),
        currency: 'INR',
        key: process.env.RAZORPAY_KEY_ID,
        user: { name: fullName, email: req.session.user.email, phone: phoneNumber },
      });
    }

    if (payment.method === 'WALLET') {
      const wallet = await Wallet.findOne({ userId: userId });
    
      if (!wallet) {
        return res.status(404).redirect('/checkout?error=Wallet+not+found.');
      }
    
      if (wallet.balance < total) {
        return res.status(400).redirect('/checkout?error=Insufficient+wallet+balance.');
      }
    
      
      wallet.balance -= parseFloat(total);
    
      
      wallet.transactions.push({
        amount: parseFloat(total),
        type: 'Debit',
        description: `Order Payment - ${orderNumber}`
      });
    
      await wallet.save();
    
      
      const newOrder = new Order({
        userId: userId,
        orderNumber: orderNumber,
        products: cartProducts,
        shippingAddress: shippingAddress,
        payment: { method: 'WALLET', status: 'Paid' },
        subtotal: subtotal.toFixed(2),
        coupon: appliedCoupon ? { code: appliedCoupon.code, discount: couponDiscount } : null,
        tax,
        discount: allDiscount.toFixed(2),
        total,
        orderStatus: 'Pending',
      });
    
      await newOrder.save();
    }
   
    for (const item of cartProducts) {
      const product = await Product.findById(item.productId);
      if (product) {
        const variant = product.variants.find(v => v.size === item.variants[0].size);
        if (variant) {
          variant.quantity -= item.variants[0].quantity;
          await product.save();
        }
      }
    }

    
    if (appliedCoupon) {
      if (appliedCoupon.usageType === 'single') {
        appliedCoupon.status = false;
      }
      appliedCoupon.limit -= 1;
      await appliedCoupon.save();
    }

    
    await Cart.deleteOne({ user: userId });

    res.status(200).redirect('/order-success');
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).redirect('/checkout?error=An+error+occurred+while+placing+the+order.');
  }
};




const validateCoupon = async (req, res) => {
  try {
      const { couponCode, subtotal,total} = req.body;
     
      const userId = req.session.user.id;

      if (!couponCode) {
          return res.status(400).json({ valid: false, message: "Coupon code is required." });
      }

      
      const coupon = await Coupon.findOne({ code: couponCode });

      if (!coupon) {
          return res.status(400).json({ valid: false, message: "Invalid coupon code." });
      }

      
      if (!coupon.status) {
          return res.status(400).json({ valid: false, message: "This coupon is no longer active." });
      }

      
      const currentDate = new Date();
      if (currentDate < new Date(coupon.start) || currentDate > new Date(coupon.expiry)) {
          return res.status(400).json({ valid: false, message: "Coupon is expired or not yet valid." });
      }

      
      if (total < coupon.minAmount) {
          return res.status(400).json({ valid: false, message: `Minimum order amount should be ₹${coupon.minAmount}.` });
      }
      if (total > coupon.maxAmount) {
        return res.status(400).json({ valid: false, message: `Maximum order amount should be in range of ₹${coupon.maxAmount}.` });
    }

      
      let discountAmount = (total * coupon.discountAmount) / 100;
      if (discountAmount > coupon.maxAmount) {
          discountAmount = coupon.maxAmount;
      }

      
      const usageCount = await Order.countDocuments({ couponCode: coupon.code });

      if (usageCount >= coupon.limit) {
          return res.status(400).json({ valid: false, message: "Coupon usage limit reached." });
      }

      
      if (coupon.usageType === 'single') {
          const userUsed = await Order.findOne({ userId, couponCode: coupon.code });

          if (userUsed) {
              return res.status(400).json({ valid: false, message: "You have already used this coupon." });
          }
      }

      
      return res.status(200).json({
          valid: true,
          discountAmount: discountAmount.toFixed(2),  
          maxAmount: coupon.maxAmount,
          message: `Coupon applied successfully! You saved ₹${discountAmount.toFixed(2)}.`
      });

  } catch (error) {
      console.error('Coupon validation error:', error);
      return res.status(500).json({ valid: false, message: "Server error. Please try again." });
  }
};



const showOrder = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const limit = 10;
    const page = parseInt(req.query.page) || 1;

    const totalOrders = await Order.countDocuments({ userId: userId });

    const orders = await Order.find({ userId: userId,"payment.status":"Paid" })
      .populate('products.productId')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const formattedOrders = orders.map((order) => {
      const products = order.products.map((product) => ({
        productId: product.productId,
        productImage: product.image,
        productName: product.name,
        productPrice: product.variants[0].price,
      }));

      const mainProduct = products[0];
      const extraProductsCount = products.length - 1;

      return {
        orderId: order._id,
        createdAt: new Date(order.createdAt).toLocaleDateString('en-US'),
        orderStatus: order.orderStatus,
        mainProduct,
        extraProductsCount,
        totalPrice: order.total,  
        isCancellable: ['Pending', 'Processing'].includes(order.orderStatus),
      };
    });

    const totalPages = Math.ceil(totalOrders / limit);

    res.status(200).render('user/user-order', {
      title:"Orders",
      orders: formattedOrders,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error(`Error fetching order details for user ${req.session.user.id}:`, error);
    res.status(500).send('An error occurred while fetching order details.');
  }
};

const showSuccess = async (req,res)=>{
  res.status(200).render('user/succes-order',{title:"Order Success "})
}




const orderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId)
      .populate('products.productId', 'name image')
      .exec();


    res.status(200).render('user/order-details', { 
      title:"Order Details",
      orderNumber: order.orderNumber,
      createdAt: order.createdAt.toLocaleDateString(),
      orderId: orderId, 
      products: order.products.map(product => ({
        productId: product.productId._id,  
        variantId: product.variants.map(variant => variant._id), 
        name: product.productId.name,
        image: product.productId.image[0],
        variants: product.variants,
        discount: product.discount,
        productStatus: product.productStatus
      })),
      shippingAddress: order.shippingAddress,
      subtotal: order.subtotal.toFixed(2),
      tax: order.tax.toFixed(2),
      discount: order.discount.toFixed(2),
      total: order.total.toFixed(2),
      
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

const cancelProduct = async (req, res) => {
  const { orderId, productId, variantId } = req.params
const reason = req.body.reason;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

   
    const product = order.products.find(p => 
      p.productId.toString() === productId && 
      p.variants.some(v => v._id.toString() === variantId)
    );

    if (!product) return res.status(404).json({ message: "Product with the specified variant not found in order" });

   
    const variant = product.variants.find(v => v._id.toString() === variantId);
    if (!variant) return res.status(404).json({ message: "Variant not found in order" });

    
    if (product.productStatus !== "Processing" && product.productStatus !== "Pending") {
      return res.status(400).json({ message: "Product cannot be canceled at this stage" });
    }

    
    const productInDB = await Product.findById(product.productId);
    if (productInDB) {
      const variantInDB = productInDB.variants.find(v => v.size === variant.size); 
      if (variantInDB) {
        variantInDB.quantity += variant.quantity; 
        await productInDB.save();
      }
    }
    product.reason=reason
  
    product.productStatus = "Cancelled";
    order.orderStatus ="Cancelled";
    await order.save();

    
    if (order.payment.method === "RAZORPAY" ||order.payment.method === "WALLET") {
      let wallet = await Wallet.findOne({ userId: order.userId });

      if (!wallet) {
       
        wallet = new Wallet({
          userId: order.userId,
          balance: 0,
          transactions: []
        });
      }

      let refundAmount = variant.price * variant.quantity;

      
      if (product.discount) {
        refundAmount -= product.discount
      }

      
      if (order.coupon && order.coupon.discount > 0) {
        const totalDiscount = order.coupon.discount;
        const totalOrderPrice = order.subtotal; 
        const productContribution = (variant.price * variant.quantity) / totalOrderPrice;
        const couponDiscountForProduct = totalDiscount * productContribution;
        refundAmount -= couponDiscountForProduct;
      }

     
      refundAmount = Math.max(refundAmount, 0);

      
      wallet.balance += refundAmount;

      
      wallet.transactions.push({
        amount: refundAmount,
        type: "Credit",
        description: `Refund for cancelled product: ${product.name} ${order.orderNumber}`
      });

      await wallet.save();
    }

    res.status(200).json({ message: "Product cancelled successfully, stock restored, and refund processed if applicable" });
  } catch (error) {
    console.error("Error cancelling product:", error);
    res.status(500).json({ message: "Server error while cancelling product" });
  }
};

const returnProduct = async (req, res) => {
  const { orderId, productId, variantId } = req.params;
  const { reason } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    
    const product = order.products.find(
      (p) => p.productId.toString() === productId && 
             p.variants.some((v) => v._id.toString() === variantId)
    );

    if (!product) return res.status(404).json({ message: "Product not found in order" });

    const variant = product.variants.find((v) => v._id.toString() === variantId);
    if (!variant) return res.status(404).json({ message: "Variant not found in order" });

    
    if (product.productStatus !== "Delivered") {
      return res.status(400).json({ message: "Only delivered products can be returned" });
    }

   
    product.productStatus = "Returned";
    product.reason = reason; 
    order.orderStatus = "Returned"; 

    await order.save();

    res.status(200).json({ message: "Return request submitted. Awaiting admin approval." });
  } catch (error) {
    console.error("Error returning product:", error);
    res.status(500).json({ message: "Server error while processing return request" });
  }
};


const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId)
      .populate("products.productId")
      .populate("coupon");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

   
    const deliveredProducts = order.products.filter(
      (item) => item.productStatus === "Delivered"
    );

    if (deliveredProducts.length === 0) {
      return res.status(400).json({
        message: "No delivered products found in this order for invoice generation.",
      });
    }

    
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      bufferPages: true, 
      info: {
        Title: `Invoice #${order.orderNumber}`,
        Author: 'Nova Store',
      }
    });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice_${order.orderNumber}.pdf`
    );
    doc.pipe(res);

    // Helper function to add header to each page
    const addHeader = () => {
      // Company logo and information
      
      doc.fontSize(20).text('Nova Store', 50, 65, { bold: true });
      doc.fontSize(10).text('123 Business Street, City, Country', 50, 90);
      doc.fontSize(10).text('Email: contact@novastore.com | Phone: +1 234 567 8900', 50, 105);
      
      // Add a horizontal line
      doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, 125).lineTo(550, 125).stroke();
    };

    // Helper function to add footer to each page
    const addFooter = (pageNumber) => {
      const footerTop = 750;
      doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, footerTop).lineTo(550, footerTop).stroke();
      doc.fontSize(10).fillColor('#555555').text(`Page ${pageNumber}`, 50, footerTop + 15, { align: 'center', width: 500 });
    };

    // First page header
    addHeader();

    // Invoice title and number
    doc.fontSize(24).text('INVOICE', 50, 140, { bold: true });
    doc.fontSize(10).text('INVOICE #:', 430, 140);
    doc.fontSize(10).text(`${order.orderNumber}`, 500, 140, { align: 'right' });
    
    // Dates
    const currentDate = new Date().toLocaleDateString();
    doc.fontSize(10).text('DATE:', 430, 155);
    doc.fontSize(10).text(`${currentDate}`, 500, 155, { align: 'right' });
    
    doc.fontSize(10).text('ORDER DATE:', 430, 170);
    doc.fontSize(10).text(`${new Date(order.createdAt).toLocaleDateString()}`, 500, 170, { align: 'right' });
    
   

    // Customer Information Section
    doc.fontSize(14).text('Bill To:', 50, 195);
    doc.fontSize(10).text(`${order.shippingAddress.fullName}`, 50, 215);
    doc.fontSize(10).text(`${order.shippingAddress.houseAddress}, ${order.shippingAddress.streetAddress}`, 50, 230);
    doc.fontSize(10).text(`${order.shippingAddress.city}, ${order.shippingAddress.state}, ${order.shippingAddress.zipCode}`, 50, 245);
    doc.fontSize(10).text(`${order.shippingAddress.country}`, 50, 260);
    doc.fontSize(10).text(`Phone: ${order.shippingAddress.phoneNumber}`, 50, 275);

    // Payment information
    doc.fontSize(14).text('Payment Method:', 300, 195);
    doc.fontSize(10).text(`${order.payment.method}`, 300, 215);
    doc.fontSize(10).text(`Status: ${order.payment.status}`, 300, 230);

    // Add a horizontal line
    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, 300).lineTo(550, 300).stroke();

    // Products table header
    let tableTop = 320;
    const drawTableHeader = (y) => {
      doc.fontSize(10).fillColor('#444444').text('Item', 50, y);
      doc.text('Variants', 150, y);
      doc.text('Quantity', 250, y, { width: 90, align: 'center' });
      doc.text('Price (Rs.)', 340, y, { width: 90, align: 'right' });
      doc.text('Total (Rs.)', 450, y, { width: 90, align: 'right' });
      
      // Add a horizontal line for table header
      doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, y + 15).lineTo(550, y + 15).stroke();
      
      return y + 30; // Return the y position after the header
    };
    
    let y = drawTableHeader(tableTop);
    let pageNumber = 1;
    const itemHeight = 70; // Estimated height per item with variants
    const pageBreakY = 700; // When to break to a new page
    let totalQuantity = 0;
    let deliveredSubtotal = 0;

    // Draw each delivered product
    for (let i = 0; i < deliveredProducts.length; i++) {
      const item = deliveredProducts[i];
      
      // Check if we need a new page
      if (y + itemHeight > pageBreakY) {
        addFooter(pageNumber);
        pageNumber++;
        doc.addPage();
        addHeader();
        y = drawTableHeader(140); // Start table after header on new page
      }
      
      let itemQuantity = 0;
      let itemTotal = 0;
      
      // Calculate total quantity and price for this item
      item.variants.forEach(variant => {
        itemQuantity += variant.quantity;
        itemTotal += variant.price * variant.quantity;
      });
      totalQuantity += itemQuantity;
      deliveredSubtotal += itemTotal;
      
      
      doc.fontSize(10).fillColor('#444444');
      doc.text(item.name, 50, y, {
        width: 100,       
        align: 'left',    
        lineBreak: true 
      });
      
      // Variants
      let variantText = '';
      item.variants.forEach(variant => {
        variantText += `Size: ${variant.size}, Qty: ${variant.quantity}\n`;
      });
      doc.text(variantText, 150, y);
      
      // Quantity
      doc.text(itemQuantity.toString(), 250, y, { width: 90, align: 'center' });
      
      // Unit Price (using first variant price for simplicity)
      const unitPrice = item.variants[0]?.price || 0;
      doc.text(`${unitPrice}`, 340, y, { width: 90, align: 'right' });
      
      // Item Total Price
      doc.text(`${itemTotal}`, 450, y, { width: 90, align: 'right' });
      
      // Add a light separator line between items
      y += itemHeight - 10;
      doc.strokeColor('#dddddd').lineWidth(0.5).moveTo(50, y - 10).lineTo(550, y - 10).stroke();
    }

    // Check if we need a new page for the summary
    if (y + 150 > pageBreakY) {
      addFooter(pageNumber);
      pageNumber++;
      doc.addPage();
      addHeader();
      y = 140; // Start summary after header on new page
    } else {
      // Add a closing line for the items table
      doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, y + 10).lineTo(550, y + 10).stroke();
      y += 30;
    }

    // Calculate adjusted values for delivered items only
    // Using a simple ratio of delivered subtotal to original subtotal
    const deliveryRatio = deliveredSubtotal / order.subtotal;
    const adjustedDiscount = order.discount * deliveryRatio;
    const adjustedTax = order.tax * deliveryRatio;
    const adjustedTotal = deliveredSubtotal - adjustedDiscount + adjustedTax;

    // Summary section
    doc.fontSize(10).text('Subtotal (Delivered Items):', 350, y);
    doc.text(`Rs. ${deliveredSubtotal.toFixed(2)}`, 500, y, { align: 'right' });
    
    // Coupon and discounts
    y += 20;
    doc.text('Applied Discount:', 350, y);
    doc.text(`Rs. ${adjustedDiscount.toFixed(2)}`, 500, y, { align: 'right' });
    
    // Tax
    y += 20;
    doc.text('Tax:', 350, y);
    doc.text(`Rs. ${adjustedTax.toFixed(2)}`, 500, y, { align: 'right' });
    
    // Line for grand total
    y += 20;
    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(350, y).lineTo(550, y).stroke();
    
    // Grand total
    y += 15;
    doc.fontSize(14).fillColor('#000000').text('GRAND TOTAL:', 350, y);
    doc.text(`Rs. ${adjustedTotal.toFixed(2)}`, 500, y, { align: 'right' });

    // Order information note
    y += 50;
    doc.fontSize(10).fillColor('#555555');
    doc.text('Note: This invoice only includes delivered items from order #' + order.orderNumber, 50, y, { 
      width: 500, 
      align: 'center',
      highlight: true,
      underline: true
    });
    
    // Footer for the last page
    y += 40;
    
    if (y + 100 > pageBreakY) {
      addFooter(pageNumber);
      pageNumber++;
      doc.addPage();
      addHeader();
      y = 200;
    }
    
    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
    y += 15;
    
    doc.fontSize(10).fillColor('#555555').text('Payment is due within 15 days. Thank you for your business.', 50, y, { align: 'center', width: 500 });
    y += 15;
    doc.fontSize(10).text('For questions concerning this invoice, please contact customer@yourcompany.com', 50, y, { align: 'center', width: 500 });
    y += 25;
    
    
    doc.fontSize(10).fillColor('#333333').text('www.yourcompany.com', 50, y, { align: 'center', width: 500 });

    
    addFooter(pageNumber);

    
    doc.end();
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


const loadPendingOrder = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const page = parseInt(req.query.page) || 1; 
    const limit = 5; 
    const skip = (page - 1) * limit; 

    const orders = await Order.find({
      userId: userId,
      "payment.method": "RAZORPAY",
      "payment.status": "Pending"
    })
      .populate('products.productId') 
      .skip(skip)
      .limit(limit); 

    const totalOrders = await Order.countDocuments({
      userId: userId,
      "payment.method": "RAZORPAY",
      "payment.status": "Pending"
    });

    const totalPages = Math.ceil(totalOrders / limit); 

    res.status(200).render('user/pending-order', { 
      order:"Pending Order",
      orders, page, totalPages });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};







module.exports = {
    showCheckoutPage,
    placeOrder,
    showOrder,
    showSuccess,
    //orderCancel,
    orderDetails,
    validateCoupon,
    //orderReturn,
    cancelProduct,
    returnProduct,
    generateInvoice,
    loadPendingOrder
    

}