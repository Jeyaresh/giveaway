const Razorpay = require('razorpay');
const crypto = require('crypto');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, query, where, getDocs } = require('firebase/firestore');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_RLr3XtQd5owAlC',
  key_secret: process.env.RAZORPAY_SECRET_KEY || 'zO7LDifUUQlsWPbOY2gtF4kI',
});

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Verify payment signature
const verifyPayment = (razorpay_payment_id, razorpay_order_id, razorpay_signature) => {
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY || 'zO7LDifUUQlsWPbOY2gtF4kI')
    .update(body.toString())
    .digest("hex");
  
  return expectedSignature === razorpay_signature;
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

export default async function handler(req, res) {
  try {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('Verify payment request received:', req.body);

    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      participantName,
      participantEmail,
      participantPhone,
      amount
    } = req.body;

    // Verify payment signature
    const isValidSignature = verifyPayment(razorpay_payment_id, razorpay_order_id, razorpay_signature);
    
    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        error: 'Invalid signature',
        message: 'Payment verification failed - invalid signature'
      });
    }

    // Fetch payment details from Razorpay
    const paymentDetails = await fetchPayment(razorpay_payment_id);
    
    // Verify the payment amount matches
    if (paymentDetails.amount !== amount * 100) {
      return res.status(400).json({
        success: false,
        error: 'Amount mismatch',
        message: 'Payment amount does not match expected amount'
      });
    }
    
    // Verify payment status
    if (paymentDetails.status !== 'captured') {
      return res.status(400).json({
        success: false,
        error: 'Payment not captured',
        message: 'Payment was not successfully captured'
      });
    }

    // Check if payment is already processed
    const paymentQuery = query(
      collection(db, 'participants'),
      where('razorpayPaymentId', '==', razorpay_payment_id)
    );
    const paymentSnapshot = await getDocs(paymentQuery);
    
    if (!paymentSnapshot.empty) {
      return res.status(400).json({
        success: false,
        error: 'Payment already processed',
        message: 'This payment has already been processed'
      });
    }

    // Add participant to Firebase
    const participantData = {
      name: participantName,
      email: participantEmail,
      phone: participantPhone || null,
      amount: paymentDetails.amount / 100,
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpaySignature: razorpay_signature,
      paymentStatus: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const participantRef = await addDoc(collection(db, 'participants'), participantData);
    
    // Add transaction details
    const transactionData = {
      participantId: participantRef.id,
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      amount: paymentDetails.amount / 100,
      currency: paymentDetails.currency,
      status: paymentDetails.status,
      paymentMethod: paymentDetails.method,
      createdAt: new Date().toISOString()
    };

    await addDoc(collection(db, 'transactions'), transactionData);

    console.log(`Payment verified and saved for participant ${participantRef.id}`);

    res.json({
      success: true,
      message: 'Payment verified successfully',
      participant: {
        id: participantRef.id,
        name: participantName,
        email: participantEmail,
        paymentId: razorpay_payment_id
      }
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      error: 'Payment verification failed',
      message: 'Please try again later',
      details: error.message
    });
  }
}
