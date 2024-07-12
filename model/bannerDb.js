const mongoose=require("mongoose")

const bannerSchema= new mongoose.Schema({
    bannerName:{type:String},
    bannerImage:{type:String},
    offerText:{type:String},
    category:{type:mongoose.Types.ObjectId}

})

const banner=mongoose.model("banners",bannerSchema)

module.exports=banner