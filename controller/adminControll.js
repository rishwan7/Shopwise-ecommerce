const express = require("express");
const { product, category } = require("../model/adminDb");
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
  getAddProduct: async (req, res) => {
    const errorMessage = req.session.errorMessage;
    req.session.errorMessage = "";

    const categories = await category.find({});
    const subcategories = await category.distinct("subcategories");
    res.render("addproduct", { errorMessage, categories, subcategories });
  },
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
  getAddCategory: async (req, res) => {
    const errorMessage = req.session.errorMessage;
    req.session.errorMessage = "";
    const sucessmessage = req.session.sucsessMsg;
    const subcategories = await category.distinct("subcategory");
    req.session.sucsessMsg = "";

    res.render("addcategory", { errorMessage, subcategories, sucessmessage });
  },
  postAddCategory: async (req, res) => {
    const { categoryName, subcategories } = req.body;

    try {
      if (!categoryName || !subcategories) {
        req.session.errorMessage = "Category name is required.";
        return res.redirect("/admin/addcategory");
      }

      console.log("Received categoryName:", categoryName);
      console.log("Received subcategories:", subcategories);

      let existingCategory = await category.findOne({ categoryName });

      if (!existingCategory) {
        // If the category doesn't exist, create a new one
        existingCategory = new category({
          categoryName,
          subcategories: Array.isArray(subcategories)
            ? subcategories
            : [subcategories],
        });
      } else {
        // If the category exists, push the new subcategories
        if (!existingCategory.subcategories) {
          existingCategory.subcategories = [];
        }
        if (Array.isArray(subcategories)) {
          existingCategory.subcategories.push(...subcategories);
        } else {
          existingCategory.subcategories.push(subcategories);
        }
      }

      await existingCategory.save();

      if (existingCategory) {
        req.session.sucsessMsg = "category added sucess";
      }

      return res.redirect("/admin/addcategory?success=true");
    } catch (error) {
      console.error(error);
      req.session.errorMessage = "Error adding category.";
      res.redirect("/admin/addcategory");
    }
  },

  getViewProducts: async (req, res) => {
    try {
      const products = await product
        .find()
        .populate("productCategory", "categoryName");
      console.log(products);
      res.render("viewproducts", { products });
    } catch (error) {
      console.error(error);
      req.session.errorMessage = "Error fetching products.";
      res.redirect("/admin/addproduct");
    }
  },

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

  updateProduct: async (req, res) => {
    const productId = req.params.id;
    const {
      productName,
      productDescription,
      productPrice,
      offerPrice,
      productStock,
      productCategory,
      productSubCategory,
    } = req.body;

  
  },
};
