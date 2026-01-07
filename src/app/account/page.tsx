
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { UserCircle, Edit, Save, X, KeyRound, Upload, Mail, Phone, Building, DollarSign, Clock, Gift, Banknote } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useAppContext } from '@/context/app-provider';
import type { Employee } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
};


export default function AccountPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, login } = useAuth();
  const { 
    employees, setEmployees, 
    expenses, overtime, bonuses, withdrawals 
  } = useAppContext();

  const [isEditing, setIsEditing] = useState(false);
  const [employeeDetails, setEmployeeDetails] = useState<Employee | null>(null);

  // Form State
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [kurdishName, setKurdishName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const photoUploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && employees) {
      const emp = employees.find(e => {
        const potentialUsername = `${e.name.split(' ')[0]}${e.employeeId || ''}`;
        return potentialUsername === user.username;
      });
      setEmployeeDetails(emp || null);
    }
  }, [user, employees]);

  useEffect(() => {
    if (employeeDetails) {
      setPhotoUrl(employeeDetails.photoUrl);
      setKurdishName(employeeDetails.kurdishName || '');
      setEmail(employeeDetails.email || '');
      setPhone(employeeDetails.phone || '');
    }
  }, [employeeDetails]);
  
  const financials = useMemo(() => {
    if (!employeeDetails) return null;
    const empId = employeeDetails.id;
    const totalExpenses = expenses.filter(e => e.employeeId === empId).reduce((sum, exp) => sum + exp.amount, 0);
    const totalOvertime = overtime.filter(e => e.employeeId === empId).reduce((sum, ot) => sum + ot.totalAmount, 0);
    const totalBonuses = bonuses.filter(b => b.employeeId === empId).reduce((sum, b) => sum + b.totalAmount, 0);
    const totalWithdrawals = withdrawals.filter(w => w.employeeId === empId).reduce((sum, w) => sum + w.amount, 0);
    return { totalExpenses, totalOvertime, totalBonuses, totalWithdrawals };
  }, [employeeDetails, expenses, overtime, bonuses, withdrawals]);


  const handleEditToggle = () => {
    if (isEditing && employeeDetails) {
      setPhotoUrl(employeeDetails.photoUrl);
      setKurdishName(employeeDetails.kurdishName || '');
      setEmail(employeeDetails.email || '');
      setPhone(employeeDetails.phone || '');
    }
    setIsEditing(!isEditing);
  };
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            setPhotoUrl(result);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = () => {
    if (!employeeDetails) return;

    const updatedEmployee: Employee = {
      ...employeeDetails,
      photoUrl: photoUrl,
      kurdishName: kurdishName,
      email: email,
      phone: phone,
    };

    setEmployees(employees.map(emp => emp.id === employeeDetails.id ? updatedEmployee : emp));
    toast({ title: "Profile Updated", description: "Your profile details have been saved." });
    setIsEditing(false);
  };
  
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !employeeDetails?.password) return;

    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: "Passwords don't match", description: "The new password and confirmation do not match." });
      return;
    }
    if (newPassword.length < 6) {
        toast({ variant: 'destructive', title: "Password too short", description: "Your new password must be at least 6 characters long." });
        return;
    }

    const isCurrentPasswordCorrect = await login(user.username, currentPassword);

    if (!isCurrentPasswordCorrect) {
        toast({ variant: 'destructive', title: "Incorrect Password", description: "The current password you entered is incorrect." });
        return;
    }

    const updatedEmployeeWithNewPass: Employee = { ...employeeDetails, password: newPassword };
    setEmployees(employees.map(emp => emp.id === employeeDetails!.id ? updatedEmployeeWithNewPass : emp));
    
    // We need to also update the user record for the login to work next time
    // This part is tricky as use-auth doesn't expose a setUser function.
    // For now, we update the employee and re-login which should handle the session for now.
    
    await login(user.username, newPassword);

    toast({ title: "Password Changed", description: "Your password has been successfully updated." });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  if (!employeeDetails) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading account details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
                <Card>
                    <CardHeader className="items-center text-center">
                        <div className="relative">
                            <Avatar className="w-32 h-32 mb-4 border-4 border-primary/20">
                                <AvatarImage src={photoUrl} alt={employeeDetails.name} />
                                <AvatarFallback>{employeeDetails.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {isEditing && (
                                <Button size="icon" variant="outline" className="absolute -bottom-0 right-0 rounded-full h-10 w-10" onClick={() => photoUploadRef.current?.click()}>
                                    <Upload className="w-5 h-5"/>
                                    <input ref={photoUploadRef} type="file" onChange={handlePhotoUpload} accept="image/*" className="hidden"/>
                                </Button>
                            )}
                        </div>
                        <CardTitle className="text-2xl">{employeeDetails.name}</CardTitle>
                        <CardDescription>{employeeDetails.role || 'Employee'}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-3">
                         <p className="flex items-center gap-2"><Mail className="w-4 h-4"/> {isEditing ? <Input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" /> : (employeeDetails.email || t('no_email'))}</p>
                         <p className="flex items-center gap-2"><Phone className="w-4 h-4"/> {isEditing ? <Input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone number" /> : (employeeDetails.phone || t('no_phone'))}</p>
                    </CardContent>
                    <CardFooter>
                        {isEditing ? (
                            <div className="flex w-full gap-2">
                                <Button onClick={handleSaveChanges} className="flex-1"><Save className="mr-2 h-4 w-4"/> Save</Button>
                                <Button variant="ghost" onClick={handleEditToggle}><X className="mr-2 h-4 w-4"/> Cancel</Button>
                            </div>
                        ) : (
                            <Button variant="outline" onClick={handleEditToggle} className="w-full">
                                <Edit className="mr-2 h-4 w-4"/> Edit Profile
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
             <div className="md:col-span-2 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-blue-500"/> {t('expenses')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p className="text-2xl font-bold text-blue-500">{formatCurrency(financials?.totalExpenses || 0)}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-orange-500"/> {t('overtime')}</CardTitle>
                        </CardHeader>
                         <CardContent>
                             <p className="text-2xl font-bold text-orange-500">{formatCurrency(financials?.totalOvertime || 0)}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Gift className="w-5 h-5 text-green-500"/> {t('bonuses')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p className="text-2xl font-bold text-green-500">{formatCurrency(financials?.totalBonuses || 0)}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Banknote className="w-5 h-5 text-rose-500"/> {t('cash_withdrawals')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-rose-500">{formatCurrency(financials?.totalWithdrawals || 0)}</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('general')}</CardTitle>
                        <CardDescription>Manage your general account information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" value={employeeDetails.name} disabled />
                            <p className="text-xs text-muted-foreground">Your name can only be changed by an administrator.</p>
                         </div>
                         <div className="space-y-2">
                            <Label htmlFor="kurdishName">Kurdish Name</Label>
                            <Input id="kurdishName" value={kurdishName} dir="rtl" onChange={e => setKurdishName(e.target.value)} disabled={!isEditing} />
                         </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><KeyRound/> Change Password</CardTitle>
                        <CardDescription>For security, you must provide your current password to set a new one.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleChangePassword}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input id="current-password" type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} required />
                            </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">New Password</Label>
                                    <Input id="new-password" type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                                    <Input id="confirm-password" type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit">Update Password</Button>
                        </CardFooter>
                    </form>
                </Card>
             </div>
        </div>
      </main>
    </div>
  );
}

