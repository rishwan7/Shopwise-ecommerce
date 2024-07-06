const express = require("express");
const { product, category ,subcategory} = require("../model/adminDb");
const multer = require("multer");
const { Session } = require("express-session");


module.exports = {

  //get the new product add page

  getAddProduct: async (req, res) => {
    const errorMessage = req.session.errorMessage;
    req.session.errorMessage = "";

    const categories = await category.find({});
    const subcategories = await subcategory.distinct("subcategoryName");
    res.render("admin/addproduct", { errorMessage, categories, subcategories });
  },

  // adding new products

  postAddProduct: async (req, res) => {
    const {
      productName,
      productDescription,
      productPrice,
      offerPrice,
      productStock,
      productCategory,
      productSubCategory,
      productSize

    } = req.body;
    console.log("done 1");
    console.log(productSize);

    if (!req.files) {
      req.session.errorMessage = "All field must be required";
      console.log("error 1");
      return res.redirect("/admin/addproduct");
      console.log("error 1");
    }

    const productImage = req.files.map(file=>file.filename)

    if (
      !productName ||
      !productDescription ||
      !productCategory ||
      !productPrice ||
      !productStock||
      !productImage||
      !productSubCategory
    ) {

      req.session.errorMessage = "All fields must be filled out.";
      console.log("error 2");
      return res.redirect("/admin/addproduct");
      
    }
    console.log(req.body);
    try {

      const percentageDifference = ((productPrice - offerPrice) / productPrice) * 100;
      const newProduct = new product({
        productName,
        productDescription,
        productPrice,
        offerPrice,
        productStock,
        productCategory,
        percentageDifference: percentageDifference.toFixed(2),
        productSubCategory,
        productImage,
        productSize
      });
      await newProduct.save();
      console.log("done2");
      res.redirect("/admin/addproduct");
    } catch (error) {
      console.error(error);
      req.session.errorMessage = "Error saving product.";
      res.redirect("/admin/addproduct");
    }
  },

  //view on the listed product on admin

  getViewProducts: async (req, res) => {
    try {
      const categoryId = req.params.categoryId;
      // console.log("this is cat id:",categoryId);
        let products;

        if (categoryId) {

            products = await product.find({ productCategory: categoryId }).populate('productCategory').populate('productSubCategory');
            console.log("this is",products);
        } else {
            products = await product.find().populate('productCategory').populate('productSubCategory');
        }

        const categories = await category.find();
      // console.log(products);
      res.render("admin/viewproducts", { products,categories });
    } catch (error) {
      console.error(error);
      req.session.errorMessage = "Error fetching products.";
      res.redirect("/admin/addproduct");
    }
  },

  //delete the added products on the admin

  deleteProduct: async (req, res) => {
    try {
      const productId = req.params.id;
      console.log(productId);
      await product.findByIdAndDelete(productId);
      res.json({ success: true, message: "Product deleted successfully." });
    } catch (error) {
      console.error("Error deleting product:", error);
      res
        .status(500)
        .json({ success: false, message: "Error deleting product." });
    }
  },


  //get the update page

  getUpdateProduct: async (req, res) => {
    const productId = req.params.id;
    // console.log(`this is product id: ${productId}`);
    const productToUpdate = await product.findById(productId);
    // console.log(`this is productto update: ${productToUpdate}`);

    const categories = await category.find({});
    // console.log(`this is product category: ${categories}`);
    const subcategories = await subcategory.distinct("subcategoryName");
    // console.log(`this is product subca: ${subcategories}`);

    errorMessage=req.session.errorMessage
    req.session.errorMessage=""
    res.render("admin/updateproduct", {
      products: productToUpdate,
      categories,
      subcategories,
      errorMessage
    });
  },


  //updating added product on admin
  postUpdateProduct:async(req,res)=>{
    const productId=req.params.id
    console.log("this is peoduct id:",productId);
    const{productName, productStock, productDescription, productPrice, offerPrice, productCategory, productSubCategory,productSize }=req.body

    try{
      const percentageDifference = ((productPrice - offerPrice) / productPrice) * 100;
      const updatedProduct={
        productName,
        productStock,
        productDescription,
        productPrice,
        offerPrice,
        percentageDifference: percentageDifference.toFixed(2),
        productCategory,
        productSubCategory,
        productSize
      }
      if (req.files && req.files.length>0) {
        console.log("this is ",req.files);
        console.log("not found");
        updatedProduct.productImage = req.files.map(file=>file.filename)
        await product.findByIdAndUpdate(productId,updatedProduct)
        
        res.redirect("/admin/viewproducts")
      }else{
        console.log("not image updated");
        await product.findByIdAndUpdate(productId,updatedProduct)
        res.redirect("/admin/viewproducts")
      }
     

    }
    catch(error){
      console.error(error);
      req.session.errorMessage="Error while updating product"
      res.redirect("/admin/updateproduct")


    }


    
  }

};
