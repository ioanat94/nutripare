'use client';

import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

const CONTAINER_ID = 'barcode-scanner-container';

export default function BarcodeScanner({
  onScan,
  onClose,
}: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDesktop] = useState(
    () => window.matchMedia('(pointer: fine)').matches,
  );
  const onScanRef = useRef(onScan);
  const stoppedRef = useRef(false);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    stoppedRef.current = false;

    const scanner = new Html5Qrcode(CONTAINER_ID, {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
      ],
      verbose: false,
    });

    const startPromise = scanner
      .start(
        { facingMode: 'environment' },
        { fps: 15, qrbox: { width: 400, height: 200 } },
        (decodedText) => {
          if (!stoppedRef.current) {
            stoppedRef.current = true;
            scanner.stop().catch(() => {});
          }
          onScanRef.current(decodedText);
        },
        () => {},
      )
      .then(() => true)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
        return false;
      });

    return () => {
      const alreadyStopped = stoppedRef.current;
      stoppedRef.current = true;
      startPromise.then((started) => {
        if (started && !alreadyStopped) {
          scanner
            .stop()
            .catch(() => {})
            .then(() => {
              try {
                scanner.clear();
              } catch {
                /* already cleared */
              }
            });
        } else if (started) {
          try {
            scanner.clear();
          } catch {
            /* already cleared */
          }
        }
      });
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      role='dialog'
      aria-label='Barcode scanner'
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/80'
    >
      <div className='relative w-full max-w-lg rounded-xl bg-background p-6'>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='absolute right-2 top-2'
          onClick={onClose}
          aria-label='Close scanner'
        >
          <X className='size-4' />
        </Button>
        <h2 className='mb-4 text-center text-lg font-semibold'>Scan barcode</h2>
        <div id={CONTAINER_ID} className='rounded-lg' />
        {isDesktop && !error && (
          <p className='mt-3 text-xs text-muted-foreground'>
            Scanning may be unreliable with a low-resolution webcam. Try typing
            the code manually if you run into difficulties.
          </p>
        )}
        {error && (
          <p className='mt-3 text-sm text-destructive' role='alert'>
            Camera error: {error}
          </p>
        )}
      </div>
    </div>
  );
}
