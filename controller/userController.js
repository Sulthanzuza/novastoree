const User = require('../model/user')
const bcrypt = require('bcryptjs')
const saltround = 10  
const otpGenerator = require('otp-generator');
const transporter = require('../config/emailService')
const OTP = require('../model/otp')
const Refferal = require('../model/refferal')
const Wallet = require('../model/wallet')


const loadRegister= (req,res)=>{
    res.status(200).render('user/signup',{title:"Sign up"})
}



const registerUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password, refferalCode } = req.body;



        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).render('user/signup', { message: 'User already exists' });
        }
        if (refferalCode) {
            const referral = await Refferal.findOne({ referralCode: refferalCode });
            if (!referral) {
                return res.status(400).render('user/signup', { 
                    message: 'Invalid referral code',
                    script: `<script>
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Oops...',
                                    text: 'Invalid referral code',
                                });
                            </script>`
                });
            }
        
            referral.referredUsers.push(email);
            await referral.save();
        }
        
       
        const hashedPassword = await bcrypt.hash(password, 10);

      
        const newUser = new User({
            firstName,
            lastName,
            email,
            isReferred:refferalCode ? true : false,
            password: hashedPassword,
            isBlocked: true, 
            lastOtpSentAt: new Date(),
        });
        
        if (refferalCode) {
            const referredUser = await Refferal.findOne({ referralCode: refferalCode });
            if (referredUser) {
                const refWallet = await Wallet.findOne({ user_id: referredUser.userId });

                if (refWallet) {
                   
                    refWallet.balance += 50; 
                    refWallet.transactions.push({
                        amount: 50,
                        type: 'Credit',
                        description: 'Referral Bonus for referring ' + email,
                    });

                    await refWallet.save();
                }
            }
        }

        
        const newWallet = new Wallet({
            userId: newUser._id,
            balance: 0, 
            transactions: [], 
        });

        await newWallet.save(); 
        await newUser.save();

        
        const generateOtp = async (email) => {
          
            const existingOtp = await OTP.findOne({ email });

            if (existingOtp && new Date() - existingOtp.createdAt < 5 * 60 * 1000) {
                throw new Error('OTP already sent. Please check your email.');
            }

            const otp = Math.floor(1000 + Math.random() * 9000); 
            const createdAt = new Date(); 

            
            await OTP.create({
                email,
                otp,
                createdAt,
            });

            return otp; 
        };

        const otp = await generateOtp(email);

        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Registration OTP',
            text: `Your OTP for registration is: ${otp}. It is valid for 5 minutes.`,
        };

        
        const sendEmail = (mailOptions) => {
            return new Promise((resolve, reject) => {
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        reject('Failed to send OTP. Please try again later.');
                    } else {
                        resolve(info);
                    }
                });
            });
        };

        try {
            await sendEmail(mailOptions);

          
            req.session.tempEmail = email; 
            res.status(200).redirect('/verify-otp');
        } catch (error) {
            console.error('Error sending email:', error);
            return res.render('user/signup', { message: error });
        }

    } catch (error) {
        console.error(error);

        res.status(500).render('user/signup', { message: 'Something went wrong. Please try again later.' });
    }
};

const loadotpPage=(req,res)=>{
    res.status(200).render('user/verify-otp',{title:"OTP"})
}


const loadLogin = (req,res)=>{
    res.status(200).render('user/login',{title:"Login"})
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        const userName = user.firstName;
        if (!user) {
            return res.status(404).render('user/login', { message: "User does not exist" });
        }
        if(user.isBlocked==true ){
            return res.status(400).render('user/login',{message:"user is blocked"})
        }
        if(!user|| !email){
            return res.status(400).render('user/login',{message:"fill all fields"})
        }
        
        const date = new Date()
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).render('user/login', { message: "Incorrect password" });
        }

//         const mailOptions = {
//             from: process.env.EMAIL_USER,
//             to: email,
//             subject: 'Login Alert',
//             text: `Hi ${userName},

// We noticed a successful login to your account on NOVA Store.

// Login Details:

// Date & Time: ${date}

// If this was you, no further action is required.
// However, if you did not initiate this login, please reset your password immediately or contact our support team.



// We prioritize your security and are always here to help!
// Enjoy shopping `,
//         };

        
//         const sendEmail = (mailOptions) => {
//             return new Promise((resolve, reject) => {
//                 transporter.sendMail(mailOptions, (error, info) => {
//                     if (error) {
//                         reject('Failed to sent Email');
//                     } else {
//                         resolve(info);
//                     }
//                 });
//             });
//         };
        
        try {
            // await sendEmail(mailOptions);

            req.session.user = {
                id: user._id,
                email:user.email
            }; 
    
            
            res.status(200).redirect('/home');

        } catch (error) {
            console.error('Error sending email:', error);
            return res.status(500).render('user/signup', { message: error });
        }

    } catch (error) {

        console.error(error); 
        res.status(500).render('user/login', { message: 'Something went wrong' });
    }
};

const showError = async (req, res) => {
    res.render('user/error', { title:"404 Error",
        message: req.query.message || "Oops! Something went wrong." });
};

const forgotpassword=  (req,res)=>{
    res.status(200).render('user/forgot',{title:"Forgot Password"})
}

const forgot = async (req, res) => {
    const { email } = req.body;
    

    try {
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).render('user/forgot', { message: 'No account found with this email.' });
        }

        
        const otp = Math.floor(1000 + Math.random() * 9000); 

        
        await OTP.updateOne(
            { email }, 
            { 
                $set: { 
                    otp: otp.toString(), 
                    createdAt: new Date() 
                }
            },
            { upsert: true } 
        );

        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset OTP',
            text: `Your OTP for password reset is: ${otp}. It is valid for 5 minutes.`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).send('Failed to send OTP. Please try again later.');
            }
            req.session.email = email; 
            res.status(200).redirect('/otp');
        });
    } catch (error) {
        console.error('Error in forgot password:', error);
        res.status(500).render('user/error', { message: 'Something went wrong. Please try again later.' });
    }
};

const showotp= (req,res)=>{
    res.status(200).render('user/otp',{title:"OTP"})
}

const verifyOtp = async (req, res) => {
    const { otp } = req.body;
    const email = req.session.email; 
    
    try {
        const otpEntry = await OTP.findOne({ email });

        if (!otpEntry) {
            return res.status(404).json({ success: false, message: 'OTP not found. Please request a new one.' });
        }

        const isExpired = (new Date() - new Date(otpEntry.createdAt)) > 5 * 60 * 1000; 
        if (isExpired) {
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }

        if (otpEntry.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
        }

        
        req.session.isOtpVerified = true;
        
        return res.status(200).json({ success: true});
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return res.status(500).json({ success: false, message: 'An error occurred during OTP verification. Please try again.' });
    }
}

const resendOtp = async (req, res) => {
    const email = req.session.email;

    if (!email) {
        return res.status(400).json({ success: false, message: 'No email in session.' });
    }

    try {
       
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'No account found with this email.' });
        }

        
        const otp = Math.floor(1000 + Math.random() * 9000);

        
        const updateResult = await OTP.updateOne(
            { email }, 
            {
                $set: {
                    otp: otp.toString(), 
                    createdAt: new Date(), 
                },
            },
            { upsert: true } 
        );

        if (updateResult.matchedCount === 0 && !updateResult.upsertedCount) {
            return res.status(500).json({ success: false, message: 'Failed to update OTP in the database.' });
        }

        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Resent OTP for Password Reset',
            text: `Your new OTP for password reset is: ${otp}. It is valid for 5 minutes.`,
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ success: false, message: 'Failed to send OTP.' });
            }

           
            return res.status(200).json({ success: true, message: 'OTP resent successfully.' });
        });
    } catch (error) {
        console.error('Error resending OTP:', error);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
    }
};

  const loadReset = (req,res)=>{
    res.status(200).render('user/reset',{title:"Reset Password"})    
}

const resetPass = async (req, res) => {
    try {
        const { password } = req.body;
        const email = req.session.email; 

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Invalid request!' });
        }

       
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found!' });
        }

        
        const hashedPassword = await bcrypt.hash(password, 10);

       
        const updatedUser = await User.findOneAndUpdate({ email }, { password: hashedPassword }, { new: true });

        if (!updatedUser) {
            return res.status(400).json({ success: false, message: 'Failed to update password.' });
        }

        
        return res.status(200).json({ success: true, message: 'Password updated successfully.' });

    } catch (error) {
        console.error('Error resetting password:', error);
        
        if (!res.headersSent) {
            return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
        }
    }
};




const logout = async (req, res) => {

    const email = req.session.user.email;
    const user = await User.findOne({ email });
    const userName = user.firstName
    const date = new Date();

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Logout Alert',
        text: `Hi ${userName},

We noticed a logout from your account on NOVA Store.

Logout Details:

Date & Time: ${date}

If this was you, no further action is required.
However, if you did not initiate this logout, we strongly recommend changing your password immediately or contacting our support team.


Your security is our priority!
Thank you for shopping with NOVA Store.
`,
    };

    const sendEmail = (mailOptions) => {
        return new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    reject('Failed to send Email');
                } else {
                    resolve(info);
                }
            });
        });
    };

    try {
       
        await sendEmail(mailOptions);

       
        req.session.destroy((err) => {
            if (err) {
                console.error("Error destroying session: " + err);
                return res.status(200).redirect("/login");
            }
            
            res.clearCookie('connect.sid');
            return res.status(500).redirect("/login");
        });

    } catch (error) {
        console.error("Failed to send logout email: " + error);
        res.status(500).redirect("/login");
    }
};


const verifyRegisterOtp = async (req, res) => {
    const { otp } = req.body;
    const email = req.session.tempEmail;

    if (!email) {
        return res.status(400).redirect('/signup');
    }

    try {
        
        const otpEntry = await OTP.findOne({ email });
        if (!otpEntry) {
            return res.status(400).render('user/verify-otp', { message: 'Invalid OTP request.' });
        }

        const cleanupUnverifiedUsers = async () => {
            const cleanupTime = 30 * 60 * 1000; 
        
            
            const unverifiedUsers = await User.find({ isBlocked: true, createdAt: { $lt: new Date(Date.now() - cleanupTime) } });
        
            
            await User.deleteMany({ _id: { $in: unverifiedUsers.map(user => user._id) } });
        };

        cleanupUnverifiedUsers();

        
        const otpExpiryTime = 5 * 60 * 1000; 
        if (Date.now() - otpEntry.createdAt > otpExpiryTime) {
            return res.status(400).render('user/verify-otp', { message: 'OTP has expired. Please request a new OTP.' });
        }

        
        

        if (otpEntry.otp === otp) {
            
            await User.updateOne({ email }, { $set: { isBlocked: false } });
            await OTP.deleteOne({ email }); 
            req.session.tempEmail = null; 
            return res.status(200).json({ success: true, message: 'OTP verified successfully!' });
        } else {
            return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
        }
        
        
    } catch (error) {
        console.error(error);
        res.status(500).render('user/verify-otp', { message: 'Something went wrong. Please try again later.' });
    }
};

const resendRegisterOtp = async (req, res) => {
    const email = req.session.tempEmail;
    if (!email) {
        return res.status(400).json({ success: false, message: 'Email not found in session.' });
    }

    try {
        const otp = Math.floor(1000 + Math.random() * 9000);
        const createdAt = new Date(); 

       
        await OTP.updateOne({ email }, { otp, createdAt });

        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Registration OTP',
            text: `Your new OTP for registration is: ${otp}. It is valid for 5 minutes.`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ success: false, message: 'Failed to resend OTP. Please try again later.' });
            }

            return res.status(200).json({
                success: true,
                message: 'OTP resent successfully!'
            });
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Failed to resend OTP. Please try again later.' });
    }
};





module.exports= {
    registerUser,
    loadRegister,
    loadLogin,
    login,
    logout,
    forgotpassword,
    forgot,
    loadReset,
    showotp,
    verifyOtp,
    resendOtp,
    resetPass,
    loadotpPage,
    verifyRegisterOtp,
    resendRegisterOtp,
    showError
}