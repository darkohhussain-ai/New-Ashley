
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
    setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
    isLoading: boolean;
}

// Create the context
const AppContext = createContext<AppState | undefined>(undefined);

// Helper to manage a single collection from the root of Firestore
function useFirestoreCollection<T extends {id: string}>(collectionName: string) {
    const db = useFirestore();
    const { user } = useUser();
    const populationAttempted = React.useRef(false);

    const collectionRef = useMemoFirebase(() => {
        if (!user) return null;
        return collection(db, collectionName);
    }, [db, user, collectionName]);
    
    const { data, isLoading, error } = useCollection<T>(collectionRef);
    
    const dataRef = React.useRef(data);
    useEffect(() => {
      dataRef.current = data;
    }, [data]);

    const setter = useCallback((newData: T[]) => {
        if (!user || !collectionRef) return;

        const currentData = dataRef.current;
        const currentDataMap = new Map((currentData || []).map(item => [item.id, item]));
        const newDataMap = new Map(newData.map(item => [item.id, item]));

        for (const id of currentDataMap.keys()) {
            if (!newDataMap.has(id)) {
                const docRef = doc(collectionRef, id);
                deleteDocumentNonBlocking(docRef);
            }
        }
        
        for (const [id, item] of newDataMap.entries()) {
            const docRef = doc(collectionRef, id);
            const existingItem = currentDataMap.get(id);
            if (!existingItem) {
                setDocumentNonBlocking(docRef, item, { merge: false });
            } else {
                 if (JSON.stringify(existingItem) !== JSON.stringify(item)) {
                    updateDocumentNonBlocking(docRef, item);
                 }
            }
        }
    }, [user, collectionRef]);
    
    useEffect(() => {
        if (!isLoading && user && collectionRef && data && !populationAttempted.current) {
            populationAttempted.current = true; // Mark as attempted
            if (data.length === 0 && (initialData as any)[collectionName]) {
                const initialItems = (initialData as any)[collectionName];
                initialItems.forEach((item: any) => {
                    const docRef = doc(collectionRef, item.id);
                    setDocumentNonBlocking(docRef, item, { merge: true });
                });
            }
        }
    }, [isLoading, data, collectionName, user, collectionRef]);

    return [data || [], setter, isLoading, error] as const;
}

// The provider component
export function AppProvider({ children }: { children: ReactNode }) {
    const { isUserLoading } = useUser();

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
    const db = useFirestore();
    const settingsDocRef = useMemoFirebase(() => db ? doc(db, 'settings', 'main') : null, [db]);
    const { data: firestoreSettings, isLoading: isSettingsLoading } = useDoc<AppSettings>(settingsDocRef);
    const [settings, _setSettings] = useState<AppSettings>(initialSettings);
    const settingsPopulationAttempted = React.useRef(false);
    
    useEffect(() => {
        if (!isSettingsLoading) {
            if (firestoreSettings) {
                _setSettings(prev => {
                    const mergedSettings = {
                        ...initialSettings,
                        ...firestoreSettings,
                        pdfSettings: { ...initialSettings.pdfSettings, ...(firestoreSettings.pdfSettings || {}) }
                    };
                    if (JSON.stringify(mergedSettings) !== JSON.stringify(prev)) {
                        return mergedSettings;
                    }
                    return prev;
                });
            } else if (!settingsPopulationAttempted.current) {
                settingsPopulationAttempted.current = true;
                if (settingsDocRef) {
                    setDocumentNonBlocking(settingsDocRef, initialSettings, { merge: false });
                }
            }
        }
    }, [firestoreSettings, isSettingsLoading, settingsDocRef]);
    
    const setSettings = useCallback((value: React.SetStateAction<AppSettings>) => {
        _setSettings(prevState => {
            const newSettings = value instanceof Function ? value(prevState) : value;
            if (settingsDocRef && JSON.stringify(newSettings) !== JSON.stringify(prevState)) {
                updateDocumentNonBlocking(settingsDocRef, newSettings);
            }
            return newSettings;
        });
    }, [settingsDocRef]);
    
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
