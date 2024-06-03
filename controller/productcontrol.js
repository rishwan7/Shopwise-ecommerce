const express = require("express");
const { product, category ,subcategory} = require("../model/adminDb");
const multer = require("multer");
const { Session } = require("express-session");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/product");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

module.exports = {

  //get the new product add page

  getAddProduct: async (req, res) => {
    const errorMessage = req.session.errorMessage;
    req.session.errorMessage = "";

    const categories = await category.find({});
    const subcategories = await subcategory.distinct("subcategoryName");
    res.render("addproduct", { errorMessage, categories, subcategories });
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
    } = req.body;

    if (!req.file) {
      req.session.errorMessage = "All field must be required";
      return res.redirect("/admin/addproduct");
    }

    const productImage = req.file.filename;

    if (
      !productName ||
      !productDescription ||
      !productCategory ||
      !productPrice ||
      !productStock
    ) {
      req.session.errorMessage = "All fields must be filled out.";
      return res.redirect("/admin/addproduct");
    }
    console.log(req.body);
    try {
      const newProduct = new product({
        productName,
        productDescription,
        productPrice,
        offerPrice,
        productStock,
        productCategory,
        productSubCategory,
        productImage,
      });
      await newProduct.save();
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

            products = await product.find({ productCategory: categoryId }).populate('productCategory');
            console.log("this is",products);
        } else {
            products = await product.find().populate('productCategory');
        }

        const categories = await category.find();
      // console.log(products);
      res.render("viewproducts", { products,categories });
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
    res.render("updateproduct", {
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
    const{productName, productStock, productDescription, productPrice, offerPrice, productCategory, productSubCategory }=req.body

    try{
      const updatedProduct={
        productName,
        productStock,
        productDescription,
        productPrice,
        offerPrice,
        productCategory,
        productSubCategory
      }
      if (req.file) {
        updatedProduct.productImage = req.file.path;
      }
      await product.findByIdAndUpdate(productId,updatedProduct)
        
      res.redirect("/admin/viewproducts")

    }catch(error){
      console.error(error);
      req.session.errorMessage="Error while updating product"
      res.redirect("/admin/updateproduct")


    }


    
  }
};
