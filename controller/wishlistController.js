const Cart = require('../model/cart')
const Product = require('../model/product')
const User = require('../model/user') 
const Wishlist = require('../model/wishlist')
const Offer = require('../model/offer')
const Category =require('../model/category')

 

const addWishlist = async (req, res) => {
    try {
        const { productId, variantId } = req.body;
        
        
        const userId = req.session.user ? req.session.user.id : null;
        const isGuest = !req.session.user && req.session.tempUser;
        
        
        if (!userId || isGuest) {
            return res.status(401).json({ 
                success: false, 
                message: "Please login to add items to wishlist",
                redirect: "/login"
            });
        }
        
        const product = await Product.findById(productId).populate('category');
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        
        const variant = product.variants.find(v => v._id.toString() === variantId);
        if (!variant) {
            return res.status(404).json({ success: false, message: 'Variant not found' });
        }
        
        const existingItem = await Wishlist.findOne({ userId, productId, variantId });
        
        if (existingItem) {
            
            await Wishlist.findByIdAndDelete(existingItem._id);
            return res.status(200).json({ success: true, message: 'Removed from wishlist' });
        } else {
           
            const newWishlistItem = new Wishlist({
                userId,
                productId,
                variantId,
            });
            
            await newWishlistItem.save();
            return res.status(201).json({ success: true, message: 'Added to wishlist' });
        }
    } catch (error) {
        console.error("Error in addWishlist:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};



  
const loadWishlist = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const page = parseInt(req.query.page) || 1; 
    const limit = 10; 
    const skip = (page - 1) * limit;
    const totalWishlistItems = await Wishlist.countDocuments({ userId });




    const wishlistItems = await Wishlist.find({ userId })
          .populate({
              path: 'productId',
              select: 'name image variants',
          })
          .skip(skip)
          .limit(limit)
          .lean();


    for (const item of wishlistItems) {
      const product = item.productId;
      
      if (!product || !product._id) {
      
        continue;
      }
      if (!item.variantId) { 
        continue;
      }
      const variant = product.variants.find(v => v._id.toString() === item.variantId.toString());
      
      if (variant) {
        item.variantDetails = variant;
      } else {
        
        continue; 
      }

      item.isOutOfStock = variant.quantity === 0;
      
      const cart = await Cart.findOne({ user: userId });
      if (!cart) {
       
        continue;
      }
      
      item.isInCart = cart.products.some(p => {
        
        const productMatch = p.product.toString() === product._id.toString();
         

        let variantMatch = false;
        
        if (p.variant && p.variant.size) {
          variantMatch = p.variant.size === variant.size;
        }
        
        
        


        return productMatch && variantMatch;
      });
      
    }

 const totalPages = Math.ceil(totalWishlistItems / limit);
    
    res.status(200).render('user/wishlist', { wishlistItems,
      title:"Wishlist",
      currentPage: page,
      totalPages
     }); 
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}
  
  const addToCart = async (req, res) => {
    try {
        const { productId, variantId } = req.body;
        
        const userId = req.session.user.id;
        const wishlistItem = await Wishlist.findOne({ userId, productId, variantId });
        if (!wishlistItem) {
            return res.status(404).json({ success: false, message: 'Wishlist item not found' });
        }

        
        const product = await Product.findById(productId).populate('category');
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const variant = product.variants.find(v => v._id.toString() === variantId);
        if (!variant) {
            return res.status(404).json({ success: false, message: 'Variant not found' });
        }

        
        const offers = await Offer.find({ status: true });
        const categories = await Category.find({ isDeleted: false });

        
        const getProductDiscount = async (product) => {
            let totalDiscount = 0;

            
            if (product.offers) {
                const productOffer = offers.find(offer => offer.name === product.offers);
                if (productOffer && productOffer.status) {
                    totalDiscount = productOffer.discount;
                }
                
            }

            
            const category = categories.find(cat => cat.name === product.category);
            
            if (category && category.offers) {
                const categoryOffer = offers.find(offer => offer.name === category.offers);
                if (categoryOffer && categoryOffer.status) {
                    totalDiscount += categoryOffer.discount;
                   
                } 
                
            }

            return totalDiscount;
        };

        
        const discount = await getProductDiscount(product);
        const originalPrice = variant.price;
        let discountedPrice = originalPrice;

        if (discount > 0) {
            discountedPrice = originalPrice - (originalPrice * discount / 100);
        }

        
        discountedPrice = parseFloat(discountedPrice.toFixed(2));

        
        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            
            cart = new Cart({
                user: userId,
                products: []
            });
        }

        
        const existingProductIndex = cart.products.findIndex(p => 
            p.product.toString() === productId && p.variant.size === variant.size
        );

        if (existingProductIndex !== -1) {
            
            cart.products[existingProductIndex].variant.quantity += 1;
        } else {
            
            cart.products.push({
                product: productId,
                variant: {
                    size: variant.size,
                    price: originalPrice,
                    discountedPrice: discountedPrice,
                    quantity: 1
                },
                image: product.image[0]
            });
        }

        
        await cart.save();

        
        await Wishlist.findByIdAndDelete(wishlistItem._id);

        return res.status(200).json({ success: true, message: 'Added to cart' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const removeFromWishlist = async (req, res) => {
  try {
    const { productId, variantId } = req.body;
    const userId = req.session.user.id;

    
    const deletedItem = await Wishlist.findOneAndDelete({ userId, productId, variantId });

    if (!deletedItem) {
      return res.status(404).json({ success: false, message: 'Item not found in wishlist' });
    }

    return res.status(200).json({ success: true, message: 'Removed from wishlist' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}


module.exports={
    loadWishlist,
    addWishlist,
    addToCart,
    removeFromWishlist,
   // addWishList
}