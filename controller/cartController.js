const express =require("express")
const {cart}=require("../model/cartDb")
const {product}=require("../model/adminDb")
const mongoose =  require('mongoose')
const { logout } = require("./commoncontrol")
const {userdetails}=require("../model/userDb")

   const getCartPage=async(req,res)=>{
    const userId=req.session.userId
    console.log(userId,"this is user iD");

     // Redirect to login if userId is not set in session
     if (!userId) {
        return res.redirect('/login'); // Adjust the path as per your application's routes
    }


    const userDetails=await userdetails.findById(userId)
   

   
    try {
        const cartDetails = await cart.aggregate([
            {
                $match: { userId: mongoose.Types.ObjectId.createFromHexString(userId) }
            },
            {
                $unwind: "$items"
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.productId',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            {
                $unwind: "$productDetails" 
            },
            {
                $project: {
                    _id: 0,
                    productId:"$productDetails._id",
                    productName: "$productDetails.productName",
                    productImage: "$productDetails.productImage",
                    productPrice: "$productDetails.offerPrice",
                    quantity: "$items.quantity",
                    subtotal: { $multiply: ["$productDetails.offerPrice", "$items.quantity"] }
                   
                }
            }
        ]);
              let totalAmount = cartDetails.reduce((acc, item) => acc + item.subtotal, 0);
              let cartSubtotal=totalAmount
              let shippingCharge=99;

               if(totalAmount<500){
                cartSubtotal+=shippingCharge

                 

              }else{
                shippingCharge=0
              }


              
        res.render("user/shop-cart", {cartDetails,totalAmount,shippingCharge,cartSubtotal,userDetails})
console.log("cart details is",cartDetails);        
    
    } catch (error) {
        console.error('Error fetching cart details:', error);
        throw error; // Handle or propagate the error as needed
    }
       
       
      
    }

    const postCartPage = async (req, res) => {
        const { productId, quantity, userId } = req.body;
    
        console.log(`Product ID: ${productId}, Quantity: ${quantity}, userId: ${userId}`);
        if (!userId) {
            console.log("okk");
             return res.status(400).json({message:"User not found please login"})
        }
    
        // Redirect to login if userId is not provided
       
    
        try {
           

            let cartItems = await cart.findOne({ userId });
            const Products = await product.findById(productId)
            const totalValue=Products.offerPrice*quantity
            console.log("this is total value",totalValue);
            console.log(Products);
    
            if (!cartItems) {
                // Create new cart if none exists for the user
                cartItems = new cart({
                    userId: userId,
                    items: [{ productId, quantity }],
                    total:totalValue
                   

                });
            } else {
                // Update or add item to existing cart
                const productIndex = cartItems.items.findIndex(item => item.productId.toString() === productId);
    
                if (productIndex >=0) {
                    // Update quantity if product exists
                    cartItems.items[productIndex].quantity += parseInt(quantity, 10);
                    
                } else {
                    // Add new item if product doesn't exist
                    cartItems.items.push({ productId, quantity });
                }
                cartItems.total += Products.offerPrice * parseInt(quantity, 10);
            }

            Products.productStock -= parseInt(quantity, 10);

            if(Products.productStock<=0){
                return res.json({success:true,message:"Out of stock"})
            }
           

    
    
            await cartItems.save();
            await Products.save();
            const totalCartQuantity = cartItems.items.length
           
            return res.json({ success: true, message: "Item added to cart",totalCartQuantity });

    
        } catch (error) {
            console.error("Error adding item to cart:", error);
            return res.status(500).json({ success: false, message: "Server error" });
        }
    }

    const updateCartQuantity = async (req, res) => {
        let { productId, quantity,type } = req.body;
        console.log(productId, quantity, "product details");
        const userId = req.session.userId; 

        if(quantity<=0){
           return res.json({cartvalue:true,message:"cart should not be zero"})
        }
    
        try {
            // Find the cart and update the quantity  
            const userCart = await cart.findOne({ userId });
            // console.log(userCart, "this is usercart");
            if (userCart) {
                const item = userCart.items.find(item => item.productId.toString() === productId);
                if (item) {
                    const previousQuantity = item.quantity;

                    item.quantity = parseInt(quantity, 10);
                  
                    // console.log("this is quantity",quantity);
    
                    // Check stock availability
                    const Product = await product.findById(productId);
                    // console.log(Product);

                    userCart.total += (item.quantity - previousQuantity) * Product.offerPrice;

                    let availableStock = Product.productStock
                    let newStock = type == 'decrement' ? ++availableStock :  --availableStock



                const updated=    await product.findByIdAndUpdate({ _id: productId }, {$set:{ productStock: newStock }},{new:true})
                     
                     console.log(updated);
                   
                    const savedProduct = await product.findById(productId);
                    // console.log('saved',savedProduct);
                    
                //    console.log("this is available stock",availableStock);
    
                    if (availableStock <= 0) {
                        return res.json({outOfStock:true, message: 'Out of stock'});
                    }




                  
                    // console.log(Product.productStock,"this is database stock");
                    
                    
                   
                    await userCart.save();
    
                    // Recalculate cart details
                    const cartDetails = await cart.aggregate([
                        { $match: { userId: mongoose.Types.ObjectId.createFromHexString(userId) } },
                        { $unwind: "$items" },
                        {
                            $lookup: {
                                from: 'products',
                                localField: 'items.productId',
                                foreignField: '_id',
                                as: 'productDetails'
                            }
                        },
                        { $unwind: "$productDetails" },
                        {
                            $project: {
                                _id: 0,
                                productId: "$items.productId",
                                productName: "$productDetails.productName",
                                productImage: "$productDetails.productImage",
                                productPrice: "$productDetails.offerPrice",
                                quantity: "$items.quantity",
                                subtotal: { $multiply: ["$items.quantity", "$productDetails.offerPrice"] }
                            }
                        }
                    ]);
    
                    // Calculate total amount
                    let totalAmount = cartDetails.reduce((acc, item) => acc + item.subtotal, 0);
                    let cartSubtotal=totalAmount
                    let shippingCharge=99;
      
                     if(totalAmount<500){
                      cartSubtotal+=shippingCharge
      
                       
      
                    }else{
                      shippingCharge=0
                    }
                  
                    
                    // Return updated cart details
                    return res.json({
                    success: true,
                    totalAmount,
                    cartSubtotal,
                    cartDetails,
                    shippingCharge,
                    availableStock,
                    message: availableStock <= 5 ? `Only ${availableStock} items left` : ''
                });
                }
            }
            return res.json({ success: false, message: 'Item not found' });
        } catch (error) {
            console.error('Error updating cart quantity:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    };

    const deleteCart = async (req, res) => {
        const { productId } = req.body;
  // Assuming you manage userId in session
        const userId = req.session.userId;
    
        try {
            // Find the cart
            const userCart = await cart.findOne({ userId });
    
            if (!userCart) {
                return res.json({ success: false, message: 'Cart not found for the user' });
            }
    
            // Find the index of the item in the items array
            const itemIndex = userCart.items.findIndex(item => item.productId.toString() === productId);
            console.log("this is item index",itemIndex);
    
            if (itemIndex === -1) {
                return res.json({ success: false, message: 'Item not found in cart' });
            }
    
            // Adjust product stock if necessary
            const removedItem = userCart.items[itemIndex];
            const Product = await product.findById(productId);
    
            if (Product) {
                Product.productStock += removedItem.quantity;
                await Product.save();
            }
    
            // Remove the item from the cart
            userCart.items.splice(itemIndex, 1);
            userCart.total -= removedItem.quantity * Product.offerPrice;
            await userCart.save();
            
            const remainingItems = userCart.items.length;
            if (remainingItems === 0) {
                // Delete the cart document if no items are left
                await cart.deleteOne({ userId });
            }
           
    
            // Recalculate cart details
            const cartDetails = await cart.aggregate([
                { $match: { userId: mongoose.Types.ObjectId.createFromHexString(userId) } },
                { $unwind: "$items" },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'items.productId',
                        foreignField: '_id',
                        as: 'productDetails'
                    }
                },
                { $unwind: "$productDetails" },
                {
                    $project: {
                        _id: 0,
                        productId: "$items.productId",
                        productName: "$productDetails.productName",
                        productImage: "$productDetails.productImage",
                        productPrice: "$productDetails.offerPrice",
                        quantity: "$items.quantity",
                        subtotal: { $multiply: ["$items.quantity", "$productDetails.offerPrice"] }
                    }
                }
            ]);
    
            // Calculate total amount
            let totalAmount = cartDetails.reduce((acc, item) => acc + item.subtotal, 0);
            let cartSubtotal = totalAmount;
            let shippingCharge = 99;
    
            if (totalAmount < 500) {
                cartSubtotal += shippingCharge;
            } else {
                shippingCharge = 0;
            }
    
            // Return updated cart details
            return res.json({
                success: true,
                totalAmount,
                cartSubtotal,
                shippingCharge
            });
        } catch (error) {
            console.error('Error removing item from cart:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    };
    
   
    
    

    


module.exports={getCartPage,postCartPage,updateCartQuantity,deleteCart}