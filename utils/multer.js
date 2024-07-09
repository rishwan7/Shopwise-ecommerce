const multer=require("multer")
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/productImage');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const storage2 = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/bannerImage');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

module.exports=storage,storage2