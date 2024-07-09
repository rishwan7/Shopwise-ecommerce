const express=require("express")
const mongoose=require("mongoose")
const {banners}=require("../model/bannerDb")


const getBanner=async (req,res)=>{
    res.render("admin/banner")
}
const postBanner = async (req, res) => {
    const { bannerName } = req.body;
    const { bannerImage } = req.file; // Assuming req.file contains the file object

};



module.exports={getBanner,postBanner}
