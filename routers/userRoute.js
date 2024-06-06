const express=require("express")
const router=express.Router()
const userControll=require("../controller/userControll")


router.get("/login",userControll.getLoginpage)
.get("/signup",userControll.getsignupage)
.post("/signup",userControll.postSignup)
router.get("/otpvalidation",userControll.getSignupOtp)
module.exports=router