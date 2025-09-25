const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Create database directory if it doesn't exist
const dbDir = path.join(process.cwd(), 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'giveaway.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Participants table
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

  // Transactions table
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

  // Create indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_participants_payment_id ON participants(razorpay_payment_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_payment_id ON transactions(razorpay_payment_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)`);

  console.log('✅ Database initialized successfully');
});

module.exports = { db };
