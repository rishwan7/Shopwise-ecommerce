const mongoose=require("mongoose")
const Schema = mongoose.Schema;

const userAddressSchema=mongoose.Schema({
    userId:{type:mongoose.Types.ObjectId},
    firstName:{type:String},
    lastName:{type:String},
    address:{type:String},
    address2:{type:String},
    city:{type:String},
    state:{type:String},
    postalCode:{type:Number},
    phone:{type:Number}
},{timestamps:true})
const useraddressSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    addresses: [userAddressSchema]
});

const UserAddress = mongoose.model('UserAddress', useraddressSchema)

module.exports={UserAddress}