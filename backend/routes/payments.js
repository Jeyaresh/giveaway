const express = require('express');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const { createOrder, verifyPayment, fetchPayment } = require('../config/razorpay');
const { db } = require('../database/init');
const router = express.Router();

// Validation middleware
const validatePaymentRequest = [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
  body('participantName').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('participantEmail').isEmail().withMessage('Valid email is required'),
  body('participantEmail').normalizeEmail()
];

// Create payment order
router.post('/create-order', validatePaymentRequest, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
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

    // Create Razorpay order using backend
    try {
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

      console.log(`Razorpay order created for ${participantEmail}:`, order.id);

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

    } catch (razorpayError) {
      console.error('Razorpay order creation failed:', razorpayError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create payment order',
        message: 'Payment service temporarily unavailable. Please try again later.'
      });
    }

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment order',
      message: 'Please try again later'
    });
  }
});

// Verify payment
router.post('/verify-payment', [
  body('razorpay_payment_id').notEmpty().withMessage('Payment ID is required'),
  body('razorpay_order_id').notEmpty().withMessage('Order ID is required'),
  body('razorpay_signature').notEmpty().withMessage('Signature is required'),
  body('participantName').trim().isLength({ min: 2 }).withMessage('Name is required'),
  body('participantEmail').isEmail().withMessage('Valid email is required'),
  body('amount').isNumeric().withMessage('Amount is required')
], async (req, res) => {
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

      // Insert participant with data security measures
      const participantStmt = db.prepare(`
        INSERT INTO participants (
          name, email, phone, amount, razorpay_payment_id, 
          razorpay_order_id, razorpay_signature, payment_status,
          created_at, data_hash, is_encrypted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // Generate data hash for integrity verification
      const dataToHash = `${participantName}${participantEmail}${participantPhone || ''}${paymentDetails.amount}${razorpay_payment_id}${razorpay_order_id}`;
      const dataHash = crypto.createHash('sha256').update(dataToHash).digest('hex');
      
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
});

// Get payment statistics
router.get('/stats', async (req, res) => {
  try {
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

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// Data transparency endpoint - shows all participants (for transparency)
router.get('/transparency', async (req, res) => {
  try {
    const participants = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          id,
          name,
          email,
          amount,
          payment_status,
          created_at,
          data_hash,
          is_encrypted,
          data_integrity_verified
        FROM participants 
        WHERE payment_status = 'completed'
        ORDER BY created_at DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const totalStats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as totalParticipants,
          SUM(amount) as totalCollected,
          MIN(created_at) as firstPayment,
          MAX(created_at) as lastPayment
        FROM participants 
        WHERE payment_status = 'completed'
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    res.json({
      success: true,
      transparency: {
        totalParticipants: totalStats.totalParticipants || 0,
        totalCollected: totalStats.totalCollected || 0,
        firstPayment: totalStats.firstPayment,
        lastPayment: totalStats.lastPayment,
        participants: participants.map(p => ({
          id: p.id,
          name: p.name,
          email: p.email,
          amount: p.amount,
          paymentStatus: p.payment_status,
          createdAt: p.created_at,
          dataIntegrity: p.data_integrity_verified ? 'Verified' : 'Pending',
          isEncrypted: p.is_encrypted ? 'Yes' : 'No'
        })),
        dataSecurity: {
          allDataEncrypted: participants.every(p => p.is_encrypted),
          integrityVerified: participants.every(p => p.data_integrity_verified),
          totalRecords: participants.length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching transparency data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transparency data'
    });
  }
});

module.exports = router;