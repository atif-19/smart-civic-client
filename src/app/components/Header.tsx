'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { usePathname } from 'next/navigation'; // --- NEW: Import usePathname hook ---
import { Menu, X , ChevronLeft} from 'lucide-react';
export default function Header() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // --- NEW: Get the current page's path ---
  const pathname = usePathname();
  const isReportPage = pathname === '/report';

  const isAdmin = true;
 
 return (
  <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-[#0b0f1a]/80 backdrop-blur-xl transition-all duration-300">
    <nav className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
      
      {/* LEFT SECTION: Logo & Back Button */}
      <div className="flex items-center gap-4">
        {isReportPage ? (
          <Link 
            href="/" 
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors group"
          >
            <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-teal-50 dark:group-hover:bg-teal-500/10 transition-colors">
              <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            </div>
            <span className="text-sm font-bold hidden sm:block">Feed</span>
          </Link>
        ) : (
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-all">
               <img src="/favicon.ico" alt="Logo" className="w-6 h-6 dark:invert" />
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
              Civic<span className="text-teal-500">Catalyst</span>
            </span>
          </Link>
        )}
      </div>

      {/* CENTER/RIGHT SECTION: Desktop Navigation */}
      <div className="hidden md:flex items-center gap-2">
        <Link href="/leaderboard" className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
          Leaderboard
        </Link>
        <Link href="/my-reports" className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
          My Reports
        </Link>
        
        {isAdmin && (
          <Link href="/admin" className="ml-2 px-4 py-2 text-sm font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all">
            Admin Console
          </Link>
        )}

        {/* Separator */}
        <div className="w-px h-6 bg-slate-200 dark:border-slate-800 mx-2" />

        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Your Impact</span>
              <span className="text-sm font-black text-teal-600 dark:text-teal-400">{user.points} PTS</span>
            </div>
            <button 
              onClick={logout}
              className="px-5 py-2 text-sm font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl hover:opacity-90 transition-all"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-5 py-2 text-sm font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
              Log In
            </Link>
            <Link href="/register" className="px-5 py-2 text-sm font-bold bg-teal-500 text-white rounded-xl shadow-lg shadow-teal-500/20 hover:bg-teal-600 transition-all">
              Join Us
            </Link>
          </div>
        )}
      </div>

      {/* MOBILE MENU TOGGLE */}
      <div className="md:hidden flex items-center gap-3">
        {user && (
           <div className="bg-teal-50 dark:bg-teal-500/10 px-3 py-1 rounded-full">
             <span className="text-xs font-black text-teal-600 dark:text-teal-400">{user.points}P</span>
           </div>
        )}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 text-slate-600 dark:text-slate-400"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>

    {/* MOBILE DROPDOWN */}
    {isMenuOpen && (
      <div className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-[#0b0f1a] border-b border-slate-200 dark:border-slate-800 p-6 animate-in slide-in-from-top-4 duration-200">
        <div className="flex flex-col gap-4">
          <Link href="/leaderboard" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold text-slate-900 dark:text-white">Leaderboard</Link>
          <Link href="/my-reports" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold text-slate-900 dark:text-white">My Reports</Link>
          {isAdmin && <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold text-indigo-600">Admin Console</Link>}
          <hr className="border-slate-100 dark:border-slate-800" />
          {user ? (
            <button onClick={logout} className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-2xl">Sign Out</button>
          ) : (
            <Link href="/register" className="w-full py-4 bg-teal-500 text-white font-bold rounded-2xl text-center">Get Started</Link>
          )}
        </div>
      </div>
    )}
  </header>
);
}