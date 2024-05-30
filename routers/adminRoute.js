const express=require("express")
const admin=require("../controller/adminControll")
const multer=require("multer")
const router=express.Router()

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/productImage');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

router.get("/addproduct",admin.getAddProduct)
.post("/addproduct",upload.single('productImage'),admin.postAddProduct)

router.get("/addcategory",admin.getAddCategory)
.post("/addcategory",admin.postAddCategory)

router.get('/viewproducts',admin.getViewProducts)

router.delete('/deleteproduct/:id', admin.deleteProduct);
router.post('/updateproduct/:id', upload.single('productImage'), admin.updateProduct)




module.exports=router