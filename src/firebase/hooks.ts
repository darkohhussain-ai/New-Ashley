'use client';
import { useContext } from 'react';
import {
  DocumentReference,
  Query,
  collection,
  doc,
} from 'firebase/firestore';
import { useCollection as useFirestoreCollection, useDocument } from 'react-firebase-hooks/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { FirebaseContext } from './provider';

export function useFirebaseApp() {
  const firebase = useContext(FirebaseContext);
  return firebase!.app;
}

export function useFirestore() {
  const firebase = useContext(FirebaseContext);
  return firebase!.db;
}

export function useAuth() {
  const firebase = useContext(FirebaseContext);
  return firebase!.auth;
}

export function useStorage() {
  const firebase = useContext(FirebaseContext);
  return firebase!.storage;
}

export function useUser() {
  const auth = useAuth();
  const [user, loading, error] = useAuthState(auth);
  return { user, loading, error };
}

export function useDoc<T>(ref: DocumentReference<T>) {
  const [snapshot, loading, error] = useDocument(ref);
  const data = snapshot?.data();
  return { data, loading, error };
}

export function useCollection<T>(query: Query<T> | null) {
  const [snapshot, loading, error] = useFirestoreCollection(query);
  const data = snapshot?.docs.map((doc) => doc.data());
  return { data, loading, error };
}
