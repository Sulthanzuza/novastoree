const User = require('../model/user');

const checkSession = async (req, res, next) => {
  if (req.session.user) {
    try {
      const user = await User.findById(req.session.user.id); 
      if (user && user.isBlocked) {
       
        delete req.session.user
        return res.redirect('/login')
      } else {
        return res.redirect('/'); 
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
      
        delete req.session.user
        return res.redirect('/login')
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