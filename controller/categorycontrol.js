const express = require("express");
const { product, category, subcategory } = require("../model/adminDb");
const { Session } = require("express-session");

module.exports = {
  getAddCategory: async (req, res) => {
    const adminId=req.session.adminId
    if(!adminId){
        return res.redirect("/admin/login")
    }

    const errorMessage = req.session.errorMessage;
    req.session.errorMessage = "";
    const sucessmessage = req.session.successMessage;
    req.session.successMessage=""
    const subcategories = await category.distinct("subcategory");
   

    res.render("admin/addcategory", { errorMessage, subcategories, sucessmessage });
  },
  postAddCategory: async (req, res) => {
    const { categoryName, subcategoryName } = req.body;

    try {
      if (!categoryName || !subcategoryName) {
        req.session.errorMessage = "Category name is required.";
        return res.redirect("/admin/addcategory");
      }

      console.log("Received categoryName:", categoryName);
      console.log("Received subcategories:", subcategoryName);

      let existingCategory = await category.findOne({ categoryName });

      if (!existingCategory) {
        // If the category doesn't exist, create a new one
        existingCategory = new category({ categoryName });
        await existingCategory.save();
      }

      if (subcategoryName) {
        console.log("this is id:", existingCategory._id);
        let existingSubcategory = await subcategory.findOne({
          subcategoryName,
          category: existingCategory._id,
        });

        if (!existingSubcategory) {
          // Create a new subcategory if it doesn't exist
          existingSubcategory = new subcategory({
            subcategoryName,
            category: existingCategory._id,
          });

          await existingSubcategory.save();
        }
      }

      req.session.successMessage =
        "Category and subcategory added successfully.";
      return res.redirect("/admin/addcategory");
    } catch (error) {
      console.error(error);
      req.session.errorMessage = "Error adding category.";
      res.redirect("/admin/addcategory");
    }
  },

  viewCategories: async (req, res) => {
    const categories = await category.find();
    const subcategories = await subcategory.find();
    // console.log(categories);
    res.render("admin/viewcategories", { categories, subcategories });
  },
  deleteCategory: async (req, res) => {
    try {
      const categoryId = req.params.id;
      console.log(categoryId);
      await category.findByIdAndDelete(categoryId);
      res.json({ success: true, message: "category deleted successfully." });
    } catch (error) {
      console.error("Error deleting category:", error);
      res
        .status(500)
        .json({ success: false, message: "Error deleting category." });
    }
  },

  deleteSubcategory: async (req, res) => {
    try {
      const subCategoryId = req.params.id;
      await subcategory.findByIdAndDelete(subCategoryId);
      res.json({ success: true, message: "subcactehory delted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res
        .status(500)
        .json({ success: false, message: "Error deleting subcategory." });
    }
  },

  postUpdateCategory: async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    console.log("this is name :", name);
    console.log("this is id", id);
    try {
      await category.findByIdAndUpdate(id, { categoryName: name });
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.json({ success: false, error: "Failed to update category" });
    }
  },
  postUPdateSubcategory: async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      await subcategory.findByIdAndUpdate(id , {subcategoryName : name});
  
      
      // console.log("this is name :", name);
      // console.log("this is id", id);
      console.log("updated ");
      res.json({ success: true });
    } catch (error) {
      console.error(error.message);
      res.json({ success: false, error: "Failed to update category" });
    }
  },


  getSubcategory:async(req,res)=>{

    try {
      const categoryId = req.params.categoryId;
      // console.log(categoryId,"this is id");
      const subcategories = await subcategory.find({ category: categoryId });
      res.json(subcategories);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      res.status(500).json({ error: "Error fetching subcategories." });
    }
  

  }
};
