
import { Employee, ExcelFile, Item, StorageLocation, Expense, ExpenseReport, Overtime, Bonus, CashWithdrawal, SoldItemReceipt, Transfer, ItemForTransfer, MarketingFeedback, EvaluationQuestion, AnswerOption, User, Role, AppSettings, AllPdfSettings, PdfSettings, ThemeColors, ItemCategory } from '@/lib/types';
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

const parseAndFormatDate = (dateString: string): string => {
    const parts = dateString.split('/');
    if (parts.length !== 3) return new Date().toISOString();
    const [day, month, year] = parts.map(p => parseInt(p, 10));
    // Subtract 1 from month because Date months are 0-indexed
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toISOString();
};

const initialEmployees: Employee[] = [
    { id: 'emp-01', name: 'Darko097', employeeId: '01', role: 'Super Manager', createdAt: '2023-01-01T10:00:00Z', password: 'darko0123', isActive: true },
    {
        id: 'emp-101',
        name: 'کامه ران عمر روؤف',
        kurdishName: 'کامه ران عمر روؤف',
        employeeId: '101',
        role: 'Employee',
        employmentStartDate: parseAndFormatDate('15/9/2025'),
        createdAt: new Date().toISOString(),
        isActive: true,
    },
    {
        id: 'emp-102',
        name: 'دانه ر محمد باسام',
        kurdishName: 'دانه ر محمد باسام',
        employeeId: '102',
        role: 'Employee',
        employmentStartDate: parseAndFormatDate('20/5/2024'),
        createdAt: new Date().toISOString(),
        isActive: true,
    },
    {
        id: 'emp-103',
        name: 'داركو حيدر حسين',
        kurdishName: 'داركو حيدر حسين',
        employeeId: '103',
        role: 'Employee',
        employmentStartDate: parseAndFormatDate('1/5/2025'),
        createdAt: new Date().toISOString(),
        isActive: true,
    },
    {
        id: 'emp-104',
        name: 'را بهر محمد محمود',
        kurdishName: 'را بهر محمد محمود',
        employeeId: '104',
        role: 'Employee',
        employmentStartDate: parseAndFormatDate('20/4/2024'),
        createdAt: new Date().toISOString(),
        isActive: true,
    },
    {
        id: 'emp-105',
        name: 'راژان سالح فه تاح',
        kurdishName: 'راژان سالح فه تاح',
        employeeId: '105',
        role: 'Employee',
        employmentStartDate: parseAndFormatDate('13/7/2024'),
        createdAt: new Date().toISOString(),
        isActive: true,
    },
    {
        id: 'emp-106',
        name: 'سه روه ت قادر محمد',
        kurdishName: 'سه روه ت قادر محمد',
        employeeId: '106',
        role: 'Employee',
        employmentStartDate: parseAndFormatDate('16/10/2024'),
        createdAt: new Date().toISOString(),
        isActive: true,
    },
    {
        id: 'emp-107',
        name: 'گوشار سه ردار احمد',
        kurdishName: 'گوشار سه ردار احمد',
        employeeId: '107',
        role: 'Employee',
        employmentStartDate: parseAndFormatDate('1/2/2025'),
        createdAt: new Date().toISOString(),
        isActive: true,
    },
    {
        id: 'emp-108',
        name: 'توانا بورهان',
        kurdishName: 'توانا بورهان',
        employeeId: '108',
        role: 'Employee',
        employmentStartDate: parseAndFormatDate('3/10/2024'),
        createdAt: new Date().toISOString(),
        isActive: true,
    },
    {
        id: 'emp-109',
        name: 'عيماد سه باح نوری',
        kurdishName: 'عيماد سه باح نوری',
        employeeId: '109',
        role: 'Employee',
        employmentStartDate: parseAndFormatDate('15/11/2023'),
        createdAt: new Date().toISOString(),
        isActive: true,
    },
    {
        id: 'emp-110',
        name: 'ريبين سه باح نوری',
        kurdishName: 'ريبين سه باح نوری',
        employeeId: '110',
        role: 'Employee',
        employmentStartDate: parseAndFormatDate('22/6/2024'),
        createdAt: new Date().toISOString(),
        isActive: true,
    },
    {
        id: 'emp-111',
        name: 'ره وه ند نجات محمد حسن',
        kurdishName: 'ره وه ند نجات محمد حسن',
        employeeId: '111',
        role: 'Employee',
        employmentStartDate: parseAndFormatDate('10/5/2025'),
        createdAt: new Date().toISOString(),
        isActive: true,
    },
    {
        id: 'emp-112',
        name: 'سه هه ند مه ریوان حمه سعيد',
        kurdishName: 'سه هه ند مه ریوان حمه سعيد',
        employeeId: '112',
        role: 'Employee',
        employmentStartDate: parseAndFormatDate('1/1/2024'),
        createdAt: new Date().toISOString(),
        isActive: true,
    },
    {
        id: 'emp-113',
        name: 'شادومان یادگار رحیم',
        kurdishName: 'شادومان یادگار رحیم',
        employeeId: '113',
        role: 'Employee',
        employmentStartDate: parseAndFormatDate('30/9/2024'),
        createdAt: new Date().toISOString(),
        isActive: true,
    },
    {
        id: 'emp-114',
        name: 'محمد نه وزاد',
        kurdishName: 'محمد نه وزاد',
        employeeId: '114',
        role: 'Employee',
        employmentStartDate: parseAndFormatDate('13/5/2025'),
        createdAt: new Date().toISOString(),
        isActive: true,
    },
    {
        id: 'emp-115',
        name: 'هه قال حبيب حمه ره زا',
        kurdishName: 'هه قال حبيب حمه ره زا',
        employeeId: '115',
        role: 'Employee',
        employmentStartDate: parseAndFormatDate('13/5/2025'),
        createdAt: new Date().toISOString(),
        isActive: true,
    },
    {
        id: 'emp-116',
        name: 'به هره نگ رزگار عزیز',
        kurdishName: 'به هره نگ رزگار عزیز',
        employeeId: '116',
        role: 'Employee',
        employmentStartDate: parseAndFormatDate('27/12/2025'),
        createdAt: new Date().toISOString(),
        isActive: true,
    },
    {
        id: 'emp-117',
        name: 'کارزان دارا به کر',
        kurdishName: 'کارزان دارا به کر',
        employeeId: '117',
        role: 'Employee',
        employmentStartDate: parseAndFormatDate('13/5/2025'),
        createdAt: new Date().toISOString(),
        isActive: true,
    },
    {
        id: 'emp-118',
        name: 'Kalar',
        kurdishName: 'کلار',
        employeeId: '118',
        role: 'Super Manager',
        employmentStartDate: parseAndFormatDate('1/1/2024'),
        createdAt: new Date().toISOString(),
        isActive: true,
        password: '123'
    }
];

const initialUsers: User[] = [
    {
        id: `user-emp-01`,
        username: 'Darko097',
        password: 'darko0123',
        roleId: 'role-admin'
    },
    {
        id: 'user-emp-118',
        username: 'Kalar',
        password: '123',
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

const defaultLightColors: ThemeColors = { background: '0 0% 100%', foreground: '224 71.4% 4.1%', primary: '220 82% 55%', accent: '220 13% 91%', card: '0 0% 100%', tabActiveBackground: '0 0% 100%', tabActiveForeground: '224 71.4% 4.1%' };
const defaultDarkColors: ThemeColors = { background: '222.2 84% 4.9%', foreground: '210 40% 98%', primary: '217.2 91.2% 59.8%', accent: '217.2 32.6% 17.5%', card: '222.2 84% 4.9%', tabActiveBackground: '222.2 84% 4.9%', tabActiveForeground: '210 40% 98%' };


export const initialSettings: AppSettings = {
    appLogo: null,
    mainBackground: null,
    loginBackground: null,
    dashboardBanner: null,
    dashboardBannerHeight: 150,
    newsTickerText: 'Welcome to the Ashley DRP Manager! This is a scrolling news update.',
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
    theme: 'light',
    language: 'en',
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
    itemCategories: ItemCategory[],
    transfers: Transfer[],
    itemForTransfer: ItemForTransfer[],
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
    itemCategories: [
        { id: 'cat-1', name: 'Sofas' },
        { id: 'cat-2', name: 'Tables' },
        { id: 'cat-3', name: 'Chairs' },
        { id: 'cat-4', name: 'Beds' },
    ],
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
