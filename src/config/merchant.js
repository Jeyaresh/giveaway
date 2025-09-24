// Merchant Configuration for Real UPI Payments
// Replace these with your actual merchant details

export const MERCHANT_CONFIG = {
  // Your UPI ID (e.g., yourname@paytm, yourname@okicici, yourname@ybl)
  upiId: 'your-merchant@paytm', // Replace with your actual UPI ID
  
  // Your business/merchant name
  merchantName: 'iPhone Giveaway',
  
  // Your business details
  businessInfo: {
    name: 'iPhone Giveaway',
    category: 'Giveaway',
    description: 'Win an iPhone for just ₹10'
  },
  
  // Payment settings
  paymentSettings: {
    currency: 'INR',
    minimumAmount: 10,
    maximumAmount: 100000
  }
};

// Instructions for setup:
// 1. Get a UPI ID from any UPI provider:
//    - Paytm: Create account and get UPI ID
//    - PhonePe: Create merchant account
//    - Google Pay: Set up business profile
//    - Bank UPI: Use your bank's UPI service
//
// 2. Replace 'your-merchant@paytm' with your actual UPI ID
//
// 3. Test with small amounts first
//
// 4. For production, you'll need:
//    - Backend server to verify payments
//    - Webhook handling for payment confirmations
//    - Database to store transaction records

export default MERCHANT_CONFIG;
