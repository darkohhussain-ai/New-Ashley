
'use client';
import { Employee, AppSettings } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { useTranslation } from '@/hooks/use-translation';
import { ReportWrapper } from '@/components/reports/ReportWrapper';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, Calendar as CalendarIcon, Briefcase, Key } from 'lucide-react';

const EmployeeDetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | null | undefined }) => {
    if (!value) return null;
    return (
        <div className="flex items-start gap-2 text-sm">
            <Icon className="w-4 h-4 text-gray-500 mt-1" />
            <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="font-medium">{value}</p>
            </div>
        </div>
    );
};


export const EmployeeDashboardPrintView = ({ employees, settings }: { employees: Employee[], settings: AppSettings }) => {
    const { t, language } = useTranslation();

    return (
        <ReportWrapper title={t('employees')}>
            <div className="space-y-4">
                {employees.map(employee => {
                     const displayName = language === 'ku' && employee.kurdishName ? employee.kurdishName : employee.name;
                     const safeEmploymentStartDate = employee.employmentStartDate && !isNaN(parseISO(employee.employmentStartDate).getTime()) ? parseISO(employee.employmentStartDate) : null;
                     const safeDob = employee.dateOfBirth && !isNaN(parseISO(employee.dateOfBirth).getTime()) ? parseISO(employee.dateOfBirth) : null;

                    return (
                        <div key={employee.id} className="p-4 border rounded-lg break-inside-avoid bg-gray-50/50">
                            <div className="flex items-start gap-4">
                                <Avatar className="w-24 h-24 rounded-md border">
                                    <AvatarImage src={employee.photoUrl || undefined} />
                                    <AvatarFallback><User className="w-12 h-12" /></AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold" dir={language === 'ku' ? 'rtl' : 'ltr'}>{displayName}</h3>
                                    <p className="text-muted-foreground -mt-1">{employee.role || 'Employee'}</p>
                                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                                        <EmployeeDetailItem icon={Key} label={t('id_colon')} value={employee.employeeId} />
                                        <EmployeeDetailItem icon={Briefcase} label={t('role_optional')} value={employee.role} />
                                        <EmployeeDetailItem icon={Mail} label={t('email_optional')} value={employee.email} />
                                        <EmployeeDetailItem icon={Phone} label={t('phone_optional')} value={employee.phone} />
                                        <EmployeeDetailItem icon={CalendarIcon} label={t('joined_date')} value={safeEmploymentStartDate ? format(safeEmploymentStartDate, 'PPP') : null} />
                                        <EmployeeDetailItem icon={CalendarIcon} label={t('dob')} value={safeDob ? format(safeDob, 'PPP') : null} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </ReportWrapper>
    );
};
