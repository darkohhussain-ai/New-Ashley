
import { Employee, ExcelFile, Item, StorageLocation, Expense, ExpenseReport, Overtime, Bonus, CashWithdrawal, SoldItemReceipt, Transfer, ItemForTransfer, MarketingFeedback, EvaluationQuestion, AnswerOption, User, Role, AppSettings, AllPdfSettings, PdfSettings, ThemeColors } from '@/lib/types';
import { adminPermissions, adminAssistantPermissions, viewerPermissions, employeePermissions } from '@/lib/permissions';
import en from '@/locales/en.json';
import ku from '@/locales/ku.json';

const defaultAnswers: [AnswerOption, AnswerOption, AnswerOption] = [
    { label: 'Excellent', value: 3 },
    { label: 'Good', value: 2 },
    { label: 'Needs Improvement', value: 1 },
];

const initialRoles: Role[] = [
    { id: 'role-admin', name: 'Admin', permissions: adminPermissions },
    { id: 'role-admin-assistant', name: 'Admin Assistant', permissions: adminAssistantPermissions },
    { id: 'role-viewer', name: 'Viewer', permissions: viewerPermissions },
    { id: 'role-employee', name: 'Employee', permissions: employeePermissions },
];

const initialEmployees: Employee[] = [
    { id: 'emp-01', name: 'Darko01', employeeId: '01', role: 'Super Manager', createdAt: '2023-01-01T10:00:00Z', password: 'darko0123' },
    { id: 'emp-02', name: 'Shexan Ebrahem', employeeId: '02', role: 'Manager', createdAt: '2023-01-02T10:00:00Z', password: 'shexan123' },
    { id: 'emp-03', name: 'Hunar Jaza', employeeId: '03', role: 'IT', createdAt: '2023-01-03T10:00:00Z', password: 'hunar123' },
    { id: 'emp-04', name: 'Aram Qadr', employeeId: '04', role: 'Manager', createdAt: '2023-01-04T10:00:00Z', password: 'aram123' },
    { id: 'emp-05', name: 'Sarkawt Salah', employeeId: '05', role: 'Employee Supervisor', createdAt: '2023-01-05T10:00:00Z', password: 'sarkawt123' },
    { id: 'emp-06', name: 'Ranjdar Jamal', employeeId: '06', role: 'Employee', createdAt: '2023-01-06T10:00:00Z', password: 'ranjdar123' },
    { id: 'emp-07', name: 'Omer Taha', employeeId: '07', role: 'Employee', createdAt: '2023-01-07T10:00:00Z', password: 'omer123' },
    { id: 'emp-08', name: 'Muhamad Jmal', employeeId: '08', role: 'Employee', createdAt: '2023-01-08T10:00:00Z', password: 'muhamad123' },
    { id: 'emp-09', name: 'Dwha Muhamad', employeeId: '09', role: 'Employee', createdAt: '2023-01-09T10:00:00Z', password: 'dwha123' },
    { id: 'emp-10', name: 'Shewa Zher', employeeId: '10', role: 'Employee', createdAt: '2023-01-10T10:00:00Z', password: 'shewa123' },
    { id: 'emp-11', name: 'Bryar Star', employeeId: '11', role: 'Employee', createdAt: '2023-01-11T10:00:00Z', password: 'bryar123' },
    { id: 'emp-12', name: 'Shad Aram', employeeId: '12', role: 'Employee', createdAt: '2023-01-12T10:00:00Z', password: 'shad123' },
    { id: 'emp-13', name: 'Srusht Namiq', employeeId: '13', role: 'Employee', createdAt: '2023-01-13T10:00:00Z', password: 'srusht123' },
    { id: 'emp-14', name: 'Trifa Abdulla', employeeId: '14', role: 'Employee', createdAt: '2023-01-14T10:00:00Z', password: 'trifa123' },
    { id: 'emp-15', name: 'Ahmad Mhamad', employeeId: '15', role: 'Employee', createdAt: '2023-01-15T10:00:00Z', password: 'ahmad123' },
    { id: 'emp-16', name: 'Shvan Atta', employeeId: '16', role: 'Employee', createdAt: '2023-01-16T10:00:00Z', password: 'shvan123' },
    { id: 'emp-17', name: 'Baxan Rauf', employeeId: '17', role: 'Employee', createdAt: '2023-01-17T10:00:00Z', password: 'baxan123' },
    { id: 'emp-18', name: 'Harem Fayaq', employeeId: '18', role: 'Employee', createdAt: '2023-01-18T10:00:00Z', password: 'harem123' },
    { id: 'emp-19', name: 'Aland Hussen', employeeId: '19', role: 'Employee', createdAt: '2023-01-19T10:00:00Z', password: 'aland123' },
    { id: 'emp-20', name: 'Hawkar Salar', employeeId: '20', role: 'Employee', createdAt: '2023-01-20T10:00:00Z', password: 'hawkar123' },
    { id: 'emp-21', name: 'Aras Abas', employeeId: '21', role: 'Employee', createdAt: '2023-01-21T10:00:00Z', password: 'aras123' },
    { id: 'emp-22', name: 'Darya Jamal', employeeId: '22', role: 'Employee', createdAt: '2023-01-22T10:00:00Z', password: 'darya123' },
    { id: 'emp-23', name: 'Payam Salah', employeeId: '23', role: 'Employee', createdAt: '2023-01-23T10:00:00Z', password: 'payam123' },
    { id: 'emp-24', name: 'Elaf Sabah', employeeId: '24', role: 'Employee', createdAt: '2023-01-24T10:00:00Z', password: 'elaf123' },
    { id: 'emp-25', name: 'Enas', employeeId: '25', role: 'Employee', createdAt: '2023-01-25T10:00:00Z', password: 'enas123' },
    { id: 'emp-26', name: 'Chenar', employeeId: '26', role: 'Marketing', createdAt: '2023-01-26T10:00:00Z', password: 'chenar123' },
    { id: 'emp-27', name: 'Lanya', employeeId: '27', role: 'Marketing', createdAt: '2023-01-27T10:00:00Z', password: 'lanya123' },
];

const initialUsers: User[] = [
    {
        id: `user-emp-01`,
        username: 'Darko01',
        password: 'darko0123',
        roleId: 'role-admin'
    }
];

const defaultReportColors = {
  general: '#22c55e',
  expense: '#3b82f6',
  overtime: '#f97316',
  bonus: '#8b5cf6',
  withdrawal: '#ef4444'
};

const defaultReportSettings: PdfSettings = {
    logo: null,
    customFont: null,
    themeColor: '#22c55e', // Green
    reportColors: defaultReportColors,
    tableTheme: 'striped',
    headerText: '',
    footerText: 'Generated by Ashley DRP System'
};

const defaultInvoiceSettings: PdfSettings = {
    logo: null,
    customFont: null,
    themeColor: '#3b82f6', // Blue
    tableTheme: 'grid',
    headerText: 'Ashley DRP',
    footerText: 'Thank you for your business.'
};

const defaultCardSettings: PdfSettings = {
    logo: null,
    customFont: null,
    themeColor: '#8b5cf6', // Violet
    headerText: 'Employee ID',
    footerText: 'Official Company ID'
};

const defaultPdfSettings: AllPdfSettings = {
    report: defaultReportSettings,
    invoice: defaultInvoiceSettings,
    card: defaultCardSettings,
};

const defaultLightColors: ThemeColors = { background: '0 0% 100%', foreground: '224 71.4% 4.1%', primary: '220 82% 55%', accent: '220 13% 91%', card: '0 0% 100%' };
const defaultDarkColors: ThemeColors = { background: '222.2 84% 4.9%', foreground: '210 40% 98%', primary: '217.2 91.2% 59.8%', accent: '217.2 32.6% 17.5%', card: '222.2 84% 4.9%' };


export const initialSettings: AppSettings = {
    appLogo: "https://firebasestorage.googleapis.com/v0/b/ashley-drp-manager-2-119-42612.appspot.com/o/settings%2FappLogo.png?alt=media&token=42b26284-6379-4148-a003-42eb475f8eb5",
    loginBackground: "https://firebasestorage.googleapis.com/v0/b/ashley-drp-manager-2-119-42612.appspot.com/o/settings%2FloginBackground.png?alt=media&token=0b5553a9-e374-4b53-93e1-6d739f7535b4",
    dashboardBanner: "https://firebasestorage.googleapis.com/v0/b/ashley-drp-manager-2-119-42612.appspot.com/o/settings%2FdashboardBanner.png?alt=media&token=a05f9799-a53f-4e08-9a2d-15a9e5251a3e",
    dashboardBannerHeight: 150,
    customFont: null,
    translations: {
        en: en,
        ku: ku,
    },
    pdfSettings: defaultPdfSettings,
    lightThemeColors: defaultLightColors,
    darkThemeColors: defaultDarkColors,
    salarySettings: {
        overtimeRate: 5000,
        bonusRate: 5000,
    },
};


export const initialData: {
    employees: Employee[],
    excelFiles: ExcelFile[],
    items: Item[],
    locations: StorageLocation[],
    expenses: Expense[],
    expenseReports: ExpenseReport[],
    overtime: Overtime[],
    bonuses: Bonus[],
    withdrawals: CashWithdrawal[],
    receipts: SoldItemReceipt[],
    transfers: Transfer[],
    transferItems: ItemForTransfer[],
    marketingFeedbacks: MarketingFeedback[],
    evaluationQuestions: EvaluationQuestion[],
    users: User[],
    roles: Role[],
} = {
    employees: initialEmployees,
    excelFiles: [],
    items: [],
    locations: [],
    expenses: [],
    expenseReports: [],
    overtime: [],
    bonuses: [],
    withdrawals: [],
    receipts: [],
    transfers: [],
    transferItems: [],
    marketingFeedbacks: [],
    evaluationQuestions: [
        { id: 'q1', text: 'Commitment to work', answers: defaultAnswers },
        { id: 'q2', text: 'Adherence to working hours', answers: defaultAnswers },
        { id: 'q3', text: 'Acceptance of responsibility', answers: defaultAnswers },
        { id: 'q4', text: 'Initiative and offering suggestions', answers: defaultAnswers },
        { id: 'q5', text: 'Relationship with colleagues', answers: defaultAnswers },
        { id: 'q6', text: 'Appearance and personal hygiene', answers: defaultAnswers },
        { id: 'q7', text: 'Speed of completion', answers: defaultAnswers },
        { id: 'q8', text: 'Work accuracy', answers: defaultAnswers },
        { id: 'q9', text: 'Learning speed', answers: defaultAnswers },
        { id: 'q10', text: 'Problem-solving ability', answers: defaultAnswers },
        { id: 'q11', text: 'Commitment to management directives', answers: defaultAnswers },
        { id: 'q12', text: 'Ability to work under pressure', answers: defaultAnswers },
        { id: 'q13', text: 'Trustworthiness', answers: defaultAnswers },
        { id: 'q14', text: 'Customer service', answers: defaultAnswers },
        { id: 'q15', text: 'Teamwork spirit', answers: defaultAnswers },
        { id: 'q16', text: 'Continuous development', answers: defaultAnswers },
        { id: 'q17', text: 'Marketing Skills', answers: defaultAnswers },
        { id: 'q18', text: 'Sales Performance', answers: defaultAnswers },
    ],
    users: initialUsers,
    roles: initialRoles,
};
