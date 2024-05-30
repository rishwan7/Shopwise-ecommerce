const express=require("express")

module.exports={
    getLoginpage:(req,res)=>{
        res.render("login")
    },

    getsignuppage:(req,res)=>{
        res.render("signup")
    },

    getSignupOtp:(req,res)=>{
        res.render("signupotp")
    }
}