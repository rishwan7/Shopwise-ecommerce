




const twilio = require('twilio');

const accountSid = process.env.ACCOUNT_SID;
const authToken =process.env.ACCOUNT_TOKEN ;
const client = twilio(accountSid, authToken);

const sendOtp=async(to,otp)=>{
    try {
        const message = await client.messages.create({
          body: `Your OTP code is ${otp}`,
          from: '+16122940749',
          to: `+91${to}`
        });
        console.log('OTP sent:', message.sid);
        return true; // Indicate success
      } catch (error) {
        console.error('Error sending OTP:', error);
        return false; // Indicate failure
      }
}




    module.exports={
        sendOtp
    }