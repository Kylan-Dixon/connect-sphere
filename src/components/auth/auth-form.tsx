
'use client';

import { useFormState } from 'react-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { isUserAuthorized } from '@/lib/actions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import { PwaInstallButton } from '../pwa-install-button';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof loginSchema | typeof signupSchema>;

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isLogin = mode === 'login';
  const schema = isLogin ? loginSchema : signupSchema;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleAuthAction = async (data: FormData) => {
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, data.email, data.password);
      } else {
        // Check if user is authorized before creating account
        const authCheck = await isUserAuthorized(data.email);
        if (!authCheck.success) {
            throw new Error('This email is not authorized. Please contact an administrator to be added to the whitelist.');
        }
        await createUserWithEmailAndPassword(auth, data.email, data.password);
      }
      toast({
        title: isLogin ? "Login Successful" : "Signup Successful",
        description: `Welcome! Redirecting you to the dashboard...`,
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };
  
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <Logo />
        </div>
        <CardTitle className="font-headline text-3xl">
          {isLogin ? 'Welcome Back' : 'Create an Account'}
        </CardTitle>
        <CardDescription>
          {isLogin ? 'Sign in to access your connections.' : 'Enter your details to get started.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleAuthAction)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="name@example.com" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : isLogin ? 'Log In' : 'Sign Up'}
          </Button>
        </form>
        <div className="mt-6 text-center text-sm">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <Link href={isLogin ? '/signup' : '/'} className="ml-1 font-semibold text-primary underline-offset-4 hover:underline">
            {isLogin ? 'Sign up' : 'Log in'}
          </Link>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 pt-4">
        <PwaInstallButton />
      </CardFooter>
    </Card>
  );
}
