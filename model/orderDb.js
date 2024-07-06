const mongoose=require("mongoose")

const orderSchema=mongoose.Schema({
    userId:{type:mongoose.Types.ObjectId},
    products:[{
        productId :{type:mongoose.Schema.Types.ObjectId,ref:"products"},
        quantity:{type:Number}}],
        totalprice:Number,
         address:String,
         paymentMethod:String,
        Status:{type:String,default:'Pending'}
})

const orders = mongoose.model("orders",orderSchema)
module.exports ={ orders}