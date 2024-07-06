const mongoose=require("mongoose")


const couponSchema=mongoose.Schema({
    couponCode:{type:String},
    discountPercentage:{type:Number}

})

const coupons=mongoose.model("coupons",couponSchema)
module.exports={coupons}