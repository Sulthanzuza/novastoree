const checkSession = (req,res,next)=>{
    if(req.session.admin){
        next()
    }else{
        res.redirect('/admin/login')
    }
}

const isLogin =(req,res,next)=>{
    if(req.session.admin){
        res.redirect('/admin/dashboard')
    }else{
        next()
    }

}
const isAdminAuthenticated = (req, res, next) => {
    if (req.session && req.session.admin) {
      return next(); 
    }
    return res.redirect('/admin/login'); 
  };


module.exports = {checkSession, isLogin,isAdminAuthenticated}