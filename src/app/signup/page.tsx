import { AuthForm } from '@/components/auth/auth-form';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <AuthForm mode="signup" />
    </div>
  );
}
