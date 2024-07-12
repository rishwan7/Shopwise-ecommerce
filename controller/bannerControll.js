const express=require("express")
const mongoose=require("mongoose")
const banner=require("../model/bannerDb")
const{category}=require("../model/adminDb")


const getBanner=async (req,res)=>{
    const categories = await category.find({});
    res.render("admin/banner",{categories})
}
const postBanner = async (req, res) => {
    console.log("okk");
    try {
        const { bannerName, offertext, bannerCategory } = req.body;
        const { filename: bannerImage } = req.file; // Assuming req.file contains the file object

        const trimmedBannerCategory = bannerCategory.trim();

        if (!req.file) {
            return res.status(400).send("Banner image is required");
        }

        const newBanner = new banner({
            bannerName,
            bannerImage,
            offerText: offertext,
            category:mongoose.Types.ObjectId.createFromHexString(trimmedBannerCategory)
        });
console.log("done");
        await newBanner.save();
        res.send("Banner saved successfully");
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while saving the banner");
    }
};




module.exports={getBanner,postBanner}
