const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs } = require('firebase/firestore');

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

    if (req.method === 'GET') {
      // Test Firebase connection by trying to read from participants collection
      const participantsSnapshot = await getDocs(collection(db, 'participants'));
      const participants = [];
      participantsSnapshot.forEach((doc) => {
        participants.push({ id: doc.id, ...doc.data() });
      });

      res.json({
        success: true,
        message: 'Firebase connection successful!',
        timestamp: new Date().toISOString(),
        participantsCount: participants.length,
        sampleData: participants.slice(0, 3) // Show first 3 participants if any
      });
    }

    if (req.method === 'POST') {
      // Test Firebase write by adding a test document
      const testDoc = await addDoc(collection(db, 'test'), {
        message: 'Firebase connection test',
        timestamp: new Date().toISOString(),
        testId: Math.random().toString(36).substr(2, 9)
      });

      res.json({
        success: true,
        message: 'Firebase write test successful!',
        testDocId: testDoc.id,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Firebase test error:', error);
    res.status(500).json({
      success: false,
      error: 'Firebase connection failed',
      details: error.message
    });
  }
}
