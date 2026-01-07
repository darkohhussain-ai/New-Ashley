
import { Employee, ExcelFile, Item, StorageLocation, Expense, ExpenseReport, Overtime, Bonus, CashWithdrawal, SoldItemReceipt, Transfer, ItemForTransfer, MarketingFeedback, EvaluationQuestion, AnswerOption, User, Role } from '@/lib/types';
import { adminPermissions, viewerPermissions, financeManagerPermissions, inventoryManagerPermissions, hrManagerPermissions } from '@/lib/permissions';

const defaultAnswers: [AnswerOption, AnswerOption, AnswerOption] = [
    { label: 'Excellent', value: 3 },
    { label: 'Good', value: 2 },
    { label: 'Needs Improvement', value: 1 },
];

const initialRoles: Role[] = [
    { id: 'role-admin', name: 'Admin', permissions: adminPermissions },
    { id: 'role-viewer', name: 'Viewer', permissions: viewerPermissions },
    { id: 'role-finance', name: 'Finance Manager', permissions: financeManagerPermissions },
    { id: 'role-inventory', name: 'Inventory Manager', permissions: inventoryManagerPermissions },
    { id: 'role-hr', name: 'HR Manager', permissions: hrManagerPermissions },
];

const initialEmployees: Employee[] = [
    { id: 'emp-01', name: 'Rasty Haidar', employeeId: '01', role: 'Super Manager', createdAt: '2023-01-01T10:00:00Z' },
    { id: 'emp-02', name: 'Shexan Ebrahem', employeeId: '02', role: 'Manager', createdAt: '2023-01-02T10:00:00Z' },
    { id: 'emp-03', name: 'Hunar Jaza', employeeId: '03', role: 'IT', createdAt: '2023-01-03T10:00:00Z' },
    { id: 'emp-04', name: 'Aram Qadr', employeeId: '04', role: 'Manager', createdAt: '2023-01-04T10:00:00Z' },
    { id: 'emp-05', name: 'Sarkawt Salah', employeeId: '05', role: 'Employee Supervisor', createdAt: '2023-01-05T10:00:00Z' },
    { id: 'emp-06', name: 'Ranjdar Jamal', employeeId: '06', role: 'Employee', createdAt: '2023-01-06T10:00:00Z' },
    { id: 'emp-07', name: 'Omer Taha', employeeId: '07', role: 'Employee', createdAt: '2023-01-07T10:00:00Z' },
    { id: 'emp-08', name: 'Muhamad Jmal', employeeId: '08', role: 'Employee', createdAt: '2023-01-08T10:00:00Z' },
    { id: 'emp-09', name: 'Dwha Muhamad', employeeId: '09', role: 'Employee', createdAt: '2023-01-09T10:00:00Z' },
    { id: 'emp-10', name: 'Shewa Zher', employeeId: '10', role: 'Employee', createdAt: '2023-01-10T10:00:00Z' },
    { id: 'emp-11', name: 'Bryar Star', employeeId: '11', role: 'Employee', createdAt: '2023-01-11T10:00:00Z' },
    { id: 'emp-12', name: 'Shad Aram', employeeId: '12', role: 'Employee', createdAt: '2023-01-12T10:00:00Z' },
    { id: 'emp-13', name: 'Srusht Namiq', employeeId: '13', role: 'Employee', createdAt: '2023-01-13T10:00:00Z' },
    { id: 'emp-14', name: 'Trifa Abdulla', employeeId: '14', role: 'Employee', createdAt: '2023-01-14T10:00:00Z' },
    { id: 'emp-15', name: 'Ahmad Mhamad', employeeId: '15', role: 'Employee', createdAt: '2023-01-15T10:00:00Z' },
    { id: 'emp-16', name: 'Shvan Atta', employeeId: '16', role: 'Employee', createdAt: '2023-01-16T10:00:00Z' },
    { id: 'emp-17', name: 'Baxan Rauf', employeeId: '17', role: 'Employee', createdAt: '2023-01-17T10:00:00Z' },
    { id: 'emp-18', name: 'Harem Fayaq', employeeId: '18', role: 'Employee', createdAt: '2023-01-18T10:00:00Z' },
    { id: 'emp-19', name: 'Aland Hussen', employeeId: '19', role: 'Employee', createdAt: '2023-01-19T10:00:00Z' },
    { id: 'emp-20', name: 'Hawkar Salar', employeeId: '20', role: 'Employee', createdAt: '2023-01-20T10:00:00Z' },
    { id: 'emp-21', name: 'Aras Abas', employeeId: '21', role: 'Employee', createdAt: '2023-01-21T10:00:00Z' },
    { id: 'emp-22', name: 'Darya Jamal', employeeId: '22', role: 'Employee', createdAt: '2023-01-22T10:00:00Z' },
    { id: 'emp-23', name: 'Payam Salah', employeeId: '23', role: 'Employee', createdAt: '2023-01-23T10:00:00Z' },
    { id: 'emp-24', name: 'Elaf Sabah', employeeId: '24', role: 'Employee', createdAt: '2023-01-24T10:00:00Z' },
    { id: 'emp-25', name: 'Enas', employeeId: '25', role: 'Employee', createdAt: '2023-01-25T10:00:00Z' },
    { id: 'emp-26', name: 'Chenar', employeeId: '26', role: 'Marketing', createdAt: '2023-01-26T10:00:00Z' },
    { id: 'emp-27', name: 'Lanya', employeeId: '27', role: 'Marketing', createdAt: '2023-01-27T10:00:00Z' },
];

const generatedUsers: User[] = initialEmployees.map(employee => {
    const firstName = employee.name.split(' ')[0].toLowerCase();
    return {
        id: `user-${employee.id}`,
        username: employee.name,
        password: `${firstName}123`,
        roleId: 'role-viewer', // Default role for all employees
    };
});

const initialUsers: User[] = [
    { id: 'user-admin-1', username: 'Darko Haidar', password: 'Darko123', roleId: 'role-admin' },
    ...generatedUsers
];

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
