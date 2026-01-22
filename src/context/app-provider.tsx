
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  doc,
  DocumentData,
  setDoc,
  getDoc,
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
    ItemCategory,
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
    setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
    excelFiles: ExcelFile[];
    setExcelFiles: React.Dispatch<React.SetStateAction<ExcelFile[]>>;
    items: Item[];
    setItems: React.Dispatch<React.SetStateAction<Item[]>>;
    locations: StorageLocation[];
    setLocations: React.Dispatch<React.SetStateAction<StorageLocation[]>>;
    expenses: Expense[];
    setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
    expenseReports: ExpenseReport[];
    setExpenseReports: React.Dispatch<React.SetStateAction<ExpenseReport[]>>;
    overtime: Overtime[];
    setOvertime: React.Dispatch<React.SetStateAction<Overtime[]>>;
    bonuses: Bonus[];
    setBonuses: React.Dispatch<React.SetStateAction<Bonus[]>>;
    withdrawals: CashWithdrawal[];
    setWithdrawals: React.Dispatch<React.SetStateAction<CashWithdrawal[]>>;
    receipts: SoldItemReceipt[];
    setReceipts: React.Dispatch<React.SetStateAction<SoldItemReceipt[]>>;
    itemCategories: ItemCategory[];
    setItemCategories: React.Dispatch<React.SetStateAction<ItemCategory[]>>;
    transfers: Transfer[];
    setTransfers: React.Dispatch<React.SetStateAction<Transfer[]>>;
    transferItems: ItemForTransfer[];
    setTransferItems: React.Dispatch<React.SetStateAction<ItemForTransfer[]>>;
    marketingFeedbacks: MarketingFeedback[];
    setMarketingFeedbacks: React.Dispatch<React.SetStateAction<MarketingFeedback[]>>;
    evaluationQuestions: EvaluationQuestion[];
    setEvaluationQuestions: React.Dispatch<React.SetStateAction<EvaluationQuestion[]>>;
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    roles: Role[];
    setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
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

    const setter = useCallback((newDataOrFn: T[] | ((current: T[]) => T[])) => {
        if (!collectionRef) return;

        const currentData = dataRef.current || [];
        const newData = typeof newDataOrFn === 'function' ? newDataOrFn(currentData) : newDataOrFn;

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
    const [itemCategories, setItemCategories, isItemCategoriesLoading] = useFirestoreCollection<ItemCategory>('itemCategories');
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
                setDocumentNonBlocking(settingsDocRef, newSettings, { merge: true });
            }
        }
    }, [settingsDocRef, settings]);
    
    const isLoading = isUserLoading || isSettingsLoading || isEmployeesLoading || isExcelFilesLoading || isItemsLoading || isLocationsLoading || isExpensesLoading || isExpenseReportsLoading || isOvertimeLoading || isBonusesLoading || isWithdrawalsLoading || isReceiptsLoading || isItemCategoriesLoading || isTransfersLoading || isTransferItemsLoading || isMarketingFeedbacksLoading || isEvaluationQuestionsLoading || isUsersLoading || isRolesLoading;

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
        itemCategories, setItemCategories,
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
        itemCategories, setItemCategories,
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
