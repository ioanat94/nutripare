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
  const [hasFinePointer] = useState(
    () => window.matchMedia('(pointer: fine)').matches,
  );
  const onScanRef = useRef(onScan);
  const stoppedRef = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

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
            scanner.stop().catch((err) => {
              console.warn('Failed to stop scanner after scan:', err);
            });
          }
          onScanRef.current(decodedText);
        },
        () => {},
      )
      .then(() => true)
      .catch((err: unknown) => {
        const raw = err instanceof Error ? err.message : String(err);
        const isNotFound =
          raw.includes('NotFoundError') || raw.includes('Requested device not found');
        setError(
          isNotFound
            ? 'No camera found. Please connect a camera and try again.'
            : raw,
        );
        return false;
      });

    return () => {
      const alreadyStopped = stoppedRef.current;
      stoppedRef.current = true;
      startPromise.then((started) => {
        if (!started) return;
        const cleanup = () => {
          try {
            scanner.clear();
          } catch (err) {
            console.warn('Failed to clear scanner:', err);
          }
        };
        if (alreadyStopped) {
          cleanup();
        } else {
          scanner
            .stop()
            .catch((err) => {
              console.warn('Failed to stop scanner on unmount:', err);
            })
            .then(cleanup);
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
      aria-modal='true'
      tabIndex={-1}
      ref={dialogRef}
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 outline-none'
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
        {hasFinePointer && !error && (
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
