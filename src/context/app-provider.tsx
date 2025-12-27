
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';
import { 
    Employee, 
    ExcelFile, 
    Item, 
    StorageLocation, 
    Expense, 
    Overtime,
    Bonus,
    CashWithdrawal,
    SoldItemReceipt,
    Transfer,
    ItemForTransfer,
    EvaluationResponse,
    RealityCheck
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
    evaluations: EvaluationResponse[];
    setEvaluations: (evaluations: EvaluationResponse[]) => void;
    realityChecks: RealityCheck[];
    setRealityChecks: (checks: RealityCheck[]) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {

    const [employees, setEmployees] = useLocalStorage<Employee[]>('employees', initialData.employees);
    const [excelFiles, setExcelFiles] = useLocalStorage<ExcelFile[]>('excel_files', initialData.excelFiles);
    const [items, setItems] = useLocalStorage<Item[]>('items', initialData.items);
    const [locations, setLocations] = useLocalStorage<StorageLocation[]>('storage_locations', initialData.locations);
    const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', initialData.expenses);
    const [overtime, setOvertime] = useLocalStorage<Overtime[]>('overtime', initialData.overtime);
    const [bonuses, setBonuses] = useLocalStorage<Bonus[]>('bonuses', initialData.bonuses);
    const [withdrawals, setWithdrawals] = useLocalStorage<CashWithdrawal[]>('cash_withdrawals', initialData.withdrawals);
    const [receipts, setReceipts] = useLocalStorage<SoldItemReceipt[]>('sold_item_receipts', initialData.receipts);
    const [transfers, setTransfers] = useLocalStorage<Transfer[]>('transfers', initialData.transfers);
    const [transferItems, setTransferItems] = useLocalStorage<ItemForTransfer[]>('transfer_items', initialData.transferItems);
    const [evaluations, setEvaluations] = useLocalStorage<EvaluationResponse[]>('marketing-evaluations', initialData.evaluations);
    const [realityChecks, setRealityChecks] = useLocalStorage<RealityCheck[]>('reality_checks', initialData.realityChecks);

    const value = {
        employees, setEmployees,
        excelFiles, setExcelFiles,
        items, setItems,
        locations, setLocations,
        expenses, setExpenses,
        overtime, setOvertime,
        bonuses, setBonuses,
        withdrawals, setWithdrawals,
        receipts, setReceipts,
        transfers, setTransfers,
        transferItems, setTransferItems,
        evaluations, setEvaluations,
        realityChecks, setRealityChecks,
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
