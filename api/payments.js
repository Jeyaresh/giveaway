const Razorpay = require('razorpay');
const crypto = require('crypto');
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

// Initialize database tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      amount REAL NOT NULL,
      payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      razorpay_payment_id TEXT,
      razorpay_order_id TEXT,
      razorpay_signature TEXT,
      payment_status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      participant_id INTEGER,
      razorpay_payment_id TEXT UNIQUE,
      razorpay_order_id TEXT,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'INR',
      status TEXT NOT NULL,
      payment_method TEXT,
      bank_reference TEXT,
      wallet TEXT,
      vpa TEXT,
      email TEXT,
      contact TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (participant_id) REFERENCES participants (id)
    )
  `);
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
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action } = req.query;

  try {
    if (action === 'create-order') {
      // Create order endpoint
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

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

    } else if (action === 'verify-payment') {
      // Verify payment endpoint
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

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
      const existingPayment = await new Promise((resolve, reject) => {
        db.get(
          'SELECT id FROM participants WHERE razorpay_payment_id = ?',
          [razorpay_payment_id],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (existingPayment) {
        return res.status(400).json({
          success: false,
          error: 'Payment already processed',
          message: 'This payment has already been processed'
        });
      }

      // Insert participant
      const participantStmt = db.prepare(`
        INSERT INTO participants (
          name, email, phone, amount, razorpay_payment_id, 
          razorpay_order_id, razorpay_signature, payment_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      participantStmt.run([
        participantName,
        participantEmail,
        participantPhone || null,
        paymentDetails.amount / 100,
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        'completed'
      ], function(err) {
        if (err) {
          console.error('Error inserting participant:', err);
          return res.status(500).json({
            success: false,
            error: 'Database error',
            message: 'Failed to save participant data'
          });
        }

        res.json({
          success: true,
          message: 'Payment verified successfully',
          participant: {
            id: this.lastID,
            name: participantName,
            email: participantEmail,
            paymentId: razorpay_payment_id
          }
        });
      });

    } else if (action === 'stats') {
      // Get stats endpoint
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const stats = await new Promise((resolve, reject) => {
        db.get(`
          SELECT 
            COUNT(*) as totalParticipants,
            SUM(amount) as totalCollected,
            AVG(amount) as averageAmount
          FROM participants 
          WHERE payment_status = 'completed'
        `, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      res.json({
        success: true,
        stats: {
          totalParticipants: stats.totalParticipants || 0,
          totalCollected: stats.totalCollected || 0,
          averageAmount: stats.averageAmount || 0
        }
      });

    } else {
      res.status(404).json({ error: 'Endpoint not found' });
    }

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Please try again later'
    });
  }
}
