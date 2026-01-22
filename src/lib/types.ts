
export type Translations = Record<string, string>;

export type Language = 'en' | 'ku';

export type User = {
    id: string;
    username: string;
    password?: string; // Should not be stored long-term, used for creation/reset
    roleId: string;
};

export type Role = {
    id: string;
    name: string;
    permissions: string[];
};

export type Permission = {
    id: string;
    description: string;
};

export type Employee = {
  id: string;
  name: string;
  kurdishName?: string;
  employeeId?: string; // New field for unique ID
  role?: 'Super Manager' | 'Manager' | 'IT' | 'Employee Supervisor' | 'Transport Supervisor' | 'Employee' | 'Marketing'; // New field for role
  employmentStartDate?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  notes?: string;
  createdAt?: string;
  password?: string; // Added to store password for login purposes
  isActive?: boolean;
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
  id:string;
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
  expenseReportId: string; // Link to the parent report
  expenseType: string;
  expenseSubType?: string;
};

export type ExpenseReport = {
  id: string;
  reportName: string;
  reportDate: string;
  totalAmount: number;
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
  date: string;
  loadCount: number;
  rate: number;
  totalAmount: number;
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

export type ItemCategory = {
    id: string;
    name: string;
};

export type Transfer = {
  id: string;
  transferDate: string;
  cargoName: string;
  destinationCity: string;
  driverName: string;
  warehouseManagerName: string;
  itemIds: string[];
  invoiceNumber: number;
};

export type ItemForTransfer = {
  id: string;
  model: string;
  quantity: number;
  destination: string;
  notes?: string;
  transferId?: string | null;
  createdAt: string;
  requestDate?: string;
  invoiceNo?: string;
  storage?: string;
};

export type NewItem = Omit<Item, 'id' | 'fileId' | 'storageStatus' | 'modelCondition' | 'quantityPerCondition' | 'updateStatus'> & {
  tempId: number;
  locationId: string;
};

export type MarketingFeedback = {
    id: string;
    employeeId: string;
    totalScore: number;
    date: string;
    responses: { questionId: string; answer: number }[];
};

export type AnswerOption = {
    label: string;
    value: number;
};

export type EvaluationQuestion = {
    id: string;
    text: string;
    answers: [AnswerOption, AnswerOption, AnswerOption];
};

export type ReportColors = {
  general: string;
  expense: string;
  overtime: string;
  bonus: string;
  withdrawal: string;
}

export type BranchColors = {
  Erbil?: string;
  Baghdad?: string;
  Dohuk?: string;
  Diwan?: string;
}

export type PdfSettings = {
    logo?: string | null;
    font?: string;
    customFont?: string | null;
    themeColor?: string;
    secondaryColor?: string;
    reportColors?: ReportColors;
    branchColors?: BranchColors;
    tableTheme?: 'striped' | 'grid';
    headerText?: string;
    footerText?: string;
    titleTemplate?: string;
    loginCardColor?: string;
    hideLoginBg?: boolean;
    scale?: number;
    width?: number;
    fontSize?: number;
}

export type AllPdfSettings = {
    report: PdfSettings;
    invoice: PdfSettings;
    card: PdfSettings;
};

export type ThemeColors = {
  background: string;
  foreground: string;
  primary: string;
  accent: string;
  card: string;
  tabActiveBackground: string;
  tabActiveForeground: string;
  tableRowPrimary: string;
  tableRowSecondary: string;
  huanaHighlight: string;
  locationOccupiedBorder: string;
  locationOccupiedBg: string;
}

export type SalarySettings = {
    overtimeRate: number;
    bonusRate: number;
}

export type AppSettings = {
  appLogo: string | null;
  mainBackground: string | null;
  loginBackground: string | null;
  dashboardBanner: string | null;
  dashboardBannerHeight: number;
  newsTickerText: string;
  customFont: string | null;
  translations: {
      en: Translations;
      ku: Translations;
  };
  pdfSettings: AllPdfSettings;
  lightThemeColors: ThemeColors;
  darkThemeColors: ThemeColors;
  salarySettings: SalarySettings;
  theme: 'light' | 'dark';
  language: Language;
};
