var nodemailer = require("nodemailer");
require("dotenv").config();



const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});
const sendOtpEmail = (toEmail, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: 'Password Reset OTP',
    text: `Your OTP  is: ${otp}. This OTP is valid for a limited time.`,
  };

  return transporter.sendMail(mailOptions);
};

module.exports={sendOtpEmail}

