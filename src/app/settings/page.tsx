
'use client';

import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Save,
  Palette,
  ShieldCheck,
  ImageIcon as ImageIconLucide,
  Languages,
  FileText,
  Loader2,
  Users,
  Cloud,
  Play,
  RefreshCcw,
  Plus,
  Edit,
  Trash2,
  KeyRound,
  Check,
  Monitor,
  X,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/hooks/use-translation';
import type {
  ThemeColors,
  AppSettings,
  Role,
} from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import withAuth from '@/hooks/withAuth';
import { useAppContext } from '@/context/app-provider';
import { useAuth } from '@/hooks/use-auth';
import { initialSettings } from '@/context/initial-data';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { allPermissions } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const themes = [
  { name: 'default', color: 'bg-blue-500', label: 'Default Blue' },
  { name: 'emerald', color: 'bg-emerald-500', label: 'Emerald Green' },
  { name: 'rose', color: 'bg-rose-500', label: 'Rose Pink' },
  { name: 'amber', color: 'bg-amber-500', label: 'Amber Gold' },
  { name: 'violet', color: 'bg-violet-500', label: 'Violet Purple' },
  { name: 'orange', color: 'bg-orange-500', label: 'Sunset Orange' },
  { name: 'cyan', color: 'bg-cyan-500', label: 'Sky Cyan' },
  { name: 'indigo', color: 'bg-indigo-500', label: 'Indigo Night' },
  { name: 'zinc', color: 'bg-zinc-800', label: 'Industrial Zinc' },
  { name: 'crimson', color: 'bg-red-700', label: 'Crimson Red' },
  { name: 'custom', color: 'bg-gradient-to-tr from-gray-400 to-gray-200', label: 'Custom Architect' },
];

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  
  const parseHsl = (hsl: string) => {
    if (typeof hsl !== 'string' || hsl.split(' ').length !== 3) {
      return { h: '0', s: '0', l: '0' };
    }
    const [h, s, l] = hsl.replace(/%/g, '').split(' ').map(s => s.trim());
    return { h, s, l };
  };

  const { h, s, l } = parseHsl(value);

  const handleHslChange = (part: 'h' | 's' | 'l', newValue: string) => {
    const current = parseHsl(value);
    current[part] = newValue;
    onChange(`${current.h} ${current.s}% ${current.l}%`);
  };

  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
      <div className="space-y-0.5">
        <Label className="capitalize text-sm font-bold tracking-tight">
          {t(label.toLowerCase().replace(/ /g, '_'))}
        </Label>
        <p className="text-[10px] text-muted-foreground uppercase font-mono">{value}</p>
      </div>
      <div className="flex items-center gap-3">
        <div 
            className="w-10 h-10 rounded-full border-2 border-background shadow-sm" 
            style={{ backgroundColor: `hsl(${value})` }}
        />
        <div className="flex items-center gap-1">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-center font-bold text-muted-foreground">H</span>
            <Input
                className="h-8 w-14 text-xs font-mono"
                value={h}
                onChange={e => handleHslChange('h', e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-center font-bold text-muted-foreground">S</span>
            <Input
                className="h-8 w-12 text-xs font-mono"
                value={s}
                onChange={e => handleHslChange('s', e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-center font-bold text-muted-foreground">L</span>
            <Input
                className="h-8 w-12 text-xs font-mono"
                value={l}
                onChange={e => handleHslChange('l', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function UserManagementTab() {
  const { users, roles } = useAppContext();
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">User Accounts</h3>
            <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add User
            </Button>
        </div>
        <div className="border rounded-xl overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map(user => (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.username}</TableCell>
                            <TableCell>{roles.find(r => r.id === user.roleId)?.name || 'Unknown'}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon">
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    </div>
  );
}

function RoleManagementTab() {
    const { roles } = useAppContext();
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

    useEffect(() => {
        if (roles.length > 0 && !selectedRole) {
            setSelectedRole(roles[0]);
        }
    }, [roles, selectedRole]);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Label>Select Role:</Label>
                <div className="flex gap-2 flex-wrap">
                    {roles.map(role => (
                        <Button 
                            key={role.id} 
                            variant={selectedRole?.id === role.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedRole(role)}
                        >
                            {role.name}
                        </Button>
                    ))}
                </div>
            </div>

            {selectedRole && (
                <div className="border p-4 rounded-xl space-y-4 bg-muted/30">
                    <h4 className="font-bold text-sm">Permissions for {selectedRole.name}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
                        {allPermissions.map(permission => (
                            <div key={permission.id} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`perm-${permission.id}`} 
                                    checked={selectedRole.permissions.includes(permission.id)}
                                    disabled
                                />
                                <Label htmlFor={`perm-${permission.id}`} className="text-xs">{permission.description}</Label>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function ActivityLogsTab() {
    const { t } = useTranslation();
    const { activityLogs } = useAppContext();

    const sortedLogs = useMemo(() => {
        return [...activityLogs].sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());
    }, [activityLogs]);

    const getActionBadgeVariant = (action: string) => {
        switch (action) {
            case 'create': return 'default';
            case 'update': return 'secondary';
            case 'delete': return 'destructive';
            case 'login': return 'outline';
            default: return 'outline';
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold">{t('activity_log')}</h3>
            <div className="border rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('user')}</TableHead>
                            <TableHead>{t('action')}</TableHead>
                            <TableHead>{t('description')}</TableHead>
                            <TableHead className="text-right">{t('timestamp')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedLogs.length > 0 ? (
                            sortedLogs.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell className="font-medium">{log.username}</TableCell>
                                    <TableCell><Badge variant={getActionBadgeVariant(log.action)}>{log.action}</Badge></TableCell>
                                    <TableCell className="text-xs">{log.description}</TableCell>
                                    <TableCell className="text-right text-xs whitespace-nowrap">{format(parseISO(log.timestamp), 'PP p')}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No logs found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
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
        setDraftSettings(prev => {
          const newSettings = JSON.parse(JSON.stringify(prev));
          const keys = settingKeyPath.split('.');
          let current: any = newSettings;
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
          }
          current[keys[keys.length - 1]] = localUrl;
          return newSettings;
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleThemeColorChange = (mode: 'light' | 'dark', property: keyof ThemeColors, value: string) => {
    const themeKey = mode === 'light' ? 'lightThemeColors' : 'darkThemeColors';
    setDraftSettings(prev => ({
      ...prev,
      [themeKey]: {
        ...prev[themeKey],
        [property]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!isAdmin) return;
    setIsSaving(true);
    try {
        await setSettings(draftSettings);
        toast({ title: 'Settings Saved', description: 'Your changes have been applied.' });
    } catch (err) {
        toast({ variant: 'destructive', title: 'Save Failed', description: 'An error occurred while saving.' });
    } finally {
        setIsSaving(false);
    }
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="design"><Palette className="mr-2 h-4 w-4" /> {t('design')}</TabsTrigger>
            <TabsTrigger value="images"><ImageIconLucide className="mr-2 h-4 w-4" /> {t('images')}</TabsTrigger>
            <TabsTrigger value="language"><Languages className="mr-2 h-4 w-4" /> {t('language_text')}</TabsTrigger>
            <TabsTrigger value="pdf"><FileText className="mr-2 h-4 w-4" /> {t('pdf_reports')}</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin"><ShieldCheck className="mr-2 h-4 w-4" /> Admin Control</TabsTrigger>}
          </TabsList>

          <TabsContent value="design" className="pt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Theme Architect</CardTitle>
                <CardDescription>Select a professional preset or use "Custom Architect" to design your own color space.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                    {themes.map((theme) => (
                      <button
                        key={theme.name}
                        onClick={() => setDraftSettings(prev => ({ ...prev, selectedTheme: theme.name }))}
                        className={cn(
                          "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:bg-muted/50",
                          draftSettings.selectedTheme === theme.name ? "border-primary bg-primary/5 shadow-inner" : "border-transparent"
                        )}
                      >
                        <div className={cn("w-12 h-12 rounded-full shadow-lg border-2 border-white", theme.color)} />
                        <span className="text-[10px] font-bold uppercase tracking-tighter text-center">{theme.label}</span>
                        {draftSettings.selectedTheme === theme.name && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-primary font-bold">
                        <Monitor className="w-5 h-5" />
                        <h3>Advanced Color Customization</h3>
                    </div>
                    
                    <Tabs defaultValue="light">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="light">Light Mode Palettes</TabsTrigger>
                            <TabsTrigger value="dark">Dark Mode Palettes</TabsTrigger>
                        </TabsList>
                        <TabsContent value="light" className="space-y-2 pt-4">
                            <ColorPicker label="Primary Accent (Frontend)" value={draftSettings.lightThemeColors.primary} onChange={c => handleThemeColorChange('light', 'primary', c)} />
                            <ColorPicker label="System Background" value={draftSettings.lightThemeColors.background} onChange={c => handleThemeColorChange('light', 'background', c)} />
                            <ColorPicker label="Interface Accent" value={draftSettings.lightThemeColors.accent} onChange={c => handleThemeColorChange('light', 'accent', c)} />
                        </TabsContent>
                        <TabsContent value="dark" className="space-y-2 pt-4">
                            <ColorPicker label="Primary Accent (Frontend)" value={draftSettings.darkThemeColors.primary} onChange={c => handleThemeColorChange('dark', 'primary', c)} />
                            <ColorPicker label="System Background" value={draftSettings.darkThemeColors.background} onChange={c => handleThemeColorChange('dark', 'background', c)} />
                            <ColorPicker label="Interface Accent" value={draftSettings.darkThemeColors.accent} onChange={c => handleThemeColorChange('dark', 'accent', c)} />
                        </TabsContent>
                    </Tabs>
                  </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images" className="pt-6 space-y-6">
            <Card>
              <CardHeader><CardTitle>{t('app_logo')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="relative w-full h-24 border rounded-md p-2 flex justify-center bg-muted/30">
                  {draftSettings.appLogo && <Image src={draftSettings.appLogo} alt="Logo" fill className="object-contain" unoptimized />}
                </div>
                <Input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'appLogo')} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t('main_dashboard_background')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="relative w-full h-32 border rounded-md overflow-hidden bg-muted/30">
                  {draftSettings.mainBackground && <Image src={draftSettings.mainBackground} alt="Background" fill className="object-cover" unoptimized />}
                </div>
                <Input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'mainBackground')} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="language" className="pt-6">
             <Card>
                <CardHeader><CardTitle>{t('custom_app_font')}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <Input type="file" accept=".ttf,.otf" onChange={e => handleFileUpload(e, 'customFont')} />
                    <p className="text-xs text-muted-foreground">Upload a .ttf or .otf font file to use custom typography across the terminal.</p>
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="admin" className="pt-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                      <Card>
                          <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-primary">
                                  <Users className="h-5 w-5" /> User Management
                              </CardTitle>
                              <CardDescription>Manage terminal operators and their access roles.</CardDescription>
                          </CardHeader>
                          <CardContent>
                              <UserManagementTab />
                          </CardContent>
                      </Card>

                      <Card>
                          <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-primary">
                                  <ShieldCheck className="h-5 w-5" /> Role &amp; Permission Management
                              </CardTitle>
                              <CardDescription>Configure system access levels for different roles.</CardDescription>
                          </CardHeader>
                          <CardContent>
                              <RoleManagementTab />
                          </CardContent>
                      </Card>

                      <Card>
                          <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-primary">
                                  <RefreshCcw className="h-5 w-5" /> System Activity
                              </CardTitle>
                              <CardDescription>Monitor important system actions performed by users.</CardDescription>
                          </CardHeader>
                          <CardContent>
                              <ActivityLogsTab />
                          </CardContent>
                      </Card>

                      <Card>
                          <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-primary">
                                  <Cloud className="h-5 w-5" /> Firebase Rollout Hub
                              </CardTitle>
                              <CardDescription>Troubleshooting guide for successful cloud deployment on Firebase.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-6">
                              <div className="p-5 rounded-2xl border-2 bg-amber-50 border-amber-100 space-y-2 text-amber-900 shadow-sm">
                                  <p className="text-sm font-bold flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Resolving Rollout Errors</p>
                                  <p className="text-xs leading-relaxed opacity-80">
                                      If your build fails or the site doesn't load after deployment, ensure your Firebase environment is correctly configured in the Firebase Console under:
                                      <br/><strong>App Hosting &gt; Your Backend &gt; Settings</strong>
                                  </p>
                              </div>
                              
                              <div className="space-y-4">
                                  <h4 className="text-sm font-bold flex items-center gap-2"><Play className="h-4 w-4" /> Deployment Steps</h4>
                                  <ul className="space-y-2 text-xs text-muted-foreground list-disc pl-4">
                                      <li>Push your code to a GitHub Repository.</li>
                                      <li>Connect the repo via the Firebase Console App Hosting dashboard.</li>
                                      <li>Ensure your project is on the <strong>Blaze Plan</strong> for App Hosting.</li>
                                  </ul>
                              </div>
                          </CardContent>
                      </Card>
                  </div>

                  <div className="lg:col-span-1 space-y-6">
                      <Card className="border-destructive/20 shadow-lg">
                          <CardHeader className="bg-destructive/5 border-b border-destructive/10">
                              <CardTitle className="text-destructive flex items-center gap-2">
                                  <RefreshCcw className="h-4 w-4" /> Reset Terminal
                              </CardTitle>
                              <CardDescription>Permanently wipe all data.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4 pt-6">
                              <p className="text-xs text-muted-foreground">Type <strong>RESET</strong> below to confirm. This will delete all records.</p>
                              <Input value={resetConfirmText} onChange={e => setResetConfirmText(e.target.value)} placeholder="Type RESET to confirm" />
                          </CardContent>
                          <CardFooter>
                              <Button variant="destructive" className="w-full font-bold" disabled={resetConfirmText !== "RESET"} onClick={handleResetToDefault}>
                                Execute Full Reset
                              </Button>
                          </CardFooter>
                      </Card>
                  </div>
              </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Sticky Save Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t p-4 z-50 flex justify-center">
          <div className="w-full max-w-4xl flex items-center justify-between gap-4">
              <div className="hidden md:block">
                  <p className="text-sm font-medium text-muted-foreground">
                      {isDirty ? "You have unsaved changes." : "All configurations are synchronized."}
                  </p>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                  <Button variant="outline" className="flex-1 md:flex-none" onClick={() => setDraftSettings(settings)} disabled={!isDirty || isSaving}>
                      <X className="mr-2 h-4 w-4" /> Discard
                  </Button>
                  <Button className="flex-1 md:flex-none shadow-lg px-8" onClick={handleSave} disabled={!isDirty || isSaving || !isAdmin}>
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
