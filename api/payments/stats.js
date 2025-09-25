const { db } = require('../../backend/database/init');

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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
}
