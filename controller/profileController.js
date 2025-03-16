const Address = require('../model/address')
const User = require('../model/user')
const Cart = require('../model/cart')
const Product = require('../model/product')
const Order  = require('../model/order')
const bcrypt = require("bcrypt");
const Category = require('../model/category')
const Offer = require('../model/offer')


const showAddAddress = async (req, res) => {

  res.status(200).render('user/add-address',{title:"Add Address"})
}

const showProfile = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const user = await User.findById(userId); 

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).render('user/profile', { title:"Profile",
      user }); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while showing the profile' });
  }
};

const showEditProfile = async(req,res)=>{
  try{
    const userId = req.session.user.id;
    const user = await User.findById(userId); 

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.render('user/edit-profile', { title:"Edit Profile",
      user }); 
  }catch(error){
    console.error(error);
    res.status(500).json({ error: 'An error occurred while showing the Edit profile' });
  
  }
}

const editProfile = async(req,res)=>{
  try{
    const userId = req.session.user.id
    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const {firstName,lastName,phoneNumber} = req.body

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    if (phoneNumber) user.phoneNumber = phoneNumber;

    await user.save()
    res.status(200).redirect("/profile");

  }catch(error){
    console.error(error);
    res.status(500).json({ error: 'An error occurred while Editing profile' });
  }
}

const showAddress = async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    const addresses = await Address.find({ user: userId, deleted: false });
    res.status(200).render('user/address', { title:"Address",
      addresses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while showing the address' });
  }
};


const addToCart = async (req, res) => {
  const { productId, variantId, quantity, variantSize, price, discountedPrice } = req.body;
  
  
  
  const userId = req.session.user.id;

  try {
      const product = await Product.findOne({ _id: productId, deleted: false });
      if (!product) {
          return res.status(404).json({ error: 'Product not found.' });
      }

      const variant = product.variants.find(v => v._id.toString() === variantId);
      if (!variant) {
          return res.status(404).json({ error: 'Variant not found.' });
      }

      const stockAvailable = variant.quantity;
      const maxAllowed = Math.min(5, stockAvailable); 

      let cart = await Cart.findOne({ user: userId });
      let totalRequestedQuantity = parseInt(quantity);

      if (cart) {
          const existingProduct = cart.products.find(
              item => item.product.toString() === productId && item.variant.size === variantSize
          );

          if (existingProduct) {
              totalRequestedQuantity += existingProduct.variant.quantity;
          }
      }

      if (totalRequestedQuantity > maxAllowed) {
          return res.status(400).json({
              error: `Only ${maxAllowed} items can be added.`,
              swal: true 
          });
      }

      const cartItem = {
          product: productId,
          variant: {
              size: variantSize,
              price: price,
              discountedPrice: discountedPrice, 
              quantity: parseInt(quantity),
          },
          image: product.image && product.image.length > 0 ? product.image[0] : product.name,
      };

      if (cart) {
          const existingProductIndex = cart.products.findIndex(
              item => item.product.toString() === productId && item.variant.size === variantSize
          );

          if (existingProductIndex > -1) {
              cart.products[existingProductIndex].variant.quantity += parseInt(quantity);
          } else {
              cart.products.push(cartItem);
          }
      } else {
          cart = new Cart({
              user: userId,
              products: [cartItem],
          });
      }

      await cart.save();

      res.status(200).json({
          message: 'Product added to cart successfully!',
          cartItem,
      });
  } catch (error) {
      console.error('Error adding to cart:', error);
      res.status(500).json({ error: 'An error occurred while adding the product to the cart.' });
  }
};


const showCart = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const cart = await Cart.findOne({ user: userId }).populate('products.product');
    const category = await Category.find({isDeleted:false})

    if (!cart || cart.products.length === 0) {
      if (req.xhr) {
        return res.json({
          success: true,
          cart: [],
          subTotal: 0,
          discount: 0,
          tax: 0,
          total: 0,
          message: 'Your cart is empty.',
        });
      }
      return res.render('user/user-cart', {
        cart: [],
        subTotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
        message: 'Your cart is empty.',
      });
    }

    const now = new Date();
    let subTotal = 0;
    let totalDiscount = 0;

    const cartItems = await Promise.all(
      cart.products.map(async (item) => {
        const product = item.product;
        if (!product || product.deleted) return null;
    
        const variant = product.variants.find((v) => v.size === item.variant.size);
        if (!variant) return null;
    
        let originalPrice = variant.price * item.variant.quantity;
        let finalPrice = originalPrice;
        let appliedOffer = null;
        let maxDiscount = 0;
        let itemDiscount = 0;
    
        if (product.offers) {
          const productOffer = await Offer.findOne({ name: product.offers, status: true });
          if (productOffer && new Date(productOffer.expiry) > now) {
            const productDiscount = (variant.price * productOffer.discount) / 100;
            
            if (productDiscount > maxDiscount) {
              maxDiscount = productDiscount;
              appliedOffer = `Offer  (${productOffer.discount}% Off)`;
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
              appliedOffer = `Offer  (${categoryOffer.discount}% Off)`;
            }
          }
        }
    
        
        const unitPrice = variant.price;
        const unitDiscountedPrice = unitPrice - maxDiscount;
        
        
        finalPrice = Math.floor(unitDiscountedPrice * item.variant.quantity);
        originalPrice = Math.floor(unitPrice * item.variant.quantity);

        subTotal += originalPrice;
        totalDiscount += originalPrice - finalPrice;
        itemDiscount = originalPrice - finalPrice;
    
        return {
          id: item._id,
          product: {
            name: product.name,
            _id: product._id,
          },
          image: item.image,
          variant: {
            _id: variant._id,
            size: variant.size,
            price: variant.price,
            discountedPrice: appliedOffer ? unitDiscountedPrice : null,
            quantity: item.variant.quantity,
            maxQuantity: variant.quantity,
            finalPrice: finalPrice,
            outOfStock: variant.quantity === 0,
          },
          appliedOffer, 
          originalPrice: originalPrice,
          discountedPrice: appliedOffer ? finalPrice : originalPrice,
          unitPrice: unitPrice,
          unitDiscountedPrice: appliedOffer ? unitDiscountedPrice : unitPrice,
          itemDiscount: itemDiscount
        };
      })
    );
    
    const filteredCartItems = cartItems.filter((item) => item !== null);
    const tax = (subTotal * 0.02).toFixed(2);
    const total = (subTotal - totalDiscount + parseFloat(tax)).toFixed(2);

    const responseData = {
      cart: filteredCartItems,
      subTotal: subTotal.toFixed(2),
      discount: totalDiscount.toFixed(2),
      tax,
      total,
    };

    
    if (req.xhr) {
      return res.status(200).json({
        success: true,
        ...responseData
      });
    }

   
    res.status(200).render('user/user-cart', {
      title: "Cart",
      ...responseData
    });
  } catch (error) {
    console.error('Error fetching cart details:', error);
    if (req.xhr) {
      return res.status(500).json({ success: false, message: 'An error occurred while fetching cart details.' });
    }
    res.status(500).send('An error occurred while fetching cart details.');
  }
};

const updateCart = async (req, res) => {
  const { productId, variantSize, quantity } = req.body;

  try {
      const userId = req.session.user.id;
      const cart = await Cart.findOne({ user: userId });
      const product = await Product.findOne({ _id: productId, deleted: false }).populate('offers');

      if (!cart) {
          return res.status(404).json({ success: false, message: 'Cart not found', swal: true });
      }

      if (!product) {
          return res.status(404).json({ success: false, message: 'Product not found', swal: true });
      }

      const variant = product.variants.find(v => v.size === variantSize);
      if (!variant) {
          return res.status(404).json({ success: false, message: 'Variant not found', swal: true });
      }

      const maxStock = variant.stock;
      const maxAllowed = Math.min(5, maxStock); 

      const itemIndex = cart.products.findIndex(
          item => item.product.toString() === productId && item.variant.size === variantSize
      );

      if (itemIndex === -1) {
          return res.status(404).json({ success: false, message: 'Item not found in cart', swal: true });
      }

      if (quantity < 1) {
          return res.status(400).json({ success: false, message: 'Quantity must be at least 1', swal: true });
      }

      if (quantity > maxAllowed) {
          return res.status(400).json({ 
              success: false, 
              message: `Only ${maxAllowed} units are available for this variant.`,
              swal: true 
          });
      }

      cart.products[itemIndex].variant.quantity = quantity;
      await cart.save();

      
      const now = new Date();
      let unitPrice = variant.price;
      let unitDiscountedPrice = unitPrice;
      let appliedOffer = null;
      let maxDiscount = 0;

     
      if (product.offers) {
          const productOffer = await Offer.findOne({ name: product.offers, status: true });
          if (productOffer && new Date(productOffer.expiry) > now) {
              const productDiscount = (unitPrice * productOffer.discount) / 100;
              
              if (productDiscount > maxDiscount) {
                  maxDiscount = productDiscount;
                  appliedOffer = `Offer  (${productOffer.discount}% Off)`;
              }
          }
      }

     
      const category = await Category.findOne({ name: product.category, isDeleted: false });
      if (category && category.offers) {
          const categoryOffer = await Offer.findOne({ name: category.offers, type: 'category', status: true });   
          if (categoryOffer && new Date(categoryOffer.expiry) > now) {
              const categoryDiscount = (unitPrice * categoryOffer.discount) / 100; 
              
              if (categoryDiscount > maxDiscount) {
                  maxDiscount = categoryDiscount;
                  appliedOffer = `Offer (${categoryOffer.discount}% Off)`;
              }
          }
      }

    
      unitDiscountedPrice = unitPrice - maxDiscount;
      const originalPrice = Math.floor(unitPrice * quantity);
      const finalPrice = Math.floor(unitDiscountedPrice * quantity);
      const itemDiscount = originalPrice - finalPrice;

      
      return res.status(200).json({ 
          success: true, 
          message: 'Quantity updated successfully',
          updatedCart: true,
          itemData: {
              originalPrice: originalPrice,
              finalPrice: finalPrice,
              discountedPrice: appliedOffer ? finalPrice : originalPrice,
              itemDiscount: itemDiscount,
              quantity: quantity,
              productId: productId,
              variantSize: variantSize,
              appliedOffer: appliedOffer
          }
      });
  } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Server error', swal: true });
  }
};

const removeFromCart = async (req, res) => {
  const cartId = req.params.id;
  
  try {
      const userId = req.session.user.id;
      const cart = await Cart.findOne({ user: userId });

      if (!cart) {
          return res.status(404).json({ success: false, message: 'Cart not found.' });
      }
      
      const itemIndex = cart.products.findIndex(item => item._id.toString() === cartId);

      if (itemIndex === -1) {
          return res.status(404).json({ success: false, message: 'Item not found in cart.' });
      }
      
      cart.products.splice(itemIndex, 1);
      await cart.save();
      
      return res.status(200).json({ 
          success: true, 
          message: 'Item removed successfully.',
          updatedCart: true
      });
  } catch (error) {
      console.error('Error removing item from cart:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getCartData = async (req, res) => {
  try {
  
    req.xhr = true;
    return showCart(req, res);
  } catch (error) {
    console.error('Error fetching cart data:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const showSearch = (req, res) => {
  res.status(200).render('user/product-list',{title:"Search Page"})
}

const addAddress = async (req, res) => {
  try {
    const { fullName, phoneNumber, houseAddress, streetAddress, city, state, zipCode, country } = req.body;
    const userId = req.session.user.id;


    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }


    const address = new Address({
      fullName,
      phoneNumber,
      houseAddress,
      streetAddress,
      city,
      state,
      zipCode,
      country,
      user: user._id,
    });

    const savedAddress = await address.save();

   
    user.address = savedAddress._id;
    await user.save();

    res.status(201).json({ message: 'Address added successfully', address: savedAddress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while adding the address' });
  }
}

const showEditAddress = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const addressId = req.params.id;

    const address = await Address.findOne({ _id: addressId, user: userId });

    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.status(200).render('user/edit-address', { title:"Edit Address",
      address });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the address' });
  }
};

const editAddress = async (req, res) => {
  try {

    const addressId = req.params.id
    const userId = req.session.user.id
    const address = await Address.findOne({ _id: addressId, user: userId });
    const {
      fullName,
      phoneNumber,
      houseAddress,
      streetAddress,
      city,
      state,
      zipCode,
      country
    } = req.body

    if (fullName) address.fullName = fullName;
    if (phoneNumber) address.phoneNumber = phoneNumber;
    if (houseAddress) address.houseAddress = houseAddress;
    if (streetAddress) address.streetAddress = streetAddress;
    if (city) address.city = city;
    if (state) address.state = state;
    if (zipCode) address.zipCode = zipCode;
    if (country) address.country = country
    await address.save()

    res.status(200).json({ success: true, message: 'Address updated successfully.' });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: `An error occurred while editing the Address: ${error.message}` });
  }
}

const deleteAddress = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const addressId = req.params.id;

    

    const address = await Address.findOne({ _id: addressId, user: userId });

    if (!address) {
   
      return res.status(404).json({ error: 'Address not found or not authorized to delete' });
    }

    address.deleted = true; 
    await address.save();

    res.status(200).json({ message: 'Address soft deleted successfully' });
  } catch (error) {
    console.error('Error in deleteAddress:', error);
    res.status(500).json({ error: 'An error occurred while deleting the address' });
  }
};

const showChangePassword = async(req,res)=>{

    res.status(200).render('user/change-password',{title:"Change Password"})
 
}

const changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const userId = req.session.user.id;

  try {
  
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).render('user/change-password', {
        message: 'User not found',
        messageType: 'error'
      });
    }

    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(404).render('user/change-password', {
        message: 'Current password is incorrect',
        messageType: 'error'
      });
    }

    
    if (newPassword !== confirmPassword) {
      return res.status(400).render('user/change-password', {
        message: 'New password and confirmation do not match',
        messageType: 'error'
      });
    }

    
    if (newPassword.length < 6) {
      return res.status(404).render('user/change-password', {
        message: 'Password must be at least 6 characters long',
        messageType: 'error'
      });
    }

    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

   
    user.password = hashedPassword;
    await user.save();

    
    res.status(200).redirect('/profile')

  } catch (error) {
    console.error(error);
    res.status(500).render('user/change-password', {
      message: 'Server error',
      messageType: 'error'
    });
  }
};

const showAbout = async(req,res)=>{
  res.status(200).render('user/about',{title:"About Page"})
}

const cartCount=async (req, res) => {
  try {
    const userId = req.session.user.id; 
    if (!userId) {
        return res.json({ count: 0 });
    }

    
    const cart = await Cart.findOne({ user: userId });
    let itemCount = 0;

    if (cart && cart.products.length > 0) {
        for (const item of cart.products) {
            itemCount += item.variant.quantity;
        }
    }

    res.status(200).json({ count: itemCount });
} catch (error) {
    console.error("Error fetching cart count:", error);
    res.status(500).json({ count: 0 });
}
}



module.exports = {
  showAddAddress,
  showAddress,
  showCart,
  showSearch,
  addAddress,
  showEditAddress,
  editAddress,
  deleteAddress,
  showProfile,
  showEditProfile,
  editProfile,
  addToCart,
  updateCart,
  removeFromCart,
  showChangePassword,
  changePassword,
  showAbout,
  cartCount,
  getCartData
}