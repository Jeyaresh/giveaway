const Razorpay = require('razorpay');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_RLr3XtQd5owAlC',
  key_secret: process.env.RAZORPAY_SECRET_KEY || 'zO7LDifUUQlsWPbOY2gtF4kI',
});

// Initialize database - use in-memory database for Vercel
const db = new sqlite3.Database(':memory:');

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
});

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

      console.log(`Payment verified and saved for participant ${this.lastID}`);

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
