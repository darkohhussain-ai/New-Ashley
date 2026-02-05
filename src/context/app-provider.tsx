
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useEffect, useState, useCallback } from 'react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
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
    SoldItemsList,
    ItemCategory,
    Transfer,
    ItemForTransfer,
    OrderRequest,
    MarketingFeedback,
    EvaluationQuestion,
    User,
    Role,
    ActivityLog,
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
    itemCategories: ItemCategory[];
    setItemCategories: React.Dispatch<React.SetStateAction<ItemCategory[]>>;
    transfers: Transfer[];
    setTransfers: React.Dispatch<React.SetStateAction<Transfer[]>>;
    transferItems: ItemForTransfer[];
    setTransferItems: React.Dispatch<React.SetStateAction<ItemForTransfer[]>>;
    orderRequests: OrderRequest[];
    setOrderRequests: React.Dispatch<React.SetStateAction<OrderRequest[]>>;
    marketingFeedbacks: MarketingFeedback[];
    setMarketingFeedbacks: React.Dispatch<React.SetStateAction<MarketingFeedback[]>>;
    evaluationQuestions: EvaluationQuestion[];
    setEvaluationQuestions: React.Dispatch<React.SetStateAction<EvaluationQuestion[]>>;
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    roles: Role[];
    setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
    soldItemsLists: SoldItemsList[];
    setSoldItemsLists: React.Dispatch<React.SetStateAction<SoldItemsList[]>>;
    activityLogs: ActivityLog[];
    setActivityLogs: React.Dispatch<React.SetStateAction<ActivityLog[]>>;
    settings: AppSettings;
    setSettings: (value: React.SetStateAction<AppSettings>) => Promise<void>;
    isLoading: boolean;
}

// Create the context
const AppContext = createContext<AppState | undefined>(undefined);

// Helper to manage a single collection from the root of Firestore
function useFirestoreCollection<T extends {id: string}>(collectionName: string, initialFallback: T[]) {
    const db = useFirestore();
    
    const collectionRef = useMemoFirebase(() => {
        if (!db) return null;
        return collection(db, collectionName);
    }, [db, collectionName]);
    
    const { data, isLoading, error } = useCollection<T>(collectionRef);

    const [localData, setLocalData] = useState<T[]>(data ?? initialFallback);

     useEffect(() => {
        if (data) {
            setLocalData(data);
        }
    }, [data]);
    
    const setter = useCallback((newDataOrFn: React.SetStateAction<T[]>) => {
         if (!collectionRef) {
            // Update local state if offline
            setLocalData(newDataOrFn);
            return;
        }

        const currentData = localData || [];
        const newData = typeof newDataOrFn === 'function' ? (newDataOrFn as (prevState: T[]) => T[])(currentData) : newDataOrFn;

        setLocalData(newData);

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
    }, [collectionRef, localData]);
    
    return [localData || [], setter, isLoading, error] as const;
}


// The provider component
export function AppProvider({ children }: { children: ReactNode }) {
    const { isUserLoading } = useUser();
    const db = useFirestore();

    // App Data Collections
    const [employees, setEmployees, isEmployeesLoading] = useFirestoreCollection<Employee>('employees', initialData.employees);
    const [excelFiles, setExcelFiles, isExcelFilesLoading] = useFirestoreCollection<ExcelFile>('excelFiles', initialData.excelFiles);
    const [items, setItems, isItemsLoading] = useFirestoreCollection<Item>('items', initialData.items);
    const [locations, setLocations, isLocationsLoading] = useFirestoreCollection<StorageLocation>('locations', initialData.locations);
    const [expenses, setExpenses, isExpensesLoading] = useFirestoreCollection<Expense>('expenses', initialData.expenses);
    const [expenseReports, setExpenseReports, isExpenseReportsLoading] = useFirestoreCollection<ExpenseReport>('expenseReports', initialData.expenseReports);
    const [overtime, setOvertime, isOvertimeLoading] = useFirestoreCollection<Overtime>('overtime', initialData.overtime);
    const [bonuses, setBonuses, isBonusesLoading] = useFirestoreCollection<Bonus>('bonuses', initialData.bonuses);
    const [withdrawals, setWithdrawals, isWithdrawalsLoading] = useFirestoreCollection<CashWithdrawal>('withdrawals', initialData.withdrawals);
    const [itemCategories, setItemCategories, isItemCategoriesLoading] = useFirestoreCollection<ItemCategory>('itemCategories', initialData.itemCategories);
    const [transfers, setTransfers, isTransfersLoading] = useFirestoreCollection<Transfer>('transfers', initialData.transfers);
    const [transferItems, setTransferItems, isTransferItemsLoading] = useFirestoreCollection<ItemForTransfer>('transferItems', initialData.transferItems);
    const [orderRequests, setOrderRequests, isOrderRequestsLoading] = useFirestoreCollection<OrderRequest>('orderRequests', initialData.orderRequests);
    const [marketingFeedbacks, setMarketingFeedbacks, isMarketingFeedbacksLoading] = useFirestoreCollection<MarketingFeedback>('marketingFeedbacks', initialData.marketingFeedbacks);
    const [evaluationQuestions, setEvaluationQuestions, isEvaluationQuestionsLoading] = useFirestoreCollection<EvaluationQuestion>('evaluationQuestions', initialData.evaluationQuestions);
    const [users, setUsers, isUsersLoading] = useFirestoreCollection<User>('users', initialData.users);
    const [roles, setRoles, isRolesLoading] = useFirestoreCollection<Role>('roles', initialData.roles);
    const [soldItemsLists, setSoldItemsLists, isSoldItemsListsLoading] = useFirestoreCollection<SoldItemsList>('soldItemsLists', initialData.soldItemsLists);
    const [activityLogs, setActivityLogs, isActivityLogsLoading] = useFirestoreCollection<ActivityLog>('activityLogs', initialData.activityLogs);
    
    // Settings Singleton Document
    const settingsDocRef = useMemoFirebase(() => db ? doc(db, 'settings', 'main') : null, [db]);
    const { data: firestoreSettings, isLoading: isSettingsLoading } = useDoc<AppSettings>(settingsDocRef);
    const [settings, setLocalSettings] = useState<AppSettings>(initialSettings);
    
    useEffect(() => {
        if (firestoreSettings) {
            const mergedSettings: AppSettings = {
                ...initialSettings,
                ...firestoreSettings,
                pdfSettings: {
                    ...initialSettings.pdfSettings,
                    ...(firestoreSettings.pdfSettings || {}),
                    report: { ...initialSettings.pdfSettings.report, ...(firestoreSettings.pdfSettings?.report || {}) },
                    invoice: { ...initialSettings.pdfSettings.invoice, ...(firestoreSettings.pdfSettings?.invoice || {}) },
                    card: { ...initialSettings.pdfSettings.card, ...(firestoreSettings.pdfSettings?.card || {}) },
                    datasheet: { ...initialSettings.pdfSettings.datasheet, ...(firestoreSettings.pdfSettings?.datasheet || {}) },
                },
                lightThemeColors: { ...initialSettings.lightThemeColors, ...(firestoreSettings.lightThemeColors || {}) },
                darkThemeColors: { ...initialSettings.darkThemeColors, ...(firestoreSettings.darkThemeColors || {}) },
                salarySettings: { ...initialSettings.salarySettings, ...(firestoreSettings.salarySettings || {}) },
                translations: {
                    en: { ...initialSettings.translations.en, ...(firestoreSettings.translations?.en || {}) },
                    ku: { ...initialSettings.translations.ku, ...(firestoreSettings.translations?.ku || {}) },
                },
                reportHeaderColors: { ...initialSettings.reportHeaderColors, ...(firestoreSettings.reportHeaderColors || {}) },
            };
            setLocalSettings(mergedSettings);
        }
    }, [firestoreSettings]);

    const setSettings = useCallback(async (value: React.SetStateAction<AppSettings>) => {
        const newSettings = value instanceof Function ? value(settings) : value;
        setLocalSettings(newSettings); 
        
        if (settingsDocRef) {
            setDocumentNonBlocking(settingsDocRef, JSON.parse(JSON.stringify(newSettings)), { merge: true });
        }
    }, [settingsDocRef, settings]);
    
    // This effect is a safeguard to prevent user lockout.
    // If no users are found in the database, it seeds the initial users.
    useEffect(() => {
        if (!isUsersLoading && users && users.length === 0 && db) {
            console.log("No users found. Seeding initial users to prevent lockout.");
            const usersCol = collection(db, 'users');
            initialData.users.forEach(user => {
                const userDoc = doc(usersCol, user.id);
                setDocumentNonBlocking(userDoc, user, { merge: false });
            });
            const rolesCol = collection(db, 'roles');
            initialData.roles.forEach(role => {
                const roleDoc = doc(rolesCol, role.id);
                setDocumentNonBlocking(roleDoc, role, { merge: false });
            });
        }
    }, [isUsersLoading, users, db]);

    const isLoading = isUserLoading || isSettingsLoading || isEmployeesLoading || isExcelFilesLoading || isItemsLoading || isLocationsLoading || isExpensesLoading || isExpenseReportsLoading || isOvertimeLoading || isBonusesLoading || isWithdrawalsLoading || isItemCategoriesLoading || isTransfersLoading || isTransferItemsLoading || isOrderRequestsLoading || isMarketingFeedbacksLoading || isEvaluationQuestionsLoading || isUsersLoading || isRolesLoading || isSoldItemsListsLoading || isActivityLogsLoading;

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
        itemCategories, setItemCategories,
        transfers, setTransfers,
        transferItems, setTransferItems,
        orderRequests, setOrderRequests,
        marketingFeedbacks, setMarketingFeedbacks,
        evaluationQuestions, setEvaluationQuestions,
        users, setUsers,
        roles, setRoles,
        soldItemsLists, setSoldItemsLists,
        activityLogs, setActivityLogs,
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
        itemCategories, setItemCategories,
        transfers, setTransfers,
        transferItems, setTransferItems,
        orderRequests, setOrderRequests,
        marketingFeedbacks, setMarketingFeedbacks,
        evaluationQuestions, setEvaluationQuestions,
        users, setUsers,
        roles, setRoles,
        soldItemsLists, setSoldItemsLists,
        activityLogs, setActivityLogs,
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
