const Razorpay = require('razorpay');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

// Initialize database
const dbDir = path.join(process.cwd(), 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'giveaway.db');
const db = new sqlite3.Database(dbPath);

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

  try {
    const { amount, participantName, participantEmail, participantPhone } = req.body;

    // Check if email already exists
    const existingParticipant = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM participants WHERE email = ?',
        [participantEmail],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingParticipant) {
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
      message: 'Please try again later'
    });
  }
}
