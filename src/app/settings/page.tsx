
'use client';

import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';
import {
  Save,
  Palette,
  ShieldCheck,
  ImageIcon as ImageIconLucide,
  Languages,
  FileText,
  Loader2,
  X,
  Plus,
  Check,
  Video,
  Type,
  ScrollText,
  Link as LinkIcon,
  Users,
  Users2,
  Activity,
  Trash2,
  Edit,
  Search,
  KeyRound,
  ShieldAlert,
  Database,
  Download,
  RefreshCw,
  Bomb,
  LayoutTemplate,
  Monitor,
  Maximize,
  Scaling,
  MousePointer2,
  CaseSensitive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/hooks/use-translation';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import type { AppSettings, ThemeColors, User, Role, Employee, ActivityLog, TextTransform } from '@/lib/types';
import withAuth from '@/hooks/withAuth';
import { useAppContext } from '@/context/app-provider';
import { useAuth } from '@/hooks/use-auth';
import { initialSettings, initialData } from '@/context/initial-data';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { allPermissions } from '@/lib/permissions';

const themes = [
  { name: 'purple', color: 'bg-purple-600', label: 'Corporate Purple' },
  { name: 'blue', color: 'bg-blue-600', label: 'Tech Blue' },
  { name: 'green', color: 'bg-green-600', label: 'Forest Emerald' },
  { name: 'rose', color: 'bg-rose-600', label: 'Elegant Rose' },
  { name: 'amber', color: 'bg-amber-600', label: 'Golden Amber' },
  { name: 'violet', color: 'bg-violet-600', label: 'Royal Violet' },
  { name: 'orange', color: 'bg-orange-600', label: 'Sunset Orange' },
  { name: 'cyan', color: 'bg-cyan-600', label: 'Arctic Cyan' },
  { name: 'indigo', color: 'bg-indigo-600', label: 'Deep Indigo' },
  { name: 'zinc', color: 'bg-zinc-600', label: 'Industrial Zinc' },
  { name: 'crimson', color: 'bg-red-700', label: 'Crimson Power' },
  { name: 'custom', color: 'bg-gradient-to-br from-gray-400 to-gray-800', label: 'Custom Architect' },
];

/** Utility to convert HSL variable string to Hex for input type color */
function hslToHex(hsl: string): string {
    const parts = hsl.split(' ');
    if (parts.length < 3) return '#000000';
    const h = parseInt(parts[0]);
    const s = parseInt(parts[1].replace('%', ''));
    const l = parseInt(parts[2].replace('%', ''));

    const l_calc = l / 100;
    const a = s * Math.min(l_calc, 1 - l_calc) / 100;
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l_calc - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

/** Utility to convert Hex to HSL variable string */
function hexToHsl(hex: string): string {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function ColorPicker({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) {
    const hex = useMemo(() => hslToHex(value), [value]);
    
    return (
        <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</Label>
            <div className="flex items-center gap-3 bg-muted/20 p-2 rounded-xl border border-white/10 group hover:border-primary/30 transition-all">
                <div className="relative shrink-0 w-10 h-10 overflow-hidden rounded-lg shadow-lg border-2 border-white/20">
                    <input 
                        type="color" 
                        value={hex} 
                        onChange={e => onChange(hexToHsl(e.target.value))}
                        className="absolute inset-0 w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                    />
                </div>
                <div className="flex-1 space-y-0.5">
                    <p className="text-[9px] font-black uppercase tracking-tighter opacity-40">HSL Variable</p>
                    <Input 
                        value={value} 
                        onChange={e => onChange(e.target.value)} 
                        className="h-6 text-[10px] font-mono border-none bg-transparent p-0 focus-visible:ring-0 shadow-none"
                    />
                </div>
                <MousePointer2 className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />
            </div>
        </div>
    );
}

function ImageControl({ 
    label, 
    description, 
    value, 
    onValueChange, 
    onFileUpload 
}: { 
    label: string, 
    description: string, 
    value: string | null, 
    onValueChange: (val: string) => void,
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void 
}) {
    return (
        <Card className="border-none shadow-sm bg-card/68 backdrop-blur-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm">{label}</CardTitle>
                <CardDescription className="text-[10px]">{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="relative w-full h-32 border-2 border-dashed rounded-xl p-2 flex justify-center bg-muted/30 overflow-hidden">
                    {value ? (
                        <Image src={value} alt={label} fill className="object-contain" unoptimized />
                    ) : (
                        <div className="flex items-center justify-center text-muted-foreground opacity-20">
                            <ImageIconLucide className="w-12 h-12" />
                        </div>
                    )}
                </div>
                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-60">
                            <LinkIcon className="w-3 h-3" />
                            URL Import
                        </div>
                        <Input 
                            value={value || ''} 
                            onChange={e => onValueChange(e.target.value)} 
                            placeholder="https://example.com/image.png"
                            className="h-9 text-xs"
                        />
                    </div>
                    <Separator className="opacity-50" />
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-60">
                            <Plus className="w-3 h-3" />
                            File Upload
                        </div>
                        <Input type="file" accept="image/*" onChange={onFileUpload} className="h-9 text-xs cursor-pointer" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function AdminPowerSuite() {
    const { t } = useTranslation();
    const { 
        users, setUsers, 
        roles, setRoles, 
        employees, setEmployees,
        activityLogs,
        excelFiles, setExcelFiles,
        items, setItems,
        expenses, setExpenses,
        expenseReports, setExpenseReports,
        transfers, setTransfers,
        transferItems, setTransferItems,
        orderRequests, setOrderRequests,
        settings, setSettings
    } = useAppContext();
    const { user: currentUser } = useAuth();
    const { toast } = useToast();

    // User State
    const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState("");
    
    // Roles State
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [isNewRoleOpen, setIsNewRoleOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState("");

    // Multi-Factor Reset State
    const [resetSafetyUnlocked, setResetSafetyUnlocked] = useState(false);
    const [resetConfirmationChecked, setResetConfirmationChecked] = useState(false);
    const [resetVerifyCode, setResetVerifyCode] = useState("");

    useEffect(() => {
        if (roles.length > 0 && !selectedRole) {
            setSelectedRole(roles[0]);
        }
    }, [roles, selectedRole]);

    // Activity Log Filtering
    const [searchQuery, setSearchQuery] = useState('');
    const filteredLogs = useMemo(() => {
        return [...activityLogs]
            .filter(log => log.username.toLowerCase().includes(searchQuery.toLowerCase()) || log.description.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a,b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());
    }, [activityLogs, searchQuery]);

    const handleCreateAllUsers = () => {
        const existingUsernames = new Set(users.map(u => u.username));
        const employeesWithoutUsers = employees.filter(emp => {
            const newUsername = `${emp.name.split(' ')[0]}${emp.employeeId || ''}`;
            return !existingUsernames.has(newUsername);
        });

        if (employeesWithoutUsers.length === 0) {
            toast({ title: t('no_new_users_to_create') });
            return;
        }

        const newUsers: User[] = employeesWithoutUsers.map(emp => ({
            id: `user-${emp.id}`,
            username: `${emp.name.split(' ')[0]}${emp.employeeId || ''}`,
            password: `${emp.name.split(' ')[0].toLowerCase()}123`,
            roleId: 'role-viewer',
        }));

        setUsers([...users, ...newUsers]);
        toast({ title: t('users_created'), description: t('users_created_desc', { newUsersCount: newUsers.length }) });
    };

    const handleSaveUserChanges = () => {
        if (!editingUser) return;
        const updatedUser = { ...editingUser };
        if (newPassword) updatedUser.password = newPassword;
        setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
        toast({ title: "User Updated", description: `Member ${updatedUser.username} has been synchronized.` });
        setIsUserDialogOpen(false);
        setNewPassword("");
    };

    const handleCreateNewRole = () => {
        if (!newRoleName.trim()) return;
        const newRole: Role = {
            id: `role-${Date.now()}`,
            name: newRoleName.trim(),
            permissions: []
        };
        setRoles([...roles, newRole]);
        toast({ title: "Role Provisioned", description: `Architectural tier "${newRoleName}" has been added.` });
        setNewRoleName("");
        setIsNewRoleOpen(false);
    };

    const handleSaveRole = () => {
        if (!selectedRole) return;
        setRoles(roles.map(r => r.id === selectedRole.id ? selectedRole : r));
        toast({ title: t("role_updated"), description: t('role_updated_desc', {roleName: selectedRole.name})});
    };

    const exportAllData = () => {
        const fullState = {
            employees, excelFiles, items, expenses, expenseReports, transfers, transferItems, orderRequests, users, roles, settings
        };
        const blob = new Blob([JSON.stringify(fullState, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Ashley_Terminal_Backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
        a.click();
        toast({ title: "Nexus Export Complete", description: "All terminal sectors have been backed up to JSON." });
    };

    const handleImportData = (e: React.ChangeEvent<HTMLInputElement>, mode: 'employees' | 'branch') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const incoming = JSON.parse(event.target?.result as string);
                
                if (mode === 'employees') {
                    if (incoming.employees) {
                        setEmployees(incoming.employees);
                        toast({ title: "Biometric Sync Success", description: "Employee database and image headers have been updated." });
                    } else {
                        throw new Error("No employee cluster found in backup.");
                    }
                } else if (mode === 'branch') {
                    const brandingKeys = [
                        'appLogo', 'mainBackground', 'loginBackground', 'loginBackgroundVideo', 
                        'loginBackgroundEmbed', 'loginCardUpperImage', 'dashboardBanner', 
                        'printHeaderImage', 'printFooterImage', 'customFont'
                    ];
                    
                    if (incoming.employees) setEmployees(incoming.employees);
                    if (incoming.excelFiles) setExcelFiles(incoming.excelFiles);
                    if (incoming.items) setItems(incoming.items);
                    if (incoming.expenses) setExpenses(incoming.expenses);
                    if (incoming.expenseReports) setExpenseReports(incoming.expenseReports);
                    if (incoming.transfers) setTransfers(incoming.transfers);
                    if (incoming.transferItems) setTransferItems(incoming.transferItems);
                    if (incoming.orderRequests) setOrderRequests(incoming.orderRequests);
                    if (incoming.users) setUsers(incoming.users);
                    if (incoming.roles) setRoles(incoming.roles);
                    
                    if (incoming.settings) {
                        const sanitizedSettings = { ...incoming.settings };
                        brandingKeys.forEach(key => {
                            if (settings[key as keyof AppSettings]) {
                                sanitizedSettings[key] = settings[key as keyof AppSettings];
                            }
                        });
                        setSettings(sanitizedSettings);
                    }
                    
                    toast({ title: "Nexus Link Established", description: "Operational data synchronized. Local branding architecture protected." });
                }
            } catch (err) {
                toast({ variant: "destructive", title: "Nexus Breach", description: "Could not parse data cluster. File may be corrupted." });
            }
        };
        reader.readAsText(file);
    };

    const handleTerminalReset = async () => {
        if (!resetSafetyUnlocked || !resetConfirmationChecked || resetVerifyCode !== "RESET") return;
        
        await setEmployees(initialData.employees);
        await setExcelFiles([]);
        await setItems([]);
        await setExpenses([]);
        await setExpenseReports([]);
        await setTransfers([]);
        await setTransferItems([]);
        await setOrderRequests([]);
        await setUsers(initialData.users);
        await setRoles(initialData.roles);
        await setSettings(initialSettings);
        
        toast({ title: "Factory Reset Successful", description: "Terminal has been purged and returned to initial state." });
        window.location.reload();
    };

    return (
        <div className="space-y-8">
            <Tabs defaultValue="users" className="w-full">
                <TabsList className="bg-muted/30 p-1 mb-6 flex overflow-x-auto h-auto">
                    <TabsTrigger value="users" className="text-[10px] font-bold uppercase tracking-widest px-4 py-2"><Users className="w-3 h-3 mr-2" /> Members</TabsTrigger>
                    <TabsTrigger value="roles" className="text-[10px] font-bold uppercase tracking-widest px-4 py-2"><ShieldCheck className="w-3 h-3 mr-2" /> Roles</TabsTrigger>
                    <TabsTrigger value="activity" className="text-[10px] font-bold uppercase tracking-widest px-4 py-2"><Activity className="w-3 h-3 mr-2" /> Activity</TabsTrigger>
                    <TabsTrigger value="data" className="text-[10px] font-bold uppercase tracking-widest px-4 py-2"><Database className="w-3 h-3 mr-2" /> Data Mgr</TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-4">
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={handleCreateAllUsers}>
                            <Users2 className="w-3 h-3 mr-2" /> {t('create_all_users')}
                        </Button>
                    </div>
                    <div className="border rounded-xl overflow-hidden bg-card/30">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-[9px] uppercase font-black tracking-widest">Username</TableHead>
                                    <TableHead className="text-[9px] uppercase font-black tracking-widest">Role</TableHead>
                                    <TableHead className="text-right text-[9px] uppercase font-black tracking-widest">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map(u => (
                                    <TableRow key={u.id}>
                                        <TableCell className="font-bold text-xs">{u.username}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[9px] uppercase font-black tracking-tighter">
                                                {roles.find(r => r.id === u.roleId)?.name || 'Unknown'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingUser(u); setIsUserDialogOpen(true); }}>
                                                <Edit className="w-3 h-3" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="roles" className="space-y-6">
                    <div className="flex flex-wrap items-center gap-4 bg-muted/20 p-4 rounded-xl border">
                        <Label className="text-xs font-bold uppercase tracking-widest">Select Role:</Label>
                        <Select value={selectedRole?.id || ''} onValueChange={(val) => setSelectedRole(roles.find(r => r.id === val) || null)}>
                            <SelectTrigger className="w-64 h-9 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button size="sm" onClick={handleSaveRole} disabled={selectedRole?.name === 'Admin'}>
                            <Save className="w-3 h-3 mr-2" /> Save Tier
                        </Button>
                        <Separator orientation="vertical" className="h-6 hidden md:block" />
                        <Button variant="outline" size="sm" onClick={() => setIsNewRoleOpen(true)}>
                            <Plus className="w-3 h-3 mr-2" /> New Role
                        </Button>
                    </div>

                    {selectedRole && (
                        <Card className="bg-card/20 border-none shadow-none">
                            <CardHeader>
                                <CardTitle className="text-xs uppercase font-black tracking-widest text-primary">Permissions Architect: {selectedRole.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                                {allPermissions.map(p => (
                                    <div key={p.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                        <Checkbox 
                                            id={`perm-${p.id}`} 
                                            checked={selectedRole.permissions.includes(p.id)}
                                            onCheckedChange={(checked) => {
                                                const newPerms = checked 
                                                    ? [...selectedRole.permissions, p.id]
                                                    : selectedRole.permissions.filter(id => id !== p.id);
                                                setSelectedRole({ ...selectedRole, permissions: newPerms });
                                            }}
                                            disabled={selectedRole.name === 'Admin'}
                                        />
                                        <label htmlFor={`perm-${p.id}`} className="text-[10px] font-bold leading-tight cursor-pointer opacity-80">{p.description}</label>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="activity">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input 
                            placeholder="Filter logs..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-10 h-9 text-xs"
                        />
                    </div>
                    <div className="border rounded-xl overflow-hidden bg-card/30 max-h-[500px] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-[9px] uppercase font-black tracking-widest">Timestamp</TableHead>
                                    <TableHead className="text-[9px] uppercase font-black tracking-widest">User</TableHead>
                                    <TableHead className="text-[9px] uppercase font-black tracking-widest">Action</TableHead>
                                    <TableHead className="text-[9px] uppercase font-black tracking-widest">Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLogs.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-[9px] font-mono opacity-60">{format(parseISO(log.timestamp), 'MMM d, HH:mm')}</TableCell>
                                        <TableCell className="text-[10px] font-bold">{log.username}</TableCell>
                                        <TableCell>
                                            <Badge variant={log.action === 'delete' ? 'destructive' : 'outline'} className="text-[8px] h-4 px-1 uppercase font-black">
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-[10px] font-medium opacity-80">{log.description}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="data" className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-card/20 border-none">
                            <CardHeader>
                                <CardTitle className="text-sm">Nexus Data Export</CardTitle>
                                <CardDescription className="text-[10px]">Generate a complete encrypted backup of all terminal sectors.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button className="w-full font-black uppercase tracking-widest text-[10px]" onClick={exportAllData}>
                                    <Download className="w-3.5 h-3.5 mr-2" /> Initiate Export
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="bg-card/20 border-none">
                            <CardHeader>
                                <CardTitle className="text-sm">Nexus Data Import</CardTitle>
                                <CardDescription className="text-[10px]">Synchronize data clusters from backups or other branches.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[9px] uppercase font-black tracking-widest opacity-60">Strategy A: Biometric Sync</Label>
                                    <div className="relative">
                                        <Button variant="outline" className="w-full text-[9px] uppercase font-black tracking-widest h-9" asChild>
                                            <label>
                                                <Users className="w-3 h-3 mr-2" /> Import Employees Only
                                                <input type="file" accept=".json" onChange={e => handleImportData(e, 'employees')} className="hidden" />
                                            </label>
                                        </Button>
                                    </div>
                                    <p className="text-[8px] text-muted-foreground italic">Imports employee list and photos only. Preserves all existing reports.</p>
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    <Label className="text-[9px] uppercase font-black tracking-widest opacity-60">Strategy B: Neural Branch Link</Label>
                                    <div className="relative">
                                        <Button variant="outline" className="w-full text-[9px] uppercase font-black tracking-widest h-9 border-primary/30" asChild>
                                            <label>
                                                <RefreshCw className="w-3 h-3 mr-2" /> Import Branch Data
                                                <input type="file" accept=".json" onChange={e => handleImportData(e, 'branch')} className="hidden" />
                                            </label>
                                        </Button>
                                    </div>
                                    <p className="text-[8px] text-muted-foreground italic">Imports all operational data. <span className="text-primary">Strips all branding images</span> to protect this terminal's UI.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Separator className="opacity-20" />

                    <Card className="border-destructive/20 shadow-xl bg-destructive/5 overflow-hidden">
                        <CardHeader className="bg-destructive/10 border-b border-destructive/10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-destructive text-white rounded-lg shadow-lg">
                                    <Bomb className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-destructive font-black uppercase tracking-widest text-base">Terminal Purge Protocol</CardTitle>
                                    <CardDescription className="text-destructive/70 text-[10px] font-bold">CRITICAL: This action wipes all database sectors and resets identity anchors.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="flex items-center justify-between p-4 bg-background/40 rounded-xl border border-destructive/20">
                                <div className="space-y-0.5">
                                    <Label className="text-[10px] font-black uppercase tracking-widest">Factor 1: Neural Safety Interlock</Label>
                                    <p className="text-[9px] text-muted-foreground">Unlock the primary reset circuit.</p>
                                </div>
                                <Switch checked={resetSafetyUnlocked} onCheckedChange={setResetSafetyUnlocked} className="data-[state=checked]:bg-destructive" />
                            </div>

                            <div className={cn("space-y-6 transition-all duration-500", resetSafetyUnlocked ? "opacity-100 scale-100" : "opacity-20 scale-[0.98] pointer-events-none grayscale")}>
                                <div className="flex items-start space-x-3 p-4 bg-background/40 rounded-xl border border-destructive/10">
                                    <Checkbox id="confirm-wipe" checked={resetConfirmationChecked} onCheckedChange={(v) => setResetConfirmationChecked(!!v)} />
                                    <div className="grid gap-1.5 leading-none">
                                        <label htmlFor="confirm-wipe" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">Factor 2: Confirmation of Data Loss</label>
                                        <p className="text-[9px] text-muted-foreground italic">I acknowledge that all reports, items, and biometric headers will be permanently deleted.</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Factor 3: Verification Sequence</Label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground opacity-50" />
                                        <Input 
                                            value={resetVerifyCode} 
                                            onChange={e => setResetVerifyCode(e.target.value)} 
                                            placeholder="Enter 'RESET' to authorize"
                                            className="pl-10 border-destructive/30 focus-visible:ring-destructive bg-background/50 h-10 font-mono text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-destructive/5 p-6 border-t border-destructive/10">
                            <Button 
                                variant="destructive" 
                                className="w-full font-black uppercase tracking-widest h-12 shadow-2xl transition-all" 
                                disabled={!resetSafetyUnlocked || !resetConfirmationChecked || resetVerifyCode !== "RESET"}
                                onClick={handleTerminalReset}
                            >
                                <ShieldAlert className="w-4 h-4 mr-2" /> Execute Factory Purge
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Dialogs */}
            <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit Member Architecture: {editingUser?.username}</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Access Tier (Role)</Label>
                            <Select value={editingUser?.roleId || ''} onValueChange={v => editingUser && setEditingUser({...editingUser, roleId: v})}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Overwrite Security Key (Password)</Label>
                            <Input 
                                type="password" 
                                value={newPassword} 
                                onChange={e => setNewPassword(e.target.value)} 
                                placeholder="Leave blank to maintain current"
                                className="h-9 text-xs"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsUserDialogOpen(false)}>Abort</Button>
                        <Button onClick={handleSaveUserChanges}>Save Configuration</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isNewRoleOpen} onOpenChange={setIsNewRoleOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Provision New Access Tier</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Role Designation Name</Label>
                            <Input value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="e.g. Finance Architect" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsNewRoleOpen(false)}>Abort</Button>
                        <Button onClick={handleCreateNewRole}>Initialize Role</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function DashboardSettingsSuite({ draft, onChange }: { draft: AppSettings, onChange: (path: string, val: any) => void }) {
    const { t } = useTranslation();
    const config = draft.dashboard;
    const sidebar = draft.sidebar;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm bg-card/68 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Maximize className="w-4 h-4"/> Card Architecture</CardTitle>
                        <CardDescription>Adjust the geometric sharpness and structure of terminal cards.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Corner Radius (Sharpness)</Label>
                                <Badge variant="outline" className="font-mono text-[10px]">{config.cardRadius}px</Badge>
                            </div>
                            <Slider 
                                value={[config.cardRadius]} 
                                min={0} max={40} step={1}
                                onValueChange={([val]) => onChange('dashboard.cardRadius', val)}
                            />
                        </div>
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                                <CaseSensitive className="w-3.5 h-3.5" /> Text Transformation (Paragraph)
                            </Label>
                            <Select value={config.textTransform} onValueChange={(val: TextTransform) => onChange('dashboard.textTransform', val)}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Default (None)</SelectItem>
                                    <SelectItem value="uppercase">ALL UPPERCASE</SelectItem>
                                    <SelectItem value="capitalize">Capitalize First Letter</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-card/68 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Scaling className="w-4 h-4"/> Main Hub Typography</CardTitle>
                        <CardDescription>Calibrate the information density of the main terminal hub.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Global Dashboard Font Size</Label>
                                <Badge variant="outline" className="font-mono text-[10px]">{config.fontSize}px</Badge>
                            </div>
                            <Slider 
                                value={[config.fontSize]} 
                                min={1} max={72} step={1}
                                onValueChange={([val]) => onChange('dashboard.fontSize', val)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-card/68 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Monitor className="w-4 h-4"/> Command Sidebar Configuration</CardTitle>
                        <CardDescription>Customize the navigation interface density and styling.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Sidebar Font Size</Label>
                                <Badge variant="outline" className="font-mono text-[10px]">{sidebar.fontSize}px</Badge>
                            </div>
                            <Slider 
                                value={[sidebar.fontSize]} 
                                min={8} max={24} step={1}
                                onValueChange={([val]) => onChange('sidebar.fontSize', val)}
                            />
                        </div>
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                                <CaseSensitive className="w-3.5 h-3.5" /> Sidebar Text Case
                            </Label>
                            <Select value={sidebar.textTransform} onValueChange={(val: TextTransform) => onChange('sidebar.textTransform', val)}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Default (None)</SelectItem>
                                    <SelectItem value="uppercase">ALL UPPERCASE</SelectItem>
                                    <SelectItem value="capitalize">Capitalize First Letter</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-card/68 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Palette className="w-4 h-4"/> Interface Chroma Overrides</CardTitle>
                        <CardDescription>Visual color picker for main terminal elements.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ColorPicker label="Dashboard Titles" value={config.titleColor} onChange={v => onChange('dashboard.titleColor', v)} />
                        <ColorPicker label="Content Body Text" value={config.textColor} onChange={v => onChange('dashboard.textColor', v)} />
                        <ColorPicker label="Interface Accent" value={config.accentColor} onChange={v => onChange('dashboard.accentColor', v)} />
                    </CardContent>
                </Card>
            </div>

            <Separator className="opacity-20" />

            <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-40 text-center">Operational Architecture Audit (Live Preview)</h3>
                <div className="p-8 rounded-3xl border-2 border-dashed bg-muted/10 overflow-hidden relative min-h-[400px] flex items-center justify-center">
                    <div className="absolute inset-0 z-0 opacity-20">
                        {draft.mainBackground && <Image src={draft.mainBackground} alt="Preview BG" fill className="object-cover" unoptimized />}
                    </div>
                    
                    <div className="relative z-10 w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                        {/* Sidebar Mockup */}
                        <div className="bg-primary/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-4 shadow-2xl">
                            <div className="w-8 h-8 rounded-lg bg-white/20" />
                            <div className="space-y-2">
                                <div className="h-2 w-full bg-white/30 rounded" />
                                <div className="h-2 w-3/4 bg-white/20 rounded" />
                            </div>
                            <div className="pt-4 border-t border-white/5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/60">Command Sector</p>
                                <p 
                                    className="font-bold opacity-90 transition-all" 
                                    style={{ 
                                        fontSize: `${sidebar.fontSize}px`, 
                                        textTransform: sidebar.textTransform as any,
                                        color: `hsl(${config.textColor})` 
                                    }}
                                >
                                    Navigation Sample Alpha
                                </p>
                            </div>
                        </div>

                        {/* Data Card Mockup */}
                        <div 
                            className="bg-card/68 backdrop-blur-md border border-white/10 p-6 flex flex-col justify-between shadow-2xl transition-all"
                            style={{ 
                                borderRadius: `${config.cardRadius}px`,
                                fontSize: `${config.fontSize}px`,
                                textTransform: config.textTransform as any,
                                color: `hsl(${config.textColor})`
                            }}
                        >
                            <div className="space-y-2">
                                <h4 className="font-black uppercase tracking-widest transition-all" style={{ color: `hsl(${config.titleColor})` }}>Hub Architecture Data</h4>
                                <p className="opacity-80">This sample text represents the body content density of your terminal hub at {config.fontSize}px size.</p>
                            </div>
                            
                            <div className="mt-6 flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(${config.accentColor})` }} />
                                    <span className="text-[10px] font-bold uppercase opacity-60">Small Caption Element</span>
                                </div>
                                <div className="h-8 w-full rounded flex items-center justify-center font-black uppercase tracking-widest text-[9px] transition-all" style={{ backgroundColor: `hsl(${config.accentColor})` }}>
                                    Confirm Protocol
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SettingsPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { settings, setSettings } = useAppContext();
  const { hasPermission } = useAuth();

  const [draftSettings, setDraftSettings] = useState<AppSettings>(initialSettings);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const isAdmin = hasPermission('admin:all');

  useEffect(() => {
    if (settings) {
      setDraftSettings(JSON.parse(JSON.stringify(settings)));
    }
  }, [settings]);

  useEffect(() => {
    if (JSON.stringify(settings) !== JSON.stringify(draftSettings)) {
      setIsDirty(true);
    } else {
      setIsDirty(false);
    }
  }, [settings, draftSettings]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, settingKeyPath: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const localUrl = event.target?.result as string;
      if (localUrl) {
        updateSetting(settingKeyPath, localUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const updateSetting = (path: string, value: any) => {
    setDraftSettings(prev => {
        const newSettings = JSON.parse(JSON.stringify(prev));
        const keys = path.split('.');
        let current: any = newSettings;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        return newSettings;
    });
  };

  const handleSave = async () => {
    if (!isAdmin) return;
    setIsSaving(true);
    try {
        await setSettings(draftSettings);
        toast({ title: 'Settings Saved', description: 'Your visual changes have been applied.' });
    } catch (err) {
        toast({ variant: 'destructive', title: 'Save Failed', description: 'An error occurred while saving configuration.' });
    } finally {
        setIsSaving(false);
    }
  };

  const updateCustomColor = (mode: 'light' | 'dark', key: keyof ThemeColors, value: string) => {
      setDraftSettings(prev => ({
          ...prev,
          [mode === 'light' ? 'lightThemeColors' : 'darkThemeColors']: {
              ...prev[mode === 'light' ? 'lightThemeColors' : 'darkThemeColors'],
              [key]: value
          }
      }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-24">
      <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full">
        <Tabs defaultValue="design" className="w-full">
          <TabsList className="bg-muted/50 p-1 rounded-xl flex overflow-x-auto h-auto mb-6">
            <TabsTrigger value="design" className="py-2 px-4 whitespace-nowrap"><Palette className="mr-2 h-4 w-4" /> {t('design')}</TabsTrigger>
            <TabsTrigger value="dashboard" className="py-2 px-4 whitespace-nowrap"><LayoutTemplate className="mr-2 h-4 w-4" /> Hub Architect</TabsTrigger>
            <TabsTrigger value="images" className="py-2 px-4 whitespace-nowrap"><ImageIconLucide className="mr-2 h-4 w-4" /> {t('images')}</TabsTrigger>
            <TabsTrigger value="language" className="py-2 px-4 whitespace-nowrap"><Languages className="mr-2 h-4 w-4" /> {t('language_text')}</TabsTrigger>
            <TabsTrigger value="pdf" className="py-2 px-4 whitespace-nowrap"><FileText className="mr-2 h-4 w-4" /> {t('pdf_reports')}</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin" className="py-2 px-4 whitespace-nowrap"><ShieldCheck className="mr-2 h-4 w-4" /> Admin</TabsTrigger>}
          </TabsList>

          <TabsContent value="design" className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <Card className="border-none shadow-sm bg-card/68 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Global Theme Architecture</CardTitle>
                <CardDescription>Select a professional preset or design your own unique color identity.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                    {themes.map((theme) => (
                      <button
                        key={theme.name}
                        onClick={() => setDraftSettings(prev => ({ ...prev, selectedTheme: theme.name }))}
                        className={cn(
                          "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:bg-muted/50",
                          draftSettings.selectedTheme === theme.name ? "border-primary bg-primary/5 shadow-inner" : "border-transparent bg-muted/20"
                        )}
                      >
                        <div className={cn("w-10 h-10 rounded-lg shadow-md border-2 border-white/20", theme.color)} />
                        <span className="text-[10px] font-black uppercase tracking-tighter text-center">{theme.label}</span>
                        {draftSettings.selectedTheme === theme.name && (
                          <div className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground rounded-full p-0.5">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {draftSettings.selectedTheme === 'custom' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-muted/20 rounded-2xl border animate-in zoom-in-95 duration-300">
                          <div className="space-y-6">
                              <h3 className="text-sm font-black uppercase tracking-widest text-primary">Light Mode Architect</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <ColorPicker label="Background" value={draftSettings.lightThemeColors.background} onChange={v => updateCustomColor('light', 'background', v)} />
                                  <ColorPicker label="Frontend Text" value={draftSettings.lightThemeColors.foreground} onChange={v => updateCustomColor('light', 'foreground', v)} />
                                  <ColorPicker label="Primary Accent" value={draftSettings.lightThemeColors.primary} onChange={v => updateCustomColor('light', 'primary', v)} />
                                  <ColorPicker label="Interface Accent" value={draftSettings.lightThemeColors.accent} onChange={v => updateCustomColor('light', 'accent', v)} />
                                  <ColorPicker label="Card Surface" value={draftSettings.lightThemeColors.card} onChange={v => updateCustomColor('light', 'card', v)} />
                                  <ColorPicker label="Title Bar" value={draftSettings.lightThemeColors.titleBar} onChange={v => updateCustomColor('light', 'titleBar', v)} />
                                  <ColorPicker label="Table Row Primary" value={draftSettings.lightThemeColors.tableRowPrimary} onChange={v => updateCustomColor('light', 'tableRowPrimary', v)} />
                                  <ColorPicker label="Table Row Secondary" value={draftSettings.lightThemeColors.tableRowSecondary} onChange={v => updateCustomColor('light', 'tableRowSecondary', v)} />
                              </div>
                          </div>
                          <div className="space-y-6">
                              <h3 className="text-sm font-black uppercase tracking-widest text-primary">Dark Mode Architect</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <ColorPicker label="Background" value={draftSettings.darkThemeColors.background} onChange={v => updateCustomColor('dark', 'background', v)} />
                                  <ColorPicker label="Frontend Text" value={draftSettings.darkThemeColors.foreground} onChange={v => updateCustomColor('dark', 'foreground', v)} />
                                  <ColorPicker label="Primary Accent" value={draftSettings.darkThemeColors.primary} onChange={v => updateCustomColor('dark', 'primary', v)} />
                                  <ColorPicker label="Interface Accent" value={draftSettings.darkThemeColors.accent} onChange={v => updateCustomColor('dark', 'accent', v)} />
                                  <ColorPicker label="Card Surface" value={draftSettings.darkThemeColors.card} onChange={v => updateCustomColor('dark', 'card', v)} />
                                  <ColorPicker label="Title Bar" value={draftSettings.darkThemeColors.titleBar} onChange={v => updateCustomColor('dark', 'titleBar', v)} />
                                  <ColorPicker label="Table Row Primary" value={draftSettings.darkThemeColors.tableRowPrimary} onChange={v => updateCustomColor('light', 'tableRowPrimary', v)} />
                                  <ColorPicker label="Table Row Secondary" value={draftSettings.darkThemeColors.tableRowSecondary} onChange={v => updateCustomColor('dark', 'tableRowSecondary', v)} />
                              </div>
                          </div>
                      </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard">
              <DashboardSettingsSuite draft={draftSettings} onChange={updateSetting} />
          </TabsContent>

          <TabsContent value="images" className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ImageControl 
                    label={t('app_logo')} 
                    description={t('app_logo_desc')} 
                    value={draftSettings.appLogo} 
                    onValueChange={v => updateSetting('appLogo', v)}
                    onFileUpload={e => handleFileUpload(e, 'appLogo')}
                />
                <ImageControl 
                    label={t('main_dashboard_background')} 
                    description={t('main_dashboard_background_desc')} 
                    value={draftSettings.mainBackground} 
                    onValueChange={v => updateSetting('mainBackground', v)}
                    onFileUpload={e => handleFileUpload(e, 'mainBackground')}
                />
                <ImageControl 
                    label="Login Card Banner" 
                    description="The decorative image at the top of the login portal." 
                    value={draftSettings.loginCardUpperImage} 
                    onValueChange={v => updateSetting('loginCardUpperImage', v)}
                    onFileUpload={e => handleFileUpload(e, 'loginCardUpperImage')}
                />
                <ImageControl 
                    label="Login Portal Background" 
                    description="Static fallback image for the login screen." 
                    value={draftSettings.loginBackground} 
                    onValueChange={v => updateSetting('loginBackground', v)}
                    onFileUpload={e => handleFileUpload(e, 'loginBackground')}
                />
                <ImageControl 
                    label={t('dashboard_banner')} 
                    description={t('dashboard_banner_desc')} 
                    value={draftSettings.dashboardBanner} 
                    onValueChange={v => updateSetting('dashboardBanner', v)}
                    onFileUpload={e => handleFileUpload(e, 'dashboardBanner')}
                />
            </div>

            <Card className="border-none shadow-sm bg-card/68 backdrop-blur-sm mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Video className="w-4 h-4"/> Login Video Engineering</CardTitle>
                    <CardDescription>High-performance video streaming integration.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>YouTube/Vimeo Embed URL</Label>
                        <Input 
                            value={draftSettings.loginBackgroundEmbed || ''} 
                            onChange={e => updateSetting('loginBackgroundEmbed', e.target.value)}
                            placeholder="https://www.youtube.com/embed/VIDEO_ID"
                        />
                    </div>
                    <Separator />
                    <ColorPicker 
                        label="Login Button Color" 
                        value={draftSettings.loginButtonColor || draftSettings.lightThemeColors.primary} 
                        onChange={v => updateSetting('loginButtonColor', v)} 
                    />
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="language" className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm bg-card/68 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ScrollText className="w-4 h-4"/> Dashboard News Ticker</CardTitle>
                        <CardDescription>Define the scrolling intelligence that appears on the main terminal hub.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Announcement Text</Label>
                            <Textarea 
                                value={draftSettings.newsTickerText || ''} 
                                onChange={e => setDraftSettings(prev => ({ ...prev, newsTickerText: e.target.value }))}
                                placeholder="Enter text to scroll on the dashboard..."
                                className="min-h-[100px]"
                            />
                        </div>
                        <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Live Preview</p>
                            <div className="relative h-6 bg-primary/10 rounded overflow-hidden flex items-center">
                                <div className="animate-marquee whitespace-nowrap text-[9px] font-bold text-primary">
                                    {draftSettings.newsTickerText || "Waiting for input..."}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-card/68 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Type className="w-4 h-4"/> Terminal Typography</CardTitle>
                        <CardDescription>Upload a custom TrueType Font (.ttf) to transform the entire terminal's look.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 border-2 border-dashed rounded-xl bg-muted/30 text-center space-y-3">
                            <Label className="block">Upload TTF Font File</Label>
                            <Input type="file" accept=".ttf" onChange={e => handleFileUpload(e, 'customFont')} className="max-w-xs mx-auto" />
                            {draftSettings.customFont && (
                                <div className="pt-2">
                                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                                        <Check className="w-3 h-3 mr-1"/> Neural Font Active
                                    </Badge>
                                </div>
                            )}
                        </div>
                        <div className="p-3 bg-muted/20 rounded-lg">
                            <p className="text-[10px] font-bold uppercase opacity-60 mb-1">Typography Audit</p>
                            <p className="text-sm font-bold" style={{ fontFamily: draftSettings.customFont ? 'CustomAppFont' : 'inherit' }}>
                                THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG. 1234567890
                            </p>
                        </div>
                    </CardContent>
                </Card>
             </div>
          </TabsContent>

          <TabsContent value="pdf" className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ImageControl 
                    label="Print Header" 
                    description="Custom letterhead for all PDF reports." 
                    value={draftSettings.printHeaderImage} 
                    onValueChange={v => updateSetting('printHeaderImage', v)}
                    onFileUpload={e => handleFileUpload(e, 'printHeaderImage')}
                />
                <ImageControl 
                    label="Print Footer" 
                    description="Global footer image for printed documents." 
                    value={draftSettings.printFooterImage} 
                    onValueChange={v => updateSetting('printFooterImage', v)}
                    onFileUpload={e => handleFileUpload(e, 'printFooterImage')}
                />
             </div>
          </TabsContent>

          <TabsContent value="admin" className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <AdminPowerSuite />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t p-4 z-50 flex justify-center animate-in slide-in-from-bottom-full duration-500">
          <div className="w-full max-w-4xl flex items-center justify-between gap-4">
              <div className="hidden md:block">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                      {isDirty ? "Configuration pending synchronization..." : "Terminal synchronized with Firestore."}
                  </p>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                  <Button variant="ghost" size="sm" className="flex-1 md:flex-none" onClick={() => setDraftSettings(settings)} disabled={!isDirty || isSaving}>
                      <X className="mr-2 h-3.5 w-3.5" /> Discard
                  </Button>
                  <Button className="flex-1 md:flex-none shadow-xl px-12 h-10 font-bold" onClick={handleSave} disabled={!isDirty || isSaving || !isAdmin}>
                      {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      {t('save_all_changes')}
                  </Button>
              </div>
          </div>
      </footer>
    </div>
  );
}

export default withAuth(SettingsPage);
