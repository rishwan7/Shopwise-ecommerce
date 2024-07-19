const express=require("express")
const mongoose=require("mongoose")
const banner=require("../model/bannerDb")
const{category}=require("../model/adminDb")


const getBanner=async (req,res)=>{
    const adminId=req.session.adminId
    if(!adminId){
        return res.redirect("/admin/login")
    }

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
        res.redirect("/admin/viewbanner")
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while saving the banner");
    }
};

const updateBanner=async (req,res)=>{
    const bannerId=req.params.id
    console.log(bannerId);
  const banners=await banner.findOne({_id:bannerId})
  const existCategory=await category.findOne({_id:banners.category})

  const categories=await category.find({})
//   console.log("cattttttttttttttt",existCategory);
   
    res.render("admin/updatebanner",{banner:banners,categories,existCategory:existCategory.categoryName})
};

const postUpdateBanner=async(req,res)=>{
    const bannerId = req.params.id;
    const { bannerName, offerText, category } = req.body;
    const bannerImage = req.file ? req.file.filename : null;
    console.log(bannerId,bannerName,offerText);
    console.log(bannerImage);
    console.log(category);
    console.log(req.body);
}

const deleteBanner=async (req,res)=>{
    const id=req.params.id
    console.log(id);

    await banner.findByIdAndDelete({_id:id})
    res.redirect("/admin/viewbanner")
}




module.exports={getBanner,postBanner,updateBanner,postUpdateBanner,deleteBanner}
