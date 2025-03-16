const mongoose = require('mongoose');
const config = require('../config'); 

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.DB_URI);

        console.log('Database connected:', conn.connection.host);
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1); 
    }
};

module.exports = connectDB;
