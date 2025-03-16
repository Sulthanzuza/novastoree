const Product= require('../model/product')
const Category = require('../model/category')
const Offer = require('../model/offer')
const Wishlist = require('../model/wishlist')
const User=require('../model/user')
const Order = require('../model/order')
const Review = require('../model/review')

const loadHome = async (req, res) => {
  try {
    const userId = req.session.user.id; 

   
    const products = await Product.find({ deleted: false }).limit(4).populate('category');
    const trendingProducts = await Product.find({ deleted: false }).sort({ createdAt: -1 }).limit(4).populate('category');
    const categories = await Category.find({ isDeleted: false });
    const offers = await Offer.find({ status: true });

    let wishlistProductIds = {}; 

    if (userId) {
      const wishlistItems = await Wishlist.find({ userId }).lean();
      wishlistItems.forEach(item => {
        wishlistProductIds[item.variantId.toString()] = true; 
      });
    }
    
    const getProductDiscount = async (product) => {
      let productDiscount = 0;
      let categoryDiscount = 0;

    
      if (product.offers) {
        const productOffer = offers.find(offer => offer.name === product.offers);
        if (productOffer && productOffer.status) {
          productDiscount = productOffer.discount;
        }
      }

      
      const category = categories.find(cat => cat.name === product.category);
      if (category && category.offers) {
        const categoryOffer = offers.find(offer => offer.name === category.offers);
        if (categoryOffer && categoryOffer.status) {
          categoryDiscount = categoryOffer.discount;
        }
      }
    
     
      return Math.max(productDiscount, categoryDiscount);
    };
    

    
    const applyDiscountsToProducts = async (product) => {
      const discount = await getProductDiscount(product);

      
      product.variants.forEach(variant => {
        const originalPrice = variant.price;
        let discountedPrice = originalPrice;

        if (discount > 0) {
          discountedPrice = originalPrice - (originalPrice * discount / 100);
        }

        variant.discountedPrice =Math.floor(discountedPrice); 
        variant.stockStatus = variant.quantity > 0 ? "IN STOCK" : "OUT OF STOCK";
        variant.discountPercentage = discount;
      });
    };

    await Promise.all(products.map(applyDiscountsToProducts));
    await Promise.all(trendingProducts.map(applyDiscountsToProducts));

   
    res.status(200).render('user/home', { 
      title:"Home",
      products, 
      categories, 
      trendingProducts,
      wishlistProductIds 
    });

  } catch (err) {
    console.error('Error in loadHome:', err);
    res.status(500).send('Server Error');
  }
};

const showProductDetails = async (req, res) => {
  const productId = req.params.id;
  const userId = req.session.user.id;

  try {
      const products = await Product.findById(productId).populate('category'); 
 const categoryName = products.category;

      if (!products) {
          return res.status(404).send('Product not found');
      }
  
      const selectedVariantPrice = products.variants[0].price;

      
      const similarProducts = await Product.find({
        deleted: false,
        category: categoryName,
        'variants.price': { $gte: selectedVariantPrice - 100, $lte: selectedVariantPrice + 100 },
    }).limit(4);
    
   
    similarProducts.forEach(product => {
        const selectedVariant = product.variants.find(variant => variant.price === selectedVariantPrice);
        if (selectedVariant) {
            product.selectedVariant = selectedVariant; 
        } else {
            product.selectedVariant = product.variants[0]; 
        }
    });
      
      const offers = await Offer.find({ status: true });
      const category = await Category.findOne({name: products.category});
     
      const userWishlist = await Wishlist.find({ userId: userId });
      
      
      const wishlistProductIds = {}; 


      if (userWishlist.length > 0) {
        userWishlist.forEach(item => {
            wishlistProductIds[item.variantId.toString()] = true; 
        });
    }


    const getProductDiscount = async (product) => {
      let productDiscount = 0;
      let categoryDiscount = 0;

      if (product.offers) {
        const productOffer = offers.find(offer => offer.name === product.offers);
        if (productOffer && productOffer.status) {
          productDiscount = productOffer.discount;
        }
      }

      const category = await Category.findOne({ name: product.category });
      if (category && category.offers) {
        const categoryOffer = offers.find(offer => offer.name === category.offers);
        if (categoryOffer && categoryOffer.status) {
          categoryDiscount = categoryOffer.discount;
        }
      }

      return Math.max(productDiscount, categoryDiscount);
    };

    
    const applyDiscountsToProducts = async (product) => {
      const discount = await getProductDiscount(product);

      product.variants.forEach(variant => {
        const originalPrice = variant.price;
        let discountedPrice = originalPrice;
        let showDiscount = false;

        if (discount > 0) {
          discountedPrice = originalPrice - (originalPrice * discount / 100);
          showDiscount = true;
        }

        variant.discountedPrice = showDiscount ? Math.floor(discountedPrice) : null;
        variant.stockStatus = variant.quantity > 0 ? "IN STOCK" : "OUT OF STOCK";
        variant.discountPercentage = discount;
      });
    };

    
    await applyDiscountsToProducts(products);
    await Promise.all(similarProducts.map(applyDiscountsToProducts));

      const userOrders = await Order.find({
        userId: userId,
        "products.productId": productId,
        "products.productStatus": 'Delivered'
      });
      
      const userHasOrdered = userOrders.some(order => 
        order.products.some(product => 
          product.productStatus === 'Delivered' && product.productId.toString() === productId
        )
      );
      
      let hasPurchased = false;

      
      for (let order of userOrders) {
        for (let orderItem of order.products) {
          if (orderItem.productId.toString() === productId && orderItem.productStatus === 'Delivered') {
            hasPurchased = true;
            break;
          }
        }
        if (hasPurchased) break;
      }
      
      let reviews = await Review.find({ productId: productId });
      
      
reviews = reviews.map(review => {
  review.hasMoreReplies = review.replies.length > 2; 
  review.visibleReplies = review.replies.slice(0, 2); 
  return review;
});

const hasMoreReviews = reviews.length > 3; 
const visibleReviews = reviews.slice(0, 3); 

    

        
for (let review of reviews) {
  let user = await User.findById(review.userId);
  review.userName = user ? user.firstName + ' ' + (user.lastName || '') : 'Anonymous';
  review.userAvatar = user ? `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName || ''}&background=random&color=fff&size=40` : '';
  
  for (let reply of review.replies) {
      let replyUser = await User.findById(reply.userId);
      reply.userName = replyUser ? replyUser.firstName + ' ' + (replyUser.lastName || '') : 'Anonymous';
      reply.userAvatar = replyUser ? `https://ui-avatars.com/api/?name=${replyUser.firstName}+${replyUser.lastName || ''}&background=random&color=fff&size=40` : '';
  }
}


        
        let totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : "No Ratings Yet";
       const wishListIds = JSON.stringify(wishlistProductIds)
      return res.status(200).render('user/products-details', {
        title:products.name,
          productId,
          userId,
          products,
          similarProducts,
          wishlistProductIds,
          wishListIds,
          updatedProduct: {
              ...products.toObject(),
              image: Array.isArray(products.image) ? products.image : [products.image],
              productDiscount: await getProductDiscount(products),
              hasPurchased,
              userHasOrdered,
              productDelivered: userOrders.length > 0 
          },
          reviews:visibleReviews,  
          hasMoreReviews,
          averageRating  
      });
  } catch (err) {
      console.error(err);
      res.status(500).send('Error retrieving product details');
  }
};

const showListProducts = async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: false });
    const products = await Product.find({ deleted: false }).populate('category');
    const offers = await Offer.find({ status: true });
    const userId =req.session.user.id
    
    let wishlistProductIds = {}; 

    if (userId) {
        const wishlistItems = await Wishlist.find({ userId }).lean();
        wishlistItems.forEach(item => {
            wishlistProductIds[item.variantId.toString()] = true; 
        });
    }

    const getProductDiscount = (product, category) => {
      let productDiscount = 0;
      let categoryDiscount = 0;
    
      if (product.offers) {
        const productOffer = offers.find(offer => offer.name === product.offers);
        if (productOffer && productOffer.status) {
          productDiscount = productOffer.discount;
        }
      }
    
      if (category && category.offers) {
        const categoryOffer = offers.find(offer => offer.name === category.offers);
        if (categoryOffer && categoryOffer.status) {
          categoryDiscount = categoryOffer.discount;
        }
      }
    
      return Math.max(productDiscount, categoryDiscount);
    };
        
        const orderCounts = await Order.aggregate([
          { $unwind: "$products" }, 
          { $match: { "products.productStatus": "Delivered" } }, 
          { $group: { _id: "$products.productId", count: { $sum: 1 } } } 
        ]);
        
    
        
        const reviewRatings = await Review.aggregate([
          { $group: { _id: "$productId", avgRating: { $avg: "$rating" } } } 
        ]);
   
    
        
        const orderCountMap = orderCounts.reduce((acc, item) => {
          acc[item._id.toString()] = item.count; 
          return acc;
        }, {});
    
    
    const ratingMap = reviewRatings.reduce((acc, item) => {
      if (item._id) { 
        acc[item._id.toString()] = item.avgRating;
      }
      return acc;
    }, {});
   
  
   


    const allProducts = products.flatMap(product => {
      
      return product.variants.map(variant => {
        const category = categories.find(cat => cat.name === product.category);
        const discount = getProductDiscount(product, category);
       product.image = [product.image[0],product.image[1]]
        const originalPrice = variant.price;
        let discountedPrice = originalPrice;
        const discountPercentage = discount
        if (discount > 0) {
          discountedPrice = originalPrice - (originalPrice * discount / 100);
        }

      
        const popularity = orderCountMap[product._id.toString()] || 0;

        
        const averageRating = ratingMap[product._id.toString()] || 0;

       
        return {
          ...product.toObject(),
          variantId: variant._id,
          price: variant.price,
          discountedPrice: Math.floor(discountedPrice),
          stock: variant.quantity,
          size: variant.size,
          popularity,
          discountPercentage,
          averageRating,
          featured: product.featured,
          createdAt: product.createdAt
        };
      });
    });
    

    res.status(200).render('user/productList', { 
      title:"All Products",
      allProducts: JSON.stringify(allProducts), 
      categories,
      wishlistProductIds: JSON.stringify(wishlistProductIds) 
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).send('Server Error');
  }
};


module.exports={
    loadHome,
    showProductDetails,
    showListProducts,
   
   
}


