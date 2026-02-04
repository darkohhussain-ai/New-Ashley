
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-provider';
import type { ItemForTransfer, ActivityLog } from '@/lib/types';
import { format, formatISO, parseISO } from 'date-fns';
import { useTranslation } from '@/hooks/use-translation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useAuth } from '@/hooks/use-auth';
import withAuth from '@/hooks/withAuth';
import { cn } from '@/lib/utils';

const destinations = ["Erbil", "Baghdad", "Diwan", "Dohuk"];
const storageOptions = ["Ashley", "Huana", "Showroom"];

function RequestOrderPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { transferItems, setTransferItems, employees, isLoading: isAppLoading, setActivityLogs } = useAppContext();
  const { user } = useAuth();

  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [model, setModel] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [destination, setDestination] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [storage, setStorage] = useState('');
  const [notes, setNotes] = useState('');
  const [requestDate, setRequestDate] = useState<Date | undefined>(new Date());
  const [requestedBy, setRequestedBy] = useState('');

  useEffect(() => {
    if (user && employees) {
      const currentUserEmployee = employees.find(e => {
        const potentialUsername = `${e.name.split(' ')[0]}${e.employeeId || ''}`;
        return potentialUsername === user.username;
      });
      if (currentUserEmployee) {
        setRequestedBy(currentUserEmployee.id);
      }
    }
  }, [user, employees]);
  
  const resetForm = () => {
      setModel('');
      setQuantity(1);
      setDestination('');
      setInvoiceNo('');
      setStorage('');
      setNotes('');
      setRequestDate(new Date());
      // Don't reset requestedBy, as it's likely the same user
  }

  const handleAddRequest = () => {
    if (!model.trim() || !destination || !requestedBy) {
      toast({ variant: 'destructive', title: t('missing_information'), description: t('provide_model_destination_requester') });
      return;
    }
    if (!quantity || quantity <= 0) {
      toast({ variant: 'destructive', title: t('invalid_quantity'), description: t('quantity_must_be_positive') });
      return;
    }
    
    setIsSaving(true);
    const newItemData: ItemForTransfer = {
        id: crypto.randomUUID(),
        model: model.trim(),
        quantity,
        destination,
        invoiceNo,
        storage,
        notes,
        status: 'Pending',
        requestDate: requestDate ? formatISO(requestDate) : undefined,
        requestedBy,
        transferId: null,
        createdAt: formatISO(new Date())
    };
    
    setTransferItems([...transferItems, newItemData]);
    
    if (user) {
        const log: ActivityLog = {
            id: crypto.randomUUID(),
            userId: user.id,
            username: user.username,
            action: 'create',
            entity: 'Order Request',
            entityId: newItemData.id,
            description: `Created order request for "${newItemData.model}" to ${newItemData.destination}.`,
            timestamp: new Date().toISOString(),
        };
        setActivityLogs(prev => [...prev, log]);
    }

    toast({ title: t('request_submitted'), description: t('item_request_submitted_desc', {model}) });
    resetForm();
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/transmit">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">{t('request_an_order')}</h1>
        </div>
      </header>

      <Card className="max-w-2xl mx-auto">
          <CardHeader>
              <CardTitle>{t('request_order')}</CardTitle>
              <CardDescription>{t('request_order_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="space-y-2">
                  <Label htmlFor="requestedBy">{t('requested_by')}</Label>
                  <Select value={requestedBy} onValueChange={setRequestedBy}>
                      <SelectTrigger id="requestedBy"><SelectValue placeholder={t('select_an_employee')} /></SelectTrigger>
                      <SelectContent>
                          {employees?.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="model">{t('model_name')}</Label>
                  <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g., Sofa 123" />
              </div>
              <div className="space-y-2">
                  <Label>{t('request_date')}</Label>
                  <Popover>
                      <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !requestDate && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {requestDate ? format(requestDate, 'PPP') : <span>{t('pick_a_date')}</span>}
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={requestDate} onSelect={setRequestDate} initialFocus />
                      </PopoverContent>
                  </Popover>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="quantity">{t('quantity')}</Label>
                      <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 0)} min="1" />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="destination">{t('destination')}</Label>
                       <Select value={destination} onValueChange={setDestination}>
                          <SelectTrigger id="destination"><SelectValue placeholder={t('select_branch')} /></SelectTrigger>
                          <SelectContent>
                              {destinations.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="invoiceNo">{t('invoice_no')}</Label>
                      <Input id="invoiceNo" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="e.g., INV-001" />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="storage">{t('storage')}</Label>
                       <Select value={storage} onValueChange={setStorage}>
                          <SelectTrigger id="storage"><SelectValue placeholder={t('select_a_source')} /></SelectTrigger>
                          <SelectContent>
                              {storageOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
              </div>
               <div className="space-y-2">
                  <Label htmlFor="notes">{t('notes')}</Label>
                  <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('optional_notes_about_item')} />
              </div>
               <div className="flex gap-2 pt-2">
                  <Button onClick={handleAddRequest} disabled={isSaving} className="w-full">
                      {isSaving ? <Loader2 className="animate-spin mr-2"/> : <Plus className="mr-2"/>}
                      {t('submit_request')}
                  </Button>
              </div>
          </CardContent>
      </Card>
    </div>
  );
}

export default withAuth(RequestOrderPage)
