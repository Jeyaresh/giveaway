import Razorpay from 'razorpay';
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

// Check if email already exists
const checkEmailExists = async (email) => {
  try {
    const q = query(
      collection(db, 'participants'),
      where('email', '==', email)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking email:', error);
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
    const { amount, participantName, participantEmail, participantPhone } = req.body;

    // Validation
    if (!amount || !participantName || !participantEmail) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Amount, name, and email are required'
      });
    }

    if (amount < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount',
        message: 'Amount must be at least 1'
      });
    }

    // Check if email already exists
    const emailExists = await checkEmailExists(participantEmail);
    if (emailExists) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered',
        message: 'This email has already participated in the giveaway'
      });
    }

    // Create receipt ID
    const receipt = `giveaway_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: receipt,
      notes: {
        participant_name: participantName,
        participant_email: participantEmail,
        participant_phone: participantPhone
      }
    });

    console.log(`Order created for ${participantEmail}:`, order.id);

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      },
      participant: {
        name: participantName,
        email: participantEmail,
        phone: participantPhone
      }
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment order',
      message: 'Please try again later'
    });
  }
}
