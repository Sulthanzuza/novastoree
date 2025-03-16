const Wallet = require('../model/wallet');
const User = require('../model/user');
const moment = require('moment');
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const showWallet = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const user = await User.findById({ _id: userId });
        let wallet = await Wallet.findOne({ userId: userId });

        if (!wallet) {
            wallet = new Wallet({ userId: userId, balance: 0, transactions: [] });
            await wallet.save();
        }

        
        wallet.transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
        res.status(200).render('user/wallet', { user, wallet,
            title:"Wallet"
         });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

const createOrder =  async (req, res) => {
    const { amount } = req.body; 
    
   
    const options = {
      amount: amount * 100, 
      currency: "INR",
      receipt: `receipt_order_${Math.random()}`,
      payment_capture: 1,
    };
  
    try {
      const order = await razorpay.orders.create(options);
      res.status(200).json(order);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

const shareKey = ( req, res) => {
    res.status(200).json({ key: process.env.RAZORPAY_KEY_ID }); 
  }
  const updateWalletBalance = async (req, res) => {
    try {
        const { amount } = req.body;  
        const userId = req.session.user.id;
        let wallet = await Wallet.findOne({ userId: userId });

        if (!wallet) {
            wallet = new Wallet({ user_id: userId, balance: 0, transactions: [] });
        }

        
        wallet.balance += parseFloat(amount);

      
        wallet.transactions.push({
            type: 'Credit',
            amount: parseFloat(amount),
            description: `Added Rs. ${amount} to wallet`,
            createdAt: new Date(),
        });

        await wallet.save();

        
        res.status(200).json({ success: true, balance: wallet.balance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports={
    showWallet,
    createOrder,
    shareKey,
    updateWalletBalance
}