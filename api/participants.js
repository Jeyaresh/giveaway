const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, orderBy } = require('firebase/firestore');

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCp18SDoPQ8qCs5-KoYt5m_DGU78vkxa60",
  authDomain: "giveaway-3966c.firebaseapp.com",
  projectId: "giveaway-3966c",
  storageBucket: "giveaway-3966c.firebasestorage.app",
  messagingSenderId: "392424309109",
  appId: "1:392424309109:web:9db9733d590f57e54c133c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get all participants ordered by creation date
    const participantsQuery = query(
      collection(db, 'participants'),
      orderBy('createdAt', 'desc')
    );
    const participantsSnapshot = await getDocs(participantsQuery);
    
    const participants = [];
    participantsSnapshot.forEach((doc) => {
      participants.push({ 
        id: doc.id, 
        ...doc.data(),
        // Format dates for display
        createdAt: doc.data().createdAt ? new Date(doc.data().createdAt).toLocaleString() : 'Unknown',
        updatedAt: doc.data().updatedAt ? new Date(doc.data().updatedAt).toLocaleString() : 'Unknown'
      });
    });

    res.json({
      success: true,
      participants,
      totalCount: participants.length
    });

  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch participants',
      details: error.message
    });
  }
}
