
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/app-provider';
import { Download, BellRing, DatabaseBackup } from 'lucide-react';
import { isToday, parseISO } from 'date-fns';

export function BackupReminder() {
  const [isOpen, setIsOpen] = useState(false);
  const { exportStateAsJson, isLoading } = useAppContext();

  useEffect(() => {
    if (isLoading) return;

    const lastBackup = localStorage.getItem('ashley_last_backup_date');
    if (!lastBackup || !isToday(parseISO(lastBackup))) {
      // Show reminder 3 seconds after terminal is ready
      const timer = setTimeout(() => setIsOpen(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleDownload = () => {
    exportStateAsJson();
    localStorage.setItem('ashley_last_backup_date', new Date().toISOString());
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md bg-card/68 backdrop-blur-xl border-primary/20 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-primary text-sm uppercase font-black tracking-widest">
            <div className="p-2 bg-primary/10 rounded-lg">
                <DatabaseBackup className="w-5 h-5" />
            </div>
            Backup Reminder / پاشەکەوتی ڕۆژانە
          </DialogTitle>
          <div className="space-y-3 pt-4">
            <p className="text-[12px] font-medium leading-relaxed opacity-90">
                It's time for your daily terminal backup. This ensures all operational data is saved safely on your local device.
            </p>
            <p className="text-[12px] font-bold text-primary/80 leading-relaxed" dir="rtl">
                کاتی پاشەکەوتی ڕۆژانەی تێرمیناڵە. ئەمە دڵنیایی دەدات کە هەموو زانیارییەکانت بە سەلامەتی لەسەر ئامێرەکەت پاشەکەوت دەکرێن.
            </p>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-6 flex gap-2">
          <Button variant="ghost" onClick={() => setIsOpen(false)} className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100">
            Later / دواتر
          </Button>
          <Button onClick={handleDownload} className="flex-1 text-[10px] font-black uppercase tracking-widest shadow-xl">
            <Download className="w-3.5 h-3.5 mr-2" />
            OK / Download Data / پاشەکەوتکردن
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
