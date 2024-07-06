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

module.exports = {


  //home page
  getindex: async (req, res) => {
    // const id=req.query.id
    // console.log(id);
    req.session.userId='66742001854d67a55ce082b7'
    const userId = req.session.userId;
   
    
  

   const cartDetails=await cart.findOne({userId:userId})
   const userDetails=await userdetails.findOne({_id:userId})
   console.log("this is user name ",userDetails.userName);
   const userName=userDetails.userName
  //  cartQty=cartDetails.items.length
   
    console.log("user id is ssssss", userId);
    const categories = await category.find({});
    const products = await product.find({}).populate("productCategory");
    // console.log(products);
    res.render("user/index", { products, categories, userId,userName});
  },

  //product details page

  getProductDetail: async (req, res) => {
    const productId = mongoose.Types.ObjectId.createFromHexString( req.params.id);
       req.session.userId = '66742001854d67a55ce082b7'
    const userId=req.session.userId
    console.log(userId,"this userid");
    console.log("Converted productId:", productId);
    const userDetails=await userdetails.findOne({_id:userId})

    const products = await product.aggregate([
      { $match: { _id: productId } },
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
    console.log("this is", products[0]);
    // const productImg=products.productImage

    // console.log(productId);
    res.render("user/productDetail", { productDetails: products,userId,isInCart,userDetails });
  },

  postProductReview: (req, res) => {
    const { rating, userName, userEmail, message } = req.body;
    console.log(rating, userName, userEmail, message);
    res.send("posted");
  },

  getGridView: (req, res) => {
    res.render("shop-grid-view");
  },

  getWishList:(req,res)=>{
    res.render("user/wishlist")
  },

  getOrders:async(req,res)=>{

    const userId=req.session.userId
    
    console.log(userId);
    console.log("ordes",userId);
    const ordersCollection= await orders.find({userId:userId})

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
          }
      }
  ]);

  res.json({orderDetails})
    console.log(orderDetails);

    res.render("user/orders",{orderDetails})
  }


  


};
