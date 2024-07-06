const names = document.getElementById("name");
const email = document.getElementById("email");
const phonenumber=document.getElementById("phonenumber")
const password = document.getElementById("password");
const cpassword = document.getElementById("cpassword");

const form = document.getElementById("signupForm");

const nameReq = document.querySelector(".names-req");
const emailReq = document.querySelector(".email-req");
const passReq = document.querySelector(".pass-req");
const passRegex = document.querySelector(".pass-format");
const passMis = document.querySelector(".pass-mis");

form.addEventListener("submit", (e) => {
  validateInput(e);
});

const validateInput = (e) => {
  const nameValue = names.value.trim();
  const emailValue = email.value.trim();
  const phonenumberValue=phonenumber.value.trim()
  const passValue = password.value.trim();
  const cpassValue = cpassword.value.trim();

  let formIsValid = true;

  // Reset error messages
  nameReq.style.display = "none";
  emailReq.style.display = "none";
  passReq.style.display = "none";
  passRegex.style.display = "none";
  passMis.style.display = "none";

  // Validate name
  if (nameValue === "") {
 
    nameReq.style.display = "block";
    formIsValid = false;
  } else if (nameValue.length < 3) {
    
    nameReq.style.display = "block";
    formIsValid = false;
  }

  // Validate email
  if (emailValue === "") {
  
    emailReq.style.display = "block";
    formIsValid = false;
  } else if (!isValidEmail(emailValue)) {

    emailReq.style.display = "block";
    formIsValid = false;
  }

  if (phonenumberValue === "") {
 
    nameReq.style.display = "block";
    formIsValid = false;
  }

  // Validate password
  if (passValue === "") {
   
    passReq.style.display = "block";
    formIsValid = false;
  } else if (!isValidPassword(passValue)) {
    
    passRegex.style.display = "block";
    formIsValid = false;
  } else if (passValue !== cpassValue) {
   
    passMis.style.display = "block";
    formIsValid = false;
  }

  if (!formIsValid) {
    e.preventDefault();
  }
};

// Email validation function
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation function
const isValidPassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]+$/;
  return passwordRegex.test(password);
};
