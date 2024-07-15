const mongoose = require("mongoose");

const cartSchema = mongoose.Schema({
    userId: { type: mongoose.Types.ObjectId, required: true },
    items: [
        {
            productId: { type: mongoose.Types.ObjectId, ref: 'products', required: true },
            quantity: { type: Number, required: true }
        }
    ],
    total:{type:Number,default:0},
    coupenDiscount:{type:Number,default:0},
    couponcode:{type:String,default:null}



},{timestamps:true});

const cart = mongoose.model("cart", cartSchema);

module.exports = { cart };
