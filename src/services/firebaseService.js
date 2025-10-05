import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  where,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

const PARTICIPANTS_COLLECTION = 'participants';
const TRANSACTIONS_COLLECTION = 'transactions';

// Add a new participant
export const addParticipant = async (participantData) => {
  try {
    const docRef = await addDoc(collection(db, PARTICIPANTS_COLLECTION), {
      ...participantData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { id: docRef.id, ...participantData };
  } catch (error) {
    console.error('Error adding participant:', error);
    throw error;
  }
};

// Add a new transaction
export const addTransaction = async (transactionData) => {
  try {
    const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
      ...transactionData,
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...transactionData };
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

// Get all participants
export const getAllParticipants = async () => {
  try {
    const q = query(
      collection(db, PARTICIPANTS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const participants = [];
    querySnapshot.forEach((doc) => {
      participants.push({ id: doc.id, ...doc.data() });
    });
    return participants;
  } catch (error) {
    console.error('Error getting participants:', error);
    throw error;
  }
};

// Get participants by payment status
export const getParticipantsByStatus = async (status = 'completed') => {
  try {
    // First get all participants, then filter client-side to avoid index requirement
    const q = query(
      collection(db, PARTICIPANTS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const allParticipants = [];
    querySnapshot.forEach((doc) => {
      allParticipants.push({ id: doc.id, ...doc.data() });
    });
    
    // Filter by status client-side
    return allParticipants.filter(participant => participant.paymentStatus === status);
  } catch (error) {
    console.error('Error getting participants by status:', error);
    throw error;
  }
};

// Check if email already exists
export const checkEmailExists = async (email) => {
  try {
    const q = query(
      collection(db, PARTICIPANTS_COLLECTION),
      where('email', '==', email)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking email:', error);
    throw error;
  }
};

// Check if payment ID already exists
export const checkPaymentIdExists = async (paymentId) => {
  try {
    const q = query(
      collection(db, PARTICIPANTS_COLLECTION),
      where('razorpayPaymentId', '==', paymentId)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking payment ID:', error);
    throw error;
  }
};

// Get payment statistics
export const getPaymentStats = async () => {
  try {
    // Get all participants first, then filter client-side
    const allParticipants = await getAllParticipants();
    const completedParticipants = allParticipants.filter(p => p.paymentStatus === 'completed');
    
    const totalParticipants = completedParticipants.length;
    const totalCollected = completedParticipants.reduce((sum, participant) => sum + (participant.amount || 0), 0);
    const averageAmount = totalParticipants > 0 ? totalCollected / totalParticipants : 0;
    
    return {
      totalParticipants,
      totalCollected,
      averageAmount
    };
  } catch (error) {
    console.error('Error getting payment stats:', error);
    throw error;
  }
};
