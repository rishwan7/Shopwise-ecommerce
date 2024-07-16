const mongoose = require("mongoose");
const { type } = require("os");

const ProductSchema = new mongoose.Schema({
  productName: {
    type: String,
  },
  productStock: {
    type: Number,
    required: true,
  },
  productImage: {
    type: [String],
    required: true,
  },
  productSize: { type: String },

  productDescription: { type: String, required: true },

  percentageDifference: {
    type: Number,
    required: true,
  },

  productPrice: { type: Number, required: true },

  offerPrice: { type: Number, required: true },

  productSubCategory: { type: mongoose.Types.ObjectId,ref: "subcategories", },

  productCategory: {
    type: mongoose.Types.ObjectId,
    ref: "categories",
    required: true,
  },

  productSize: {
    type: [String],
  },
},{timestamps:true});

const categorySchema = new mongoose.Schema({
  categoryName: { type: String, required: true },
},{timestamps:true});

const subcategorySchema = new mongoose.Schema({
  subcategoryName: { type: String, required: true },

  category: { type: mongoose.Schema.Types.ObjectId},
},{timestamps:true});

const product = mongoose.model("products", ProductSchema);

const category = mongoose.model("categories", categorySchema);
const subcategory = mongoose.model("subcategories", subcategorySchema);



//adminDb

const adminSchema=new mongoose.Schema({
  userName:{type:String},
  userEmail:{type:String},
  userPassword:{type:String}
})

const adminDetails=mongoose.model("adminDetails",adminSchema)

module.exports = { product, category, subcategory ,adminDetails};
