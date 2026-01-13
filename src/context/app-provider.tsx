
'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';
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
import { initialData } from './initial-data';

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

// The provider component
export function AppProvider({ children }: { children: ReactNode }) {
    const [employees, setEmployees] = useLocalStorage<Employee[]>('employees', initialData.employees);
    const [excelFiles, setExcelFiles] = useLocalStorage<ExcelFile[]>('excel_files', initialData.excelFiles);
    const [items, setItems] = useLocalStorage<Item[]>('items', initialData.items);
    const [locations, setLocations] = useLocalStorage<StorageLocation[]>('storage_locations', initialData.locations);
    const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', initialData.expenses);
    const [expenseReports, setExpenseReports] = useLocalStorage<ExpenseReport[]>('expense_reports', initialData.expenseReports);
    const [overtime, setOvertime] = useLocalStorage<Overtime[]>('overtime', initialData.overtime);
    const [bonuses, setBonuses] = useLocalStorage<Bonus[]>('bonuses', initialData.bonuses);
    const [withdrawals, setWithdrawals] = useLocalStorage<CashWithdrawal[]>('cash_withdrawals', initialData.withdrawals);
    const [receipts, setReceipts] = useLocalStorage<SoldItemReceipt[]>('sold_item_receipts', initialData.receipts);
    const [transfers, setTransfers] = useLocalStorage<Transfer[]>('transfers', initialData.transfers);
    const [transferItems, setTransferItems] = useLocalStorage<ItemForTransfer[]>('transfer_items', initialData.transferItems);
    const [marketingFeedbacks, setMarketingFeedbacks] = useLocalStorage<MarketingFeedback[]>('marketing_feedbacks', initialData.marketingFeedbacks);
    const [evaluationQuestions, setEvaluationQuestions] = useLocalStorage<EvaluationQuestion[]>('evaluation_questions', initialData.evaluationQuestions);
    const [users, setUsers] = useLocalStorage<User[]>('users', initialData.users);
    const [roles, setRoles] = useLocalStorage<Role[]>('roles', initialData.roles);
    
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
