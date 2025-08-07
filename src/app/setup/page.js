'use client';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Setup() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState('');

  const handleCreateSuperAdmin = async () => {
    if (!user) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/fix-super-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Super admin created successfully! Redirecting...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage('Error creating super admin');
    }
    setIsCreating(false);
  };

  if (isLoading) return <div>Loading...</div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Please login first</p>
          <a href="/api/auth/login" className="text-blue-600">Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Setup Super Admin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Promote yourself to super admin
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4">
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </div>
          
          <button
            onClick={handleCreateSuperAdmin}
            disabled={isCreating}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isCreating ? 'Promoting...' : 'Promote to Super Admin'}
          </button>
          
          {message && (
            <p className={`mt-4 text-sm ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}