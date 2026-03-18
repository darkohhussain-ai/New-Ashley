'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/app-provider';
import { Download, DatabaseBackup, AlertCircle } from 'lucide-react';

export function BackupReminder() {
  const [isOpen, setIsOpen] = useState(false);
  const { exportStateAsJson, isLoading } = useAppContext();

  useEffect(() => {
    if (isLoading) return;

    const lastBackup = localStorage.getItem('ashley_last_backup_date');
    const now = new Date().getTime();
    const lastTime = lastBackup ? new Date(lastBackup).getTime() : 0;
    
    // LOGIC: Show reminder only if 24 hours (86,400,000 ms) have passed since the last backup.
    if (now - lastTime >= 86400000) {
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
      <DialogContent className="max-w-md bg-orange-50/95 backdrop-blur-xl border-none shadow-2xl p-0 overflow-hidden rounded-2xl animate-in zoom-in-95 duration-300">
        {/* High-Visibility Orange Header Sector */}
        <div className="bg-orange-500 p-5 flex items-center gap-4 text-white shadow-lg">
            <div className="p-2.5 bg-white/20 rounded-xl shadow-inner border border-white/10">
                <DatabaseBackup className="w-6 h-6" />
            </div>
            <div>
                <h2 className="text-[12px] font-black uppercase tracking-[0.2em]">Safety Protocol / ڕێکاری سەلامەتی</h2>
                <p className="text-[9px] font-bold opacity-80 uppercase tracking-widest">Nexus Data Preservation</p>
            </div>
        </div>
        
        <div className="p-6 space-y-5">
          <div className="space-y-4">
            <p className="text-[13px] font-bold text-slate-900 leading-relaxed">
                It's time for your daily terminal backup. This ensures all operational data is saved safely on your local device.
            </p>
            <p className="text-[13px] font-bold text-orange-800 leading-relaxed" dir="rtl">
                کاتی پاشەکەوتی ڕۆژانەی تێرمیناڵە. ئەمە دڵنیایی دەدات کە هەموو زانیارییەکانت بە سەلامەتی لەسەر ئامێرەکەت پاشەکەوت دەکرێن.
            </p>
          </div>

          <div className="flex items-center gap-3 p-4 bg-orange-100/50 rounded-2xl border border-orange-200/50 shadow-sm">
            <div className="bg-orange-500/10 p-1.5 rounded-full">
                <AlertCircle className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-[10px] text-orange-900 font-black uppercase tracking-tight">24-Hour Cycle Backup Required / داگرتنی داتا پێویستە</p>
          </div>
        </div>

        <DialogFooter className="p-4 bg-orange-100/20 border-t border-orange-200/30 flex gap-2">
          <Button 
            variant="ghost" 
            onClick={() => setIsOpen(false)} 
            className="text-[10px] font-black uppercase tracking-widest text-orange-900/40 hover:text-orange-900 hover:bg-orange-100 transition-all rounded-xl h-11"
          >
            Later / دواتر
          </Button>
          <Button 
            onClick={handleDownload} 
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 h-11 rounded-xl transition-all hover:scale-[1.02] active:scale-95"
          >
            <Download className="w-4 h-4 mr-2" />
            OK / Backup Now / پاشەکەوتکردن
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
