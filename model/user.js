const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: function() {
     
      return !this.googleId; 
    },
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function() {

      return !this.googleId; 
    },
  },
  lastOtpSentAt: {
    type: Date, 
    default: null, 
  },
  googleId: { 
    type: String, 
    unique: true, 
    sparse: true },

  isBlocked: {
    type: Boolean,
    default: false, 
  },
  phoneNumber: {
    type: String,
  },
  address: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address', 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isReferred:{
    type:Boolean,
    default:false,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('user', userSchema);
