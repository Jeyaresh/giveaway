import Razorpay from 'razorpay';
import crypto from 'crypto';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCp18SDoPQ8qCs5-KoYt5m_DGU78vkxa60",
  authDomain: "giveaway-3966c.firebaseapp.com",
  projectId: "giveaway-3966c",
  storageBucket: "giveaway-3966c.firebasestorage.app",
  messagingSenderId: "392424309109",
  appId: "1:392424309109:web:9db9733d590f57e54c133c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Razorpay
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
  
  return expectedSignature === razorpay_signature;
};

// Check if payment ID already exists
const checkPaymentIdExists = async (paymentId) => {
  try {
    const q = query(
      collection(db, 'participants'),
      where('razorpayPaymentId', '==', paymentId)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking payment ID:', error);
    throw error;
  }
};

// Add participant to Firebase
const addParticipant = async (participantData) => {
  try {
    const docRef = await addDoc(collection(db, 'participants'), {
      ...participantData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { id: docRef.id, ...participantData };
  } catch (error) {
    console.error('Error adding participant:', error);
    throw error;
  }
};

// Add transaction to Firebase
const addTransaction = async (transactionData) => {
  try {
    const docRef = await addDoc(collection(db, 'transactions'), {
      ...transactionData,
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...transactionData };
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

export default async function handler(req, res) {
  // Set CORS headers
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

  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      participantName,
      participantEmail,
      participantPhone,
      amount
    } = req.body;

    // Validation
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing payment details',
        message: 'Payment ID, Order ID, and Signature are required'
      });
    }

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
    let paymentDetails;
    try {
      paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
      console.log('Payment details fetched:', paymentDetails.id);
      
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
    } catch (error) {
      console.error('Error fetching payment details:', error);
      return res.status(400).json({
        success: false,
        error: 'Invalid payment',
        message: 'Payment verification failed - could not fetch payment details'
      });
    }

    // Check if payment is already processed
    const paymentExists = await checkPaymentIdExists(razorpay_payment_id);
    if (paymentExists) {
      return res.status(400).json({
        success: false,
        error: 'Payment already processed',
        message: 'This payment has already been processed'
      });
    }

    // Save to Firebase
    try {
      // Prepare participant data
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

      // Save participant
      const participantResult = await addParticipant(participantData);
      console.log(`Payment verified and saved for participant ${participantResult.id}`);

      // Prepare transaction data
      const transactionData = {
        participantId: participantResult.id,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        amount: paymentDetails.amount / 100,
        currency: paymentDetails.currency,
        status: paymentDetails.status,
        paymentMethod: paymentDetails.method || null,
        bankReference: paymentDetails.bank_reference || null,
        wallet: paymentDetails.wallet || null,
        vpa: paymentDetails.vpa || null,
        email: paymentDetails.email || null,
        contact: paymentDetails.contact || null,
        notes: paymentDetails.notes || {}
      };

      // Remove undefined values
      Object.keys(transactionData).forEach(key => {
        if (transactionData[key] === undefined) {
          delete transactionData[key];
        }
      });

      // Save transaction
      await addTransaction(transactionData);

      res.json({
        success: true,
        message: 'Payment verified successfully',
        participant: {
          id: participantResult.id,
          name: participantName,
          email: participantEmail,
          paymentId: razorpay_payment_id
        }
      });

    } catch (firebaseError) {
      console.error('Error saving to Firebase:', firebaseError);
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: 'Failed to save payment data'
      });
    }

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      error: 'Payment verification failed',
      message: 'Please try again later'
    });
  }
}
