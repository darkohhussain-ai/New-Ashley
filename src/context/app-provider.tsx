
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useEffect } from 'react';
import { useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  doc,
  DocumentData,
  query,
  where,
  Query,
  CollectionReference,
} from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase/provider';
import { 
    Employee, 
    ExcelFile, 
    Item, 
    StorageLocation, 
    Expense, 
    ExpenseReport,
    Overtime,
    Bonus,
    CashWithdrawal,
    SoldItemReceipt,
    Transfer,
    ItemForTransfer,
    MarketingFeedback,
    EvaluationQuestion,
    User,
    Role,
} from '@/lib/types';
import { setDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { initialData } from './initial-data';

// Define the shape of our application state, now with setters for non-blocking Firestore updates
interface AppState {
    employees: Employee[];
    setEmployees: (employees: Employee[]) => void;
    excelFiles: ExcelFile[];
    setExcelFiles: (files: ExcelFile[]) => void;
    items: Item[];
    setItems: (items: Item[]) => void;
    locations: StorageLocation[];
    setLocations: (locations: StorageLocation[]) => void;
    expenses: Expense[];
    setExpenses: (expenses: Expense[]) => void;
    expenseReports: ExpenseReport[];
    setExpenseReports: (reports: ExpenseReport[]) => void;
    overtime: Overtime[];
    setOvertime: (overtime: Overtime[]) => void;
    bonuses: Bonus[];
    setBonuses: (bonuses: Bonus[]) => void;
    withdrawals: CashWithdrawal[];
    setWithdrawals: (withdrawals: CashWithdrawal[]) => void;
    receipts: SoldItemReceipt[];
    setReceipts: (receipts: SoldItemReceipt[]) => void;
    transfers: Transfer[];
    setTransfers: (transfers: Transfer[]) => void;
    transferItems: ItemForTransfer[];
    setTransferItems: (items: ItemForTransfer[]) => void;
    marketingFeedbacks: MarketingFeedback[];
    setMarketingFeedbacks: (feedbacks: MarketingFeedback[]) => void;
    evaluationQuestions: EvaluationQuestion[];
    setEvaluationQuestions: (questions: EvaluationQuestion[]) => void;
    users: User[];
    setUsers: (users: User[]) => void;
    roles: Role[];
    setRoles: (roles: Role[]) => void;
}

// Create the context
const AppContext = createContext<AppState | undefined>(undefined);


// Helper to manage a single collection
function useFirestoreCollection<T>(collectionName: string) {
    const db = useFirestore();
    const { user } = useUser();

    // Memoize the collection reference to prevent re-renders
    const collectionRef = useMemoFirebase(() => collection(db, 'users', user?.uid || 'anonymous', collectionName), [db, user?.uid]);
    
    // Use the useCollection hook to get real-time data
    const { data, isLoading } = useCollection<T>(collectionRef);

    // This setter function will handle all updates for the collection.
    // It is designed to be "non-blocking".
    const setter = (newData: T[]) => {
        if (!user || !collectionRef) return;

        const currentDataMap = new Map((data || []).map(item => [(item as any).id, item]));
        const newDataMap = new Map(newData.map(item => [(item as any).id, item]));

        // Deletes
        for (const id of currentDataMap.keys()) {
            if (!newDataMap.has(id)) {
                const docRef = doc(collectionRef, id);
                deleteDocumentNonBlocking(docRef);
            }
        }
        
        // Adds or Updates
        for (const [id, item] of newDataMap.entries()) {
            const docRef = doc(collectionRef, id);
            const existingItem = currentDataMap.get(id);
            if (!existingItem) { // Add
                setDocumentNonBlocking(docRef, item, { merge: false });
            } else { // Update
                 if (JSON.stringify(existingItem) !== JSON.stringify(item)) {
                    updateDocumentNonBlocking(docRef, item);
                 }
            }
        }
    };
    
    // During initial load from Firestore, if the collection is empty, populate it with initialData
    useEffect(() => {
        if (!isLoading && data && data.length === 0 && (initialData as any)[collectionName]) {
             if (user && collectionRef) {
                const initialItems = (initialData as any)[collectionName];
                initialItems.forEach((item: any) => {
                    const docRef = doc(collectionRef, item.id);
                    setDocumentNonBlocking(docRef, item, { merge: true });
                });
             }
        }
    }, [isLoading, data, collectionName, user, collectionRef]);


    return [data || [], setter] as const;
}


// The provider component
export function AppProvider({ children }: { children: ReactNode }) {
    const { user } = useUser();

    const [employees, setEmployees] = useFirestoreCollection<Employee>('employees');
    const [excelFiles, setExcelFiles] = useFirestoreCollection<ExcelFile>('excelFiles');
    const [items, setItems] = useFirestoreCollection<Item>('items');
    const [locations, setLocations] = useFirestoreCollection<StorageLocation>('locations');
    const [expenses, setExpenses] = useFirestoreCollection<Expense>('expenses');
    const [expenseReports, setExpenseReports] = useFirestoreCollection<ExpenseReport>('expenseReports');
    const [overtime, setOvertime] = useFirestoreCollection<Overtime>('overtime');
    const [bonuses, setBonuses] = useFirestoreCollection<Bonus>('bonuses');
    const [withdrawals, setWithdrawals] = useFirestoreCollection<CashWithdrawal>('withdrawals');
    const [receipts, setReceipts] = useFirestoreCollection<SoldItemReceipt>('receipts');
    const [transfers, setTransfers] = useFirestoreCollection<Transfer>('transfers');
    const [transferItems, setTransferItems] = useFirestoreCollection<ItemForTransfer>('transferItems');
    const [marketingFeedbacks, setMarketingFeedbacks] = useFirestoreCollection<MarketingFeedback>('marketingFeedbacks');
    const [evaluationQuestions, setEvaluationQuestions] = useFirestoreCollection<EvaluationQuestion>('evaluationQuestions');
    const [users, setUsers] = useFirestoreCollection<User>('users');
    const [roles, setRoles] = useFirestoreCollection<Role>('roles');
    
    const value = useMemo<AppState>(() => ({
        employees, setEmployees,
        excelFiles, setExcelFiles,
        items, setItems,
        locations, setLocations,
        expenses, setExpenses,
        expenseReports, setExpenseReports,
        overtime, setOvertime,
        bonuses, setBonuses,
        withdrawals, setWithdrawals,
        receipts, setReceipts,
        transfers, setTransfers,
        transferItems, setTransferItems,
        marketingFeedbacks, setMarketingFeedbacks,
        evaluationQuestions, setEvaluationQuestions,
        users, setUsers,
        roles, setRoles,
    }), [
        employees, setEmployees,
        excelFiles, setExcelFiles,
        items, setItems,
        locations, setLocations,
        expenses, setExpenses,
        expenseReports, setExpenseReports,
        overtime, setOvertime,
        bonuses, setBonuses,
        withdrawals, setWithdrawals,
        receipts, setReceipts,
        transfers, setTransfers,
        transferItems, setTransferItems,
        marketingFeedbacks, setMarketingFeedbacks,
        evaluationQuestions, setEvaluationQuestions,
        users, setUsers,
        roles, setRoles,
    ]);

    if (!user) {
        return <div className="flex h-screen items-center justify-center">Loading user data...</div>;
    }

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
}
