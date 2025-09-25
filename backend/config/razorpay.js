const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

// Verify payment signature
const verifyPayment = (razorpay_payment_id, razorpay_order_id, razorpay_signature) => {
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
    .update(body.toString())
    .digest("hex");
  
  const isAuthentic = expectedSignature === razorpay_signature;
  
  // Debug logging
  console.log("=== Payment Signature Verification ===");
  console.log("Payment ID:", razorpay_payment_id);
  console.log("Order ID:", razorpay_order_id);
  console.log("Received Signature:", razorpay_signature);
  console.log("Expected Signature:", expectedSignature);
  console.log("Body for signature:", body);
  console.log("Secret Key (first 10 chars):", process.env.RAZORPAY_SECRET_KEY ? process.env.RAZORPAY_SECRET_KEY.substring(0, 10) + "..." : "NOT SET");
  console.log("Signature Match:", isAuthentic);
  console.log("=====================================");
  
  if (isAuthentic) {
    console.log("Payment signature verified successfully");
  } else {
    console.error("Payment signature verification failed");
  }
  
  return isAuthentic;
};

// Create order
const createOrder = async (orderData) => {
  try {
    const options = {
      amount: orderData.amount, // Amount is already in paise
      currency: orderData.currency || 'INR',
      receipt: orderData.receipt,
      notes: orderData.notes || {
        source: 'iPhone Giveaway',
        timestamp: new Date().toISOString()
      }
    };

    const order = await razorpay.orders.create(options);
    console.log('Order created:', order.id);
    return order;
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error('Failed to create payment order');
  }
};

// Fetch payment details
const fetchPayment = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Error fetching payment:', error);
    throw new Error('Failed to fetch payment details');
  }
};

module.exports = {
  razorpay,
  verifyPayment,
  createOrder,
  fetchPayment
};
