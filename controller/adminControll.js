const express = require("express");
const {orders}=require("../model/orderDb")
const{product, category}=require("../model/adminDb")
const{userdetails}=require("../model/userDb");
const banner = require("../model/bannerDb");



module.exports={ 
    getAdminHome:async(req,res)=>{

        
        const productDetails=await product.find({})
        const count=productDetails.length
        console.log(count);
        const userCount =  await userdetails.countDocuments({});
        console.log("Total users:", userCount);
        const canceledProductsCount = await orders.aggregate([
            { $unwind: "$products" },
            { $match: { "products.status": "canceled" } },
            { $count: "canceledCount" }
          ]);
          canceledCount= canceledProductsCount.length > 0 ? canceledProductsCount[0].canceledCount : 0;
          console.log(canceledProductsCount);

          const totalSalesData = await orders.aggregate([
            { $group: { _id: null, totalSales: { $sum: "$totalprice" } } }
          ]);
      
          const totalSales = totalSalesData.length > 0 ? totalSalesData[0].totalSales : 0;
          console.log(totalSales);

          const profitData = await orders.aggregate([
            { $unwind: "$products" }, // Unwind the products array
            { $match: { "products.status": "Delivered" } }, // Match products with status "Delivered"
            {
              $lookup: {
                from: "products", // The collection to join with
                localField: "products.productId", // Field from the orders collection
                foreignField: "_id", // Field from the products collection
                as: "productDetails" // Name for the output array
              }
            },
            { $unwind: "$productDetails" }, // Unwind the productDetails array
            {
              $group: {
                _id: null,
                totalProfit: { $sum: { $multiply: ["$productDetails.offerPrice", 0.4] } } // Calculate total profit (40% of product price)
              }
            }
          ]);
          console.log("proffut",profitData);
          let profit=0;
          if(profitData){

               profit=profitData[0].totalProfit
          }
          
          const discount = await orders.aggregate([
            {
              $group: {
                _id: null, // Grouping all documents into a single group
                discount: { $sum: "$DiscountviaCoupon" } // Summing up the 'DiscountviaCoupon' field
              }
            }
          ]);
          
      couponDiscount=discount.length>0?discount[0].discount:0;
       
          
        res.render("admin/adminHome",{count,userCount,canceledCount,totalSales,profit,couponDiscount})
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
    
    },

    //category based productshowing (on doghnut chart)on admin side
    getProductDetails:async(req,res)=>{
        try {
            const productCount = await product.aggregate([
                {
                    $group: {
                        _id: '$productCategory',
                        productCount: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: 'categories',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'categoryDetails'
                    }
                },
                { $unwind: '$categoryDetails' },
                {
                    $project: {
                        _id: 0,
                        categoryName: '$categoryDetails.categoryName',
                        productCount: 1
                    }
                }
            ]);
    
            res.json(productCount);
        } catch (err) {
            console.error("Error aggregating product counts by category:", err);
            res.status(500).json({ error: 'Internal server error' });
        }

    },
 
  salesByDate:async(req,res)=>{
    try {
        // Fetch date-wise sales data
        const salesData = await orders.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(new Date().getFullYear(), 0, 1), // Start of the current year
                        $lt: new Date(new Date().getFullYear() + 1, 0, 1) // Start of next year
                    }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalSales: { $sum: "$totalprice" }
                }
            },
            {
                $sort: { '_id': 1 } // Sort by date
            }
        ]);

        // Prepare data for response
        const data = {
            labels: salesData.map(entry => entry._id),
            salesValues: salesData.map(entry => entry.totalSales)
        };
console.log(data);
        res.json(data); // Send data as JSON response
    } catch (error) {
        console.error('Error fetching date-wise sales data:', error);
        res.status(500).json({ error: 'Failed to fetch date-wise sales data' });
    }
  },
  userJoinedCount: async (req, res) => {
    console.log("okkkkk");



    try {
        const currentDate = new Date();
        const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const nextMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

        console.log("Date Range:", currentMonthStart, "to", nextMonthStart);

        const userData = await userdetails.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: currentMonthStart, // Start of the current month
                        $lt: nextMonthStart // Start of next month
                    }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id': 1 } // Sort by date
            }
        ]);

        console.log("Aggregated User Data:", userData);

        // Prepare data for response
        const data = {
            labels: userData.map(entry => entry._id),
            userCounts: userData.map(entry => entry.count)
        };

        console.log("Prepared Data:", data);
        res.json(data); // Send data as JSON response
    } catch (error) {
        console.error('Error fetching date-wise user joined data:', error);
        res.status(500).json({ error: 'Failed to fetch date-wise user joined data' });
    }

},
getViewBanner:async(req,res)=>{
    const banners=await banner.find({}).populate("category")
    console.log(banners);
    res.render("admin/viewbanner",{banners})

},
getViewUsers:async(req,res)=>{
    const users=await userdetails.find({})
    // console.log(users);
    res.render("admin/viewusers",{users})
},
blockUser:async(req,res)=>{
    const{userId}=req.body
    console.log(userId);
try{


    const blocking=await userdetails.findOneAndUpdate({_id:userId},{userStatus:"block"})
    console.log(blocking);
    return res.json({success:true})
}catch(error){
    return res.json({success:false,message:"internal server down"})
}

},
unBlockUser:async(req,res)=>{
    const{userId}=req.body
    try {
        const unblock=await userdetails.findOneAndUpdate({_id:userId},{userStatus:"active"})
        return res.json({success:true})
        return res.json({success:false,message:"internal server down"})
        
    } catch (error) {
        
    }
},
adminSignup:(req,res)=>{
    
}
    
}


