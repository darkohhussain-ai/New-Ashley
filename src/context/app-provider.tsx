
'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
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
    EvaluationResponse
} from '@/lib/types';
import { initialData } from './initial-data';

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
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const memoizedInitialData = useMemo(() => initialData, []);

    const [employees, setEmployees] = useLocalStorage<Employee[]>('employees', memoizedInitialData.employees);
    const [excelFiles, setExcelFiles] = useLocalStorage<ExcelFile[]>('excel_files', memoizedInitialData.excelFiles);
    const [items, setItems] = useLocalStorage<Item[]>('items', memoizedInitialData.items);
    const [locations, setLocations] = useLocalStorage<StorageLocation[]>('storage_locations', memoizedInitialData.locations);
    const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', memoizedInitialData.expenses);
    const [overtime, setOvertime] = useLocalStorage<Overtime[]>('overtime', memoizedInitialData.overtime);
    const [bonuses, setBonuses] = useLocalStorage<Bonus[]>('bonuses', []);
    const [withdrawals, setWithdrawals] = useLocalStorage<CashWithdrawal[]>('cash_withdrawals', []);
    const [receipts, setReceipts] = useLocalStorage<SoldItemReceipt[]>('sold_item_receipts', []);
    const [transfers, setTransfers] = useLocalStorage<Transfer[]>('transfers', []);
    const [transferItems, setTransferItems] = useLocalStorage<ItemForTransfer[]>('transfer_items', []);
    const [evaluations, setEvaluations] = useLocalStorage<EvaluationResponse[]>('marketing-evaluations', []);

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
