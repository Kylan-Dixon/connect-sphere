
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

export function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstall, setShowIOSInstall] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // This code runs only on the client
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandalone) {
        setIsInstallable(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    if (isIOSDevice && !isStandalone) {
      setIsInstallable(true);
    }
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstall(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      } else {
        console.log('User dismissed the A2HS prompt');
      }
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  if (!isInstallable) {
    return null;
  }

  return (
    <>
      <Button variant="outline" onClick={handleInstallClick} className="w-full">
        <Download className="mr-2 h-4 w-4" />
        Get the Mobile App
      </Button>

      <AlertDialog open={showIOSInstall} onOpenChange={setShowIOSInstall}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Install the App on Your iPhone</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 py-2">
                <p>To install the app, tap the Share icon below in your Safari toolbar.</p>
                <div className="flex justify-center">
                    <Share className="w-8 h-8 text-blue-500" />
                </div>
                <p>Then, scroll down and tap 'Add to Home Screen'.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
