// Import dependencies
const express = require('express');
const app = express();
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const path = require('path');
const bodyParser = require('body-parser');
const connetDB = require('./database/connectDB');
const session = require('express-session');
const nocache = require('nocache');
const config = require('./config'); 
const hbs = require('hbs');
const cronJobs = require('./config/cronJobs'); 
const helpers = require('./helpers/helpers');
const MongoStore = require('connect-mongo');
const passport = require('./config/passport');
const moment = require('moment');
const rateLimit = require('express-rate-limit')



hbs.registerHelper('ifCond', helpers.ifCond);
hbs.registerHelper('chunk', helpers.chunk);
hbs.registerHelper('add', function (a, b) {
    return a + b;
  });
hbs.registerHelper('subtract',function(a,b){
  return a-b
})
hbs.registerHelper('eq', (a, b) => a === b);
hbs.registerHelper('neq', (a, b) => a !== b);
  hbs.registerHelper('increment', function(value) {
    return parseInt(value) + 1;
  });
  hbs.registerHelper('gt', function (value1, value2) {
    return value1 > value2;
  });
  hbs.registerHelper('or', function (a, b) {
    return a || b;
});
hbs.registerHelper('divide', function (a, b) {
  if (!b || b == 0) return 0; 
  return (a / b).toFixed(2); 
});
hbs.registerHelper('json', function(context) {
return JSON.stringify(context);
});
hbs.registerHelper('toFixed', function (value, decimalPlaces) {
  return parseFloat(value).toFixed(decimalPlaces);
});
hbs.registerHelper('isInWishlist', function(productId, wishlistProductIds) {
  return wishlistProductIds.has(productId.toString());
})
hbs.registerHelper('formatDate', function (date) {
  return new Date(date).toLocaleDateString();
});
hbs.registerHelper('and', function() {
  return Array.prototype.every.call(arguments, Boolean);
});
hbs.registerHelper('generateStars', function (rating) {
  let stars = '';
  for (let i = 0; i < 5; i++) {
      stars += i < rating ? '<i class="fas fa-star text-warning"></i>' : '<i class="far fa-star text-muted"></i>';
  }
  return new hbs.SafeString(stars);
});
hbs.registerHelper("notCompleted", function (products) {

  const allCancelledOrReturned = products.every(product => 
    product.productStatus === "Cancelled" ||
    product.productStatus === "Returned" ||
    product.productStatus === "Return Approved"
  );

  
  const anyPendingOrProcessing = products.some(product => 
    product.productStatus === "Pending" ||
    product.productStatus === "Processing" ||
    product.productStatus === "Shipped"
  );


  if (allCancelledOrReturned || anyPendingOrProcessing) {
    return true;  
  }

  return false;  
});

hbs.registerHelper('formatDate', function(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString(); // Adjust the format as needed
});
hbs.registerHelper('range', function(min, max) {
  const result = [];
  for (let i = min; i <= max; i++) {
    result.push(i);
  }
  return result;
});
hbs.registerHelper('lt', function(a, b) {
  return a < b;
});
hbs.registerHelper('multiply', (a, b) => a * b);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(path.join(__dirname, 'views/partials'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(nocache());

// Session middleware
app.use(
    session({
        secret: config.session.secret,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 }, 
    })
);

// Passport middleware (AFTER express-session)
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/', userRoutes);
app.use('/admin', adminRoutes);
app.use((req,res)=>{
  res.render('user/error',{
    title:"Error"
  })
})


// Connect to DB
connetDB();

// Start server
app.listen(config.app.port, () => {
    console.log(`Server running on port ${config.app.port} (${config.app.environment})`);
});
