const express=require("express")
const mongoose=require("mongoose")
const {banner}=require("../model/bannerDb")


const getBanner=async (req,res)=>{
    res.render("admin/banner")
}
const postBanner = async (req, res) => {
    const { bannerName } = req.body;
    const { bannerImage } = req.file; // Assuming req.file contains the file object
   
    const image=req.file.filename+Date.now()

    const newBanner= new banner({
        
        bannerName:bannerName,
        bannerImage:image
    })
    await newBanner.save()
    res.send("okkk")

};



module.exports={getBanner,postBanner}
