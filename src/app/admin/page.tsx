
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, Users, KeyRound, Save, Plus, Trash2, Edit, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-provider';
import type { User, Role, Employee } from '@/lib/types';
import { allPermissions } from '@/lib/permissions';

const useAdminAuth = () => {
  const { user, loading, hasPermission } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!loading) {
      const adminCheck = hasPermission('admin:all');
      setIsAdmin(adminCheck);
      if (!adminCheck) {
        router.replace('/');
      }
    }
  }, [user, loading, hasPermission, router]);

  return { user, loading, isAdmin };
};

function UserManagement() {
  const { users, setUsers, roles, employees } = useAppContext();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleSaveUser = (user: User, isNew: boolean) => {
    if(isNew) {
        setUsers([...users, user]);
        toast({ title: "User Created", description: `A user account for ${user.username} has been created.` });
    } else {
        setUsers(users.map(u => u.id === user.id ? user : u));
        toast({ title: "User Updated", description: `Details for ${user.username} have been updated.` });
    }
    setEditingUser(null);
    setIsDialogOpen(false);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
    toast({ title: "User Deleted", description: "The user has been removed." });
  };
  
  const getRoleName = (roleId: string) => roles.find(r => r.id === roleId)?.name || 'Unknown Role';

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>Add, edit, or remove user accounts and assign their roles.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-right">
          <Button onClick={() => { setEditingUser(null); setIsDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add User
          </Button>
        </div>
        <div className="overflow-x-auto">
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
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{getRoleName(user.roleId)}</TableCell>
                    <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingUser(user); setIsDialogOpen(true); }}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)} disabled={user.username === 'Darko Haidar'}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
      </CardContent>
      <UserDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        user={editingUser} 
        onSave={handleSaveUser} 
        roles={roles}
        employees={employees}
        existingUsers={users}
      />
    </Card>
  );
}

function UserDialog({ open, onOpenChange, user, onSave, roles, employees, existingUsers }: { open: boolean, onOpenChange: (open: boolean) => void, user: User | null, onSave: (user: User, isNew: boolean) => void, roles: Role[], employees: Employee[], existingUsers: User[] }) {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [password, setPassword] = useState('');
    const [roleId, setRoleId] = useState('');
    const isNewUser = !user;

    const availableEmployees = useMemo(() => {
        const existingUsernames = new Set(existingUsers.map(u => u.username));
        return employees.filter(emp => !existingUsernames.has(emp.name));
    }, [employees, existingUsers]);
  
    useEffect(() => {
      if (user) {
        setSelectedEmployeeId(''); // Not applicable for editing
        setPassword(''); // Always clear password for security
        setRoleId(user.roleId);
      } else {
        // Reset for new user
        setSelectedEmployeeId('');
        setPassword('');
        setRoleId('role-viewer'); // Default to Viewer
      }
    }, [user, open]);
  
    const handleSubmit = () => {
      if(isNewUser) {
        if (!selectedEmployeeId) {
            alert("Please select an employee.");
            return;
        }
        const selectedEmp = employees.find(e => e.id === selectedEmployeeId);
        if (!selectedEmp) {
            alert("Selected employee not found.");
            return;
        }
        
        const defaultPassword = `${selectedEmp.name.split(' ')[0].toLowerCase()}123`;
        const newUser: User = {
            id: `user-${selectedEmp.id}`,
            username: selectedEmp.name,
            password: password || defaultPassword,
            roleId
        }
        onSave(newUser, true);
      } else { // Editing existing user
        const updatedUser: User = {
            ...user!,
            roleId,
        };
        if (password) {
            updatedUser.password = password;
        }
        onSave(updatedUser, false);
      }
    };
  
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{user ? 'Edit User' : 'Add User'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                {isNewUser ? (
                    <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                        <SelectTrigger id="username">
                            <SelectValue placeholder="Select an employee" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableEmployees.map(emp => (
                                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <Input id="username" value={user.username} disabled />
                )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={isNewUser ? "Leave blank for default (firstname123)" : "Leave blank to keep current password"} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id} disabled={user?.username === 'Darko Haidar' && role.name !== 'Admin'}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
}


function RoleManagement() {
    const { roles, setRoles } = useAppContext();
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const { toast } = useToast();
  
    useEffect(() => {
      if (roles.length > 0 && !selectedRole) {
        setSelectedRole(roles[0]);
      }
    }, [roles, selectedRole]);

    const handlePermissionChange = (permission: string, checked: boolean) => {
        if (!selectedRole) return;
        
        setSelectedRole(prev => {
            if (!prev) return null;
            const newPermissions = checked
                ? [...prev.permissions, permission]
                : prev.permissions.filter(p => p !== permission);
            return { ...prev, permissions: newPermissions };
        });
    };

    const handleSaveRole = () => {
        if (!selectedRole) return;
        setRoles(roles.map(r => r.id === selectedRole.id ? selectedRole : r));
        toast({ title: "Role Updated", description: `Permissions for ${selectedRole.name} have been saved.`});
    };
  
    return (
      <Card>
        <CardHeader>
          <CardTitle>Role & Permission Management</CardTitle>
          <CardDescription>Select a role to view and edit its page access permissions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
                <Label htmlFor="role-select">Select Role:</Label>
                <Select value={selectedRole?.id || ''} onValueChange={(roleId) => setSelectedRole(roles.find(r => r.id === roleId) || null)}>
                    <SelectTrigger id="role-select" className="w-[250px]">
                        <SelectValue placeholder="Select a role..." />
                    </SelectTrigger>
                    <SelectContent>
                        {roles.map(role => (
                            <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {selectedRole && (
                <div className="border p-4 rounded-lg">
                    <h3 className="font-semibold mb-4">Permissions for {selectedRole.name}</h3>
                    <div className="max-h-[40vh] overflow-y-auto space-y-2">
                        {allPermissions.map(permission => (
                            <div key={permission.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`perm-${permission.id}`}
                                    checked={selectedRole.permissions.includes(permission.id)}
                                    onCheckedChange={(checked) => handlePermissionChange(permission.id, !!checked)}
                                    disabled={selectedRole.name === 'Admin' || selectedRole.name === 'Viewer'}
                                />
                                <label htmlFor={`perm-${permission.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    {permission.description}
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 text-right">
                        <Button onClick={handleSaveRole} disabled={selectedRole.name === 'Admin' || selectedRole.name === 'Viewer'}>
                            <Save className="mr-2 h-4 w-4" /> Save Permissions for {selectedRole.name}
                        </Button>
                    </div>
                </div>
            )}
        </CardContent>
      </Card>
    );
}

export default function AdminPage() {
  const { isAdmin, loading } = useAdminAuth();

  if (loading || !isAdmin) {
    return (
      <div className="flex h-[calc(100vh-80px)] w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-8 w-8" />
          Admin Panel
        </h1>
        <p className="text-muted-foreground">System configuration and user management.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <UserManagement />
        <RoleManagement />
      </div>
    </main>
  );
}
