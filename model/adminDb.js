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

});

const categorySchema = new mongoose.Schema({
  categoryName: 
  { type: String, 
    required: true },

 
});


const subcategorySchema=new mongoose.Schema({
  subcategoryName:
  {type:String,
    required:true
  },

  category:
   { type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category' }


})

const product = mongoose.model("products", ProductSchema);

const category = mongoose.model("categories", categorySchema);
const subcategory=mongoose.model("subcategories",subcategorySchema)

module.exports = { product, category,subcategory };
