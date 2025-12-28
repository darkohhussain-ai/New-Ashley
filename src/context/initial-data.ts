
import { Employee, ExcelFile, Item, StorageLocation, Expense, Overtime, Bonus, CashWithdrawal, SoldItemReceipt, Transfer, ItemForTransfer, EvaluationResponse, RealityCheck } from '@/lib/types';

export const initialData: {
    employees: Employee[],
    excelFiles: ExcelFile[],
    items: Item[],
    locations: StorageLocation[],
    expenses: Expense[],
    overtime: Overtime[],
    bonuses: Bonus[],
    withdrawals: CashWithdrawal[],
    receipts: SoldItemReceipt[],
    transfers: Transfer[],
    transferItems: ItemForTransfer[],
    evaluations: EvaluationResponse[],
    realityChecks: RealityCheck[],
} = {
    employees: [],
    excelFiles: [],
    items: [],
    locations: [],
    expenses: [],
    overtime: [],
    bonuses: [],
    withdrawals: [],
    receipts: [],
    transfers: [],
    transferItems: [],
    evaluations: [],
    realityChecks: [],
};
