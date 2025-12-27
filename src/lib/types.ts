
export type Employee = {
  id: string;
  name: string;
  jobTitle?: string;
  employmentStartDate?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  notes?: string;
};

export type ExcelFile = {
  id: string;
  storekeeperId: string;
  storageName: string;
  categoryName: string;
  date: string;
  source: string;
  type: 'new' | 'imported';
};

export type Item = {
  id: string;
  fileId: string;
  model: string;
  quantity: number;
  notes?: string;
  storageStatus?: 'Correct' | 'Less' | 'More' | '';
  modelCondition?: 'Wrapped' | 'Damaged' | '';
  quantityPerCondition?: number;
  locationId?: string;
  updateStatus?: 'NEW' | 'UPDATED' | 'DELETED' | '';
};

export type StorageLocation = {
  id: string;
  name: string;
  warehouseType: 'Ashley' | 'Huana';
};

export type Expense = {
  id: string;
  employeeId: string;
  amount: number;
  date: string;
  notes?: string;
};

export type Overtime = {
  id: string;
  employeeId: string;
  date: string;
  hours: number;
  rate: number;
  totalAmount: number;
  notes?: string;
};

export type Bonus = {
  id: string;
  employeeId: string;
  amount: number;
  date: string;
  notes?: string;
};

export type CashWithdrawal = {
  id: string;
  employeeId: string;
  amount: number;
  date: string;
  notes?: string;
};

export type SoldItemReceipt = {
    id: string;
    receiptNumber: string;
    receiptDate?: string;
    customerName?: string;
    itemCategories: string[];
}

export type Transfer = {
  id: string;
  transferDate: string;
  cargoName: string;
  destinationCity: string;
  driverName: string;
  warehouseManagerName: string;
  itemIds: string[];
};

export type ItemForTransfer = {
  id: string;
  model: string;
  quantity: number;
  destination: string;
  notes?: string;
  transferId?: string | null;
  createdAt: string;
};

export type NewItem = Omit<Item, 'id' | 'fileId' | 'storageStatus' | 'modelCondition' | 'quantityPerCondition' | 'updateStatus'> & {
  tempId: number;
  locationId: string;
};

export type EvaluationResponse = {
    id: string;
    employeeId: string;
    totalScore: number;
    date: string;
    responses: { questionId: string; answer: number }[];
};
