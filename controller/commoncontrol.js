const express=require("express")
const session=require("express-session")

module.exports={
    logout:(req,res)=>{
        req.session.destroy((err)=>{
            if(err){
                console.log("error while destroying",err);
                return res.status(500).send("<h1>an error occured </h1>")
            }
            res.redirect("/login")
        })
    }
}