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
        
        req.session.userId = '66742001854d67a55ce082b7'; // For testing purposes
        const userId = req.session.userId;
        const userDetails = await userdetails.findById(userId);
        const userAddresses = await UserAddress.findOne({ userId });
        let couponslist= await coupons.find({})
        console.log(couponslist);
        
     

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
                    }
                }
            ]);

            let totalAmount = cartDetails.reduce((acc, item) => acc + item.subtotal, 0);
            let cartSubtotal = totalAmount;
            let totalDiscount = cartDetails.reduce((acc, item) => acc + item.discountAmount, 0);
            let shippingCharge = totalAmount < 500 ? 99 : 0;
            cartSubtotal += shippingCharge;

            req.session.cartDetails = cartDetails;
            req.session.totalAmount = cartSubtotal;

           
              const couponAvailable=await coupons.find({})

           
            res.render("user/checkout", {
                userDetails,
                cartDetails,
                totalAmount,
                cartSubtotal,
                shippingCharge,
                totalDiscount,
                userAddresses,
                userId,
                couponAvailable
            });
        }
    } catch (error) {
        console.error('Error fetching checkout page:', error);
        res.status(500).json({ error: 'Failed to load checkout page' });
    }
};
const postCheckOut = async (req, res) => {zy
    try {
        const { paymentMethod, deliveryAddress, purchaseDate, status } = req.body;
        const deliveryAddressId = mongoose.Types.ObjectId.createFromHexString(deliveryAddress);
        const cartDetails = req.session.cartDetails;

        if (paymentMethod === "cod") {
            const newOrder = new orders({
                userId: req.session.userId,
                products: cartDetails.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                })),
                paymentMethod,
                total: req.session.totalAmount,
                status: status || 'Pending',
                address: deliveryAddress,
                purchaseDate: purchaseDate || new Date(),
            });

            await newOrder.save();
            await cart.deleteMany({ userId: req.session.userId });

            req.session.cartDetails = [];
            req.session.totalAmount = 0;
            return res.status(200).json({ success: true, cod: true, message: "Order placed successfully" });
        } else if (paymentMethod === "onlinePayment") {
            const lineItems = cartDetails.map(item => ({
                price_data: {
                    currency: 'inr',
                    product_data: {
                        name: item.productName,
                    },
                    unit_amount: item.productPrice * 100,
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
                    }
                }
            ]);

            const totalAmount = cartDetails.reduce((acc, item) => acc + item.subtotal, 0);
            const cartSubtotal = totalAmount < 500 ? totalAmount + 99 : totalAmount;

            try {
                const newOrder = new orders({
                    userId,
                    products: cartDetails.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity
                    })),
                    paymentMethod: 'onlinePayment',
                    totalprice: cartSubtotal,
                    Status: 'Paid',
                    address: deliveryAddress,
                    purchaseDate: new Date(purchaseDate),
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

const orderSuccess = (req, res) => {
    res.render("orderSuccess");
};

module.exports = { getCheckOutPage, postCheckOut, orderSuccess, verifyPaymentWebhook };
