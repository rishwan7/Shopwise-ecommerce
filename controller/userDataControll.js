
const bcrypt = require("bcrypt");
const twilio = require("../utils/twilio");
const mailer = require("../utils/nodemailer");
const { userdetails } = require("../model/userDb");
const {UserAddress}=require("../model/addressDb")
const mongoose = require("mongoose");





  const getsignupage=(req, res) => {
    const errors = req.session.error;
    req.session.error = "";
    res.render("user/usersignup", { errors });
  }

const postSignup= async (req, res) => {
    const { names, email, phonenumber, password, cpassword } = req.body;
    console.log("before exis user");
    const existUser = await userdetails.findOne({ email: email });
    console.log("exist user");

    console.log(req.body);

    const isValidPassword = (password) => {
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]+$/;
      return passwordRegex.test(password);
    };

    if (!isValidPassword(password)) {
      console.log("password error");
      req.session.error = "password must in a correct format";
    }
    if (password != cpassword) {
      console.log("password mismatch");
      req.session.error = "password  mismatch";
    }

    if (existUser) {
      req.session.error = "this user already exist";
    }

    if (Object.keys(req.session.error).length > 0) {
      return res.redirect("/signup");
      console.log("error fetched");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    req.session.otp = otp;
    req.session.signupDetails = { names, email, password, phonenumber };

    res.redirect("/otpvalidation");

    await twilio.sendOtp(phonenumber, otp);
  }
  const getSignupOtp= (req, res) => {
    const usermob = req.session.signupDetails;
    const error = req.session.error;
    res.render("user/signupotp", { error, usermob });
  }
  const  postSignupOtp= async (req, res) => {
    if (!req.session.signupDetails) {
      req.session.error = "Session expired. Please sign up again";
      return res.redirect("/otpvalidation");
    }
    const { otp } = req.body;
    const { names, email, password, phonenumber } = req.session.signupDetails;
    console.log(req.session.otp);
    if (req.session.otp === otp) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const details = new userdetails({
       userName: names,
       userEmail :email,
       userPhone: phonenumber,
        userPassword: hashedPassword,
      });

      console.log(details);
      await details.save();
      req.session.userId = details._id;
      console.log(req.session.userId);
      res.redirect("/login");
    } else {
      req.session.error = "inavalid otp please try again";
      res.redirect("/otpvalidation");
    }
  }
  const resendOtp= async (req, res) => {
    try {
      if (!req.session.signupDetails) {
        return res.json({
          success: false,
          message: "Session expired. Please sign up again",
        });
      }

      const { phonenumber } = req.session.signupDetails;

      // Generate a new OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      req.session.otp = otp;

      // Send the new OTP
      await twilio.sendOtp(phonenumber, otp);

      res.json({ success: true, message: "OTP Resent Successfully" });
    } catch (error) {
      console.error("Error resending OTP:", error);
      res.json({ success: false });
    }
  }

  const  getLoginpage= (req, res) => {
    const errors = req.session.error;
    req.session.error = "";

    res.render("userlogin", { errors });
  }

  const  postLogin= async (req, res) => {
    const { email, password, forgotemail } = req.body;

    req.session.error = {};

    const usersData = await userdetails.findOne({ userEmail: email });

    if (!usersData) {
      req.session.error.emailerr = "incorect email id";
    } else {
      const isMatch = await bcrypt.compare(password, usersData.userPassword);
      if (!isMatch) {
        req.session.error.passerr = "Password is incorrect";
      }
    }

    if (Object.keys(req.session.error).length > 0) {
      return res.redirect("/login");
    }
    req.session.userId = usersData._id;
    // console.log(req.session.userId);
    res.redirect("index");
  }

 const forgotPassword= async (req, res) => {
    const { forgotemail } = req.body;
    console.log(req.body);
    req.session.error = {};

    const usersData = await userdetails.findOne({ userEmail: forgotemail });
    console.log(usersData);
    if (usersData) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      req.session.forgotOtp = otp;
      req.session.userId = usersData._id;
      req.session.email=usersData.email
      console.log(req.session.forgotOtp);
     

      try {
        await mailer.sendOtpEmail(forgotemail, otp);
        return res.json({
          success: true,
          message: `OTP sented to  ${forgotemail}`,
        });
      } catch (error) {
        console.error("Error sending OTP email:", error);
        return res.json({
          success: false,
          message: "Failed to send OTP email",
        });
      }
    } else {
      return res.json({ success: false, message: "This user doesn't exist" });
    }
  }

  const forgotOtp= (req, res) => {
    const { forgototp } = req.body;
    const storedotp = req.session.forgotOtp;
    console.log("this is email:",req.session.email);
    console.log("this is stored otp:", storedotp);
    console.log("this is forgot otp:", forgototp);
    if (storedotp === forgototp) {
      console.log(storedotp);
      console.log("existuser:", req.session.userId);
      res.json({ success: true });
    } else {
      return res.json({
        success: false,
        message: "Invalid otp please try again",
      });
    }
  }
  const forgotResendOtp=async(req,res)=>{
    const email=req.session.email
    console.log(email);

    try{  if(email){
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await mailer.sendOtpEmail(email, otp);
      console.log("done",otp);
      return res.json({
        success: true,
        message: `OTP sented to  ${email}`,
      });


    }else{
      res.json({success:false,message:"Session expired please try again"})
    }
  }catch(error){
    console.error(error);
    res.json({success:false,message:"An error occured while sending otp "})
  }
  
      
    



  }

  const changePassword= async (req, res) => {
    const { changepass} = req.body;
    console.log("this is body:", req.body);
    const userId = req.session.userId;
   

    if (!userId) {
      return res.json({ success: false, message: "User is not exist" });
    }

    try {

      const isValidPassword = (password) => {
        const passwordRegex =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]+$/;
        return passwordRegex.test(password);
      };

      if(!isValidPassword(changepass)){
        res.json({success:false,message:"password not be a correct format"})
      }


      

      const hashedPassword = await bcrypt.hash(changepass, 10);
      const updatedUser = await userdetails.findByIdAndUpdate(
        userId,
        { userPassword: hashedPassword },
        { new: true }
      );

      if (!updatedUser) {
        return res.json({ success: false, message: "User not found" });
      }

      return res.json({
        success: true,
        message: "Password updated successfully",
      });
    } catch (error) {
      console.error("An error occurred while updating password:", error);
      return res.json({
        success: false,
        message: "An error occurred while updating password",
      });
    }
  }

const postUserAddress = async (req, res) => {
  const { fname, lname, billing_address, billing_address2, city, state, zipcode, phone } = req.body;
  const userId = req.session.userId; // Ensure userId is being set properly in session
  console.log(req.body,"this is req body");

  if (!userId) {
      return res.status(400).json({ success: false, message: "User not found. Please log in." });
  }

  try {
      let userAddresses = await UserAddress.findOne({ userId });

      if (!userAddresses) {
          userAddresses = new UserAddress({
              userId: userId,
              addresses: []
          });
      }

      const newAddress = {
          firstName: fname,
          lastName: lname,
          address: billing_address,
          address2: billing_address2,
          city: city,
          state: state,
          postalCode: zipcode,
          phone: phone
      };

      userAddresses.addresses.push(newAddress);
      await userAddresses.save();

    return  res.json({ success: true, address: newAddress });
  } catch (error) {
      console.error('Error adding address:', error);
      res.status(500).json({ success: false, message: "Internal server error" });
  }
};



  module.exports={getsignupage,getLoginpage,getSignupOtp,changePassword,forgotPassword,forgotResendOtp,postLogin,postSignup,postSignupOtp,forgotOtp,resendOtp,postUserAddress}


