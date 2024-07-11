const express=require("express")
const admin=require("../controller/adminControll")
const productController=require("../controller/productcontrol")
const categoryController=require("../controller/categorycontrol")
const adminLogout=require("../controller/commoncontrol")
const couponController=require("../controller/couponController")
const bannerController=require("../controller/bannerControll")
const multer=require("multer")
const router=express.Router()
const {storage,storage2}=require("../utils/multer")


const upload = multer({ storage: storage });
const banner=multer({storage:storage2})


router.get("/",admin.getAdminHome)

//product-control route

router.get("/addproduct",productController.getAddProduct)
.post("/addproduct",upload.array('productImage',10),productController.postAddProduct)
router.get('/viewproducts/:categoryId?',productController.getViewProducts)
router.delete('/deleteproduct/:id', productController.deleteProduct);
router.get("/updateproduct/:id",productController.getUpdateProduct),
router.post("/updateproduct/:id",upload.array('productImage',10),productController.postUpdateProduct)
.get("/coupon",couponController.getCoupon)
.post("/coupon",couponController.postCouponControl)
.get("/ordermanage",admin.orderManagement)
.post("/updatestatus",admin.updateOrderStatus   )
.post("/cancelorder",admin.cancelOrder)


//category-controlroute
router.get("/addcategory",categoryController.getAddCategory)
.get("/getSubcategories/:categoryId",categoryController.getSubcategory)
.get("/viewcategories",categoryController.viewCategories)
.post("/addcategory",categoryController.postAddCategory)
.delete("/deletecategory/:id",categoryController.deleteCategory)
.delete("/deletesubcategory/:id",categoryController.deleteSubcategory)
.post("/updatecategory/:id",categoryController.postUpdateCategory)
.post("/updatesubcategory/:id",categoryController.postUPdateSubcategory)
.get("/banner",bannerController.getBanner)
.post("/banner",banner.single('bannerImage'),bannerController.postBanner)


//logout

router.get("/logout",adminLogout.logout)








module.exports=router