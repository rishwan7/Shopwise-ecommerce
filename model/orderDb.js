const mongoose=require("mongoose")

const orderSchema=mongoose.Schema({
    userId:{type:mongoose.Types.ObjectId},
    orderNumber:{type:Number},
    products:[{
        productId :{type:mongoose.Schema.Types.ObjectId,ref:"products"},
        quantity:{type:Number},
        status:{type:String,default:"pending"}}
       
    ],
        totalprice:Number,
         address:String,
         paymentMethod:String,
         purchaseDate:String,
         couponcode:{type:String,default:null},
         DiscountviaCoupon:{type:Number,default:0},
       
})

const orders = mongoose.model("orders",orderSchema)
module.exports ={ orders}