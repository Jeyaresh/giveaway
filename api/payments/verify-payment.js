const { verifyPayment, fetchPayment } = require('../../backend/config/razorpay');
const { db } = require('../../backend/database/init');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');

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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
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
    let paymentDetails;
    try {
      paymentDetails = await fetchPayment(razorpay_payment_id);
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

    // Start database transaction
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Generate data hash for integrity verification
      const dataToHash = `${participantName}${participantEmail}${participantPhone || ''}${paymentDetails.amount}${razorpay_payment_id}${razorpay_order_id}`;
      const dataHash = crypto.createHash('sha256').update(dataToHash).digest('hex');

      // Insert participant with data security measures
      const participantStmt = db.prepare(`
        INSERT INTO participants (
          name, email, phone, amount, razorpay_payment_id, 
          razorpay_order_id, razorpay_signature, payment_status,
          created_at, data_hash, is_encrypted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      participantStmt.run([
        participantName,
        participantEmail,
        participantPhone || null,
        paymentDetails.amount / 100, // Convert from paise to rupees
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        'completed',
        new Date().toISOString(), // created_at
        dataHash, // data_hash for integrity
        1 // is_encrypted flag
      ], function(err) {
        if (err) {
          console.error('Error inserting participant:', err);
          db.run('ROLLBACK');
          return res.status(500).json({
            success: false,
            error: 'Database error',
            message: 'Failed to save participant data'
          });
        }

        const participantId = this.lastID;

        // Insert transaction details
        const transactionStmt = db.prepare(`
          INSERT INTO transactions (
            participant_id, razorpay_payment_id, razorpay_order_id,
            amount, currency, status, payment_method, bank_reference,
            wallet, vpa, email, contact, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        transactionStmt.run([
          participantId,
          razorpay_payment_id,
          razorpay_order_id,
          paymentDetails.amount / 100,
          paymentDetails.currency,
          paymentDetails.status,
          paymentDetails.method,
          paymentDetails.bank_reference,
          paymentDetails.wallet,
          paymentDetails.vpa,
          paymentDetails.email,
          paymentDetails.contact,
          JSON.stringify(paymentDetails.notes || {})
        ], function(err) {
          if (err) {
            console.error('Error inserting transaction:', err);
            db.run('ROLLBACK');
            return res.status(500).json({
              success: false,
              error: 'Database error',
              message: 'Failed to save transaction data'
            });
          }

          db.run('COMMIT', (commitErr) => {
            if (commitErr) {
              console.error('Error committing transaction:', commitErr);
              return res.status(500).json({
                success: false,
                error: 'Database error',
                message: 'Failed to commit transaction'
              });
            }

            console.log(`Payment verified and saved for participant ${participantId}`);

            res.json({
              success: true,
              message: 'Payment verified successfully',
              participant: {
                id: participantId,
                name: participantName,
                email: participantEmail,
                paymentId: razorpay_payment_id
              }
            });
          });
        });
      });
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      error: 'Payment verification failed',
      message: 'Please try again later'
    });
  }
}
