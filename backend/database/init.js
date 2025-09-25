const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure database directory exists
const dbDir = path.dirname(process.env.DB_PATH || './database/giveaway.db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || './database/giveaway.db';
const db = new sqlite3.Database(dbPath);

// Initialize database tables
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Participants table with security features
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
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          data_hash TEXT,
          is_encrypted INTEGER DEFAULT 1,
          data_integrity_verified INTEGER DEFAULT 0
        )
      `);

      // Transactions table for detailed payment tracking
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

      // Payment logs for debugging
      db.run(`
        CREATE TABLE IF NOT EXISTS payment_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          participant_id INTEGER,
          action TEXT NOT NULL,
          details TEXT,
          ip_address TEXT,
          user_agent TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (participant_id) REFERENCES participants (id)
        )
      `);

      // Create indexes for better performance
      db.run(`CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_participants_payment_id ON participants(razorpay_payment_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_payment_id ON transactions(razorpay_payment_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)`);

      console.log('✅ Database initialized successfully');
      resolve();
    });
  });
};

// Close database connection
const closeDatabase = () => {
  return new Promise((resolve) => {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
      resolve();
    });
  });
};

module.exports = {
  db,
  initDatabase,
  closeDatabase
};
