'use client';

import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext'; // Import the useAuth hook

export default function Header() {
  const { user, logout } = useAuth(); // Get user and logout from the context

  return (
    <header className="bg-slate-800 text-white p-4 shadow-md sticky top-0 z-50">
      <nav className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-teal-400 hover:text-teal-300 transition-colors">
          Smart Civic Reporting
        </Link>
        <div>
          {user ? (
            // --- Logged-In View ---
            <div className="flex items-center space-x-6">
              <Link href="/leaderboard" className="text-sm font-semibold hover:text-teal-400 transition-colors">
                Leaderboard
              </Link>
              <Link href="/admin" className="text-sm font-semibold bg-indigo-500 hover:bg-indigo-600 px-3 py-2 rounded-md transition-colors">
                  Admin Dashboard
                </Link>
              <span className="text-sm">
                {user.email} | <span className="font-bold text-teal-400">{user.points} Points</span>
              </span>
              <button
                onClick={logout} // Use the logout function from the context
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded text-sm transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            // --- Logged-Out View ---
            <div className="space-x-4">
              <Link href="/login" className="hover:text-teal-400 transition-colors">Log In</Link>
              <Link href="/register" className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-2 px-4 rounded transition-colors">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}