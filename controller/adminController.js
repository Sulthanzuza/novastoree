const adminModel = require('../model/admin');
const bcrypt = require('bcryptjs');
const userModel = require('../model/user');
const Product = require('../model/product')
const Offer = require('../model/offer')
const Category = require('../model/category')
const Order = require('../model/order')
const xl = require('excel4node');

const PDFDocument = require('pdfkit');
const User = require('../model/user')
const Admin = require('../model/admin')
    



const loadLogin =  (req, res) => {
     res.status(200).render('admin/login',{title:"Login"});
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;


    if (!email || !password) {
      return res.status(400).render('admin/login', { message: 'Email and password are required.' });
    }



    
    
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email.trim() || !emailPattern.test(email.trim())) {
      return res.status(400).render('admin/login', { message: 'Please enter a valid email address.' });
    }

    
    
    const admin = await adminModel.findOne({ email: email.trim() });
    if (!admin) {
      return res.status(404).render('admin/login', { message: 'No user found with this email.' });
    }

    
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).render('admin/login', { message: 'Incorrect password.' });
    }

    
    req.session.admin = true; 
    res.status(200).redirect('/admin/dashboard'); 
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).render('admin/login', { message: 'An unexpected error occurred. Please try again.' });
  }
};



const showAddProduct = async (req, res) => {
  try {
     
       
    const categories = await Category.find({isDeleted:false}).sort({name:1})
    const offers = await Offer.find({status:true, type: "products" })

    
    return res.status(200).render('admin/addproducts', {
      title:" Add Products",
      categories: categories,
      offers: offers,
      
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving product data');
  }
};


const addProduct = async (req, res) => {
  try {
    const { name, description, category, offers, stock } = req.body;

   
    if (!name || !description || !category) {
      return res.status(400).send('All fields except offers are required.');
    }

   
    const variantNames = req.body.variant || [];
    const variantPrices = req.body.price || [];
    const variantQuantities = req.body.quantity || [];

    const parsedVariants = variantNames.map((size, index) => {
      const price = Number(variantPrices[index]);
      const quantity = Number(variantQuantities[index]);

      if (!size || isNaN(price) || isNaN(quantity)) {
        throw new Error(`Invalid data for variant at index ${index}`);
      }

      return { size: size.trim(), price, quantity };
    });

    if (parsedVariants.length === 0) {
      return res.status(400).send('At least one variant is required.');
    }

    const images = req.files || [];
    if (!images.length) {
      return res.status(400).send('Product image is required.');
    }



    if (offers && offers !== "No Offer") {
      const offerExists = await Offer.findOne({ 
        name: offers, 
        status: true, 
        start: { $lte: new Date() }, 
        expiry: { $gte: new Date() } 
      });

      if (offerExists) {
        productDiscount = offerExists.discount;
      }
    }

    
   
    const newProduct = new Product({
      name,
      description,
      category,
      offers: offers !== "No Offer" ? offers : null,
      variants: parsedVariants,
      image: images.map(file => file.filename),
      stockStatus: stock === 'true' ? 'true' : 'false',
    });

    await newProduct.save();
    
    return res.status(201).redirect('/admin/products');
  } catch (error) {
    console.error('Error saving product:', error);
    res.status(500).send(error.message);
  }
};




const products = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20; 
    const skip = (page - 1) * limit;

    const totalProducts = await Product.countDocuments({ deleted: false });
    const products = await Product.find({ deleted: false })
      .skip(skip)
      .limit(limit);

    return res.status(200).render('admin/products', { 
      title: "Products",
      products,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to load products');
  }
}

const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { deleted: true });
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting product' });
  }
};


const searchProducts = async (req, res) => {
  try {
    const searchQuery = req.query.q;
    
   
    const products = await Product.find({
      deleted: false,
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { category: { $regex: searchQuery, $options: 'i' } }
      ]
    });
    
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error searching products' });
  }
};


const showEditPro = async (req, res) => {
  try {
    
    const product = await Product.findById(req.params.id);
    if (!product) {
    
      return res.status(404).send('Product not found');
    }
    

     
    const categories = await Category.find({isDeleted:false})
    const offers = await Offer.find({status:true, type: "products" }) 


    

    
    return res.status(200).render('admin/editprod', {
      title:"Edit Products",
      product: product,
      categories: categories,
      offers: offers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving product data');
  }
};



const editProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const { removedImages, name, category, offer, description, stock, variants } = req.body;

    if (name) product.name = name;
    if (category) product.category = category;
    if (description) product.description = description;
    if (stock) product.stockStatus = stock === 'true' ? 'true' : 'false';


    if (offer && offer !== "No Offer") {
      const offerExists = await Offer.findOne({
        name: offer,
        status: true,
        start: { $lte: new Date() },
        expiry: { $gte: new Date() }
      });

      if (offerExists) {
        product.offers = offerExists.name;
        productDiscount = offerExists.discount;
      } else {
        product.offers = null;
      }
    } else {
      product.offers = null;
    }

    if (removedImages && removedImages.length > 0) {
      product.image = product.image.filter(image => !removedImages.includes(image));
    }

    
    const newImages = req.files ? req.files.map(file => file.filename) : [];
    if (newImages.length > 0) {
      product.image.push(...newImages);
    }

    
    const parsedVariants = (variants || []).map((variant, index) => {
      const size = variant.size ? variant.size.trim() : '';
      const price = Number(variant.price);
      const quantity = Number(variant.quantity);

      if (!size || isNaN(price) || isNaN(quantity)) {
        throw new Error(`Invalid data for variant at index ${index}`);
      }

      return { _id: variant._id,
        size, price, quantity };
    });
    


    if (parsedVariants.length === 0) {
      return res.status(400).send('At least one variant is required.');
    }

    product.variants = parsedVariants;

    await product.save();

    return res.status(200).json({ message: "Product updated successfully", product });
  } catch (error) {
    console.error('Error in editProduct:', error);
    return res.status(500).json({ message: `An error occurred while updating the product: ${error.message}` });
  }
};

const logout = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error logging out:', err);
      return res.status(500).send('Error logging out. Please try again.');
    }
    res.status(200).redirect('/admin/login'); 
  });
};

const loadCategory =async(req,res)=>{
  res.status(200).render('admin/category',{
    title:"Category"
  })
}


const loadDashboard = async (req, res) => {
  try {
     
      const topSellingProducts = await Order.aggregate([
          { $unwind: '$products' },
          { $unwind: '$products.variants' },
          { $match: { 'products.productStatus': 'Delivered' } }, 
          { 
              $group: {
                  _id: '$products.productId',
                  totalSold: { $sum: '$products.variants.quantity' },
              }
          },
          { 
              $lookup: {
                  from: 'products',
                  localField: '_id',
                  foreignField: '_id',
                  as: 'productInfo'
              }
          },
          { $unwind: '$productInfo' },
          { $sort: { totalSold: -1 } },
          { $limit: 5 }
      ]);

      
      const topSellingCategories = await Order.aggregate([
          { $unwind: '$products' },
          { $unwind: '$products.variants' },
          { $match: { 'products.productStatus': 'Delivered' } },
          { 
              $lookup: {
                  from: 'products',
                  localField: 'products.productId',
                  foreignField: '_id',
                  as: 'productInfo'
              }
          },
          { $unwind: '$productInfo' },
          { 
              $group: {
                  _id: '$productInfo.category',
                  totalSold: { $sum: '$products.variants.quantity' }
              }
          },
          { $sort: { totalSold: -1 } },
          { $limit: 5 }
      ]);

      
   
      const monthlySales = await Order.aggregate([
        { 
          $match: { "products.productStatus": "Delivered" }
        },
        
        {
          $group: {
            _id: "$_id", 
            createdAt: { $first: "$createdAt" },
            totalRevenue: { 
              $sum: { 
                $sum: { 
                  $map: {
                    input: "$products",
                    as: "product",
                    in: { 
                      $sum: { 
                        $map: {
                          input: "$$product.variants",
                          as: "variant",
                          in: { $multiply: ["$$variant.price", "$$variant.quantity"] }
                        }
                      }
                    }
                  }
                }
              }
            },
            totalOfferDiscount: { 
              $sum: { 
                $sum: { $map: { input: "$products", as: "p", in: "$$p.discount" } }
              } 
            },
            totalCouponDiscount: { $first: "$coupon.discount" }, 
            totalOrderDiscount: { $first: "$discount" }, 
            totalTax: { $first: "$tax" } 
          }
        },
        
        {
          $group: {
            _id: { 
              year: { $year: "$createdAt" }, 
              month: { $month: "$createdAt" }
            },
            totalRevenue: { $sum: "$totalRevenue" },
            totalOfferDiscount: { $sum: "$totalOfferDiscount" },
            totalCouponDiscount: { $sum: { $ifNull: ["$totalCouponDiscount", 0] } },
            totalOrderDiscount: { $sum: { $ifNull: ["$totalOrderDiscount", 0] } },
            totalTax: { $sum: { $ifNull: ["$totalTax", 0] } }
          }
        },
        {
          $project: {
            _id: 1,
            month: "$_id.month",
            year: "$_id.year",
            totalRevenue: 1,
            totalOfferDiscount: 1,
            totalCouponDiscount: 1,
            totalTax: 1,
            referralDiscount: {
              $cond: {
                if: { 
                  $ne: [
                    "$totalOrderDiscount",
                    { $add: ["$totalCouponDiscount", "$totalOfferDiscount"] }
                  ] 
                },
                then: { 
                  $subtract: [
                    "$totalOrderDiscount",
                    { $add: ["$totalCouponDiscount", "$totalOfferDiscount"] } 
                  ]
                },
                else: 0
              }
            },
            totalSales: { 
              $subtract: [
                "$totalRevenue",
                "$totalOrderDiscount" 
              ]
            }
          }
        },
        { 
          $sort: { "year": 1, "month": 1 } 
        }
      ]);


    const monthlySalesLabels = monthlySales.map(sale => {
      const { year, month } = sale._id; 
      const date = new Date(year, month - 1); 
      return date.toLocaleString('default', { month: 'long', year: 'numeric' }); 
    });

      const monthlySalesData = monthlySales.map(sale => sale.totalSales);
      const lastMonthlySales = monthlySales.length ? monthlySales[monthlySales.length - 1].totalSales : 0;

      
      const monthlyCustomers = await User.aggregate([
        { $group: { _id: { $month: "$createdAt" }, newCustomers: { $sum: 1 } } },
        { $sort: { _id: 1 } },
    ]);
    
    const monthlyCustomersData = monthlyCustomers.map(item => item.newCustomers);
      const lastMonthlyCustomers = monthlyCustomers.length ? monthlyCustomers[monthlyCustomers.length - 1].newCustomers : 0;

      
      const monthlyOrders = await Order.aggregate([
          { $match: { "products.productStatus": "Delivered" } },
          { $group: { _id: { $month: "$createdAt" }, totalOrders: { $sum: 1 } } },
          { $sort: { _id: 1 } },
      ]);
      const lastMonthlyOrders = monthlyOrders.length ? monthlyOrders[monthlyOrders.length - 1].totalOrders : 0;

      
      res.status(200).render('admin/dashboard', {
        title:"Dashboard",
          topSellingProducts,
          topSellingCategories,
          monthlySalesLabels: JSON.stringify(monthlySalesLabels),
          monthlySalesData: JSON.stringify(monthlySalesData),
          lastMonthlySales,
          lastMonthlyCustomers,
          lastMonthlyOrders,
          categoryLabels: JSON.stringify(topSellingCategories.map(cat => cat._id)),
          categorySales: JSON.stringify(topSellingCategories.map(cat => cat.totalSold)),
          monthlyCustomersData: JSON.stringify(monthlyCustomersData),
      });

  } catch (error) {
      console.error('Error loading dashboard:', error);
      res.status(500).send('Error loading dashboard');
  }
};



const getSalesReportData = async (filter, startDate, endDate) => {
  let matchConditions = {
      "products.productStatus": { $in: ["Delivered", "Return Approved"] },
  };

  let dateRange = {};
  const now = new Date();

  switch (filter) {
      case 'daily':
        dateRange = {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lte: new Date(new Date().setHours(23, 59, 59, 999)),
        };
        break;
      case 'weekly':
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          
          const endOfWeek = new Date(now);
          endOfWeek.setDate(now.getDate() + (6 - now.getDay()));
          endOfWeek.setHours(23, 59, 59, 999);
          
          dateRange = {
              $gte: startOfWeek,
              $lte: endOfWeek
          };
          break;
      case 'monthly':
          dateRange = {
              $gte: new Date(now.getFullYear(), now.getMonth(), 1),
              $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
          };
          break;
      case 'yearly':
          dateRange = {
              $gte: new Date(now.getFullYear(), 0, 1),
              $lte: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
          };
          break;
      case 'custom':
          if (startDate && endDate) {
              const endDateTime = new Date(endDate);
              endDateTime.setHours(23, 59, 59, 999);
              dateRange = {
                  $gte: new Date(startDate),
                  $lte: endDateTime
              };
          }
          break;
  }

  if (Object.keys(dateRange).length > 0) {
      matchConditions.createdAt = dateRange;
  }

  const result = await Order.aggregate([
      { $match: matchConditions },
      { $unwind: "$products" },
      { $unwind: "$products.variants" },
      {
          $group: {
              _id: { productId: "$products.productId", size: "$products.variants.size" },
              productName: { $first: "$products.name" },
              category: { $first: "$products.category" },
              size: { $first: "$products.variants.size" },
              soldCount: {
                  $sum: { $cond: [{ $eq: ["$products.productStatus", "Delivered"] }, "$products.variants.quantity", 0] }
              },
              returnedCount: {
                  $sum: { $cond: [{ $eq: ["$products.productStatus", "Return Approved"] }, "$products.variants.quantity", 0] }
              },
              offerDiscounts: {
                $sum: { $ifNull: ["$products.discount", 0] } 
            },
            
            
              revenue: {
                  $sum: {
                    $cond: [
                      { $eq: ["$products.productStatus", "Delivered"] },  
                      {
                          $subtract: [
                              { $multiply: ["$products.variants.price", "$products.variants.quantity"] },
                              { $ifNull: ["$products.discount", 0] }
                          ]
                      },
                      0  
                  ]
                  }
              }
          }
      },
      {
          $project: {
              _id: 0,
              productName: 1,
              category: 1,
              size: 1,
              soldCount: 1,
              returnedCount: 1,
              revenue: 1,
              offerDiscounts: 1
          }
      }
  ]);

  const couponDiscounts = await Order.aggregate([
    { $match: matchConditions },
    { $unwind: "$products" },
    { $unwind: "$products.variants" },
    {
        $group: {
            _id: "$_id",
            totalCoupon: { $first: "$coupon.discount" },
            totalProducts: { $sum: "$products.variants.quantity" }, 
            returnedProducts: {
                $sum: {
                    $cond: [{ $eq: ["$products.productStatus", "Return Approved"] }, "$products.variants.quantity", 0]
                }
            }
        }
    },
    {
        $project: {
            _id: 1,
            totalCoupon: 1,
            nonReturnedPercentage: {
                $cond: [
                    { $eq: ["$totalProducts", 0] }, 
                    1,
                    { $subtract: [1, { $divide: ["$returnedProducts", "$totalProducts"] }] } 
                ]
            }
        }
    },
    {
        $group: {
            _id: null,
            couponDiscount: {
                $sum: { $multiply: ["$totalCoupon", "$nonReturnedPercentage"] } 
            }
        }
    }
]);


  const totalCouponDiscount = couponDiscounts[0]?.couponDiscount || 0;
  let totalRevenue = 0;
  let totalSold = 0;
  let totalReturns = 0;
  let totalOfferDiscounts = 0;

  result.forEach((item) => {
      totalRevenue += item.revenue + item.offerDiscounts;
      totalSold += item.soldCount;
      totalReturns += item.returnedCount;
      totalOfferDiscounts += item.offerDiscounts;
     
      
  });
  

  return {
      result,
      totalRevenue,
      totalSold,
      totalReturns,
      totalOfferDiscounts,
      totalCouponDiscount,
      overallDiscount: totalOfferDiscounts + totalCouponDiscount,
      netRevenue: totalRevenue - (totalOfferDiscounts + totalCouponDiscount)
  };
};


const getDateRangeText = (filter, startDate, endDate) => {
  switch (filter) {
      case 'daily':
          return `Date: ${new Date().toLocaleDateString()}`;
      case 'weekly':
          return `Week: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
      case 'monthly':
          return `Month: ${new Date(startDate).toLocaleString('default', { month: 'long', year: 'numeric' })}`;
      case 'yearly':
          return `Year: ${new Date().getFullYear()}`;
      case 'custom':
          return `Custom Range: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
      default:
          return 'Sales Report';
  }
};



const getSalesReport = async (req, res) => {
  try {
      const { filter, startDate, endDate } = req.query;
      
      const reportData = await getSalesReportData(filter, startDate, endDate);
      
      res.status(200).json(reportData);
  } catch (error) {
      console.error('Error generating sales report:', error);
      res.status(500).json({ error: 'Failed to generate report' });
  }
};



const loadSalesReport = async (req, res) => {
  try {
      const reportData = await getSalesReportData('daily');
      res.status(200).render('admin/sales-report', {
        title:"Sales Report",
          orders: reportData.result,
          offerDiscounts: reportData.totalOfferDiscounts.toFixed(2),
          couponDiscounts: reportData.totalCouponDiscount.toFixed(2),
          overallSalesCount: reportData.totalSold,
          orderCount: reportData.totalSold + reportData.totalReturns,
          overallDiscount: reportData.overallDiscount.toFixed(2),
          netRevenue: reportData.netRevenue.toFixed(2)
      });
  } catch (error) {
      console.error('Error loading sales report page:', error);
      res.status(500).render('error', { message: 'Failed to load sales report' });
  }
};

const generateExcel = async (reportData, res, filter, startDate, endDate) => {
  try {
      const wb = new xl.Workbook();
      const ws = wb.addWorksheet('Sales Report');

      
      const headerStyle = wb.createStyle({
          font: { bold: true, color: 'FFFFFF', size: 12 },
          fill: { type: 'pattern', patternType: 'solid', fgColor: '4F81BD' },
          alignment: { horizontal: 'center', vertical: 'center' }
      });

      const moneyStyle = wb.createStyle({ 
          numberFormat: '₹#,##0.00; (₹#,##0.00)',
          alignment: { horizontal: 'right' }
      });

      const boldStyle = wb.createStyle({
          font: { bold: true },
          alignment: { horizontal: 'left' }
      });

      // Set column widths
      ws.column(1).setWidth(40);
      ws.column(2).setWidth(15);
      ws.column(3).setWidth(15);
      ws.column(4).setWidth(20);
      ws.column(5).setWidth(20);

      // Report Title
      ws.cell(1, 1).string('Sales Report').style(boldStyle);
      ws.cell(2, 1).string(getDateRangeText(filter, startDate, endDate)).style(boldStyle);

      // Headers
      ws.cell(4, 1).string('Product Name').style(headerStyle);
      ws.cell(4, 2).string('Sold').style(headerStyle);
      ws.cell(4, 3).string('Returns').style(headerStyle);
      ws.cell(4, 4).string('Offer Discounts').style(headerStyle);
      ws.cell(4, 5).string('Revenue').style(headerStyle);

      // Data rows
      reportData.result.forEach((order, index) => {
          const rowIndex = index + 5;
          ws.cell(rowIndex, 1).string(order.productName || 'N/A');
          ws.cell(rowIndex, 2).number(order.soldCount || 0);
          ws.cell(rowIndex, 3).number(order.returnedCount || 0);
          ws.cell(rowIndex, 4).number(Number(order.offerDiscounts) || 0).style(moneyStyle);
          ws.cell(rowIndex, 5).number(Number(order.revenue) || 0).style(moneyStyle);
      });

      // Summary section
      const summaryRow = reportData.result.length + 6;
      
      ws.cell(summaryRow, 1).string('Offer Discounts:').style(boldStyle);
      ws.cell(summaryRow, 4).number(Number(reportData.totalOfferDiscounts) || 0).style(moneyStyle);

      ws.cell(summaryRow + 1, 1).string('Coupon Discounts:').style(boldStyle);
      ws.cell(summaryRow + 1, 4).number(Number(reportData.totalCouponDiscounts) || 0).style(moneyStyle);

      ws.cell(summaryRow + 2, 1).string('Overall Discount:').style(boldStyle);
      ws.cell(summaryRow + 2, 4).number(Number(reportData.overallDiscount) || 0).style(moneyStyle);

      ws.cell(summaryRow + 3, 1).string('Net Revenue:').style(boldStyle);
      ws.cell(summaryRow + 3, 4).number(Number(reportData.netRevenue) || 0).style(moneyStyle);

      // Set response headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');

      // Write to buffer and send
      const buffer = await wb.writeToBuffer();
      res.send(buffer);
  } catch (error) {
      console.error('Excel generation error:', error);
      throw new Error('Failed to generate Excel report');
  }
};


const generatePDF = async (reportData, res, filter, startDate, endDate) => {
  try {
    
    const doc = new PDFDocument({ margin: 50 });
    
   
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=sales-report-${filter || 'custom'}-${new Date().toISOString().split('T')[0]}.pdf`);
    
  
    doc.pipe(res);
    
  
    doc.fontSize(25).text('Sales Report', { align: 'center' });
    doc.moveDown();
    
    
    doc.fontSize(12);
    
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };
    
    
    doc.text(`${getDateRangeText(filter, startDate, endDate)}`, { align: 'left' });
    doc.text(`Generated on: ${formatDate(new Date())}`, { align: 'left' });
    doc.moveDown(2);
    
    
    doc.fontSize(16).text('Summary', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Total Revenue: Rs.${reportData.totalRevenue.toFixed(2)}`);
    doc.text(`Total Products Sold: ${reportData.totalSold}`);
    doc.text(`Total Returns: ${reportData.totalReturns}`);
    doc.text(`Total Offer Discounts: Rs. ${reportData.totalOfferDiscounts.toFixed(2)}`);
    doc.text(`Total Coupon Discounts: Rs. ${reportData.totalCouponDiscount.toFixed(2)}`);
    doc.text(`Overall Discount: Rs. ${reportData.overallDiscount.toFixed(2)}`);
    doc.text(`Net Revenue: Rs. ${reportData.netRevenue.toFixed(2)}`);
    doc.moveDown(2);
    
    
    doc.fontSize(16).text('Product Details', { underline: true });
    doc.moveDown();
    
    
    const tableTop = doc.y;
    const tableColumns = [
      { title: 'Product', x: 50, width: 180 },
      { title: 'Category', x: 230, width: 100 },
      { title: 'Size', x: 330, width: 60 },
      { title: 'Sold', x: 390, width: 60 },
      { title: 'Returns', x: 450, width: 60 },
      { title: 'Revenue', x: 510, width: 80 }
    ];
    
 
    doc.fontSize(10).font('Helvetica-Bold');
    tableColumns.forEach(column => {
      doc.text(column.title, column.x, tableTop, { width: column.width, align: 'left' });
    });
    
    
    doc.moveDown();
    const lineY = doc.y;
    doc.moveTo(50, lineY).lineTo(590, lineY).stroke();
    doc.moveDown(0.5);
    
    
    let rowY = doc.y;
    doc.font('Helvetica');
    
    reportData.result.forEach((item, index) => {
      
      if (rowY > 700) {
        doc.addPage();
        rowY = 50;
        doc.moveDown();
      }
      
      doc.text(item.productName, tableColumns[0].x, rowY, { width: tableColumns[0].width, align: 'left' });
      doc.text(item.category, tableColumns[1].x, rowY, { width: tableColumns[1].width, align: 'left' });
      doc.text(item.size, tableColumns[2].x, rowY, { width: tableColumns[2].width, align: 'left' });
      doc.text(item.soldCount.toString(), tableColumns[3].x, rowY, { width: tableColumns[3].width, align: 'left' });
      doc.text(item.returnedCount.toString(), tableColumns[4].x, rowY, { width: tableColumns[4].width, align: 'left' });
      doc.text(`Rs. ${item.revenue.toFixed(2)}`, tableColumns[5].x, rowY, { width: tableColumns[5].width, align: 'left' });
      
      doc.moveDown();
      rowY = doc.y;
    });
    
    
    doc.fontSize(10).text('Thank you for your order!', { align: 'center' });
    
    
    doc.end();
    
  } catch (error) {
    console.error('Error generating PDF sales report:', error);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
};

const downloadSalesReport = async (req, res) => {
  try {
      const { filter, startDate, endDate, format } = req.query;

      
      if (!filter) {
          return res.status(400).json({ error: 'Filter parameter is required' });
      }

      if (filter === 'custom' && (!startDate || !endDate)) {
          return res.status(400).json({ error: 'Start date and end date are required for custom filter' });
      }

      
      const reportData = await getSalesReportData(filter, startDate, endDate);

      
      switch (format?.toLowerCase()) {
        case 'excel':
            await generateExcel(reportData, res, filter, startDate, endDate);
            break;
        case 'pdf':
            await generatePDF(reportData, res, filter, startDate, endDate);
            break;
        default:
            res.status(400).json({ error: 'Invalid format. Supported formats are "excel" and "pdf"' });
    }
    
  } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ 
          error: 'Error generating report', 
          message: error.message 
      });
  }
}

const loadSettings =(req,res)=>{
  res.render('admin/settings',{
    title:"Settings"
  })
}

const changePassword=async (req,res)=>{
  try {
    const { currentPassword, newPassword } = req.body;
   
    const admin = await Admin.findOne()

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
        return res.status(400).json({ success: false, message: "Current password is incorrect." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    admin.password = hashedPassword;
    await admin.save();

    res.status(200).json({ success: true, message: "Password changed successfully." });
} catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
}
}
module.exports = { 
  loadCategory,
  loadLogin,
  login,
  logout,
  addProduct,
  products,
  showAddProduct,
  showEditPro,
  editProduct,
  deleteProduct,
  loadDashboard,
  loadSalesReport,
  downloadSalesReport,
  getSalesReport,
  //getAdminDashboard
  loadSettings,
  changePassword,
  searchProducts
} ;