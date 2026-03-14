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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { useTheme } from '@/components/shared/theme-provider';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/hooks/use-translation';
import type {
  ThemeColors,
  AppSettings,
  User,
  ActivityLog,
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

  const hslToHex = (h: number, s: number, l: number): string => {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
      l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return `#${[0, 8, 4]
      .map(n => Math.round(f(n) * 255).toString(16).padStart(2, '0'))
      .join('')}`;
  };

  return (
    <div className="flex items-center justify-between">
      <Label className="capitalize text-sm">
        {t(label.toLowerCase().replace(/ /g, '_'))}
      </Label>
      <div className="flex items-center gap-2">
        <Input
          type="color"
          value={hslToHex(Number(h), Number(s), Number(l))}
          readOnly
          className="w-8 h-8 p-1 rounded-md pointer-events-none"
        />
        <div className="flex items-center gap-1 text-xs">
          <Input
            className="h-7 w-14 text-xs"
            placeholder="H"
            value={h}
            onChange={e => handleHslChange('h', e.target.value)}
          />
          <Input
            className="h-7 w-12 text-xs"
            placeholder="S"
            value={s}
            onChange={e => handleHslChange('s', e.target.value)}
          />
          <Input
            className="h-7 w-12 text-xs"
            placeholder="L"
            value={l}
            onChange={e => handleHslChange('l', e.target.value)}
          />
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
                <div className="flex gap-2">
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="bg-card border-b p-4">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/">
                <ArrowLeft />
              </Link>
            </Button>
            <h1 className="text-xl">{t('settings')}</h1>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <Button onClick={handleSave} disabled={!isDirty || isSaving || !isAdmin}>
              {isSaving ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2 h-4 w-4" />}
              {t('save_all_changes')}
            </Button>
          </div>
        </div>
      </header>
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
              <CardHeader><CardTitle>Theme Colors</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                  <Tabs defaultValue="light">
                      <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="light">Light</TabsTrigger>
                          <TabsTrigger value="dark">Dark</TabsTrigger>
                      </TabsList>
                      <TabsContent value="light" className="space-y-4 pt-4">
                          <ColorPicker label="Primary" value={draftSettings.lightThemeColors.primary} onChange={c => handleThemeColorChange('light', 'primary', c)} />
                          <ColorPicker label="Background" value={draftSettings.lightThemeColors.background} onChange={c => handleThemeColorChange('light', 'background', c)} />
                          <ColorPicker label="Accent" value={draftSettings.lightThemeColors.accent} onChange={c => handleThemeColorChange('light', 'accent', c)} />
                      </TabsContent>
                      <TabsContent value="dark" className="space-y-4 pt-4">
                          <ColorPicker label="Primary" value={draftSettings.darkThemeColors.primary} onChange={c => handleThemeColorChange('dark', 'primary', c)} />
                          <ColorPicker label="Background" value={draftSettings.darkThemeColors.background} onChange={c => handleThemeColorChange('dark', 'background', c)} />
                          <ColorPicker label="Accent" value={draftSettings.darkThemeColors.accent} onChange={c => handleThemeColorChange('dark', 'accent', c)} />
                      </TabsContent>
                  </Tabs>
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
                              <CardTitle className="flex items-center gap-2">
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
                              <CardTitle className="flex items-center gap-2">
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
                              <CardTitle className="flex items-center gap-2">
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
                              <CardTitle className="flex items-center gap-2">
                                  <Cloud className="h-5 w-5" /> Cloud Rollout &amp; Publishing Hub
                              </CardTitle>
                              <CardDescription>Troubleshooting guide for successful cloud deployment.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-6">
                              <div className="p-5 rounded-2xl border-2 bg-amber-50 border-amber-100 space-y-2 text-amber-900">
                                  <p className="text-sm font-bold flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Resolving "Rollout Error"</p>
                                  <p className="text-xs leading-relaxed opacity-80">
                                      If you see "Something went wrong creating your App Hosting rollout", it usually means environment variables are missing. In the Firebase Console, go to:
                                      <br/><strong>App Hosting &gt; Your Backend &gt; Settings &gt; Environment Variables</strong>
                                  </p>
                                  <div className="bg-white/50 p-2 rounded font-mono text-[10px]">
                                      Add: NEXT_PUBLIC_SUPABASE_URL<br/>
                                      Add: NEXT_PUBLIC_SUPABASE_ANON_KEY
                                  </div>
                              </div>
                              
                              <div className="space-y-4">
                                  <h4 className="text-sm font-bold flex items-center gap-2"><Play className="h-4 w-4" /> Deployment Steps</h4>
                                  <ul className="space-y-2 text-xs text-muted-foreground list-disc pl-4">
                                      <li>Push code to a private GitHub Repository.</li>
                                      <li>Connect the repo via Firebase App Hosting dashboard.</li>
                                      <li>Ensure your project is on the <strong>Blaze Plan</strong>.</li>
                                  </ul>
                              </div>
                          </CardContent>
                      </Card>
                  </div>

                  <div className="lg:col-span-1 space-y-6">
                      <Card className="border-destructive/20">
                          <CardHeader>
                              <CardTitle className="text-destructive flex items-center gap-2">
                                  <RefreshCcw className="h-4 w-4" /> Reset Terminal
                              </CardTitle>
                              <CardDescription>Permanently wipe all cloud and local data.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                              <p className="text-xs text-muted-foreground">Type <strong>RESET</strong> below to confirm. This will delete all employees, inventory, and settings records.</p>
                              <Input value={resetConfirmText} onChange={e => setResetConfirmText(e.target.value)} placeholder="Type RESET to confirm" />
                          </CardContent>
                          <CardFooter>
                              <Button variant="destructive" className="w-full" disabled={resetConfirmText !== "RESET"} onClick={handleResetToDefault}>
                                Execute Full Reset
                              </Button>
                          </CardFooter>
                      </Card>
                  </div>
              </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default withAuth(SettingsPage);
