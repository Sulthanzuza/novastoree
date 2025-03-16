const coupon = require('../model/coupon');
const Coupon = require('../model/coupon')
const moment = require('moment');

const showAddCoupon = (req,res)=>{
    res.status(200).render('admin/add-coupon',{
        title:"Add Coupon"
    })
}
const addCoupon = async (req, res) => {
    try {
        const { name, code, description, start, expiry, minAmount, discountAmount,  maxAmount, status, limit, usageType } = req.body;

    
        const newCoupon = new Coupon({
            name,
            code,
            description,
            start,
            expiry,
            minAmount,
            maxAmount,
            status,
            discountAmount,
            limit,
            usageType
        });

        await newCoupon.save(); 

        res.status(201).json({ success: true, message: 'Coupon created successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating coupon', error });
    }
};


const showCoupon = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        
        const formattedCoupons = coupons.map(coupon => {
            const currentDate = new Date();
            const expiryDate = new Date(coupon.expiry);
         
            const isActive = expiryDate >= currentDate && coupon.status;
            
            return {
                ...coupon._doc,
                createdAt: coupon.createdAt.toISOString().split('T')[0],
                start: coupon.start.toISOString().split('T')[0],
                expiry: coupon.expiry.toISOString().split('T')[0],
                status: isActive
            };
        });
        
        res.status(200).render('admin/coupon', { 
            title: "Coupons",
            coupons: formattedCoupons 
        });
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).send('Internal Server Error');
    }
};

const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;

        await Coupon.findByIdAndDelete(id);

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error deleting coupon:', error);

        res.status(500).json({ success: false, message: 'Error deleting coupon' });
    }
};

const toggleCouponStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findById(id);
        
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }
        
        
        coupon.status = !coupon.status;
        coupon.updatedAt = new Date(); 
        await coupon.save();
        
        res.status(200).json({ 
            success: true, 
            status: coupon.status,
            message: `Coupon ${coupon.status ? 'activated' : 'deactivated'} successfully` 
        });
    } catch (error) {
        console.error('Error toggling coupon status:', error);
        res.status(500).json({ success: false, message: 'Error updating coupon status' });
    }
};


 const showEditCoupon =  async (req, res) => {
    try {
        const couponId = req.params.id;
        const coupon = await Coupon.findById(couponId);
        

        if (!coupon) {
            return res.status(404).send('Coupon not found');
        }

        
        const formattedCoupon = {
            ...coupon.toObject(),
            start: moment(coupon.start).format('YYYY-MM-DD'),
            expiry: moment(coupon.expiry).format('YYYY-MM-DD'),
        };

        res.status(200).render('admin/edit-coupon', {title:"Edit Coupon",
             coupon: formattedCoupon });
    } catch (error) {
        console.error('Error fetching coupon:', error);
        res.status(500).send('Server Error');
    }
}


const editCoupon = async (req, res) => {
    
    try {
        const couponId = req.params.id; 
        
        
        const {
            name, code, description, start, expiry, minAmount,
            maxAmount, discountAmount, limit, status,usageType,
        } = req.body;

        
        const existingCoupon = await Coupon.findById(couponId);
        if (!existingCoupon) {
            return res.status(404).json({ success: false, message: "Coupon not found!" });
        }

        
        if (name === undefined || code === undefined || description === undefined || 
            start === undefined || expiry === undefined || minAmount === undefined ||
            maxAmount === undefined || discountAmount === undefined || limit === undefined) {
            return res.status(400).json({ success: false, message: "Please fill in all required fields." });
        }

        
        if (discountAmount !== undefined && (discountAmount < 0 || discountAmount > 99)) {
            return res.status(400).json({ success: false, message: "Discount should be between 0 and 99%." });
        }

        
        if (start && expiry) {
            const activationDate = new Date(start);
            const expiryDate = new Date(expiry);
            if (expiryDate <= activationDate) {
                return res.status(400).json({ success: false, message: "Expiry date must be after activation date." });
            }
        }

        
        if ((minAmount !== undefined && minAmount < 0) || 
            (maxAmount !== undefined && maxAmount < 0) || 
            (minAmount !== undefined && maxAmount !== undefined && minAmount > maxAmount) || 
            (limit !== undefined && limit < 0)) {
            return res.status(400).json({ success: false, message: "Amount fields and usage limit cannot be negative." });
        }

        
        const updateData = {};
        
        
        if (name !== undefined) updateData.name = name;
        if (code !== undefined) updateData.code = code;
        if (description !== undefined) updateData.description = description;
        if (start !== undefined) updateData.start = start;
        if (expiry !== undefined) updateData.expiry = expiry;
        if (minAmount !== undefined) updateData.minAmount = minAmount;
        if (maxAmount !== undefined) updateData.maxAmount = maxAmount;
        if (discountAmount !== undefined) updateData.discountAmount = discountAmount;
        if (limit !== undefined) updateData.limit = limit;
        if (status !== undefined) updateData.status = status === true || status === 'true';
        if(usageType!==undefined) updateData.usageType = usageType;

        
        const updatedCoupon = await Coupon.findByIdAndUpdate(
            couponId,
            { $set: updateData },
            { new: true } 
        );

        return res.status(200).json({ success: true, message: "Coupon updated successfully!", coupon: updatedCoupon });

    } catch (error) {
        console.error("Error updating coupon:", error);
        return res.status(500).json({ success: false, message: "Something went wrong. Please try again!" });
    }
 };



module.exports = {
    showAddCoupon,
    addCoupon,
    showCoupon,
    deleteCoupon,
    showEditCoupon,
    editCoupon,
    toggleCouponStatus
}