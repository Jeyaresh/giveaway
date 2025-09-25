const Razorpay = require('razorpay');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, query, where, getDocs } = require('firebase/firestore');

// Check if environment variables are set
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET_KEY) {
  console.error('Missing Razorpay environment variables');
}

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_RLr3XtQd5owAlC',
  key_secret: process.env.RAZORPAY_SECRET_KEY || 'zO7LDifUUQlsWPbOY2gtF4kI',
});

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCp18SDoPQ8qCs5-KoYt5m_DGU78vkxa60",
  authDomain: "giveaway-3966c.firebaseapp.com",
  projectId: "giveaway-3966c",
  storageBucket: "giveaway-3966c.firebasestorage.app",
  messagingSenderId: "392424309109",
  appId: "1:392424309109:web:9db9733d590f57e54c133c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Create order
const createOrder = async (orderData) => {
  try {
    const options = {
      amount: orderData.amount,
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

    console.log('Create order request received:', req.body);
    const { amount, participantName, participantEmail, participantPhone } = req.body;

    // Check if email already exists
    const emailQuery = query(
      collection(db, 'participants'),
      where('email', '==', participantEmail)
    );
    const emailSnapshot = await getDocs(emailQuery);
    
    if (!emailSnapshot.empty) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered',
        message: 'This email has already participated in the giveaway'
      });
    }

    // Create receipt ID
    const receipt = `giveaway_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create Razorpay order
    const order = await createOrder({
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: receipt,
      notes: {
        participant_name: participantName,
        participant_email: participantEmail,
        participant_phone: participantPhone
      }
    });

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
      message: 'Please try again later',
      details: error.message
    });
  }
}
