'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'

let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;
let firebaseAppInstance: FirebaseApp | null = null;


// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    try {
      firebaseAppInstance = initializeApp();
    } catch (e) {
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseAppInstance = initializeApp(firebaseConfig);
    }
  } else {
    firebaseAppInstance = getApp();
  }

  if (!authInstance) {
    authInstance = getAuth(firebaseAppInstance);
  }

  if (!firestoreInstance) {
    firestoreInstance = getFirestore(firebaseAppInstance);
    enableIndexedDbPersistence(firestoreInstance)
      .catch((err) => {
        if (err.code == 'failed-precondition') {
          // Multiple tabs open, persistence can only be enabled
          // in one tab at a time.
          // This is a normal scenario, so we can ignore the error.
        } else if (err.code == 'unimplemented') {
          // The current browser does not support all of the
          // features required to enable persistence
          console.warn('Firestore persistence is not available in this browser.');
        }
      });
  }

  return {
    firebaseApp: firebaseAppInstance,
    auth: authInstance,
    firestore: firestoreInstance,
  };
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';