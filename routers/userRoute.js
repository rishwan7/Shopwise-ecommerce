const express=require("express")
const router=express.Router()
const userControll=require("../controller/userControll")


router.get("/login",userControll.getLoginpage)
router.get("/signup",userControll.getsignuppage)
router.get("/otpvalidation",userControll.getSignupOtp)
module.exports=router