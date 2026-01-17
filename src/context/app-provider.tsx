
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useEffect, useState, useCallback } from 'react';
import { useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  doc,
  DocumentData,
  query,
  where,
  Query,
  CollectionReference,
  setDoc,
} from 'firebase/firestore';
import { useFirestore, useUser, useDoc } from '@/firebase';
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
    AppSettings,
} from '@/lib/types';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { initialData, initialSettings } from './initial-data';
import { SplashScreen } from '@/components/shared/splash-screen';

// Define the shape of our application state
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
    settings: AppSettings;
    setSettings: (value: React.SetStateAction<AppSettings>) => void;
    isLoading: boolean;
}

// Create the context
const AppContext = createContext<AppState | undefined>(undefined);

// Helper to manage a single collection from the root of Firestore
function useFirestoreCollection<T extends {id: string}>(collectionName: string) {
    const db = useFirestore();

    const collectionRef = useMemoFirebase(() => {
        if (!db) return null;
        return collection(db, collectionName);
    }, [db, collectionName]);
    
    const { data, isLoading, error } = useCollection<T>(collectionRef);
    
    const dataRef = React.useRef(data);
    useEffect(() => {
      dataRef.current = data;
    }, [data]);

    const setter = useCallback((newData: T[]) => {
        if (!collectionRef) return;

        const currentData = dataRef.current || [];
        const currentDataMap = new Map(currentData.map(item => [item.id, item]));
        const newDataMap = new Map(newData.map(item => [item.id, item]));

        // Deletions
        for (const id of currentDataMap.keys()) {
            if (!newDataMap.has(id)) {
                deleteDocumentNonBlocking(doc(collectionRef, id));
            }
        }
        
        // Additions and Updates
        for (const [id, item] of newDataMap.entries()) {
            const existingItem = currentDataMap.get(id);
            if (!existingItem) {
                setDocumentNonBlocking(doc(collectionRef, id), item, { merge: false });
            } else if (JSON.stringify(existingItem) !== JSON.stringify(item)) {
                updateDocumentNonBlocking(doc(collectionRef, id), item);
            }
        }
    }, [collectionRef]);
    
    return [data || [], setter, isLoading, error] as const;
}

// The provider component
export function AppProvider({ children }: { children: ReactNode }) {
    const { isUserLoading } = useUser();
    const db = useFirestore();

    // One-time effect to populate initial data if needed.
    useEffect(() => {
        if (!db) return;

        const populateInitialData = async () => {
            const isPopulated = localStorage.getItem('dataPopulated');
            if (isPopulated) return;

            console.log("First time setup: Populating initial data into Firestore...");

            try {
                for (const [collectionName, dataArray] of Object.entries(initialData)) {
                    if (Array.isArray(dataArray)) {
                        const collectionRef = collection(db, collectionName);
                        for (const item of dataArray) {
                            if (item.id) {
                                const docRef = doc(collectionRef, item.id);
                                await setDoc(docRef, item, { merge: true });
                            }
                        }
                    }
                }
                
                const settingsRef = doc(db, 'settings', 'main');
                await setDoc(settingsRef, initialSettings, { merge: true });

                localStorage.setItem('dataPopulated', 'true');
                console.log("Initial data population complete.");
            } catch (error) {
                console.error("Error populating initial data:", error);
            }
        };

        populateInitialData();
    }, [db]);


    // App Data Collections
    const [employees, setEmployees, isEmployeesLoading] = useFirestoreCollection<Employee>('employees');
    const [excelFiles, setExcelFiles, isExcelFilesLoading] = useFirestoreCollection<ExcelFile>('excelFiles');
    const [items, setItems, isItemsLoading] = useFirestoreCollection<Item>('items');
    const [locations, setLocations, isLocationsLoading] = useFirestoreCollection<StorageLocation>('locations');
    const [expenses, setExpenses, isExpensesLoading] = useFirestoreCollection<Expense>('expenses');
    const [expenseReports, setExpenseReports, isExpenseReportsLoading] = useFirestoreCollection<ExpenseReport>('expenseReports');
    const [overtime, setOvertime, isOvertimeLoading] = useFirestoreCollection<Overtime>('overtime');
    const [bonuses, setBonuses, isBonusesLoading] = useFirestoreCollection<Bonus>('bonuses');
    const [withdrawals, setWithdrawals, isWithdrawalsLoading] = useFirestoreCollection<CashWithdrawal>('withdrawals');
    const [receipts, setReceipts, isReceiptsLoading] = useFirestoreCollection<SoldItemReceipt>('receipts');
    const [transfers, setTransfers, isTransfersLoading] = useFirestoreCollection<Transfer>('transfers');
    const [transferItems, setTransferItems, isTransferItemsLoading] = useFirestoreCollection<ItemForTransfer>('transferItems');
    const [marketingFeedbacks, setMarketingFeedbacks, isMarketingFeedbacksLoading] = useFirestoreCollection<MarketingFeedback>('marketingFeedbacks');
    const [evaluationQuestions, setEvaluationQuestions, isEvaluationQuestionsLoading] = useFirestoreCollection<EvaluationQuestion>('evaluationQuestions');
    const [users, setUsers, isUsersLoading] = useFirestoreCollection<User>('users');
    const [roles, setRoles, isRolesLoading] = useFirestoreCollection<Role>('roles');
    
    // Settings Singleton Document
    const settingsDocRef = useMemoFirebase(() => db ? doc(db, 'settings', 'main') : null, [db]);
    const { data: firestoreSettings, isLoading: isSettingsLoading } = useDoc<AppSettings>(settingsDocRef);
    
    const settings = useMemo(() => {
        if (firestoreSettings) {
            return {
                ...initialSettings,
                ...firestoreSettings,
                pdfSettings: {
                    ...initialSettings.pdfSettings,
                    ...(firestoreSettings.pdfSettings || {}),
                    report: { ...initialSettings.pdfSettings.report, ...(firestoreSettings.pdfSettings?.report || {})},
                    invoice: { ...initialSettings.pdfSettings.invoice, ...(firestoreSettings.pdfSettings?.invoice || {})},
                    card: { ...initialSettings.pdfSettings.card, ...(firestoreSettings.pdfSettings?.card || {})},
                }
            };
        }
        return initialSettings;
    }, [firestoreSettings]);

    const setSettings = useCallback((value: React.SetStateAction<AppSettings>) => {
        if (settingsDocRef) {
            const newSettings = value instanceof Function ? value(settings) : value;
            if (JSON.stringify(newSettings) !== JSON.stringify(settings)) {
                updateDocumentNonBlocking(settingsDocRef, newSettings);
            }
        }
    }, [settingsDocRef, settings]);
    
    const isLoading = isUserLoading || isSettingsLoading || isEmployeesLoading || isExcelFilesLoading || isItemsLoading || isLocationsLoading || isExpensesLoading || isExpenseReportsLoading || isOvertimeLoading || isBonusesLoading || isWithdrawalsLoading || isReceiptsLoading || isTransfersLoading || isTransferItemsLoading || isMarketingFeedbacksLoading || isEvaluationQuestionsLoading || isUsersLoading || isRolesLoading;

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
        settings, 
        setSettings: setSettings,
        isLoading,
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
        settings,
        setSettings,
        isLoading
    ]);

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
