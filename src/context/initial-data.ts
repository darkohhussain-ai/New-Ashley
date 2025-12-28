
import { Employee, ExcelFile, Item, StorageLocation, Expense, Overtime, Bonus, CashWithdrawal, SoldItemReceipt, Transfer, ItemForTransfer, MarketingFeedback, RealityCheck } from '@/lib/types';

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
    marketingFeedbacks: MarketingFeedback[],
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
    marketingFeedbacks: [],
    realityChecks: [],
};
