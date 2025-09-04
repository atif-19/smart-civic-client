'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  
  // --- NEW: State to handle the submission loading status ---
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true); // --- NEW: Set loading to true ---

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to log in');
      }

      await login(data.token);

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsSubmitting(false); // --- NEW: Set loading to false when done ---
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-4">
      {/* RESPONSIVE: Use smaller padding on mobile (p-6) and larger on desktop (sm:p-8) */}
      <div className="w-full max-w-md rounded-lg bg-slate-800 p-6 sm:p-8 shadow-lg">
        <h1 className="mb-4 text-center text-2xl font-bold text-teal-400">Welcome Back</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-slate-600 bg-slate-700 text-slate-100 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-slate-600 bg-slate-700 text-slate-100 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-500"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          
          {/* UPDATED: Button now shows a loading state */}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full rounded-md bg-teal-500 py-2 px-4 font-bold text-slate-900 hover:bg-teal-400 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Logging In...' : 'Log In'}
          </button>
        </form>
         <p className="mt-4 text-center text-sm text-slate-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-teal-400 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </main>
  );
}