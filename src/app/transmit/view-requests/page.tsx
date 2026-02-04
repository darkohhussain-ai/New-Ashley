'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Calendar as CalendarIcon, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO, isSameMonth, startOfMonth, subMonths, addMonths } from 'date-fns';
import { useAppContext } from '@/context/app-provider';
import type { ItemForTransfer, ActivityLog } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';
import withAuth from '@/hooks/withAuth';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

const destinations = ["Erbil", "Baghdad", "Diwan", "Dohuk"];

function ViewRequestsPage() {
    const { t } = useTranslation();
    const { transferItems, setTransferItems, isLoading, setActivityLogs } = useAppContext();
    const { toast } = useToast();
    const { user } = useAuth();
    
    const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()));
    const [editingItem, setEditingItem] = useState<ItemForTransfer | null>(null);

    const monthlyRequests = useMemo(() => {
        if (!transferItems) return [];
        return transferItems.filter(item => item.requestDate && isSameMonth(parseISO(item.requestDate), selectedMonth))
               .sort((a,b) => parseISO(b.requestDate!).getTime() - parseISO(a.requestDate!).getTime());
    }, [transferItems, selectedMonth]);

    const handleDelete = (item: ItemForTransfer) => {
        setTransferItems(prev => prev.filter(i => i.id !== item.id));
        toast({ title: t('request_deleted'), description: t('request_for_model_deleted', {model: item.model}) });
        if (user) {
            const log: ActivityLog = { id: crypto.randomUUID(), userId: user.id, username: user.username, action: 'delete', entity: 'Order Request', entityId: item.id, description: `Deleted order request for "${item.model}".`, timestamp: new Date().toISOString() };
            setActivityLogs(prev => [...prev, log]);
        }
    };
    
    const handleUpdate = () => {
        if(!editingItem) return;
        setTransferItems(prev => prev.map(i => i.id === editingItem.id ? editingItem : i));
        toast({ title: t('request_updated'), description: t('request_for_model_updated', {model: editingItem.model}) });
         if (user) {
            const log: ActivityLog = { id: crypto.randomUUID(), userId: user.id, username: user.username, action: 'update', entity: 'Order Request', entityId: editingItem.id, description: `Updated order request for "${editingItem.model}".`, timestamp: new Date().toISOString() };
            setActivityLogs(prev => [...prev, log]);
        }
        setEditingItem(null);
    }
    
    const handleMonthChange = (months: number) => {
        setSelectedMonth(prev => months > 0 ? addMonths(prev, months) : subMonths(prev, -months));
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <header className="flex items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/transmit"><ArrowLeft /></Link>
                    </Button>
                    <h1 className="text-2xl md:text-3xl font-bold">{t('order_requests')}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => handleMonthChange(-1)} variant="outline">Previous Month</Button>
                    <span className="font-semibold text-lg">{format(selectedMonth, 'MMMM yyyy')}</span>
                    <Button onClick={() => handleMonthChange(1)} variant="outline" disabled={isSameMonth(selectedMonth, new Date())}>Next Month</Button>
                </div>
            </header>

            <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{t('edit_request')}</DialogTitle></DialogHeader>
                    {editingItem && (
                         <div className="space-y-4 py-4">
                            <div className="space-y-2"><Label>{t('requested_by')}</Label><Input value={editingItem.requestedBy} disabled /></div>
                            <div className="space-y-2"><Label htmlFor="model">{t('model_name')}</Label><Input id="model" value={editingItem.model} onChange={e => setEditingItem({...editingItem, model: e.target.value})} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label htmlFor="quantity">{t('quantity')}</Label><Input id="quantity" type="number" value={editingItem.quantity} onChange={e => setEditingItem({...editingItem, quantity: parseInt(e.target.value) || 1})} /></div>
                                <div className="space-y-2"><Label htmlFor="destination">{t('destination')}</Label><Select value={editingItem.destination} onValueChange={val => setEditingItem({...editingItem, destination: val})}><SelectTrigger id="destination"><SelectValue /></SelectTrigger><SelectContent>{destinations.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
                            </div>
                            <div className="space-y-2"><Label htmlFor="notes">{t('notes')}</Label><Textarea id="notes" value={editingItem.notes || ''} onChange={e => setEditingItem({...editingItem, notes: e.target.value})} /></div>
                        </div>
                    )}
                    <DialogFooter><Button variant="outline" onClick={() => setEditingItem(null)}>{t('cancel')}</Button><Button onClick={handleUpdate}>{t('save_changes')}</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            <Card>
                <CardHeader>
                    <CardTitle>{t('order_requests_for', {month: format(selectedMonth, 'MMMM yyyy')})}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('date')}</TableHead>
                                <TableHead>{t('requested_by')}</TableHead>
                                <TableHead>{t('model')}</TableHead>
                                <TableHead className="text-center">{t('quantity')}</TableHead>
                                <TableHead>{t('destination')}</TableHead>
                                <TableHead>{t('status')}</TableHead>
                                <TableHead className="text-right">{t('actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {monthlyRequests.length > 0 ? monthlyRequests.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.requestDate ? format(parseISO(item.requestDate), 'PP') : 'N/A'}</TableCell>
                                    <TableCell>{item.requestedBy || t('unknown')}</TableCell>
                                    <TableCell>{item.model}</TableCell>
                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                    <TableCell>{item.destination}</TableCell>
                                    <TableCell>
                                        <span className={cn("px-2 py-1 text-xs rounded-full", item.transferId ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800")}>
                                            {item.transferId ? t('done') : t('waiting')}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {!item.transferId && (
                                            <>
                                                <Button variant="ghost" size="icon" onClick={() => setEditingItem(JSON.parse(JSON.stringify(item)))}><Edit className="h-4 w-4" /></Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader><AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle><AlertDialogDescription>{t('confirm_delete_request', {model: item.model})}</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(item)}>{t('delete')}</AlertDialogAction></AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={7} className="h-24 text-center">{t('no_requests_for_month')}</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

export default withAuth(ViewRequestsPage);
