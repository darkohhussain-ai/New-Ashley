
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
  Code,
  Brush,
  Link as LinkIcon,
  Users,
  Users2,
  Activity,
  Trash2,
  Edit,
  Search,
  KeyRound,
  ShieldAlert,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from '@/components/ui/checkbox';
import type { AppSettings, ThemeColors, User, Role, Employee, ActivityLog } from '@/lib/types';
import withAuth from '@/hooks/withAuth';
import { useAppContext } from '@/context/app-provider';
import { useAuth } from '@/hooks/use-auth';
import { initialSettings } from '@/context/initial-data';
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

function ColorPicker({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) {
    return (
        <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</Label>
            <div className="flex items-center gap-2">
                <div 
                    className="w-10 h-10 rounded-lg border shadow-sm shrink-0" 
                    style={{ backgroundColor: `hsl(${value})` }}
                />
                <Input 
                    value={value} 
                    onChange={e => onChange(e.target.value)} 
                    placeholder="e.g. 220 80% 50%"
                    className="h-9 text-xs font-mono"
                />
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
    const { t } = useTranslation();
    return (
        <Card className="border-none shadow-sm bg-card/30 backdrop-blur-sm">
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
                            {t('import_via_url')}
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
                            {t('upload_manually')}
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
    const { users, setUsers, roles, setRoles, employees, activityLogs, setActivityLogs } = useAppContext();
    const { user: currentUser } = useAuth();
    const { toast } = useToast();

    // User State
    const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    
    // Roles State
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

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

    const handleSaveRole = () => {
        if (!selectedRole) return;
        setRoles(roles.map(r => r.id === selectedRole.id ? selectedRole : r));
        toast({ title: t("role_updated"), description: t('role_updated_desc', {roleName: selectedRole.name})});
    };

    return (
        <div className="space-y-8">
            <Tabs defaultValue="users" className="w-full">
                <TabsList className="bg-muted/30 p-1 mb-6">
                    <TabsTrigger value="users" className="text-xs font-bold uppercase tracking-widest"><Users className="w-3 h-3 mr-2" /> Users</TabsTrigger>
                    <TabsTrigger value="roles" className="text-xs font-bold uppercase tracking-widest"><ShieldCheck className="w-3 h-3 mr-2" /> Roles</TabsTrigger>
                    <TabsTrigger value="activity" className="text-xs font-bold uppercase tracking-widest"><Activity className="w-3 h-3 mr-2" /> Logs</TabsTrigger>
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
                                    <TableHead className="text-[10px] uppercase font-black tracking-widest">Username</TableHead>
                                    <TableHead className="text-[10px] uppercase font-black tracking-widest">Role</TableHead>
                                    <TableHead className="text-right text-[10px] uppercase font-black tracking-widest">Actions</TableHead>
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
                    <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-xl border">
                        <Label className="text-xs font-bold uppercase tracking-widest">Select Role:</Label>
                        <Select value={selectedRole?.id || ''} onValueChange={(val) => setSelectedRole(roles.find(r => r.id === val) || null)}>
                            <SelectTrigger className="w-64 h-9 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button size="sm" onClick={handleSaveRole} disabled={selectedRole?.name === 'Admin'}>
                            <Save className="w-3 h-3 mr-2" /> {t('save_changes')}
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
            </Tabs>
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
  const [resetConfirmText, setResetConfirmText] = useState("");
  
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

  const handleResetToDefault = async () => {
    if (resetConfirmText !== "RESET") return;
    await setSettings(initialSettings);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-24">
      <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full">
        <Tabs defaultValue="design" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5 h-auto p-1 bg-muted/50 rounded-xl">
            <TabsTrigger value="design" className="py-2"><Palette className="mr-2 h-4 w-4" /> {t('design')}</TabsTrigger>
            <TabsTrigger value="images" className="py-2"><ImageIconLucide className="mr-2 h-4 w-4" /> {t('images')}</TabsTrigger>
            <TabsTrigger value="language" className="py-2"><Languages className="mr-2 h-4 w-4" /> {t('language_text')}</TabsTrigger>
            <TabsTrigger value="pdf" className="py-2"><FileText className="mr-2 h-4 w-4" /> {t('pdf_reports')}</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin" className="py-2"><ShieldCheck className="mr-2 h-4 w-4" /> Admin</TabsTrigger>}
          </TabsList>

          <TabsContent value="design" className="pt-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <Card className="border-none shadow-sm bg-card/30 backdrop-blur-sm">
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
                                  <ColorPicker label="Table Row Primary" value={draftSettings.darkThemeColors.tableRowPrimary} onChange={v => updateCustomColor('dark', 'tableRowPrimary', v)} />
                                  <ColorPicker label="Table Row Secondary" value={draftSettings.darkThemeColors.tableRowSecondary} onChange={v => updateCustomColor('dark', 'tableRowSecondary', v)} />
                              </div>
                          </div>
                      </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images" className="pt-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
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

            <Card className="border-none shadow-sm bg-card/30 backdrop-blur-sm mt-6">
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
                        label="Login Button HSL" 
                        value={draftSettings.loginButtonColor || draftSettings.lightThemeColors.primary} 
                        onChange={v => updateSetting('loginButtonColor', v)} 
                    />
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="language" className="pt-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm bg-card/30 backdrop-blur-sm">
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

                <Card className="border-none shadow-sm bg-card/30 backdrop-blur-sm">
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

          <TabsContent value="pdf" className="pt-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
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

          <TabsContent value="admin" className="pt-6 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <AdminPowerSuite />
              
              <Separator />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-destructive/20 shadow-sm bg-destructive/5">
                      <CardHeader className="border-b border-destructive/10">
                          <CardTitle className="text-destructive flex items-center gap-2">
                              <ShieldAlert className="h-4 w-4" /> Full Terminal Reset
                          </CardTitle>
                          <CardDescription>Permanently wipe all application data and return to initial factory state.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-6">
                          <p className="text-xs text-muted-foreground italic">This action is irreversible. All employees, reports, themes, and images will be permanently deleted from the database.</p>
                          <div className="space-y-2">
                              <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Authentication Required</Label>
                              <Input 
                                value={resetConfirmText} 
                                onChange={e => setResetConfirmText(e.target.value)} 
                                placeholder="Type RESET to confirm"
                                className="border-destructive/30 focus-visible:ring-destructive bg-background/50 h-9 text-xs"
                              />
                          </div>
                      </CardContent>
                      <CardFooter>
                          <Button variant="destructive" className="w-full font-black uppercase tracking-widest" disabled={resetConfirmText !== "RESET"} onClick={handleResetToDefault}>
                            Reset Terminal
                          </Button>
                      </CardFooter>
                  </Card>
              </div>
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
