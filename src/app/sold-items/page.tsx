
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, Timestamp } from 'firebase/firestore';
import { ArrowLeft, Plus, Save, Trash2, Calendar as CalendarIcon, Loader2, List, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


type SoldItemReceipt = {
    id: string;
    receiptNumber: string;
    receiptDate?: Timestamp;
    customerName?: string;
    itemCategories: string[];
}

export default function SoldItemsCheckPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();

    const [receiptNumberDigits, setReceiptNumberDigits] = useState('');
    const [receiptDate, setReceiptDate] = useState<Date | undefined>();
    const [customerName, setCustomerName] = useState('');
    const [itemCategories, setItemCategories] = useState<string[]>([]);
    const [currentCategory, setCurrentCategory] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const receiptsRef = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'sold_item_receipts') : null, [firestore, user]);
    const { data: savedReceipts, isLoading: isLoadingReceipts } = useCollection<SoldItemReceipt>(receiptsRef);

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
        setReceiptDate(undefined);
        setCustomerName('');
        setItemCategories([]);
        setCurrentCategory('');
    };

    const handleSaveReceipt = async () => {
        if (receiptNumberDigits.length !== 4) {
            toast({ variant: 'destructive', title: 'Invalid Receipt Number', description: 'Please enter exactly 4 digits for the receipt number.' });
            return;
        }
        if (itemCategories.length === 0) {
            toast({ variant: 'destructive', title: 'No Categories', description: 'Please add at least one item category.' });
            return;
        }
        if (!firestore) return;

        setIsSaving(true);
        const receiptData = {
            receiptNumber: fullReceiptNumber,
            receiptDate: receiptDate ? Timestamp.fromDate(receiptDate) : undefined,
            customerName: customerName || undefined,
            itemCategories,
        };

        try {
            await addDocumentNonBlocking(collection(firestore, 'sold_item_receipts'), receiptData);
            toast({ title: 'Receipt Saved!', description: `Receipt ${fullReceiptNumber} has been recorded.` });
            resetForm();
        } catch (error) {
            console.error("Error saving receipt:", error);
            toast({ variant: 'destructive', title: 'Save Error', description: 'Could not save the receipt.' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const sortedReceipts = useMemo(() => {
        if (!savedReceipts) return [];
        return [...savedReceipts].sort((a,b) => {
            const dateA = a.receiptDate?.toDate().getTime() || 0;
            const dateB = b.receiptDate?.toDate().getTime() || 0;
            if(dateB !== dateA) return dateB - dateA;
            return b.receiptNumber.localeCompare(a.receiptNumber);
        })
    }, [savedReceipts])

    const isLoading = isUserLoading || isLoadingReceipts;

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <header className="flex items-center gap-4 mb-8">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/items"><ArrowLeft /></Link>
                </Button>
                <h1 className="text-2xl md:text-3xl font-bold">Sold Items Check</h1>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>New Receipt</CardTitle>
                            <CardDescription>Enter the details for a new sold item receipt.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="receipt-number">Receipt Number</Label>
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
                                <Label>Receipt Date (Optional)</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !receiptDate && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {receiptDate ? format(receiptDate, 'PPP') : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={receiptDate} onSelect={setReceiptDate} /></PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="customer-name">Customer Name (Optional)</Label>
                                <Input id="customer-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter customer's name" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="item-category">Item Categories</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="item-category"
                                        value={currentCategory}
                                        onChange={(e) => setCurrentCategory(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                                        placeholder="e.g., Dining Set"
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
                            <Button onClick={handleSaveReceipt} disabled={isSaving} className="w-full">
                                {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                                Save Receipt
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recently Saved Receipts</CardTitle>
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
                                                    {receipt.receiptDate && <p className="text-xs text-muted-foreground">{format(receipt.receiptDate.toDate(), 'PPP')}</p>}
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
                                        <h3 className="mt-4 text-lg font-medium">No Receipts Found</h3>
                                        <p className="mt-2 text-sm text-muted-foreground">Saved receipts will appear here.</p>
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
