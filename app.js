const express = require("express");
const app = express();
app.set("view engine", "ejs");
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");
const session=require("express-session")
const adminRouter = require("./routers/adminRoute");
const userRouter=require("./routers/userRoute")

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
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

mongoose
  .connect("mongodb://localhost:27017/e-commerce")
  .then(() => {
    console.log("conected");
  })
  .catch((err) => {
    console.error(err);
  });
 

app.use("/admin", adminRouter);
app.use("/",userRouter)


app.listen(3000, () => {
  console.log("server running");
});
