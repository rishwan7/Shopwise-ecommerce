const mongoose=require("mongoose")

const wishlistSchema = mongoose.Schema({
    userId: { type: mongoose.Types.ObjectId, required: true },
    items: [
        {
            productId: { type: mongoose.Types.ObjectId, ref: 'products', required: true },
           
        }
    ],
   

},{timestamps:true});

const wishlist=mongoose.model("wishlist",wishlistSchema)

module.exports={wishlist}