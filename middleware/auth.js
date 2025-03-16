const User = require('../model/user');

const checkSession = async (req, res, next) => {
  if (req.session.user) {
    try {
      const user = await User.findById(req.session.user.id); 
      if (user && user.isBlocked) {
        req.session.destroy((err) => {
          if (err) {
            console.error('Error destroying session:', err);
          }
          return res.redirect('/login'); 
        });
      } else {
        return res.redirect('/home'); 
      }
    } catch (err) {
      console.error('Error checking user session:', err);
      return res.redirect('/login'); 
    }
  } else {
    next(); 
  }
};

const isLogin = async (req, res, next) => {
  if (req.session.user) {
    try {
      const user = await User.findById(req.session.user.id); 
      
      if (user && user.isBlocked) {
        req.session.destroy((err) => {
          if (err) {
            console.error('Error destroying session:', err);
          }
          return res.redirect('/login'); 
        });
      } else {
        next(); 
      }
    } catch (err) {
      console.error('Error checking user login:', err);
      return res.redirect('/login'); 
    }
  } else {
    return res.redirect('/login');
  }
};

module.exports = { checkSession, isLogin };