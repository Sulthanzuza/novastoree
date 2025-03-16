const express = require('express');
const router = express.Router();
const userController =require('../controller/userController')
const auth = require('../middleware/auth')
const passport = require('passport');
const userProductsController = require('../controller/userProductsController')
const profileController = require('../controller/profileController')
const orderController = require('../controller/orderController')
const wishlistController = require('../controller/wishlistController')
const walletController = require('../controller/walletController')
const paymentController = require('../controller/paymentController')
const refferalController = require('../controller/refferalController')
const reviewController = require('../controller/reviewController')
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 5, 
  handler: (req, res) => {
    res.status(429).render('user/error', { message: "Too many failed login attempts. Please try again later." });
  }
});

//error
router.get('/error',userController.showError)


//login and signup
router.get('/login',auth.checkSession,userController.loadLogin)
router.post('/login',authLimiter,userController.login)
router.get('/signup',auth.checkSession,userController.loadRegister)
router.post('/signup',authLimiter,userController.registerUser)
router.get('/verify-otp',userController.loadotpPage)
router.post('/verify-otp',userController.verifyRegisterOtp)
router.post('/verify-otp/resend',userController.resendRegisterOtp)
router.get('/forgot-password',userController.forgotpassword)
router.post('/forgot-password',userController.forgot)
router.get('/otp',userController.showotp)
router.post('/otp',userController.verifyOtp)
router.post('/otp/reset',userController.resendOtp)
router.get('/reset',userController.loadReset)
router.post('/reset',userController.resetPass)
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/user/login' }),
  (req, res) => {
    req.session.user = {
      id: req.user.id, 
      email: req.user.email,
    };
    res.redirect('/user/home'); }
);


//logout
router.get('/logout',userController.logout)

//profile
router.get('/profile',auth.isLogin,profileController.showProfile)
router.get('/edit-profile',auth.isLogin ,profileController.showEditProfile)
router.post('/edit-profile',profileController.editProfile)
router.get('/change-password',auth.isLogin,profileController.showChangePassword)
router.post('/change-password',profileController.changePassword)




//home
router.get('/home',auth.isLogin,userProductsController.loadHome)




//product details
router.get('/product/:id/:variant_id',auth.isLogin,userProductsController.showProductDetails)
router.get('/list-products',auth.isLogin,userProductsController.showListProducts)
router.get('/search',auth.isLogin,profileController.showSearch)



//address
router.get('/add-address',profileController.showAddAddress)
router.post('/add-address',auth.isLogin ,profileController.addAddress )
router.get('/edit-address/:id',auth.isLogin,profileController.showEditAddress)
router.post('/edit-address/:id',profileController.editAddress)
router.post('/delete-address/:id', profileController.deleteAddress);
router.get('/address',auth.isLogin,profileController.showAddress)



//order
router.get('/order',auth.isLogin,orderController.showOrder)
router.get('/order-success',auth.isLogin,orderController.showSuccess)
// router.post('/cancel-order/:orderId', orderController.orderCancel);
// router.post('/return-order/:id',orderController.orderReturn)
router.get('/order-details/:id',auth.isLogin,orderController.orderDetails)
router.post('/cancel-product/:orderId/:productId/:variantId', orderController.cancelProduct)
router.post('/return-product/:orderId/:productId/:variantId',orderController.returnProduct)





//cart
router.get('/cart',auth.isLogin, profileController.showCart)
router.post('/addtocart',profileController.addToCart)
router.post('/update-cart',profileController.updateCart)
router.delete('/remove-cart/:id',profileController.removeFromCart)
router.get('/cart-data',auth.isLogin,profileController.getCartData)

//checkout
router.get('/checkout',auth.isLogin, orderController.showCheckoutPage)
router.post('/checkout',orderController.placeOrder)



//coupon
router.post('/validate-coupon',orderController.validateCoupon)



//wishlist
router.get('/wishlist',auth.isLogin,wishlistController.loadWishlist)
router.post('/wishlist/add-product',wishlistController.addWishlist)
//router.post('/wishlist/add',wishlistController.addWishList)
router.post('/wishlist/add-to-cart',wishlistController.addToCart)
router.post('/wishlist/remove',wishlistController.removeFromWishlist)



//wallet
router.get('/wallet',auth.isLogin,walletController.showWallet)
router.post('/create-payment',auth.isLogin,paymentController.create_payment)
router.post('/verify-payment',auth.isLogin,paymentController.verify_payment)
router.post('/retry-payment', paymentController.createRetryPayment);
router.post('/verify-retry-payment',paymentController.verifyRetryPayment)
router.post('/create-order',walletController.createOrder)
router.get('/razorpay-key',walletController.shareKey)
router.post('/update-wallet',walletController.updateWalletBalance)

// router.put('/set-payment-status',auth.isLogin,paymentController.set_payment_status)

//refferal 
router.get('/referral',auth.isLogin,refferalController.getReferralCode)


//invoice
router.get("/invoice/:orderId",orderController.generateInvoice);
router.get('/pending-order',auth.isLogin,orderController.loadPendingOrder);

//review
router.post('/submit-review',auth.isLogin,reviewController.submitReview);
router.post('/reviews/:reviewId/reply', reviewController.addReply);
router.get('/reviews', auth.isLogin,reviewController.review);
router.get('/replies/:reviewId',auth.isLogin,reviewController.reply)



//about
router.get('/about',auth.isLogin,profileController.showAbout)
router.get('/cart/count',auth.isLogin,profileController.cartCount)

module.exports = router;
