const mongoose = require("mongoose");
const { type } = require("os");

const ProductSchema = new mongoose.Schema({
  productName: {
    type: String,
  },
  productStock: {
    type: Number,
 required:true },

  productImage: {
    type: String,
    required: true,
  },


  productDescription:
   { type: String,
     required: true },


  productPrice:
   { type: Number,
     required: true },


     offerPrice:
     {type:Number,
      required:true},


  productSubCategory:
   { type: String },


  productCategory: 
  { type: mongoose.Types.ObjectId,
    ref:'categories', 
    required: true },

  category: 
  { type: mongoose.Types.ObjectId }
});

const categorySchema = new mongoose.Schema({
  categoryName: 
  { type: String, 
    required: true },

  subcategories: 
  { type: [String], 
    required: true },
});

const product = mongoose.model("products", ProductSchema);

const category = mongoose.model("categories", categorySchema);

module.exports = { product, category };
