const express = require('express');
const { db } = require('../database/init');
const router = express.Router();

// Get all participants
router.get('/', async (req, res) => {
  try {
    const participants = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          id, name, email, phone, amount, payment_date,
          razorpay_payment_id, payment_status, created_at
        FROM participants 
        WHERE payment_status = 'completed'
        ORDER BY created_at DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({
      success: true,
      participants: participants.map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        amount: p.amount,
        paymentDate: p.payment_date,
        paymentId: p.razorpay_payment_id,
        status: p.payment_status
      }))
    });

  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch participants'
    });
  }
});

// Get participant by ID
router.get('/:id', async (req, res) => {
  try {
    const participant = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          p.*, t.payment_method, t.bank_reference, t.wallet, t.vpa
        FROM participants p
        LEFT JOIN transactions t ON p.id = t.participant_id
        WHERE p.id = ? AND p.payment_status = 'completed'
      `, [req.params.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        error: 'Participant not found'
      });
    }

    res.json({
      success: true,
      participant: {
        id: participant.id,
        name: participant.name,
        email: participant.email,
        phone: participant.phone,
        amount: participant.amount,
        paymentDate: participant.payment_date,
        paymentId: participant.razorpay_payment_id,
        paymentMethod: participant.payment_method,
        bankReference: participant.bank_reference,
        wallet: participant.wallet,
        vpa: participant.vpa,
        status: participant.payment_status
      }
    });

  } catch (error) {
    console.error('Error fetching participant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch participant details'
    });
  }
});

// Get payment logs for a participant
router.get('/:id/logs', async (req, res) => {
  try {
    const logs = await new Promise((resolve, reject) => {
      db.all(`
        SELECT action, details, ip_address, created_at
        FROM payment_logs
        WHERE participant_id = ?
        ORDER BY created_at DESC
      `, [req.params.id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({
      success: true,
      logs: logs.map(log => ({
        action: log.action,
        details: JSON.parse(log.details || '{}'),
        ipAddress: log.ip_address,
        timestamp: log.created_at
      }))
    });

  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment logs'
    });
  }
});

// Check if email exists
router.get('/check-email/:email', async (req, res) => {
  try {
    const participant = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, name, payment_date FROM participants WHERE email = ?',
        [req.params.email],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    res.json({
      success: true,
      exists: !!participant,
      participant: participant ? {
        name: participant.name,
        paymentDate: participant.payment_date
      } : null
    });

  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check email'
    });
  }
});

module.exports = router;
