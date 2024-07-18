const express = require("express");
const mongoose = require("mongoose");
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECKRET_KEY);
const { cart } = require("../model/cartDb");
const { userdetails } = require('../model/userDb');
const { products } = require('../model/adminDb');
const { UserAddress } = require("../model/addressDb");
const { orders } = require("../model/orderDb");
const{coupons}=require("../model/couponDb")

const getCheckOutPage = async (req, res) => {
    try {
        
        
        
        const userId = req.session.userId;
            if(!userId){
                return res.redirect("/login")
            }
        const userDetails = await userdetails.findById(userId);
        const userAddresses = await UserAddress.findOne({ userId });
        let couponslist= await coupons.find({})
        let appliedCoupon=await cart.findOne({})
        console.log(couponslist);
        
        const cartDetails = await cart.find({userId:userId})
        if(!cartDetails){
            return res.redirect("/index")
        }

        if (userId) {

            
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
                        price: "$productDetails.productPrice",
                        quantity: "$items.quantity",
                        subtotal: { $multiply: ["$items.quantity", "$productDetails.offerPrice"] },
                        discountAmount: {
                            $multiply: [
                                { $subtract: ["$productDetails.productPrice", "$productDetails.offerPrice"] },
                                "$items.quantity"
                            ]
                        },
                        total: "$total",                // Include total
                        couponDiscount: "$coupenDiscount",
                        couponcode:"$couponcode"
                         // Include couponDiscount
                    }
                },
                {
                    $group: {
                        _id: "$userId",
                        items: { $push: "$$ROOT" },
                        total: { $first: "$total" },          // Ensure total is grouped correctly
                        couponDiscount: { $first: "$couponDiscount" },
                        couponcode: { $first: "$couponcode" }, // Ensure couponDiscount is grouped correctly
                        totalAmount: { $sum: "$subtotal" },
                        totalDiscount: { $sum: "$discountAmount" }
                    }
                },
                {
                    $addFields: {
                        finalTotal: { $subtract: ["$totalAmount", "$couponDiscount"] } // Calculate final total
                    }
                }
            ]);

            console.log(cartDetails[0],"hhhhhhhhhh");

            const cartDetail = cartDetails[0];
            const totalAmount = cartDetail.totalAmount || 0;
            const couponDiscount = cartDetail.couponDiscount;
            const cartSubtotal = cartDetail.finalTotal
            const totalDiscount = cartDetail.totalDiscount || 0;
            const shippingCharge = totalAmount < 500 ? 99 : 0;
            const finalTotal = cartSubtotal + shippingCharge;
            const couponcode=cartDetails[0].couponcode

            req.session.cartDetails = cartDetails[0];
            req.session.totalAmount = finalTotal;
            req.session.totalDiscount=couponDiscount||0;


            cartQuantity =req.session.cartQuantity

           
              const couponAvailable=await coupons.find({})

              const userDetails = await userdetails.findOne({ _id: userId });
              const userName = userDetails ? userDetails.userName : "";

              let isInUser = false;
              if (userId) {
                const userDetails = await userdetails.findOne({ _id: userId });
                if (userDetails) {
                  isInUser = true;
                }
              }

           
            res.render("user/checkout", {
                userDetails,
                cartDetails: cartDetail.items || [],
                totalAmount,
                cartSubtotal: finalTotal,
                shippingCharge,
                totalDiscount,
                userAddresses,
                userId,
                userName,
                isInUser,
                couponAvailable: couponslist,
                couponDiscount,
                couponcode,cartQuantity
            });
        }
    } catch (error) {
        console.error('Error fetching checkout page:', error);
        res.status(500).json({ error: 'Failed to load checkout page' });
    }
};


const postCheckOut = async (req, res) => {
    try {
        const { paymentMethod, deliveryAddress, purchaseDate, status } = req.body;
        const deliveryAddressId = mongoose.Types.ObjectId.createFromHexString(deliveryAddress);
        const cartDetails = req.session.cartDetails;

        if (paymentMethod === "cod") {
            const newOrder = new orders({
                userId: req.session.userId,
                products: cartDetails.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    status: status || 'Pending',
                })),
                paymentMethod,
                totalprice: req.session.totalAmount,
                
                address: deliveryAddress,
                purchaseDate: purchaseDate || new Date(),
                DiscountviaCoupon:cartDetails.couponDiscount,
                couponcode:cartDetails.couponcode
            });

            await newOrder.save();
            await cart.deleteMany({ userId: req.session.userId });

            req.session.cartDetails = [];
            req.session.totalAmount = 0;
            return res.status(200).json({ success: true, cod: true, message: "Order placed successfully" });
        } else if (paymentMethod === "onlinePayment") {

            let totalCartPrice = cartDetails.items.reduce((total, item) => total + (item.productPrice * item.quantity), 0);
            if (totalCartPrice < 500) {
                totalCartPrice += 99; // Add 99 if totalCartPrice is less than 500
            }
            const discountRatio = req.session.totalDiscount/ totalCartPrice;


            const lineItems = cartDetails.items.map(item => ({
                price_data: {
                    currency: 'inr',
                    product_data: {
                        name: item.productName,
                    },
                    unit_amount:  Math.round(item.productPrice * 100 * (1 - discountRatio)),
                },
                quantity: item.quantity,
            }));



            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: lineItems,
                mode: 'payment',
                success_url: 'http://localhost:3000/success',
                cancel_url: 'http://localhost:3000/cancel',
                client_reference_id: req.session.userId.toString(), // Save userId to retrieve later
                metadata: {
                    deliveryAddress,
                    purchaseDate: purchaseDate || new Date().toISOString(),
                    status: status || 'Pending'
                }
            });

            res.json({ url: session.url });
        } else {
            res.status(400).json({ message: 'Unsupported payment method' });
        }
    } catch (error) {
        console.error('Error processing checkout:', error);
        res.status(500).json({ error: 'Failed to process checkout' });
    }
};
const verifyPaymentWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('⚠️ Webhook signature verification failed.', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            const userId = session.client_reference_id;
            const { deliveryAddress, purchaseDate, status } = session.metadata;


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
                        price: "$productDetails.productPrice",
                        quantity: "$items.quantity",
                        subtotal: { $multiply: ["$items.quantity", "$productDetails.offerPrice"] },
                        discountAmount: {
                            $multiply: [
                                { $subtract: ["$productDetails.productPrice", "$productDetails.offerPrice"] },
                                "$items.quantity"
                            ]
                        },
                        total: "$total",                // Include total
                        couponDiscount: "$coupenDiscount",
                        couponCode:"$couponcode"
                         // Include couponDiscount
                    }
                },
                {
                    $group: {
                        _id: "$userId",
                        items: { $push: "$$ROOT" },
                        total: { $first: "$total" },          // Ensure total is grouped correctly
                        couponDiscount: { $first: "$couponDiscount" },
                        couponcode: { $first: "$couponcode" }, // Ensure couponDiscount is grouped correctly
                        totalAmount: { $sum: "$subtotal" },
                        totalDiscount: { $sum: "$discountAmount" }
                    }
                },
                {
                    $addFields: {
                        finalTotal: {
                            $subtract: [
                                { $add: ["$totalAmount", { $cond: { if: { $lt: ["$totalAmount", 500] }, then: 99, else: 0 } }] },
                                "$couponDiscount"
                            ]
                        }
                    }
                }
            ]);

            const cartDetail=cartDetails[0]
            const totalAmount = cartDetail.finalTotal
            

            try {
                const newOrder = new orders({
                    userId,
                    products: cartDetail.items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        status:"paid"
                    })),
                    paymentMethod: 'onlinePayment',
                    totalprice: totalAmount,
                    
                    address: deliveryAddress,
                    DiscountviaCoupon:cartDetail.couponDiscount,
                    purchaseDate: new Date(purchaseDate),
                    couponcode:cartDetail.couponcode
                });

                await newOrder.save();
                await cart.deleteMany({ userId });

                res.json({ received: true });
            } catch (error) {
                console.error('Error saving order:', error);
                res.status(500).json({ error: 'Failed to save order' });
            }
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
            res.json({ received: false });
    }
};

const orderSuccess =async (req, res) => {
    const userId=req.session.userId
    if(!userId){
        return res.redirect("/login")
    }

    
    let isInUser = false;
    let cartQuantity = 0;
    let userName = "";

  
       if(userId){

         const userDetails = await userdetails.findOne({ _id: userId });
         userName = userDetails ? userDetails.userName : "";
         if (userDetails) {
           isInUser = true;
         }
      
         const Cart = await cart.findOne({ userId: userId });



         if (Cart && Cart.items) {
           cartQuantity = Cart.items.length;
           console.log(`Number of items in the cart: ${cartQuantity}`);
         } else {
           console.log("Cart not found or no items in the cart.");
         }
       }
    res.render("user/orderSuccess",{cartQuantity,userName,isInUser});
};

module.exports = { getCheckOutPage, postCheckOut, orderSuccess, verifyPaymentWebhook };
