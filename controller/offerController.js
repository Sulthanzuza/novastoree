const Offer = require('../model/offer')


const showAddOffer = (req,res)=>{
    
    res.status(200).render('admin/add-offer',{title:"Add Offer"})
}


const addOffer = async (req, res) => {
    try {
      const { name, description, type, start, expiry, status, discount} = req.body;
  
      
      if (!name || !description || !type || !start || !expiry || status === undefined || discount === undefined ) {
          return res.status(400).json({ success: false, message: "All fields must be filled!" });
      }
  
      
      const validTypes = ["products", "category"];
      
      if (!validTypes.includes(type)) {
          return res.status(400).json({ success: false, message: "Invalid offer type!" });
      }
  
     
      const discountValue = parseFloat(discount);

  
      if (isNaN(discountValue)) {
          return res.status(400).json({ success: false, message: "Amount and Discount must be valid numbers!" });
      }
  
      
      if (discountValue < 0 ) {
          return res.status(400).json({ success: false, message: "Numbers cannot be negative!" });
      }
  
      
      if (discountValue < 1 || discountValue > 99) {
          return res.status(400).json({ success: false, message: "Discount must be between 1 and 99!" });
      }
  
      
      const startDate = new Date(start);
      const expiryDate = new Date(expiry);
      
      if (isNaN(startDate.getTime()) || isNaN(expiryDate.getTime())) {
          return res.status(400).json({ success: false, message: "Invalid date format!" });
      }
      
      if (expiryDate <= startDate) {
          return res.status(400).json({ success: false, message: "Expiry date must be later than activation date!" });
      }
  
      
      const existingOffer = await Offer.findOne({ name });
      if (existingOffer) {
          return res.status(400).json({ success: false, message: "Offer with this name already exists!" });
      }
  
      
      const newOffer = new Offer({
          name,
          description,
          type,
          start: startDate,
          expiry: expiryDate,
          status: status === "true",
          discount: discountValue,
      });
  
      await newOffer.save();
      
      return res.status(200).json({ success: true, message: "Offer added successfully!" });
  
    } catch (error) {
        console.error("Error adding offer:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
}

const showOffer = async (req, res) => {
    try {
        const offers = await Offer.find();
        const currentDate = new Date();
        
       
        const formattedOffers = await Promise.all(offers.map(async (offer) => {
            const startDate = new Date(offer.start);
            const expiryDate = new Date(offer.expiry);
            const dateFormatter = new Intl.DateTimeFormat('en-US');
            
            
            let isActive = offer.status;
            
            
            if (expiryDate < currentDate && offer.status === true) {
                isActive = false;
                await Offer.findByIdAndUpdate(offer._id, { status: false });
            }
            
            return {
                _id: offer._id,
                name: offer.name,
                type:offer.type,
                discount: offer.discount,
                start: dateFormatter.format(startDate),
                expiry: dateFormatter.format(expiryDate),
                status: isActive
            };
        }));
        
        res.status(200).render('admin/offers', {
            title: "Coupons Management",
            offers: formattedOffers
        });
    } catch (error) {
        console.error("Error fetching offers:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};


const deleteOffer = async (req, res) => {
    const { id } = req.params;
    
    try {
        const offer = await Offer.findByIdAndDelete(id);
        
        if (!offer) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }
        
        res.status(200).json({ success: true, message: "Offer deleted successfully!" });
    } catch (error) {
        console.error("Error deleting offer:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

const toggleOfferStatus = async (req, res) => {
    const { id } = req.params;
    
    try {
        const offer = await Offer.findById(id);
        
        if (!offer) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }
        
        
        const newStatus = req.body.status !== undefined ? req.body.status : !offer.status;
        
        
        const updatedOffer = await Offer.findByIdAndUpdate(
            id, 
            { status: newStatus },
            { new: true } 
        );
        
        res.status(200).json({ 
            success: true, 
            message: `Offer ${newStatus ? 'activated' : 'deactivated'} successfully!`,
            newStatus: updatedOffer.status
        });
    } catch (error) {
        console.error("Error toggling offer status:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};



module.exports={
    showAddOffer,
    addOffer,
    showOffer,
    deleteOffer,
    toggleOfferStatus
}