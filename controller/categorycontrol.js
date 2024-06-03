const express = require("express");
const { product, category,subcategory } = require("../model/adminDb");
const { Session } = require("express-session");

module.exports = {
 
    getAddCategory: async (req, res) => {
      const errorMessage = req.session.errorMessage;
      req.session.errorMessage = "";
      const sucessmessage = req.session.sucsessMsg;
      const subcategories = await category.distinct("subcategory");
      req.session.sucsessMsg = "";
  
      res.render("addcategory", { errorMessage, subcategories, sucessmessage });
    },
    postAddCategory: async (req, res) => {
      const { categoryName, subcategoryName} = req.body;
  
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
          existingCategory = new category({categoryName });
          await existingCategory.save()
        }

        if (subcategoryName) {
          console.log("this is id:",existingCategory._id);
          let existingSubcategory = await subcategory.findOne({ subcategoryName, category: existingCategory._id });

          if (!existingSubcategory) {
            // Create a new subcategory if it doesn't exist
            existingSubcategory = new subcategory({ subcategoryName, category: existingCategory._id });
            
            await existingSubcategory.save();
          }
        }
  
        req.session.successMessage = "Category and subcategory added successfully.";
        return res.redirect("/admin/addcategory?success=true");
  
       
  
      } catch (error) {
        console.error(error);
        req.session.errorMessage = "Error adding category.";
        res.redirect("/admin/addcategory");
      }
    },

    viewCategories:async(req,res)=>{
        const categories=await category.find()
        const subcategories=await subcategory.find()
        console.log(categories);
        res.render("viewcategories",{categories,subcategories})
    },
    deleteCategory:async (req,res)=>{

      try{
        const categoryId=req.params.id
        console.log(categoryId);
        await category.findByIdAndDelete(categoryId)
        res.json({ success: true, message: "category deleted successfully." });
        
      } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ success: false, message: 'Error deleting category.' });
    }
    
    },
  
    deleteSubcategory:async(req,res)=>{
      try{
        const subCategoryId=req.params.id
      await subcategory.findByIdAndDelete(subCategoryId)
      res.json({success:true,message:"subcactehory delted successfully"})

      }catch(error){
        console.error('Error deleting category:', error);
        res.status(500).json({ success: false, message: 'Error deleting subcategory.' })


      }
      
    },

    getUpdateCAtegory:async(req,res)=>{

      const categories=await category.find()
      const subcategories=await subcategory.find()

      res.render("updatecategory",{categories,subcategories})

    },

    updateCategory:async(req,res)=>{
      const categoryId=req.params.id
      await category.findByIdAndUpdate(categoryId)
    }
   
  };