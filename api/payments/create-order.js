import { createOrder } from '../../backend/config/razorpay.js';
import { db } from '../../backend/database/init.js';
import { body, validationResult } from 'express-validator';

// Validation middleware
const validatePaymentRequest = [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
  body('participantName').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('participantEmail').isEmail().withMessage('Valid email is required'),
  body('participantEmail').normalizeEmail()
];

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
}
