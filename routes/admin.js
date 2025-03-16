const express = require('express')
const router = express.Router()
const adminController = require('../controller/adminController')
const adminAuth = require('../middleware/adminAuth')
const multer = require('multer');
const upload =require('../config/multerConfig')
const categoryController = require('../controller/categoryController')
const customerController =require('../controller/customerController')
const couponController = require('../controller/couponController')
const  offerController = require('../controller/offerController')
const walletController = require('../controller/walletAdmin')
//login
router.get('/login',adminAuth.isLogin,adminController.loadLogin)
router.post('/login',adminAuth.isLogin,adminController.login)


//dashboard
router.get('/dashboard',adminAuth.isAdminAuthenticated,adminController.loadDashboard)
router.get('/sales-report',adminAuth.isAdminAuthenticated, adminController.loadSalesReport);
router.get('/sales-report-download',adminAuth.isAdminAuthenticated,adminController.downloadSalesReport)
router.get('/sales-report-data',adminAuth.isAdminAuthenticated,adminController.getSalesReport)

//products
router.get('/products',adminAuth.isAdminAuthenticated,adminController.products)
router.post('/products/add-product', upload.array('image'), adminController.addProduct);
router.get('/products/add-product', adminAuth.isAdminAuthenticated, adminController.showAddProduct);
router.get('/products/edit-products/:id',adminAuth.isAdminAuthenticated,adminController.showEditPro)
router.post('/products/edit-products/:id', upload.array('image'), adminController.editProduct);
router.post('/products/delete-products/:id',adminController.deleteProduct)
router.get('/products/search',adminAuth.isAdminAuthenticated,adminController.searchProducts)

//category
router.get('/category',adminAuth.isAdminAuthenticated,categoryController.showCategory)
router.get('/add-category',adminAuth.isAdminAuthenticated,categoryController.showAddCategory)
router.post('/add-category',upload.single('icon'),categoryController.addCategory)
router.get('/check-category',adminAuth.isAdminAuthenticated,categoryController.checkCategoryName)
router.get('/edit-category/:id',adminAuth.isAdminAuthenticated,categoryController.showEditCategory)
router.post('/edit-category/:id', upload.single('icon'), categoryController.editCategory);
router.post('/delete-category/:id',categoryController.deleteCategory)


//customers
router.get('/customers',adminAuth.isAdminAuthenticated,customerController.showcustomer)
router.patch('/status',customerController.userStatus)

//order
router.get('/order',adminAuth.isAdminAuthenticated,customerController.showOrderDetails)
router.get('/orderdetails/:id',adminAuth.isAdminAuthenticated,customerController.showEachOrder)
//router.post('/orderdetails/:id/status', customerController.updateOrderStatus)
router.post("/orderdetails/:orderId/product/:productId/status", customerController.updateProductStatus)
router.get('/order/:id/products',adminAuth.isAdminAuthenticated,customerController.getOrderProducts)

//coupon
router.get('/add-coupon',adminAuth.isAdminAuthenticated,couponController.showAddCoupon)
router.post('/add-coupon',couponController.addCoupon)
router.get('/coupon',adminAuth.isAdminAuthenticated,couponController.showCoupon)
router.delete('/delete-coupon/:id',couponController.deleteCoupon)
router.get('/edit-coupon/:id',adminAuth.isAdminAuthenticated,couponController.showEditCoupon)
router.post('/edit-coupon/:id',couponController.editCoupon)
router.patch('/toggle-coupon/:id',adminAuth.isAdminAuthenticated,couponController.toggleCouponStatus);


//offer
router.get('/add-offer',adminAuth.isAdminAuthenticated,offerController.showAddOffer)
router.post('/add-offer',offerController.addOffer)
router.get('/offer',adminAuth.isAdminAuthenticated,offerController.showOffer)
router.delete('/delete-offer/:id',offerController.deleteOffer)
router.patch('/toggle-offer-status/:id',offerController.toggleOfferStatus)
router.post('/change-password',adminAuth.isAdminAuthenticated,adminController.changePassword)
router.get('/settings',adminController.loadSettings)


//wallet
router.get('/wallet',adminAuth.isAdminAuthenticated,walletController.showWallet)
router.get('/transaction/:id',adminAuth.isAdminAuthenticated,walletController.transactionDetail)

//logout
router.get('/logout',adminController.logout)


module.exports = router