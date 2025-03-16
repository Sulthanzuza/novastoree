const cron = require('node-cron');
const OTP = require('../model/otp'); 


cron.schedule('0 * * * *', async () => {

    try {

        const now = new Date();
        await OTP.deleteMany({ createdAt: { $lte: now } });

    } catch (error) {

        console.error('Error cleaning up expired OTPs:', error);
        
    }
    
});


module.exports = cron;
