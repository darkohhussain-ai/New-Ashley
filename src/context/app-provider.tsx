
'use client';

import React, { createContext, useContext, ReactNode, useEffect } from 'react';
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
    EvaluationQuestion
} from '@/lib/types';
import { initialData as initialDataObject } from './initial-data';

// Define the initial data as a constant outside the component to ensure it's a stable reference.
const initialData = initialDataObject;

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
}

const AppContext = createContext<AppState | undefined>(undefined);

// Function to fetch the font and convert it to a base64 data URI
async function fetchAndStoreFont(url: string, storageKey: string) {
    // Check if the font is already in localStorage to avoid re-fetching
    const existingFont = localStorage.getItem(storageKey);
    if (existingFont) {
        return;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch font: ${response.statusText}`);
        }
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64data = reader.result;
            localStorage.setItem(storageKey, base64data as string);
            console.log("Custom font fetched and stored.");
        };
        reader.readAsDataURL(blob);
    } catch (error) {
        console.error("Could not fetch or store the custom font:", error);
    }
}


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
    const [marketingFeedbacks, setMarketingFeedbacks] = useLocalStorage<MarketingFeedback[]>('marketing-feedbacks', initialData.marketingFeedbacks);
    const [evaluationQuestions, setEvaluationQuestions] = useLocalStorage<EvaluationQuestion[]>('evaluation_questions', initialData.evaluationQuestions);

    useEffect(() => {
        // The URL for the Speda font
        const fontUrl = 'https://www.kurdfonts.com/dl/tmp/2911124/Speda.ttf';
        const storageKey = 'custom-font-base64';
        
        // Fetch the font when the app loads
        fetchAndStoreFont(fontUrl, storageKey);
    }, []);

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
