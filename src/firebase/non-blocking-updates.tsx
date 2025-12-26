'use client';
    
import {
  CollectionReference,
  DocumentReference,
  SetOptions,
} from 'firebase/firestore';

const logStyle = "background: #fde047; color: #713f12; font-weight: bold; padding: 2px 6px; border-radius: 4px;";

/**
 * OFFLINE VERSION: Initiates a setDoc operation for a document reference.
 * Logs the action to the console instead of writing to Firestore.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions) {
  console.log(`%cOFFLINE MODE`, logStyle, `Mock setDoc on path: ${docRef.path}`, { data, options });
  // No-op in offline mode
}


/**
 * OFFLINE VERSION: Initiates an addDoc operation for a collection reference.
 * Logs the action to the console instead of writing to Firestore.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  console.log(`%cOFFLINE MODE`, logStyle, `Mock addDoc to collection: ${colRef.path}`, { data });
  // Return a resolved promise with a mock doc ref
  return Promise.resolve({ id: `mock_${Date.now()}` } as DocumentReference);
}


/**
 * OFFLINE VERSION: Initiates an updateDoc operation for a document reference.
 * Logs the action to the console instead of writing to Firestore.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  console.log(`%cOFFLINE MODE`, logStyle, `Mock updateDoc on path: ${docRef.path}`, { data });
  // No-op in offline mode
}


/**
 * OFFLINE VERSION: Initiates a deleteDoc operation for a document reference.
 * Logs the action to the console instead of writing to Firestore.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  console.log(`%cOFFLINE MODE`, logStyle, `Mock deleteDoc on path: ${docRef.path}`);
  // No-op in offline mode
}
