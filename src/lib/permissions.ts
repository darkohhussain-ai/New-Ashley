
import type { Permission } from './types';

export const allPermissions: Permission[] = [
    { id: 'admin:all', description: 'Full access to all system features (Admin only)'},
    
    // Page access permissions
    { id: 'page:admin', description: 'Access the Admin Panel' },
    { id: 'page:ashley-expenses', description: 'Access Ashley Employees Management' },
    { id: 'page:transmit', description: 'Access Transmit Cargo' },
    { id: 'page:items', description: 'Access Placement & Storage' },
    { id: 'page:marketing-feedback', description: 'Access Marketing Feedback' },
    { id: 'page:settings', description: 'Access Settings' },
    { id: 'page:employees', description: 'Access Employees' },
    { id: 'page:account', description: 'Access My Account' },
    
    // Feature/action permissions can be added here later
    // e.g., { id: 'user:create', description: 'Can create new users' },
    // e.g., { id: 'items:edit', description: 'Can edit item details' }
];

export const adminPermissions = allPermissions.map(p => p.id);

export const adminAssistantPermissions = allPermissions.filter(p => p.id !== 'admin:all').map(p => p.id);

// Viewer can see all pages but cannot edit
export const viewerPermissions = allPermissions.filter(p => p.id.startsWith('page:')).map(p => p.id);

// Employee/Member can only see their account and placement/storage
export const employeePermissions = [
    'page:account',
    'page:items',
];

export const financeManagerPermissions = [
    'page:ashley-expenses',
    'page:account'
];

export const inventoryManagerPermissions = [
    'page:items',
    'page:transmit',
    'page:account'
];

export const hrManagerPermissions = [
    'page:employees',
    'page:marketing-feedback',
    'page:account'
];
