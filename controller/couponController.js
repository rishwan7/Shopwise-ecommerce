const express = require("express");
const mongoose = require("mongoose");
const { coupons } = require("../model/couponDb");
const { cart } = require("../model/cartDb");

const getCoupon = (req, res) => {

  res.render("admin/addCoupon");
};

const postCouponControl = async (req, res) => {
    const userId=req.session.userId
  const { code, discount, expirationDate } = req.body;
  const upperCaseCode = code.toUpperCase();

  const newCoupon = new coupons({
    couponCode: upperCaseCode,
    discountPercentage: discount,
  });
  await newCoupon.save();
  res.redirect("/success");
};



const discountProcess = async (req, res) => {
  console.log(req.body);
  
  const userId=mongoose.Types.ObjectId.createFromHexString(req.session.userId)
  console.log(userId);
  console.log("this is userid",userId);
//   const carts = await cart.findOne({ userId: userId });  
//   console.log(carts);

  const cartDetails = await cart.aggregate([
    { $match: { userId: userId} },
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
         
        }
    }
]);

let totalAmount = cartDetails.reduce((acc, item) => acc + item.subtotal, 0);
console.log(totalAmount);

console.log("this is cart details",cartDetails);

  try {
    // const inputCoupon = req.body.couponValue;

    const couponcodes = await coupons.findOne({couponCode:req.body.couponValue});
    console.log(couponcodes);

    // const list = couponcodes.map((element) => element.couponCode);
    // console.log("List of coupon codes:", list);

    if (couponcodes) {
      console.log("Coupon code is valid.");
      const discountPercentage = couponcodes.discountPercentage;
      const coupon = couponcodes.couponCode

      const discountAmount = (totalAmount * discountPercentage) / 100;
      console.log('Discount Amount:', discountAmount);
      const finalAmount = totalAmount - discountAmount;
      await cart.findOneAndUpdate({ userId: userId }, {  coupenDiscount: discountAmount,couponcode:coupon });

      console.log('Final Amount after discount:', finalAmount);
      res.json({ message: "coupon is valid",finalAmount,couponCode:true,discountAmount ,discountPercentage});
    } else {
      console.log("Coupon code is invalid.");
      return res.json({message:"invalid coupon"})
      // Handle the case for an invalid coupon code
    }
  } catch (error) {
    console.log("error occured", error);
  }
};

const removeDiscountCoupon=async(req,res)=>{
  console.log("vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv");


    const userId=mongoose.Types.ObjectId.createFromHexString(req.session.userId)
    console.log(userId,"issssssssssssssssssssss");

    const result = await cart.findOneAndUpdate(
      { userId: userId },
      { $set: { coupenDiscount: 0 ,couponcode:null} },
      { new: true }
  );

  if (result) {
      console.log('Updated cart with couponDiscount set to 0:', result);
      // Handle success
  } else {
      console.log('No cart found for userId:', userId);
      // Handle case where no cart is found
  }

   const cartValue= await cart.findOne({userId:userId})
   if (cartValue) {
    const totalAmount = cartValue.total;
    console.log("Total Amount:", totalAmount);
    res.status(200).json({ message: 'Coupon removed successfully',totalAmount,remove:true });
} else {
    console.log("Cart not found for the user.");
    return res.json({message:"Internal server error"})
}

   


}

module.exports = { getCoupon, postCouponControl, discountProcess , removeDiscountCoupon};
