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
  <header className="relative bg-gradient-to-r from-slate-800/95 via-slate-800/90 to-slate-900/95 backdrop-blur-md text-white shadow-2xl sticky top-0 z-50 border-b border-slate-700/60 overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/8 via-cyan-500/6 to-teal-500/8"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(20,184,166,0.1)_0%,_transparent_50%)]"></div>
      
      {/* Animated border line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-400/60 to-transparent"></div>
      
      <nav className="relative container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Left Section */}
          <div className="flex items-center space-x-6">
            {/* Enhanced Back Button */}
            {isReportPage && (
              <Link 
                href="/" 
                className="group flex items-center space-x-2 text-sm text-slate-400 hover:text-teal-300 transition-all duration-300 bg-gradient-to-r from-slate-700/60 to-slate-700/40 hover:from-slate-600/70 hover:to-slate-600/50 px-4 py-2.5 rounded-full backdrop-blur-sm border border-slate-600/40 hover:border-teal-500/50 shadow-lg hover:shadow-xl relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium relative z-10">Back to Feed</span>
              </Link>
            )}

            {/* Enhanced Main Logo/Title */}
            {!isReportPage && (
              <Link 
                href="/" 
                className="group flex items-center space-x-3 text-xl font-bold text-white hover:text-teal-300 transition-all duration-300 relative"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 via-teal-400 to-cyan-500 rounded-full flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300 border border-teal-400/30 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <img src="favicon.ico" alt="" className="relative z-10" />
                </div>
                <span className="bg-gradient-to-r from-teal-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent relative">
                  Civic Catalyst
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent blur-sm opacity-50 -z-10">
                    Civic Catalyst
                  </div>
                </span>
              </Link>
            )}
          </div>

          {/* Enhanced Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {user ? (
              <div className="flex items-center space-x-6">
                {/* Enhanced Navigation Links */}
                <Link 
                  href="/leaderboard" 
                  className="text-sm font-semibold text-slate-300 hover:text-teal-300 transition-all duration-300 px-4 py-2.5 rounded-xl hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-700/30 border border-transparent hover:border-slate-600/40 relative overflow-hidden group/nav"
                >
                  <span className="relative z-10">Leaderboard</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-transparent translate-x-[-100%] group-hover/nav:translate-x-[100%] transition-transform duration-500"></div>
                </Link>
                
                <Link 
                  href="/my-reports" 
                  className="text-sm font-semibold text-slate-300 hover:text-teal-300 transition-all duration-300 px-4 py-2.5 rounded-xl hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-700/30 border border-transparent hover:border-slate-600/40 relative overflow-hidden group/nav"
                >
                  <span className="relative z-10">My Reports</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-transparent translate-x-[-100%] group-hover/nav:translate-x-[100%] transition-transform duration-500"></div>
                </Link>
                
                {isAdmin && (
                  <>
                    <Link 
                      href="/admin" 
                      className="text-sm font-semibold bg-gradient-to-r from-indigo-500 via-indigo-400 to-purple-500 hover:from-indigo-400 hover:via-indigo-300 hover:to-purple-400 text-white px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-indigo-400/30 relative overflow-hidden group/admin"
                    >
                      <span className="relative z-10">Admin Dashboard</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent translate-x-[-100%] group-hover/admin:translate-x-[100%] transition-transform duration-500"></div>
                    </Link>
                    <Link 
                      href="/admin/analytics" 
                      className="text-sm font-semibold text-slate-300 hover:text-purple-300 transition-all duration-300 px-4 py-2.5 rounded-xl hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-purple-500/10 border border-transparent hover:border-purple-500/40 relative overflow-hidden group/nav"
                    >
                      <span className="relative z-10">Analytics</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent translate-x-[-100%] group-hover/nav:translate-x-[100%] transition-transform duration-500"></div>
                    </Link>
                  </>
                )}
                
                {/* Enhanced User Info */}
                <div className="flex items-center space-x-4 bg-gradient-to-r from-slate-700/60 to-slate-700/40 backdrop-blur-sm px-5 py-3 rounded-full border border-slate-600/40 shadow-lg relative overflow-hidden group/user">
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-transparent opacity-0 group-hover/user:opacity-100 transition-opacity duration-300"></div>
                  <div className="flex items-center space-x-3 relative z-10">
                    <div className="w-7 h-7 bg-gradient-to-br from-teal-400 via-teal-300 to-cyan-400 rounded-full flex items-center justify-center shadow-lg border border-teal-300/30">
                      <span className="text-white text-xs font-bold drop-shadow-sm">
                        {user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-slate-300 font-medium">{user.email}</span>
                  </div>
                  <div className="w-px h-5 bg-gradient-to-b from-transparent via-slate-600 to-transparent relative z-10"></div>
                  <div className="flex items-center space-x-1.5 relative z-10">
                    <span className="text-sm font-bold text-teal-300">{user.points}</span>
                    <span className="text-xs text-slate-400 font-medium">pts</span>
                  </div>
                </div>
                
                {/* Enhanced Logout Button */}
                <button 
                  onClick={logout} 
                  className="bg-gradient-to-r from-red-500 via-red-400 to-red-600 hover:from-red-400 hover:via-red-300 hover:to-red-500 text-white font-semibold py-2.5 px-5 rounded-xl text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-red-400/30 relative overflow-hidden group/logout"
                >
                  <span className="relative z-10">Logout</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent translate-x-[-100%] group-hover/logout:translate-x-[100%] transition-transform duration-500"></div>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/login" 
                  className="text-slate-300 hover:text-teal-300 transition-all duration-300 font-medium px-5 py-2.5 rounded-xl hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-700/30 border border-transparent hover:border-slate-600/40 relative overflow-hidden group/nav"
                >
                  <span className="relative z-10">Log In</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-transparent translate-x-[-100%] group-hover/nav:translate-x-[100%] transition-transform duration-500"></div>
                </Link>
                <Link 
                  href="/register" 
                  className="bg-gradient-to-r from-teal-500 via-teal-400 to-cyan-500 hover:from-teal-400 hover:via-teal-300 hover:to-cyan-400 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-teal-400/30 relative overflow-hidden group/signup"
                >
                  <span className="relative z-10">Sign Up</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent translate-x-[-100%] group-hover/signup:translate-x-[100%] transition-transform duration-500"></div>
                </Link>
              </div>
            )}
          </div>

          {/* Enhanced Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-3 rounded-xl bg-gradient-to-r from-slate-700/60 to-slate-700/40 hover:from-slate-600/70 hover:to-slate-600/50 transition-all duration-300 border border-slate-600/40 shadow-lg hover:shadow-xl relative overflow-hidden group/menu"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-transparent opacity-0 group-hover/menu:opacity-100 transition-opacity duration-300"></div>
              {isMenuOpen ? (
                <X className="w-6 h-6 text-slate-300 relative z-10 transition-transform duration-200" />
              ) : (
                <Menu className="w-6 h-6 text-slate-300 relative z-10 transition-transform duration-200" />
              )}
            </button>
          </div>
        </div>

        {/* Enhanced Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-6 bg-gradient-to-br from-slate-800/95 via-slate-800/90 to-slate-900/95 backdrop-blur-md rounded-2xl p-6 border border-slate-700/60 shadow-2xl relative overflow-hidden animate-slideDown">
            {/* Background effects for mobile menu */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-cyan-500/5"></div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-1 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full"></div>
            
            <div className="flex flex-col space-y-4 relative z-10">
              {user ? (
                <>
                  {/* Enhanced User Info for Mobile */}
                  <div className="flex items-center space-x-4 pb-5 border-b border-gradient-to-r from-transparent via-slate-700/60 to-transparent relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-400 via-teal-300 to-cyan-400 rounded-full flex items-center justify-center shadow-xl border border-teal-300/30">
                      <span className="text-white text-sm font-bold drop-shadow-sm">
                        {user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm text-slate-300 font-medium">{user.email}</div>
                      <div className="text-xs text-teal-300 font-bold bg-teal-500/10 px-2 py-1 rounded-full mt-1 inline-block">
                        {user.points} Points
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Navigation Links for Mobile */}
                  <Link 
                    href="/leaderboard" 
                    onClick={() => setIsMenuOpen(false)} 
                    className="text-slate-300 hover:text-teal-300 transition-all duration-300 py-3.5 px-4 rounded-xl hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-700/30 border border-transparent hover:border-slate-600/40 relative overflow-hidden group/mobile"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-transparent translate-x-[-100%] group-hover/mobile:translate-x-[100%] transition-transform duration-500"></div>
                    <div className="flex items-center space-x-3 relative z-10">
                      <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className="font-medium">Leaderboard</span>
                    </div>
                  </Link>
                  
                  <Link 
                    href="/my-reports" 
                    onClick={() => setIsMenuOpen(false)} 
                    className="text-slate-300 hover:text-teal-300 transition-all duration-300 py-3.5 px-4 rounded-xl hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-700/30 border border-transparent hover:border-slate-600/40 relative overflow-hidden group/mobile"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-transparent translate-x-[-100%] group-hover/mobile:translate-x-[100%] transition-transform duration-500"></div>
                    <div className="flex items-center space-x-3 relative z-10">
                      <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-medium">My Reports</span>
                    </div>
                  </Link>
                  
                  {isAdmin && (
                    <>
                      <Link 
                        href="/admin" 
                        onClick={() => setIsMenuOpen(false)} 
                        className="text-slate-300 hover:text-indigo-300 transition-all duration-300 py-3.5 px-4 rounded-xl hover:bg-gradient-to-r hover:from-indigo-500/20 hover:to-purple-500/20 border border-transparent hover:border-indigo-500/40 relative overflow-hidden group/mobile"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent translate-x-[-100%] group-hover/mobile:translate-x-[100%] transition-transform duration-500"></div>
                        <div className="flex items-center space-x-3 relative z-10">
                          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="font-medium">Admin Dashboard</span>
                        </div>
                      </Link>
                      
                      <Link 
                        href="/admin/analytics" 
                        onClick={() => setIsMenuOpen(false)} 
                        className="text-slate-300 hover:text-purple-300 transition-all duration-300 py-3.5 px-4 rounded-xl hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-purple-500/10 border border-transparent hover:border-purple-500/40 relative overflow-hidden group/mobile"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent translate-x-[-100%] group-hover/mobile:translate-x-[100%] transition-transform duration-500"></div>
                        <div className="flex items-center space-x-3 relative z-10">
                          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <span className="font-medium">Analytics</span>
                        </div>
                      </Link>
                    </>
                  )}
                  
                  {/* Enhanced Logout Button for Mobile */}
                  <button 
                    onClick={() => { logout(); setIsMenuOpen(false); }} 
                    className="bg-gradient-to-r from-red-500 via-red-400 to-red-600 hover:from-red-400 hover:via-red-300 hover:to-red-500 text-white font-semibold py-4 px-4 rounded-xl text-sm w-full transition-all duration-300 shadow-lg hover:shadow-xl border border-red-400/30 relative overflow-hidden group/logout-mobile mt-2"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent translate-x-[-100%] group-hover/logout-mobile:translate-x-[100%] transition-transform duration-500"></div>
                    <div className="flex items-center justify-center space-x-3 relative z-10">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Logout</span>
                    </div>
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    onClick={() => setIsMenuOpen(false)} 
                    className="text-slate-300 hover:text-teal-300 transition-all duration-300 py-4 px-4 rounded-xl hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-700/30 border border-transparent hover:border-slate-600/40 relative overflow-hidden group/mobile"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-transparent translate-x-[-100%] group-hover/mobile:translate-x-[100%] transition-transform duration-500"></div>
                    <div className="flex items-center justify-center space-x-3 relative z-10">
                      <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      <span className="font-medium">Log In</span>
                    </div>
                  </Link>
                  
                  <Link 
                    href="/register" 
                    onClick={() => setIsMenuOpen(false)} 
                    className="bg-gradient-to-r from-teal-500 via-teal-400 to-cyan-500 hover:from-teal-400 hover:via-teal-300 hover:to-cyan-400 text-white font-bold py-4 px-4 rounded-xl text-center transition-all duration-300 shadow-lg hover:shadow-xl border border-teal-400/30 relative overflow-hidden group/signup-mobile"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent translate-x-[-100%] group-hover/signup-mobile:translate-x-[100%] transition-transform duration-500"></div>
                    <div className="flex items-center justify-center space-x-3 relative z-10">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      <span>Sign Up</span>
                    </div>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
      
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        
        /* Performance optimized animations */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
          
          .animate-slideDown {
            animation: none !important;
          }
        }
      `}</style>
    </header>
  );
}