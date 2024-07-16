const express = require("express");
const app = express();
require("dotenv").config()
app.set("view engine", "ejs");
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");
const session=require("express-session")
const adminRouter = require("./routers/adminRoute");
const userRouter=require("./routers/userRoute")
const paymentController = require('./controller/paymentControll')

// app.use(express.raw({ type: 'application/json' }))
app.post("/webhook",express.raw({type: 'application/json'}),paymentController.verifyPaymentWebhook)

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);


// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'uploads/');
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + '-' + file.originalname);
//     }
// });
// const upload = multer({ storage: storage });

const conectDB=async()=>{
  try{

    await mongoose.connect(`mongodb+srv://rishwan063:${process.env.ATLAS_PASSWORD}@rishwan.ceaa1kd.mongodb.net/e-commerce`)
    console.log(`the db is conect with ${mongoose.connection.host}`);
  }catch(error){
    console.error('Error connecting to the database:', error);
  }
}
 conectDB()

app.use("/admin", adminRouter);
app.use("/",userRouter)
app.get("*",(req,res)=>{
  res.redirect("/404")
})


app.listen(3000, () => {
  console.log("server running");
});
