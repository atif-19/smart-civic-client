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
<header className="relative bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm text-white shadow-2xl sticky top-0 z-50 border-b border-slate-700/50">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-cyan-500/5"></div>
      
      <nav className="relative container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Left Section */}
          <div className="flex items-center space-x-6">
            {/* Back Button */}
            {isReportPage && (
              <Link 
                href="/" 
                className="group flex items-center space-x-2 text-sm text-slate-400 hover:text-teal-400 transition-all duration-300 bg-slate-700/50 hover:bg-slate-600/50 px-3 py-2 rounded-full backdrop-blur-sm border border-slate-600/30 hover:border-teal-500/40"
              >
                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back to Feed</span>
              </Link>
            )}

            {/* Main Logo/Title */}
            {!isReportPage && (
              <Link 
                href="/" 
                className="group flex items-center space-x-3 text-xl font-bold text-white hover:text-teal-300 transition-all duration-300"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  <img src="favicon.ico" alt="" />
                </div>
                <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  Smart Civic Reporting
                </span>
              </Link>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {user ? (
              <div className="flex items-center space-x-6">
                {/* Navigation Links */}
                <Link 
                  href="/leaderboard" 
                  className="text-sm font-semibold text-slate-300 hover:text-teal-400 transition-colors duration-300 px-3 py-2 rounded-lg hover:bg-slate-700/50"
                >
                  Leaderboard
                </Link>
                 <Link href="/my-reports" className="text-sm font-semibold hover:text-teal-400 transition-colors">
    My Reports
  </Link>
                
                {isAdmin && (
                  <>
                    <Link 
                      href="/admin" 
                      className="text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Admin Dashboard
                    </Link>
                    <Link 
                      href="/admin/analytics" 
                      className="text-sm font-semibold text-slate-300 hover:text-purple-400 transition-colors duration-300 px-3 py-2 rounded-lg hover:bg-slate-700/50"
                    >
                      Analytics
                    </Link>
                  </>
                )}
                
                {/* User Info */}
                <div className="flex items-center space-x-4 bg-slate-700/50 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-600/30">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-slate-300">{user.email}</span>
                  </div>
                  <div className="w-px h-4 bg-slate-600"></div>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-bold text-teal-400">{user.points}</span>
                    <span className="text-xs text-slate-400">pts</span>
                  </div>
                </div>
                
                {/* Logout Button */}
                <button 
                  onClick={logout} 
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-2 px-4 rounded-lg text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/login" 
                  className="text-slate-300 hover:text-teal-400 transition-colors duration-300 font-medium px-4 py-2 rounded-lg hover:bg-slate-700/50"
                >
                  Log In
                </Link>
                <Link 
                  href="/register" 
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors duration-300 border border-slate-600/30"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-slate-300" />
              ) : (
                <Menu className="w-6 h-6 text-slate-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 shadow-2xl">
            <div className="flex flex-col space-y-4">
              {user ? (
                <>
                  {/* User Info */}
                  <div className="flex items-center space-x-3 pb-4 border-b border-slate-700">
                    <div className="w-8 h-8 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm text-slate-300">{user.email}</div>
                      <div className="text-xs text-teal-400 font-bold">{user.points} Points</div>
                    </div>
                  </div>
                  
                  {/* Navigation Links */}
                  <Link 
                    href="/leaderboard" 
                    onClick={() => setIsMenuOpen(false)} 
                    className="text-slate-300 hover:text-teal-400 transition-colors duration-300 py-2 px-3 rounded-lg hover:bg-slate-700/50"
                  >
                    Leaderboard
                  </Link>
                  
                  {/* My Reports Link - Added for mobile */}
                  <Link 
                    href="/my-reports" 
                    onClick={() => setIsMenuOpen(false)} 
                    className="text-slate-300 hover:text-teal-400 transition-colors duration-300 py-2 px-3 rounded-lg hover:bg-slate-700/50"
                  >
                    My Reports
                  </Link>
                  
                  {isAdmin && (
                    <>
                      <Link 
                        href="/admin" 
                        onClick={() => setIsMenuOpen(false)} 
                        className="text-slate-300 hover:text-indigo-400 transition-colors duration-300 py-2 px-3 rounded-lg hover:bg-slate-700/50"
                      >
                        Admin Dashboard
                      </Link>
                      <Link 
                        href="/admin/analytics" 
                        onClick={() => setIsMenuOpen(false)} 
                        className="text-slate-300 hover:text-purple-400 transition-colors duration-300 py-2 px-3 rounded-lg hover:bg-slate-700/50"
                      >
                        Analytics
                      </Link>
                    </>
                  )}
                  
                  {/* Logout Button */}
                  <button 
                    onClick={() => { logout(); setIsMenuOpen(false); }} 
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-4 rounded-lg text-sm w-full transition-all duration-300 shadow-lg"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    onClick={() => setIsMenuOpen(false)} 
                    className="text-slate-300 hover:text-teal-400 transition-colors duration-300 py-3 px-3 rounded-lg hover:bg-slate-700/50"
                  >
                    Log In
                  </Link>
                  <Link 
                    href="/register" 
                    onClick={() => setIsMenuOpen(false)} 
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold py-3 px-4 rounded-lg text-center transition-all duration-300 shadow-lg"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}