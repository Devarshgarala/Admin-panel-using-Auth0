'use client';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      // Force refresh user data from database
      fetch('/api/user/create', {
        method: 'POST',
        cache: 'no-store', // Force fresh data
      })
      .then(res => res.json())
      .then(data => {
        setUserRole(data.user.role);
        setLoading(false);
        
        // Redirect based on role
        switch(data.user.role) {
          case 'SUPER_ADMIN':
            router.push('/super-admin');
            break;
          case 'ADMIN':
            router.push('/admin');
            break;
          case 'USER':
            router.push('/user');
            break;
          default:
            router.push('/user');
        }
      })
      .catch(err => {
        console.error('Error fetching user:', err);
        setLoading(false);
      });
    }
  }, [user, isLoading, router]);

  if (isLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div>Loading...</div>
    </div>;
  }

  return null; // Will redirect
}