




const twilio = require('twilio');

const accountSid = process.env.ACCOUNT_SID;
const authToken =process.env.ACCOUNT_TOKEN ;
const client = twilio(accountSid, authToken);

const sendOtp=async(to,otp)=>{
 await client.messages
    .create({
        body: `Your otp code is ${otp}`,
        from: '+16122940749',
        to:  `+91${to}`
    })
    .then(message => console.log(message.sid))


}




    module.exports={
        sendOtp
    }