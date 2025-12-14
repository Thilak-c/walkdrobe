// List of all Indian states and Union Territories
export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh", 
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat", 
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  // Union Territories
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];

// Validation function for Indian phone numbers
export const validatePhoneNumber = (phone) => {
  // Remove any spaces, dashes, or special characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check if it's exactly 10 digits
  if (cleanPhone.length !== 10) {
    return { isValid: false, message: "Phone number must be exactly 10 digits" };
  }
  
  // Check if it starts with valid digits (6-9)
  if (!/^[6-9]/.test(cleanPhone)) {
    return { isValid: false, message: "Please enter a valid Indian mobile number starting with 6, 7, 8, or 9" };
  }
  
  return { isValid: true, message: "", cleanPhone };
};

// Validation function for Indian PIN codes
export const validatePinCode = (pinCode) => {
  // Remove any spaces or special characters
  const cleanPin = pinCode.replace(/\D/g, '');
  
  // Check if it's exactly 6 digits
  if (cleanPin.length !== 6) {
    return { isValid: false, message: "Please enter a valid 6-digit PIN code" };
  }
  
  // Check if it doesn't start with 0
  if (cleanPin.startsWith('0')) {
    return { isValid: false, message: "PIN code cannot start with 0. Please enter a valid PIN code" };
  }
  
  return { isValid: true, message: "", cleanPin };
}; 