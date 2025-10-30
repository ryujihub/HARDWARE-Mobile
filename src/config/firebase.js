import { initializeApp } from 'firebase/app';
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged as firebaseOnAuthStateChanged,
    signOut as firebaseSignOut,
    getAuth,
    signInWithEmailAndPassword,
} from 'firebase/auth';
import {
    doc,
    getDoc,
    getFirestore,
} from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyABZw1Jk2WdOFqmp2ww8lYV0DBdcVR50GI',
  authDomain: 'hardwareinventory-65123.firebaseapp.com',
  databaseURL: 'https://hardwareinventory-65123-default-rtdb.firebaseio.com',
  projectId: 'hardwareinventory-65123',
  storageBucket: 'hardwareinventory-65123.firebasestorage.app',
  messagingSenderId: '1006715726520',
  appId: '1:1006715726520:web:13897a36fb527e8194224d',
  measurementId: 'G-Y4ZHE3GBN5',
};

// Initialize Firebase (modular)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Authentication helper wrappers using modular API
export const signIn = async (email, password) => {
  try {
    console.log('Starting sign in process...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Sign in successful:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

export const signUp = async (email, password) => {
  try {
    console.log('Starting sign up process...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('Sign up successful:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    console.log('Sign out successful');
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// Expose onAuthStateChanged wrapper
export const onAuthStateChanged = (cb) => firebaseOnAuthStateChanged(auth, cb);

// Test database connection (modular)
export const testDatabaseConnection = async () => {
  try {
    const ref = doc(db, 'test', 'connection-test');
    await getDoc(ref);
    console.log('Database connection successful!');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

export { auth, db };

