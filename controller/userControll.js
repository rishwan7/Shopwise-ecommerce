const express=require("express")
const userdetails=require("../model/userDb")


module.exports={
    getLoginpage:(req,res)=>{
        res.render("login")
    },

    getsignupage:(req,res)=>{
        res.render("signup")
    },


    postSignup:async(req,res)=>{
        console.log(req.body);
        const details=new userdetails(req.body)
        await details.save()
        console.log(details);
        res.send("okk")


      


    },

    getSignupOtp:(req,res)=>{
        res.render("signupotp")
    }
}