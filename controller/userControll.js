const express = require("express");
const bcrypt = require("bcrypt");
const twilio = require("../utils/twilio");
const mailer = require("../utils/nodemailer");
const {cart }=require("../model/cartDb")

const { product, category, subcategory } = require("../model/adminDb");
const { userdetails } = require("../model/userDb");
const { default: mongoose } = require("mongoose");
const { logout } = require("./commoncontrol");
const {orders}=require("../model/orderDb")
const {wishlist}=require("../model/wishlistDb")
const {UserAddress}=require("../model/addressDb")

module.exports = {


  //home page
  getindex: async (req, res) => {
    // const id=req.query.id
    // console.log(id);
    req.session.userId='66742001854d67a55ce082b7'
    const userId = req.session.userId;
    const wislistCount=await wishlist.findOne({userId:mongoose.Types.ObjectId.createFromHexString(userId)})
    let wishlistQty=0
    if (wislistCount && wislistCount.items) {
      wishlistQty=wislistCount.items.length
      console.log(`Wishlist count: ${wishlistQty}`);
  } else {
      console.log('Wishlist count: 0');
  }
          
  req.session.wishlistQty=wishlistQty
   
    
  

   const cartDetails=await cart.findOne({userId:userId})
   const userDetails=await userdetails.findOne({_id:userId})
   console.log("this is user name ",userDetails.userName);
   const userName=userDetails.userName

   const Cart = await cart.findOne({ userId: userId });




  
   let cartQuantity = 0;
  
   if (Cart && Cart.items) {
     cartQuantity = Cart.items.length;
     console.log(`Number of items in the cart: ${cartQuantity}`);
   } else {
     console.log('Cart not found or no items in the cart.');
   }
  //  cartQty=cartDetails.items.length
   
    console.log("user id is ssssss", userId);
    const categories = await category.find({});
    const products = await product.find({}).populate("productCategory");

    req.session.cartQuantity=cartQuantity
    // console.log(products);
    res.render("user/index", { products, categories, userId,userName,cartQuantity,wishlistQty});
  },


  getMyAccount:async(req,res)=>{
   const userId=req.session.userId
   console.log(userId);


    // const orderDetails=await orders.find({userId:mongoose.Types.ObjectId.createFromHexString(userId)})
    // console.log(orderDetails);




    const orderDetails = await orders.aggregate([
      { $match: { userId: mongoose.Types.ObjectId.createFromHexString(userId) } },
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
  
  // Return or process orderDetails as needed
  

  console.log(orderDetails);
 const cartQuantity= req.session.cartQuantity
    res.render("user/my-account",{orderDetails,cartQuantity})

  },

  //product details page

   getProductDetail: async (req, res) => {
    try {
      const productId = req.params.id;
      if(productId){

      // console.log(req.params);
      req.session.userId = '66742001854d67a55ce082b7';
      const userId = req.session.userId;
  
      console.log(userId, "this userid");
      console.log("Converted productId:", productId);
  
      const userDetails = await userdetails.findOne({ _id: userId });
  
      const products = await product.aggregate([
        { $match: { _id: mongoose.Types.ObjectId.createFromHexString(productId) } },
        {
          $lookup: {
            from: "categories",
            localField: "productCategory",
            foreignField: "_id",
            as: "categoryDetails",
          },
        },
        {
          $lookup: {
            from: "subcategories",
            localField: "productSubCategory",
            foreignField: "_id",
            as: "subcategoryDetails",
          },
        },
        { $unwind: { path: "$categoryDetails" } },
        { $unwind: { path: "$subcategoryDetails" } },
        {
          $addFields: {
            category: "$categoryDetails.categoryName",
            subcategory: "$subcategoryDetails.subcategoryName",
          },
        },
        {
          $project: {
            productCategory: 0,
            productSubCategory: 0,
            __v: 0,
            categoryDetails: 0,
            subcategoryDetails: 0,
          },
        },
      ]);
  
      let isInCart = false;
      if (userId) {
        const userCart = await cart.findOne({ userId, "items.productId": productId });
        if (userCart) {
          isInCart = true;
        }
      }
  
      const Cart = await cart.findOne({ userId: userId });

      let cartQuantity = 0;
  
      if (Cart && Cart.items) {
        cartQuantity = Cart.items.length;
        console.log(`Number of items in the cart: ${cartQuantity}`);
      } else {
        console.log('Cart not found or no items in the cart.');
      }
  

      const wishlistItem = await wishlist.findOne({ userId, 'items.productId': productId });
      const isInWishlist = !!wishlistItem; // Convert to boolean

      console.log("this is", products[0]);
  
      res.render("user/productDetail", {
        productDetails: products,
        userId,
        isInCart,
        userDetails,
        cartQuantity,
        isInWishlist
      });
      console.log('end');
      }

    } catch (error) {
      console.error('Error fetching product details:', error.message);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  },
  

  postProductReview: (req, res) => {
    const { rating, userName, userEmail, message } = req.body;
    console.log(rating, userName, userEmail, message);
    res.send("posted");
  },

  getGridView: (req, res) => {
    res.render("shop-grid-view");
  },

 

  getOrders:async(req,res)=>{

    const userId=req.session.userId
    const userDetails=await userdetails.findById(userId)
    
    console.log(userId);
    console.log("ordes",userId);
    // const ordersCollection= await orders.find({userId:userId})
    try {
      
    const orderDetails = await orders.aggregate([
      { $match: { userId: mongoose.Types.ObjectId.createFromHexString(userId) } },
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
              productId: "$products.productId",
              status:"$products.status",
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

  req.session.orderDetails=orderDetails

  
  const cartQuantity= req.session.cartQuantity



  console.log("bbbbbbbbbbbbbbbbbbb",orderDetails);
    res.render("user/orders",{userDetails,orderDetails,cartQuantity})

      
    } catch (error) {
      console.error(error);
      
    }
    

    


    
  },


  getOrderDetails:async(req,res)=>{

    const userId=req.session.userId
    const userDetails=await userdetails.findById(userId)
    const  orderDetails=req.session.orderDetails
    console.log(req.params.id);
    const params=req.params.id
    const orderDetail = await orders.aggregate([
      { 
          $match: { 
              "products._id": mongoose.Types.ObjectId.createFromHexString(params) 
          } 
      },
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
              productId: "$products.productId",
              status:"$products.status",
              orderId:"$products._id",
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
  
    console.log("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",orderDetail[0].orderId);
    const order=orderDetail[0]
    const address=order.address
    
    console.log(address);
   
    const userAddress = await UserAddress.aggregate([
      {
          $match: {
              userId: mongoose.Types.ObjectId.createFromHexString(userId), // Match by userId
              addresses: {
                  $elemMatch: { _id: mongoose.Types.ObjectId.createFromHexString(address) } // Match by addressId within addresses array
              }
          }
      },
      {
          $project: {
              addresses: {
                  $filter: {
                      input: '$addresses',
                      as: 'address',
                      cond: { $eq: ['$$address._id', mongoose.Types.ObjectId.createFromHexString(address)] } // Filter to include only matched address
                  }
              }
          }
      }
  ]);
       const useraddress=userAddress[0].addresses[0]
     




    res.render("user/orderDetail",{userDetails,order,useraddress})
  }


  


};
