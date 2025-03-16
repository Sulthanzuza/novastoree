const Review = require('../model/review')
const Order = require('../model/order')
const User = require('../model/user')


const submitReview = async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        const userId = req.session.user.id; 
        
        const hasPurchased = await Order.exists({
            userId: userId,
            "products.productId": productId,
            "products.productStatus": "Delivered"
        });

        if (!hasPurchased) {
            return res.status(403).json({ message: "You can only review delivered products." });
        }

        
        const newReview = new Review({
            userId,
            productId,
            rating,
            comment
        });
        await newReview.save();

        res.status(201).json({ message: "Review submitted successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong. Please try again." });
    }
}

const addReply = async (req, res) => {
    const { reviewId } = req.params;
        const { comment } = req.body;
        const userId = req.session.user.id;

    try {
        
        const review = await Review.findById(reviewId);
        
        

        const user = await User.findById(userId);
       
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const reply = {
            userId: userId,
            comment,
            createdAt: new Date()
        };

        review.replies.push(reply);
        await review.save();

        res.status(201).json({ message: 'Reply added successfully', reply });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
const review = async (req, res) => {
    try {
        const { offset, limit } = req.query;

        const reviews = await Review.find()
            .populate("userId") 
            .sort({ createdAt: -1 }) 
            .skip(Number(offset))
            .limit(Number(limit));

        const totalReviews = await Review.countDocuments();
        const hasMoreReviews = totalReviews > Number(offset) + Number(limit);

    
        const formattedReviews = reviews.map(review => ({
            _id: review._id,
            userName: review.userId 
                ? `${review.userId.firstName} ${review.userid.lastName || ''}` 
                : 'Anonymous',
            userAvatar: review.userId 
                ? `https://ui-avatars.com/api/?name=${review.userId.firstName}+${review.userId.lastName || ''}&background=random&color=fff&size=40` 
                : '',
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt
        }));

        res.status(200).json({ reviews: formattedReviews, hasMoreReviews });

    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ message: "Server error" });
    }
};


const reply = async (req, res) => {
    try {
        const reviewId = req.params.reviewId;
        const offset = parseInt(req.query.offset) || 0;
        const limit = parseInt(req.query.limit) || 5;

        let review = await Review.findById(reviewId).populate('replies.userId');  

        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        let replies = review.replies.slice(offset, offset + limit).map(reply => {
            return {
                _id: reply._id,
                userName: reply.userId ? `${reply.userId.firstName} ${reply.userId.lastName || ''}` : 'Anonymous',
                userAvatar: reply.userId 
                    ? `https://ui-avatars.com/api/?name=${reply.userId.firstName}+${reply.userId.lastName || ''}&background=random&color=fff&size=40` 
                    : '',
                comment: reply.comment,
                createdAt: reply.createdAt
            };
        });

        const hasMoreReplies = review.replies.length > offset + limit;

        res.status(200).json({ replies, hasMoreReplies });
    } catch (error) {
        console.error("Error fetching replies:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports={
    submitReview,
    addReply,
    review,
    reply

}