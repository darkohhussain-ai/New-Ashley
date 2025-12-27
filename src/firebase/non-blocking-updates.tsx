'use client';
    
import {
  setDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Initiates a non-blocking `setDoc` operation.
 * It does not wait for the server to confirm the write.
 * Errors, especially permission errors, are caught and emitted globally.
 * @param {DocumentReference} docRef The reference to the document.
 * @param {any} data The data to set.
 * @param {SetOptions} options Options for the set operation.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions) {
  setDoc(docRef, data, options).catch((error: any) => {
    const contextualError = new FirestorePermissionError({
      path: docRef.path,
      operation: options && 'merge' in options ? 'update' : 'create',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', contextualError);
  });
}

/**
 * Initiates a non-blocking `addDoc` operation.
 * It does not wait for the server to confirm the write.
 * Errors, especially permission errors, are caught and emitted globally.
 * @param {CollectionReference} colRef The reference to the collection.
 * @param {any} data The data for the new document.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  return addDoc(colRef, data).catch((error: any) => {
    const contextualError = new FirestorePermissionError({
      path: colRef.path,
      operation: 'create',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', contextualError);
    // Return a rejected promise to allow for local error handling if needed
    return Promise.reject(contextualError);
  });
}

/**
 * Initiates a non-blocking `updateDoc` operation.
 * It does not wait for the server to confirm the write.
 * Errors, especially permission errors, are caught and emitted globally.
 * @param {DocumentReference} docRef The reference to the document.
 * @param {any} data The data to update.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  return updateDoc(docRef, data).catch((error: any) => {
    const contextualError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', contextualError);
    return Promise.reject(contextualError);
  });
}


/**
 * Initiates a non-blocking `deleteDoc` operation.
 * It does not wait for the server to confirm the deletion.
 * Errors, especially permission errors, are caught and emitted globally.
 * @param {DocumentReference} docRef The reference to the document to delete.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  return deleteDoc(docRef).catch((error: any) => {
    const contextualError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', contextualError);
    return Promise.reject(contextualError);
  });
}
