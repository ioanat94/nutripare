'use client';

import { FirebaseUIError, getTranslation } from '@firebase-oss/ui-core';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  useSignInAuthFormAction,
  useSignUpAuthFormAction,
  useUI,
} from '@firebase-oss/ui-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Policies } from './policies';
import { auth } from '@/lib/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { useForm } from 'react-hook-form';
import { useMemo } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

type Schema = { email: string; password: string; confirmPassword: string };

const CONFIRM_PASSWORD_LABEL = 'Confirm password';
const HAVE_ACCOUNT_PROMPT = 'Already have an account? Sign in';

function buildSchema(mode: 'signIn' | 'signUp') {
  const passwordSchema =
    mode === 'signUp'
      ? z
          .string()
          .min(8, 'Must be at least 8 characters.')
          .regex(/[A-Z]/, 'Must contain at least one uppercase letter.')
          .regex(/[a-z]/, 'Must contain at least one lowercase letter.')
          .regex(/[0-9]/, 'Must contain at least one number.')
          .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character.')
      : z.string().min(1);

  const base = z.object({
    email: z.email(),
    password: passwordSchema,
    confirmPassword: z.string(),
  });

  if (mode === 'signUp') {
    return base.refine((d) => d.password === d.confirmPassword, {
      message: 'Passwords do not match.',
      path: ['confirmPassword'],
    });
  }
  return base;
}

export interface AuthFormProps {
  mode: 'signIn' | 'signUp';
  onModeToggle?: () => void;
  onForgotPasswordClick?: () => void;
}

export function AuthForm({
  mode,
  onModeToggle,
  onForgotPasswordClick,
}: AuthFormProps) {
  const ui = useUI();
  const signInAction = useSignInAuthFormAction();
  const signUpAction = useSignUpAuthFormAction();
  const schema = useMemo(() => buildSchema(mode), [mode]);

  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  async function onSubmit(values: Schema) {
    try {
      if (mode === 'signIn') {
        await signInAction({ email: values.email, password: values.password });
      } else {
        await signUpAction({ email: values.email, password: values.password });
        if (auth.currentUser) {
          try {
            await sendEmailVerification(auth.currentUser);
          } catch {
            // user can resend from the verification screen
          }
        }
      }
    } catch (error) {
      const message =
        error instanceof FirebaseUIError
          ? error.message
          : String((error as Error).message ?? error);
      form.setError('root', { message });
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='flex flex-col gap-y-4'
      >
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {getTranslation(ui, 'labels', 'emailAddress')}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type='email'
                  className='h-10 bg-transparent dark:bg-transparent'
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='flex items-center gap-2'>
                <span className='grow'>
                  {getTranslation(ui, 'labels', 'password')}
                </span>
                {mode === 'signIn' && onForgotPasswordClick ? (
                  <Button
                    type='button'
                    variant='link'
                    size='sm'
                    onClick={onForgotPasswordClick}
                  >
                    <span className='text-xs'>
                      {getTranslation(ui, 'labels', 'forgotPassword')}
                    </span>
                  </Button>
                ) : null}
              </FormLabel>
              <FormControl>
                <PasswordInput
                  {...field}
                  className='h-10 bg-transparent dark:bg-transparent'
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {mode === 'signUp' ? (
          <FormField
            control={form.control}
            name='confirmPassword'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{CONFIRM_PASSWORD_LABEL}</FormLabel>
                <FormControl>
                  <PasswordInput
                    {...field}
                    className='h-10 bg-transparent dark:bg-transparent'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
        <Policies />
        <Button
          type='submit'
          size='lg'
          className='w-full'
          disabled={ui.state !== 'idle'}
        >
          {mode === 'signIn'
            ? getTranslation(ui, 'labels', 'signIn')
            : getTranslation(ui, 'labels', 'signUp')}
        </Button>
        {form.formState.errors.root?.message && (
          <FormMessage>{form.formState.errors.root.message}</FormMessage>
        )}
        {onModeToggle ? (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={onModeToggle}
            className='text-muted-foreground hover:text-muted-foreground'
          >
            <span className='text-xs'>
              {mode === 'signIn'
                ? `${getTranslation(ui, 'prompts', 'noAccount')} ${getTranslation(ui, 'labels', 'signUp')}`
                : HAVE_ACCOUNT_PROMPT}
            </span>
          </Button>
        ) : null}
      </form>
    </Form>
  );
}
