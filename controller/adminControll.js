const express = require("express");
const {orders}=require("../model/orderDb")
const{product}=require("../model/adminDb")



module.exports={ 
    getAdminHome:(req,res)=>{
        res.render("admin/adminHome")
    },
    orderManagement: async(req,res)=>{
       
    const order = await orders.aggregate([
       
        { $unwind: "$products" },
        {
            $lookup: {
                from: 'products',
                localField: 'products.productId',
                foreignField: '_id',
                as: 'productDetails'
            }
        },
        { $unwind: "$productDetails" },
        {
            $project: {
                _id: 0,
  
                userId: 1,
                ids:"$products._id",
                orderId:"$products._id",
                status:"$products.status",

                productId: "$products.productId",
                productName: "$productDetails.productName",
                productImage: "$productDetails.productImage",
                productPrice: "$productDetails.offerPrice",
                price: "$productDetails.productPrice",
                quantity: "$products.quantity",
                subtotal: { $multiply: ["$products.quantity", "$productDetails.offerPrice"] },
                discountAmount: {
                    $multiply: [
                        { $subtract: ["$productDetails.productPrice", "$productDetails.offerPrice"] },
                        "$products.quantity"
                    ]
                },
                totalprice: "$totalprice",
                address: "$address",
                paymentMethod: "$paymentMethod",
                purchaseDate: "$purchaseDate",
                couponcode: "$couponcode",
                DiscountviaCoupon: "$DiscountviaCoupon",
              
            }
        }
    ]);
    console.log(order);
  
  

        res.render("admin/orderManagement",{order})

    },
    updateOrderStatus: async (req, res) => {
        const { orderId, status } = req.body;
    
        try {
            const order = await orders.findOneAndUpdate(
                { 'products._id': orderId }, // Find the order where products._id matches orderId
                { $set: { 'products.$.status': status } }, // Update the status of the matched product
                { new: true } // Return the updated document
            );
          
    
            if (!order) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }
    
            res.json({ success: true, status });
        } catch (error) {
            console.error('Error updating order status:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },
   
    cancelOrder:async(req,res)=>{
     
    const{orderId}=req.body
    console.log(orderId,"hhhhhhhhhhhhhhhh");

    try {
        const order = await orders.findOneAndUpdate(
            { 'products._id': orderId }, // Find the order where products._id matches orderId
            { $set: { 'products.$.status': "canceled" } }, // Update the status of the matched product
            { new: true } // Return the updated document
        );
       

        const productId = order.products.find(product => product._id.toString() === orderId.toString()).productId;
        const products = await product.findById(productId);
        if (products) {
            console.log("updated stock");
            products.productStock += 1; // Adjust the logic based on how you manage product stock
            await products.save();
        }
        res.json({success:true})
  
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        
    } catch (error) {
        console.error('Error canceling order status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
        
    }

   



       
    }
    
}


