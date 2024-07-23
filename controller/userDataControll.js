
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
      console.log("error fetched");
      return res.redirect("/signup");
      
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    req.session.otp = otp;
    req.session.signupDetails = { names, email, password, phonenumber };


    // twilio otp generation was turned of due to the trial version has send otp to limited numbers

    // const otpSent = await twilio.sendOtp(phonenumber, otp);
    // if (!otpSent) {
    //   req.session.error = 'Failed to send OTP please try anothor mobile number.';
    //   return res.redirect('/signup');
    // }

   
      await mailer.sendOtpEmail(email, otp);
      
    // Redirect to OTP validation page after sending OTP
    res.redirect('/otpvalidation');
  }
  const getSignupOtp= (req, res) => {
    const usermob = req.session.signupDetails;
    const error = req.session.error;
    res.render("user/signupotp", { error, usermob });
  }
  const  postSignupOtp= async (req, res) => {

    try{


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
    }catch(error){
      onsole.error('Signup error:', error.message);
    req.session.error = error.message;
    res.redirect('/signup');
    }
  }
  const resendOtp= async (req, res) => {
    try {
      if (!req.session.signupDetails) {
         res.json({
          success: false,
          message: "Session expired. Please sign up again",
        });

        return res.redirect("/signup")
      
      }

      const { email } = req.session.signupDetails;

      // Generate a new OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      req.session.otp = otp;
      console.log(otp);

      // Send the new OTP
      
        await mailer.sendOtpEmail(email, otp);
         
      
    
    } catch (error) {
      console.error("Error resending OTP:", error);
      res.json({ success: false });
    }
  }

  const  getLoginpage= (req, res) => {
    const errors = req.session.error;
    req.session.error = "";

    res.render("user/userlogin", { errors });
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

    
    if(usersData){
      req.session.userStatus=usersData.userStatus

      if(usersData.userStatus==="block"){
      req.session.error.blockerr='Your account is blocked. Please contact support.'
    }
    }

    if (Object.keys(req.session.error).length > 0) {
      return res.redirect("/login");
    }
    req.session.userId = usersData._id;
    // console.log(req.session.userId);
    res.redirect("/");
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
      req.session.email=usersData.userEmail
      console.log(req.session.email);

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
        message: `OTP resented to  ${email}`,
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

const addressUpdate=async (req,res)=>{
  const userId=req.session.userId
  const { addressId, firstName, lastName, address, address2, city, state, postalCode, phone } = req.body;
  console.log(addressId);
  try {
    const addressupdate = await UserAddress.updateOne(
        { userId: mongoose.Types.ObjectId.createFromHexString(userId), "addresses._id": mongoose.Types.ObjectId.createFromHexString(addressId) },
        {
            $set: {
                "addresses.$.firstName": firstName,
                "addresses.$.lastName": lastName,
                "addresses.$.address": address,
                "addresses.$.address2": address2,
                "addresses.$.city": city,
                "addresses.$.state": state,
                "addresses.$.postalCode": postalCode,
                "addresses.$.phone": phone
            }
        }
    );

    console.log(addressupdate);
    console.log(addressId);

    if (addressupdate.modifiedCount === 0) {
        return res.status(404).json({ success: false, message: "Address not found or not updated" });
    }

    res.json({ success: true, message: "Address updated" });
} catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ success: false, message: "Failed to update address", error });
}

};

const deleteAddress=async (req,res)=>{
  const userId = req.session.userId;
  const { addressId } = req.body; // Assuming addressId is sent as a URL parameter

  try {
      const result = await UserAddress.updateOne(
          { userId: userId },
          { $pull: { addresses: { _id: mongoose.Types.ObjectId.createFromHexString(addressId) } } }
      );

     
      if (result. modifiedCount > 0) {
        const addresses = await UserAddress.aggregate([
          {
            $match: { userId: mongoose.Types.ObjectId.createFromHexString(userId) },
          }, // Match documents with the given userId
          { $unwind: "$addresses" }, // Deconstruct the addresses array
          { $replaceRoot: { newRoot: "$addresses" } }, // Replace the root with addresses array
        ]);
    

          res.json({ success: true, message: "Address deleted successfully" ,addresses});
      } else {
          res.status(404).json({ success: false, message: "Address not found or not deleted" });
      }
  } catch (error) {
      console.error('Error deleting address:', error);
      res.status(500).json({ success: false, message: "Failed to delete address", error });
  }
};








  module.exports={getsignupage,getLoginpage,getSignupOtp,changePassword,forgotPassword,forgotResendOtp,postLogin,postSignup,postSignupOtp,forgotOtp,resendOtp,postUserAddress,addressUpdate,deleteAddress}


