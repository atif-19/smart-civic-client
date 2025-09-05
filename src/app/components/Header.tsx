'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { usePathname } from 'next/navigation'; // --- NEW: Import usePathname hook ---
import { Menu, X } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // --- NEW: Get the current page's path ---
  const pathname = usePathname();
  const isReportPage = pathname === '/report';

  const isAdmin = user?.email === 'admin@example.com';

  return (
    <header className="bg-slate-800 text-white p-4 shadow-md sticky top-0 z-50">
      <nav className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {/* --- NEW: Conditionally show "Back to Feed" button --- */}
          {isReportPage && (
            <Link href="/" className="text-sm text-slate-400 hover:text-teal-400 transition-colors">
              &larr; Back to Feed
            </Link>
          )}

          {/* Hide the main title on the report page for a cleaner look */}
          {!isReportPage && (
            <Link href="/" className="text-xl font-bold text-teal-400 hover:text-teal-300 transition-colors">
              Smart Civic Reporting
            </Link>
          )}
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {user ? (
            <>
              <Link href="/leaderboard" className="text-sm font-semibold hover:text-teal-400">Leaderboard</Link>
              {isAdmin && (
                <Link href="/admin" className="text-sm font-semibold bg-indigo-500 hover:bg-indigo-600 px-3 py-2 rounded-md">Admin Dashboard</Link>
              )}
              <span className="text-sm">{user.email} | <span className="font-bold text-teal-400">{user.points} Points</span></span>
              <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded text-sm">Logout</button>
            </>
          ) : (
            <div className="space-x-4">
              <Link href="/login" className="hover:text-teal-400">Log In</Link>
              <Link href="/register" className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-2 px-4 rounded">Sign Up</Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown Menu */}
      {isMenuOpen && (
        <div className="md:hidden mt-4">
          <div className="flex flex-col items-start space-y-4">
            {user ? (
              <>
                <span className="text-sm w-full pb-2 border-b border-slate-700">{user.email} | <span className="font-bold text-teal-400">{user.points} Points</span></span>
                <Link href="/leaderboard" onClick={() => setIsMenuOpen(false)} className="hover:text-teal-400">Leaderboard</Link>
                {isAdmin && (
                  <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="hover:text-teal-400">Admin Dashboard</Link>
                )}
                <button onClick={() => { logout(); setIsMenuOpen(false); }} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded text-sm w-full text-left">Logout</button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="hover:text-teal-400 w-full">Log In</Link>
                <Link href="/register" onClick={() => setIsMenuOpen(false)} className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-2 px-4 rounded w-full text-center">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}