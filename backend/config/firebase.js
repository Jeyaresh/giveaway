const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, where, orderBy } = require('firebase/firestore');

// Firebase configuration (same as frontend)
const firebaseConfig = {
  apiKey: "AIzaSyCp18SDoPQ8qCs5-KoYt5m_DGU78vkxa60",
  authDomain: "giveaway-3966c.firebaseapp.com",
  projectId: "giveaway-3966c",
  storageBucket: "giveaway-3966c.firebasestorage.app",
  messagingSenderId: "392424309109",
  appId: "1:392424309109:web:9db9733d590f57e54c133c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Collection names
const PARTICIPANTS_COLLECTION = 'participants';
const TRANSACTIONS_COLLECTION = 'transactions';

// Add a new participant to Firebase
const addParticipant = async (participantData) => {
  try {
    const docRef = await addDoc(collection(db, PARTICIPANTS_COLLECTION), {
      ...participantData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { id: docRef.id, ...participantData };
  } catch (error) {
    console.error('Error adding participant to Firebase:', error);
    throw error;
  }
};

// Add a new transaction to Firebase
const addTransaction = async (transactionData) => {
  try {
    const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
      ...transactionData,
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...transactionData };
  } catch (error) {
    console.error('Error adding transaction to Firebase:', error);
    throw error;
  }
};

// Check if email already exists in Firebase
const checkEmailExists = async (email) => {
  try {
    const q = query(
      collection(db, PARTICIPANTS_COLLECTION),
      where('email', '==', email)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking email in Firebase:', error);
    throw error;
  }
};

// Check if payment ID already exists in Firebase
const checkPaymentIdExists = async (paymentId) => {
  try {
    const q = query(
      collection(db, PARTICIPANTS_COLLECTION),
      where('razorpayPaymentId', '==', paymentId)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking payment ID in Firebase:', error);
    throw error;
  }
};

module.exports = {
  db,
  addParticipant,
  addTransaction,
  checkEmailExists,
  checkPaymentIdExists
};
