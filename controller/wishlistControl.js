const express=require("express")
const{wishlist}=require("../model/wishlistDb")
const { product } = require("../model/adminDb")
const { default: mongoose } = require("mongoose")



const getWishlist= async(req,res)=>{
        userId=req.session.userId

        if(!userId){
            return res.redirect("/login")
        }

        
if(userId){
        const wishlistProducts =await wishlist.aggregate([{ $match:{userId:mongoose.Types.ObjectId.createFromHexString(userId)}},
                {$unwind:"$items"},{$lookup:{
                        from:"products",
                        localField: 'items.productId',
                        foreignField: '_id',
                        as: 'productDetails'
                }},
                {$unwind:"$productDetails"},{
                          $project: {
                        _id: 1,
                        userId:1,
                        productId: "$items.productId",
                        productName: "$productDetails.productName",
                        productStock:"$productDetails.productStock",
                        productImage: "$productDetails.productImage",
                        productPrice: "$productDetails.offerPrice",
                        orginalprice:"$productDetails.productPrice"
                          }
                }
        ])
   
        console.log("rrrrrrrrrrrrrrrrrrrrrrrrrrr",wishlistProducts);

        const cartQuantity=req.session.cartQuantity
        console.log("cart quantity",cartQuantity);
        res.render("user/wishlist",{wishlistProducts,cartQuantity})

}else{
        console.error(Error);
}

        
    
}

const postWishlist=async(req,res)=>{

      const{productId,userId}=req.body
      console.log(req.body);
      console.log("started");
      if (!userId) {
        return res.json({ success: false, message: "Please log in to add items to your Wishlist." });
    }
    
    try {
        // Check if the product is already in the wishlist
        let wishlistItem = await wishlist.findOne({ userId });
    
        if (!wishlistItem) {
            // If wishlist doesn't exist, create a new one with the product
            wishlistItem = new wishlist({
                userId,
                items: [{ productId }]
            });
            await wishlistItem.save();
            console.log("added");
            return res.json({ success: true, message: 'Added to your Wishlist' });
        }
    
        // Check if productId is already in the wishlist items
        const isProductInWishlist = wishlistItem.items.some(item => item.productId.equals(productId));
    
        if (isProductInWishlist) {
            // If productId is found, remove it from the wishlist
            wishlistItem.items = wishlistItem.items.filter(item => !item.productId.equals(productId));
            await wishlistItem.save();
            console.log("removed");
    
            if (wishlistItem.items.length <= 0) {
                await wishlist.findOneAndDelete({ userId }); // Delete wishlist if empty
                console.log("Wishlist deleted because it became empty.");
            }
    
            return res.json({ removed: true, message: 'Removed from your Wishlist' });
    
        } else {
            // If productId is not found, add it to the wishlist
            wishlistItem.items.push({ productId });
            await wishlistItem.save();
            console.log("added");
            return res.json({ success: true, message: 'Added to your Wishlist' });
        }
    
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
    

}


module.exports={getWishlist,postWishlist}