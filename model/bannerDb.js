const mongoose=require("mongoose")

const bannerSchema= new mongoose.Schema({
    bannerName:{type:String},
    bannerImage:{type:String}
})

const banner=mongoose.model("banners",bannerSchema)

module.exports={banner}