const mongoose=require("mongoose")

const signupSchema=mongoose.Schema({
    userName:{type:String},
    userEmail :{type:String},
   userPhone:{type:Number},
   userPassword:{type:String}
})

const userdetails=mongoose.model("userdetails",signupSchema)
module.exports={userdetails}