
'use client';
import { useEffect, useState, createContext, useContext, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: Subscribing to auth state changes.');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('AuthProvider: User is logged in.', { email: user.email, uid: user.uid });
        setUser(user);
      } else {
        console.log('AuthProvider: User is logged out.');
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      console.log('AuthProvider: Unsubscribing from auth state changes.');
      unsubscribe();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};

export const useRequireAuth = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('useRequireAuth: Auth state check', { loading, user: !!user });
    if (!loading && !user) {
      console.log('useRequireAuth: No user found, redirecting to /');
      router.push('/');
    }
  }, [user, loading, router]);

  return { user, loading };
};
