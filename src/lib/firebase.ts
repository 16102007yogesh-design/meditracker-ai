import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  getDocFromServer,
  serverTimestamp
} from 'firebase/firestore';
import { Medicine, PatientRecord, DailyAdherencePoint } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with specific database ID if present
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// MANDATORY CONNECTION TEST
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Connection to Firestore verified.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('[Firebase] Please check your Firebase configuration or network.');
    }
  }
}
testConnection();

// --- Firestore Medicine Operations with Real-Time Sync ---

const MEDICINES_COLLECTION = 'medicines';
const PATIENTS_COLLECTION = 'patients';
const ADHERENCE_COLLECTION = 'adherence_logs';
const USERS_COLLECTION = 'users';

/**
 * Real-time listener for medicines.
 * Enables automatic sync across both caregiver and patient dashboards!
 */
export function subscribeToMedicines(
  onUpdate: (medicines: Medicine[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, MEDICINES_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate([]);
        return;
      }
      const meds: Medicine[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        meds.push({
          id: data.id || Number(docSnap.id) || Date.now(),
          name: data.name,
          dose: data.dose || data.dosage || '',
          time: data.time || '08:00 AM',
          frequency: data.frequency || 'Once daily',
          stock: typeof data.stock === 'number' ? data.stock : 30,
          perDose: data.perDose || 1,
          status: data.status || 'pending',
          timeSlot: data.timeSlot || 'morning',
          instructions: data.instructions || '',
          category: data.category || 'Maintenance',
          lastTakenAt: data.lastTakenAt || undefined,
          interactionCheck: data.interactionCheck || undefined,
        });
      });
      onUpdate(meds);
    },
    (err) => {
      console.warn('[Firebase] Medicines onSnapshot warning:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Add or update medicine in Firestore
 */
export async function saveMedicineToFirestore(medicine: Medicine): Promise<void> {
  const docId = String(medicine.id);
  const docRef = doc(db, MEDICINES_COLLECTION, docId);
  await setDoc(docRef, {
    ...medicine,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Remove medicine from Firestore
 */
export async function deleteMedicineFromFirestore(medicineId: number | string): Promise<void> {
  const docRef = doc(db, MEDICINES_COLLECTION, String(medicineId));
  await deleteDoc(docRef);
}

/**
 * Seed initial medicines into Firestore if empty
 */
export async function seedInitialMedicinesIfEmpty(initialMeds: Medicine[]): Promise<void> {
  try {
    const colRef = collection(db, MEDICINES_COLLECTION);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      console.log('[Firebase] Seeding initial medicines into Firestore...');
      for (const med of initialMeds) {
        await setDoc(doc(db, MEDICINES_COLLECTION, String(med.id)), {
          ...med,
          createdAt: serverTimestamp(),
        });
      }
    }
  } catch (err) {
    console.warn('[Firebase] Seeding notice:', err);
  }
}

// --- Patients Collection Sync ---

export function subscribeToPatients(
  onUpdate: (patients: PatientRecord[]) => void
) {
  const colRef = collection(db, PATIENTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (!snapshot.empty) {
        const pts: PatientRecord[] = [];
        snapshot.forEach((docSnap) => {
          pts.push(docSnap.data() as PatientRecord);
        });
        onUpdate(pts);
      }
    },
    (err) => {
      console.warn('[Firebase] Patients snapshot warning:', err);
    }
  );
}

export async function savePatientToFirestore(patient: PatientRecord): Promise<void> {
  const docRef = doc(db, PATIENTS_COLLECTION, String(patient.id));
  await setDoc(docRef, {
    ...patient,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function seedInitialPatientsIfEmpty(initialPatients: PatientRecord[]): Promise<void> {
  try {
    const colRef = collection(db, PATIENTS_COLLECTION);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      for (const pt of initialPatients) {
        await setDoc(doc(db, PATIENTS_COLLECTION, String(pt.id)), {
          ...pt,
          createdAt: serverTimestamp(),
        });
      }
    }
  } catch (err) {
    console.warn('[Firebase] Seeding patients notice:', err);
  }
}

// --- Adherence Logs ---

export async function logAdherenceEvent(log: {
  medicineId: number | string;
  medicineName: string;
  patientId: number | string;
  status: 'taken' | 'missed' | 'skipped';
  timestamp?: string;
  notes?: string;
}) {
  const id = `adh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const docRef = doc(db, ADHERENCE_COLLECTION, id);
  await setDoc(docRef, {
    id,
    ...log,
    timestamp: log.timestamp || new Date().toISOString(),
    createdAt: serverTimestamp(),
  });
}
