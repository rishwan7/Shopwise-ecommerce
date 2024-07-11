const express = require("express");
const bcrypt = require("bcrypt");
const twilio = require("../utils/twilio");
const mailer = require("../utils/nodemailer");
const { cart } = require("../model/cartDb");

const { product, category, subcategory } = require("../model/adminDb");
const { userdetails } = require("../model/userDb");
const { default: mongoose } = require("mongoose");
const { logout } = require("./commoncontrol");
const { orders } = require("../model/orderDb");
const { wishlist } = require("../model/wishlistDb");
const { UserAddress } = require("../model/addressDb");

module.exports = {
  //home page
  getindex: async (req, res) => {
    // const id=req.query.id
    try {
      req.session.userId = "66742001854d67a55ce082b7"; // Set userId in session (assuming this is set correctly)

      const userId = req.session.userId;

      // Fetch wishlist count
      const wishlistCount = await wishlist.findOne({
        userId: mongoose.Types.ObjectId.createFromHexString(userId),
      });
      const wishlistQty =
        wishlistCount && wishlistCount.items ? wishlistCount.items.length : 0;
      console.log(`Wishlist count: ${wishlistQty}`);

      req.session.wishlistQty = wishlistQty;

      // Fetch cart details
      const cartDetails = await cart.findOne({ userId });
      const cartQuantity =
        cartDetails && cartDetails.items ? cartDetails.items.length : 0;
      console.log(`Number of items in the cart: ${cartQuantity}`);

      req.session.cartQuantity = cartQuantity;

      // Fetch user details
      const userDetails = await userdetails.findOne({ _id: userId });
      const userName = userDetails ? userDetails.userName : "";
      console.log("User name:", userName);

     
      // Fetch categories
      const categories = await category.find({});

      // Fetch products with populated productCategory
      const products = await product.find({}).populate("productCategory");
      

      // Render the index view with fetched data
      res.render("user/index", {
        products,
        categories,
        userId,
        userName,
        cartQuantity,
        wishlistQty,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).send("Error fetching data");
    }
  },

  getMyAccount: async (req, res) => {
    const userId = req.session.userId;
    console.log(userId);

    // const orderDetails=await orders.find({userId:mongoose.Types.ObjectId.createFromHexString(userId)})
    // console.log(orderDetails);

    const orderDetails = await orders.aggregate([
      {
        $match: { userId: mongoose.Types.ObjectId.createFromHexString(userId) },
      },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          _id: 0,
          userId: 1,
          ids: "$products._id",
          status: "$products.status",
          productId: "$products.productId",
          productName: "$productDetails.productName",
          productImage: "$productDetails.productImage",
          productPrice: "$productDetails.offerPrice",
          price: "$productDetails.productPrice",
          quantity: "$products.quantity",
          subtotal: {
            $multiply: ["$products.quantity", "$productDetails.offerPrice"],
          },
          discountAmount: {
            $multiply: [
              {
                $subtract: [
                  "$productDetails.productPrice",
                  "$productDetails.offerPrice",
                ],
              },
              "$products.quantity",
            ],
          },
          totalprice: "$totalprice",
          address: "$address",
          paymentMethod: "$paymentMethod",
          purchaseDate: "$purchaseDate",
          couponcode: "$couponcode",
          DiscountviaCoupon: "$DiscountviaCoupon",
        },
      },
    ]);

    const addresses = await UserAddress.aggregate([
      { $match: { userId:mongoose.Types.ObjectId.createFromHexString(userId) } }, // Match documents with the given userId
      { $unwind: '$addresses' }, // Deconstruct the addresses array
      { $replaceRoot: { newRoot: '$addresses' } } // Replace the root with addresses array
  ]);

      console.log(addresses);
    

    // Return or process orderDetails as needed

    // console.log(orderDetails);
    const cartQuantity = req.session.cartQuantity;
    res.render("user/my-account", { orderDetails, cartQuantity,useraddress:addresses });
  },

  //product details page

  getProductDetail: async (req, res) => {
    try {
      const productId = req.params.id;
      if (productId) {
        // console.log(req.params);
        req.session.userId = "66742001854d67a55ce082b7";
        const userId = req.session.userId;

        console.log(userId, "this userid");
        console.log("Converted productId:", productId);

        const userDetails = await userdetails.findOne({ _id: userId });

        const products = await product.aggregate([
          {
            $match: {
              _id: mongoose.Types.ObjectId.createFromHexString(productId),
            },
          },
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
          const userCart = await cart.findOne({
            userId,
            "items.productId": productId,
          });
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
          console.log("Cart not found or no items in the cart.");
        }

        const wishlistItem = await wishlist.findOne({
          userId,
          "items.productId": productId,
        });
        const isInWishlist = !!wishlistItem; // Convert to boolean

        console.log("this is", products[0]);

        res.render("user/productDetail", {
          productDetails: products,
          userId,
          isInCart,
          userDetails,
          cartQuantity,
          isInWishlist,
        });
        console.log("end");
      }
    } catch (error) {
      console.error("Error fetching product details:", error.message);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  postProductReview: (req, res) => {
    const { rating, userName, userEmail, message } = req.body;
    console.log(rating, userName, userEmail, message);
    res.send("posted");
  },

 
  getOrders: async (req, res) => {
    const userId = req.session.userId;
    const userDetails = await userdetails.findById(userId);

    console.log(userId);
    console.log("ordes", userId);
    // const ordersCollection= await orders.find({userId:userId})
    try {
      const orderDetails = await orders.aggregate([
        {
          $match: {
            userId: mongoose.Types.ObjectId.createFromHexString(userId),
          },
        },
        { $unwind: "$products" },
        {
          $lookup: {
            from: "products",
            localField: "products.productId",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        { $unwind: "$productDetails" },
        {
          $project: {
            _id: 0,

            userId: 1,
            ids: "$products._id",
            orderId: "$products._id",
            productId: "$products.productId",
            status: "$products.status",
            productName: "$productDetails.productName",
            productImage: "$productDetails.productImage",
            productPrice: "$productDetails.offerPrice",
            price: "$productDetails.productPrice",
            quantity: "$products.quantity",
            subtotal: {
              $multiply: ["$products.quantity", "$productDetails.offerPrice"],
            },
            discountAmount: {
              $multiply: [
                {
                  $subtract: [
                    "$productDetails.productPrice",
                    "$productDetails.offerPrice",
                  ],
                },
                "$products.quantity",
              ],
            },
            totalprice: "$totalprice",
            address: "$address",
            paymentMethod: "$paymentMethod",
            purchaseDate: "$purchaseDate",
            couponcode: "$couponcode",
            DiscountviaCoupon: "$DiscountviaCoupon",
          },
        },
      ]);

      req.session.orderDetails = orderDetails;

      const cartQuantity = req.session.cartQuantity;

      console.log("bbbbbbbbbbbbbbbbbbb", orderDetails);
      res.render("user/orders", { userDetails, orderDetails, cartQuantity });
    } catch (error) {
      console.error(error);
    }
  },

  getOrderDetails: async (req, res) => {
    const userId = req.session.userId;
    const userDetails = await userdetails.findById(userId);
    const orderDetails = req.session.orderDetails;
    console.log(req.params.id);
    const params = req.params.id;
    const orderDetail = await orders.aggregate([
      {
        $match: {
          "products._id": mongoose.Types.ObjectId.createFromHexString(params),
        },
      },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          _id: 0,
          userId: 1,
          productId: "$products.productId",
          status: "$products.status",
          orderId: "$products._id",
          productName: "$productDetails.productName",
          productImage: "$productDetails.productImage",
          productPrice: "$productDetails.offerPrice",
          price: "$productDetails.productPrice",
          quantity: "$products.quantity",
          subtotal: {
            $multiply: ["$products.quantity", "$productDetails.offerPrice"],
          },
          discountAmount: {
            $multiply: [
              {
                $subtract: [
                  "$productDetails.productPrice",
                  "$productDetails.offerPrice",
                ],
              },
              "$products.quantity",
            ],
          },
          totalprice: "$totalprice",
          address: "$address",
          paymentMethod: "$paymentMethod",
          purchaseDate: "$purchaseDate",
          couponcode: "$couponcode",
          DiscountviaCoupon: "$DiscountviaCoupon",
        },
      },
    ]);

    console.log("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", orderDetail[0].orderId);
    const order = orderDetail[0];
    const address = order.address;

    console.log(address);

    const userAddress = await UserAddress.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId.createFromHexString(userId), // Match by userId
          addresses: {
            $elemMatch: {
              _id: mongoose.Types.ObjectId.createFromHexString(address),
            }, // Match by addressId within addresses array
          },
        },
      },
      {
        $project: {
          addresses: {
            $filter: {
              input: "$addresses",
              as: "address",
              cond: {
                $eq: [
                  "$$address._id",
                  mongoose.Types.ObjectId.createFromHexString(address),
                ],
              }, // Filter to include only matched address
            },
          },
        },
      },
    ]);
    const useraddress = userAddress[0].addresses[0];

    res.render("user/orderDetail", { userDetails, order, useraddress });
  },

  getShopList:async(req,res)=>{


    try {
      const categoryId = req.params.id;
      console.log("Category ID:", categoryId);

      // Pagination configuration
      const page = parseInt(req.query.page) || 1;  // Current page number, default to 1
      const limit = 5;  // Number of products per page
      const skip = (page - 1) * limit;  // Calculate skip based on page number

      // Query products based on categoryId, populate related fields
      const products = await product.find({ productCategory: categoryId })
                                    .populate('productCategory')
                                    .populate('productSubCategory')
                                    .skip(skip)
                                    .limit(limit);

      console.log("Products found:", products);

      // Example: Calculate total pages based on total products count
      const totalProductsCount = await product.countDocuments({ productCategory: categoryId });
      const totalPages = Math.ceil(totalProductsCount / limit);

      // Render shop-list view with products, categoryId, currentPage, and totalPages
      res.render("user/shop-list", { products, categoryId, currentPage: page, totalPages });
  } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).send("Error fetching products. Please try again later.");
  }
},
shopLeftSideBar:async(req,res)=>{
  const categoryId=req.params.id

  req.session.categoryId=categoryId


  const page = parseInt(req.query.page) || 1;  // Current page number, default to 1
      const limit = 5;  // Number of products per page
      const skip = (page - 1) * limit;  // Calculate skip based on page number

  const products = await product.find({productCategory:categoryId})
  .populate('productCategory')
  .populate('productSubCategory')
  .skip(skip)
  .limit(limit);

  

    const subcategories=await subcategory.find({category:categoryId})
 

  const totalProductsCount = await product.countDocuments({ productCategory: categoryId });
  const totalPages = Math.ceil(totalProductsCount / limit);

  res.render("user/shop-left-sidebar",{products,currentPage: page, totalPages,categoryId,subcategories})
},
filteringViaSubcategory: async(req,res)=>{
  const{subcategoryIds}=req.body
  console.log(req.body);
  
  try {
    const products = await product.find({ productSubCategory: { $in: subcategoryIds } })
      .populate('productCategory')
      .populate('productSubCategory');

    res.json({ success: true, products });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
},

filterByPrice:async(req,res)=>{
  const { minPrice, maxPrice } = req.body;
  console.log(req.body);
  console.log(req.session.categoryId);
  const categoryId=req.session.categoryId

  try {
      const products = await product.find({  offerPrice: { $gte: minPrice, $lte: maxPrice },productCategory:categoryId
      });

      res.json({ success: true, products });
  } catch (error) {
      res.json({ success: false, message: 'Error fetching products' });
  }
},
searchProduct:async(req,res)=>{
  const { query } = req.query;
  console.log(query);

    // Construct regex for case-insensitive search
    const regex = new RegExp(query, 'i');
    

    // Build the search criteria
    const searchCriteria = {
        productName: { $regex: regex }
    };

    try {
        const results = await product.find(searchCriteria);
        res.json(results);
    } catch (err) {
        res.status(500).send(err.message);
    }
}
};
