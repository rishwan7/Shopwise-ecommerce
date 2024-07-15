const mongoose=require("mongoose")


const couponSchema=mongoose.Schema({
    couponCode:{type:String},
    discountPercentage:{type:Number}

},{timestamps:true})

const coupons=mongoose.model("coupons",couponSchema)
module.exports={coupons}