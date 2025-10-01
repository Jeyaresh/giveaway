// Razorpay Configuration
// Replace these with your actual Razorpay details

export const RAZORPAY_CONFIG = {
  // Your Razorpay live key ID (replace with your actual live key)
  keyId: 'rzp_live_RODENRMaafpgCe',
  
  // Secret key is stored securely on backend server
  // NEVER expose secret keys in frontend code
  
  // Your business/merchant name
  merchantName: 'Digital Success Guide',
  
  // Your business details
  businessInfo: {
    name: 'Digital Success Guide',
    category: 'Ebook Sales',
    description: 'Purchase Digital Success Guide Ebook for ₹10'
  },
  
  // Payment settings
  paymentSettings: {
    currency: 'INR',
    minimumAmount: 10,
    maximumAmount: 100000
  }
};

// Instructions for setup:
// 1. Get Razorpay account from https://razorpay.com
// 2. Get your API keys from Razorpay dashboard
// 3. Replace the keyId with your actual Razorpay key
// 4. For production, use live keys instead of test keys
//
// 5. For production, you'll need:
//    - Backend server to create orders and verify payments
//    - Webhook handling for payment confirmations
//    - Database to store transaction records

export default RAZORPAY_CONFIG;
