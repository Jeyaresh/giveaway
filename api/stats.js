import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, orderBy } from 'firebase/firestore';

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

    // Get completed participants
    const participantsQuery = query(
      collection(db, 'participants'),
      where('paymentStatus', '==', 'completed')
    );
    const participantsSnapshot = await getDocs(participantsQuery);
    
    const participants = [];
    participantsSnapshot.forEach((doc) => {
      participants.push({ id: doc.id, ...doc.data() });
    });

    const totalParticipants = participants.length;
    const totalCollected = participants.reduce((sum, participant) => sum + (participant.amount || 0), 0);
    const averageAmount = totalParticipants > 0 ? totalCollected / totalParticipants : 0;

    res.json({
      success: true,
      stats: {
        totalParticipants,
        totalCollected,
        averageAmount
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      details: error.message
    });
  }
}
