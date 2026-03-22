'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function PasswordInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  const [show, setShow] = useState(false);
  return (
    <div className='relative'>
      <Input
        type={show ? 'text' : 'password'}
        className={`pr-10 ${className ?? ''}`}
        {...props}
      />
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className='absolute right-0 top-0 h-full px-4 text-muted-foreground hover:text-foreground'
        onClick={() => setShow((v) => !v)}
        tabIndex={-1}
      >
        {show ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
      </Button>
    </div>
  );
}
