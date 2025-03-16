const mongoose = require('mongoose');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const dotenv = require('dotenv');
const Order = require('../model/order');
const User = require('../model/user');
const Product = require('../model/product');
const Cart = require('../model/cart');
const Wallet = require('../model/wallet');


const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
  
 
const create_payment = async (req, res) => {
    try {
        const { total } = req.body;

        const userId = req.session.user.id;

        const options = {
            amount: Math.round(total * 100), 
            currency: "INR",
            receipt: `receipt_${userId}_${Date.now().toString().slice(-5)}`
        };

        const order = await instance.orders.create(options);
        return res.status(201).json({
            success: true,
            order: { key: process.env.RAZORPAY_KEY_ID, ...order }
        });
    } catch (err) {
        console.error("Error creating Razorpay order:", err);
        return res.status(500).json({ success: false, message: "Payment creation failed" });
    }
};


const verify_payment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature,  orderNumber } = req.body;
        
        const generated_signature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed"
            });
        }

        
        const order = await Order.findOne({ orderNumber })
        
        
        
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        
        order.payment.status = "Paid";
        order.payment.paymentId = razorpay_payment_id;
        order.payment.signature = razorpay_signature;
        order.orderStatus = "Confirmed"; 
        await order.save();

        return res.status(200).json({ success: true, message: "Payment verified successfully" });
    } catch (err) {
        console.error("Payment verification error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};


const createRetryPayment = async (req, res) => {
    try {
        const { orderId } = req.body; 

        
        const [orderIdValue, orderNumber] = orderId.split(",");

        
        const existingOrder = await Order.findById(orderIdValue);
        
        if (!existingOrder) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        
        

        
        const amount = existingOrder.total ? existingOrder.total * 100 : 0;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: "Invalid order amount." });
        }

        
        const razorpayOrder = await instance.orders.create({
            amount: amount, 
            currency: "INR",
            receipt: `retry_${orderNumber}`, 
            payment_capture: 1,
        });

        res.status(201).json({
            success: true,
            orderId: orderIdValue,  
            orderNumber: orderNumber,  
            order: {
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                key: process.env.RAZORPAY_KEY_ID
            }
        });
    } catch (error) {
        console.error("Error creating retry payment:", error);
        res.status(500).json({ success: false, message: "Error processing retry payment" });
    }
};


const verifyRetryPayment = async (req, res) => {
    try {
        const { razorpay_order_id, orderNumber, razorpay_payment_id, razorpay_signature } = req.body;

        if (!process.env.RAZORPAY_KEY_SECRET) {
            console.error("Razorpay Key Secret is missing!");
            return res.status(500).json({ success: false, message: "Server error: Missing Razorpay credentials." });
        }

        
        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        
        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: "Invalid payment signature." });
        }

       
        await Order.findOneAndUpdate(
            { orderNumber: orderNumber },
            { $set: { "payment.status": "Paid", "payment.method": "RAZORPAY" } }
        );

        res.status(200).json({ success: true, message: "Payment verified successfully." });
    } catch (error) {
        console.error("Error verifying retry payment:", error);
        res.status(500).json({ success: false, message: "Error verifying payment." });
    }
};







module.exports = {
    create_payment,
    verify_payment,
    createRetryPayment,
    verifyRetryPayment
  
   
};
