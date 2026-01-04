
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Save, Trash2, Calendar as CalendarIcon, Loader2, List, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, formatISO, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '@/context/app-provider';
import type { SoldItemReceipt } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';


export default function SoldItemsCheckPage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const { receipts: savedReceipts, setReceipts } = useAppContext();

    const [receiptNumberDigits, setReceiptNumberDigits] = useState('');
    const [receiptDate, setReceiptDate] = useState<Date | undefined>(undefined);
    const [customerName, setCustomerName] = useState('');
    const [itemCategories, setItemCategories] = useState<string[]>([]);
    const [currentCategory, setCurrentCategory] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
      setReceiptDate(new Date());
    }, []);

    const isLoading = !savedReceipts;

    const fullReceiptNumber = `115-0${receiptNumberDigits}`;

    const handleAddCategory = () => {
        if (currentCategory.trim() && !itemCategories.includes(currentCategory.trim())) {
            setItemCategories([...itemCategories, currentCategory.trim()]);
            setCurrentCategory('');
        }
    };

    const handleRemoveCategory = (categoryToRemove: string) => {
        setItemCategories(itemCategories.filter(cat => cat !== categoryToRemove));
    };

    const resetForm = () => {
        setReceiptNumberDigits('');
        setReceiptDate(new Date());
        setCustomerName('');
        setItemCategories([]);
        setCurrentCategory('');
    };

    const handleSaveReceipt = async () => {
        if (receiptNumberDigits.length !== 4) {
            toast({ variant: 'destructive', title: t('invalid_receipt_number'), description: t('invalid_receipt_number_desc') });
            return;
        }
        if (itemCategories.length === 0) {
            toast({ variant: 'destructive', title: t('no_categories'), description: t('no_categories_desc') });
            return;
        }

        setIsSaving(true);
        const receiptData: SoldItemReceipt = {
            id: crypto.randomUUID(),
            receiptNumber: fullReceiptNumber,
            receiptDate: receiptDate ? formatISO(receiptDate) : undefined,
            customerName: customerName || undefined,
            itemCategories,
        };

        setReceipts([...savedReceipts, receiptData]);
        toast({ title: t('receipt_saved'), description: t('receipt_saved_desc', {receiptNumber: fullReceiptNumber}) });
        resetForm();
        setIsSaving(false);
    };
    
    const sortedReceipts = useMemo(() => {
        if (!savedReceipts) return [];
        return [...savedReceipts].sort((a,b) => {
            const dateA = a.receiptDate ? parseISO(a.receiptDate).getTime() : 0;
            const dateB = b.receiptDate ? parseISO(b.receiptDate).getTime() : 0;
            if(dateB !== dateA) return dateB - dateA;
            return b.receiptNumber.localeCompare(a.receiptNumber);
        })
    }, [savedReceipts])

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <header className="flex items-center gap-4 mb-8">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/items"><ArrowLeft /></Link>
                </Button>
                <h1 className="text-2xl md:text-3xl font-bold">{t('sold_items_check')}</h1>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('new_receipt')}</CardTitle>
                            <CardDescription>{t('new_receipt_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="receipt-number">{t('receipt_number')}</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground font-mono">115-0</span>
                                    <Input
                                        id="receipt-number"
                                        value={receiptNumberDigits}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, ''); // Only allow digits
                                            if (val.length <= 4) setReceiptNumberDigits(val);
                                        }}
                                        maxLength={4}
                                        placeholder="XXXX"
                                        className="font-mono"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>{t('receipt_date_optional')}</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !receiptDate && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {receiptDate ? format(receiptDate, 'PPP') : <span>{t('pick_a_date')}</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={receiptDate} onSelect={setReceiptDate} /></PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="customer-name">{t('customer_name_optional')}</Label>
                                <Input id="customer-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder={t('enter_customer_name')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="item-category">{t('item_categories')}</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="item-category"
                                        value={currentCategory}
                                        onChange={(e) => setCurrentCategory(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                                        placeholder={t('item_categories_placeholder')}
                                    />
                                    <Button type="button" onClick={handleAddCategory}><Plus /></Button>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {itemCategories.map(cat => (
                                        <Badge key={cat} variant="secondary" className="flex items-center gap-1">
                                            {cat}
                                            <button onClick={() => handleRemoveCategory(cat)} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <Button onClick={handleSaveReceipt} disabled={isSaving || isLoading} className="w-full">
                                {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                                {t('save_receipt')}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('recently_saved_receipts')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-[600px] overflow-y-auto">
                                {isLoading ? (
                                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
                                ) : sortedReceipts.length > 0 ? (
                                    <div className="space-y-4">
                                        {sortedReceipts.map(receipt => (
                                            <div key={receipt.id} className="border p-4 rounded-lg">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-bold font-mono text-primary">{receipt.receiptNumber}</p>
                                                        {receipt.customerName && <p className="text-sm text-muted-foreground">{receipt.customerName}</p>}
                                                    </div>
                                                    {receipt.receiptDate && <p className="text-xs text-muted-foreground">{format(parseISO(receipt.receiptDate), 'PPP')}</p>}
                                                </div>
                                                <div className="flex flex-wrap gap-2 pt-3">
                                                    {receipt.itemCategories.map(cat => <Badge key={cat}>{cat}</Badge>)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 border-2 border-dashed rounded-lg">
                                        <List className="mx-auto h-12 w-12 text-muted-foreground" />
                                        <h3 className="mt-4 text-lg font-medium">{t('no_receipts_found')}</h3>
                                        <p className="mt-2 text-sm text-muted-foreground">{t('no_receipts_found_desc')}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

    