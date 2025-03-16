const Wallet = require('../model/wallet');
const Order = require('../model/order');
const User = require('../model/user')


const showWallet = async (req, res) => {
    try {
    
      const wallets = await Wallet.find()
        .populate('userId', 'firstName lastName email')
        .sort({ 'transactions.createdAt': -1 });
  
     
      const transactionData = [];
      wallets.forEach(wallet => {
        wallet.transactions.forEach(transaction => {
          transactionData.push({
            _id:transaction._id,
            transactionId: transaction.transactionId,
            transactionDate: transaction.createdAt,
            user: `${wallet.userId.firstName} ${wallet.userId.lastName}`,
            email: wallet.userId.email,
            type: transaction.type,
            amount: transaction.amount,
            description: transaction.description
          });
        });
      });
  
      transactionData.sort((a, b) => b.transactionDate - a.transactionDate);
  
    
      res.status(200).render('admin/wallet', {
        transactions: transactionData,
        title: 'Wallet Management'
      });
  
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      res.status(500).send('Internal Server Error');
    }
  }



  const transactionDetail = async (req, res) => {
    try {
        const { id } = req.params;
        
       
        const wallet = await Wallet.findOne({ 'transactions._id': id })
            .populate('userId', 'firstName lastName email');
        
        if (!wallet) {
            return res.status(404).send('Transaction not found');
        }
        
      
        const transaction = wallet.transactions && Array.isArray(wallet.transactions)
            ? wallet.transactions.find(tx => tx._id.toString() === id)
            : null;
        
        if (!transaction) {
            return res.status(404).send('Transaction not found');
        }
        
        let order = null;
        let orderButton = null;
        let transactionType = 'Regular Transaction';
        let description = transaction.description.toLowerCase();
        
       
        if (description.includes('order payment')) {
            transactionType = 'Debited';
            
          
            const words = transaction.description.split(' ');
            const orderNumber = words[words.length - 1];
            
            if (orderNumber) {
                order = await Order.findOne({ 'orderNumber': orderNumber });
                
                if (order) {
                    orderButton = `/admin/orderdetails/${order._id}`;
                }
            }
        }
       
        else if (description.includes('referral')) {
            transactionType = 'Referral Bonus';
        }
      
        else if (description.includes('added')) {
            transactionType = 'Wallet Recharge';
        }
    
        else if (description.includes('returned')) {
            transactionType = 'Order Returned';
            
            
            const words = transaction.description.split(' ');
            const orderNumber = words[words.length - 1];
            
            if (orderNumber) {
                order = await Order.findOne({ 'orderNumber': orderNumber });
                
                if (order) {
                    orderButton = `/admin/orderdetails/${order._id}`;
                }
            }
        }
        
        else if (description.includes('cancelled')) {
            transactionType = 'Order Cancelled';
            
            
            const words = transaction.description.split(' ');
            const orderNumber = words[words.length - 1];
            
            if (orderNumber) {
                order = await Order.findOne({ 'orderNumber': orderNumber });
                
                if (order) {
                    orderButton = `/admin/orderdetails/${order._id}`;
                }
            }
        }
      
        else if (description.includes('refund') || description.includes('cancellation')) {
            const orderNumber = transaction.description.split('#')[1];
            
            if (orderNumber) {
                order = await Order.findOne({ 'orderNumber': orderNumber });
                
                if (order) {
                    orderButton = `/admin/orderdetails/${order._id}`;
                    transactionType = order.status === 'Cancelled' ? 'Order Cancelled' : 'Order Returned';
                }
            }
        }
        
     
        res.status(200).render('admin/transactionDetails', {
            user: wallet.userId,
            transaction: {
                transaction,
                orderButton,
                transactionType
            },
            title: 'Transaction Details'
        });
        
    } catch (error) {
        console.error('Error fetching transaction:', error);
        res.status(500).send('Internal Server Error');
    }
};
  
  

const showTransactionDetails = 
  module.exports={
    showWallet,
    transactionDetail
  }
  