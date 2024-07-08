const express=require("express")
const{wishlist}=require("../model/wishlistDb")



const getWishlist=(req,res)=>{
   
        res.render("user/wishlist")
    
}

const postWishlist=(req,res)=>{

}


module.exports={getWishlist,postWishlist}