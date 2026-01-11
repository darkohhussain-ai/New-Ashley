
'use client';

import React, { createContext, useContext, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
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
import { initialData as initialDataObject } from './initial-data';

// The structure of our application state
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

// Generic hook for managing a Firestore collection
function useFirestoreCollectionManager<T extends { id: string }>(
    collectionName: string, 
    initialData: T[]
): [T[], (data: T[]) => void] {
    const db = useFirestore();
    const query = useMemo(() => collection(db, collectionName), [db, collectionName]);
    const { data: firestoreData, loading } = useCollection<T>(query);
    
    const [localData, setLocalData] = React.useState<T[]>(initialData);

    useEffect(() => {
        if (!loading && firestoreData) {
            setLocalData(firestoreData);
        }
    }, [firestoreData, loading]);

    const setData = useCallback((newData: T[]) => {
        const db = getFirestore();
        const oldDataMap = new Map(localData.map(item => [item.id, item]));
        const newDataMap = new Map(newData.map(item => [item.id, item]));

        // Add or update documents
        newData.forEach(item => {
            const docRef = doc(db, collectionName, item.id);
            const oldItem = oldDataMap.get(item.id);
            if (!oldItem || JSON.stringify(oldItem) !== JSON.stringify(item)) {
                setDoc(docRef, item, { merge: true });
            }
        });

        // Delete documents
        localData.forEach(item => {
            if (!newDataMap.has(item.id)) {
                const docRef = doc(db, collectionName, item.id);
                deleteDoc(docRef);
            }
        });

        setLocalData(newData);
    }, [collectionName, localData]);

    return [localData, setData];
}

export function AppProvider({ children }: { children: ReactNode }) {
    const [employees, setEmployees] = useFirestoreCollectionManager<Employee>('employees', initialDataObject.employees);
    const [excelFiles, setExcelFiles] = useFirestoreCollectionManager<ExcelFile>('excel_files', initialDataObject.excelFiles);
    const [items, setItems] = useFirestoreCollectionManager<Item>('items', initialDataObject.items);
    const [locations, setLocations] = useFirestoreCollectionManager<StorageLocation>('storage_locations', initialDataObject.locations);
    const [expenses, setExpenses] = useFirestoreCollectionManager<Expense>('expenses', initialDataObject.expenses);
    const [expenseReports, setExpenseReports] = useFirestoreCollectionManager<ExpenseReport>('expense_reports', initialDataObject.expenseReports);
    const [overtime, setOvertime] = useFirestoreCollectionManager<Overtime>('overtime', initialDataObject.overtime);
    const [bonuses, setBonuses] = useFirestoreCollectionManager<Bonus>('bonuses', initialDataObject.bonuses);
    const [withdrawals, setWithdrawals] = useFirestoreCollectionManager<CashWithdrawal>('cash_withdrawals', initialDataObject.withdrawals);
    const [receipts, setReceipts] = useFirestoreCollectionManager<SoldItemReceipt>('sold_item_receipts', initialDataObject.receipts);
    const [transfers, setTransfers] = useFirestoreCollectionManager<Transfer>('transfers', initialDataObject.transfers);
    const [transferItems, setTransferItems] = useFirestoreCollectionManager<ItemForTransfer>('transfer_items', initialDataObject.transferItems);
    const [marketingFeedbacks, setMarketingFeedbacks] = useFirestoreCollectionManager<MarketingFeedback>('marketing_feedbacks', initialDataObject.marketingFeedbacks);
    const [evaluationQuestions, setEvaluationQuestions] = useFirestoreCollectionManager<EvaluationQuestion>('evaluation_questions', initialDataObject.evaluationQuestions);
    const [users, setUsers] = useFirestoreCollectionManager<User>('users', initialDataObject.users);
    const [roles, setRoles] = useFirestoreCollectionManager<Role>('roles', initialDataObject.roles);
    
    const value: AppState = {
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
    };

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
