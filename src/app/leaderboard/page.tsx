'use client';

import { useState, useEffect } from 'react';
import { Crown } from 'lucide-react';

interface LeaderboardUser {
  email: string;
  points: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/leaderboard`);
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard data.');
        }
        const data = await response.json();
        setLeaderboard(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (isLoading) {
    return (
      <main className="bg-slate-900 min-h-screen flex items-center justify-center text-white p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-purple-900/10 animate-pulse"></div>
      
      {/* Loading content */}
      <div className="relative z-10 flex flex-col items-center space-y-6">
        {/* Spinner */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="absolute top-2 left-2 w-12 h-12 border-4 border-slate-800 border-t-purple-500 rounded-full animate-spin" style={{animationDirection: 'reverse'}}></div>
        </div>
        
        {/* Text */}
        <div className="text-center">
          <h1 className="text-xl font-light tracking-wide animate-pulse">Loading Leaderboard...</h1>
        </div>
      </div>
    </main>
    );
  }

  if (error) {
    return (
      <main className="bg-slate-900 min-h-screen flex items-center justify-center">
        <div className="text-center p-10 text-red-400">{error}</div>
      </main>
    );
  }

  return (
    // Enhanced Leaderboard Component
<main className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8 text-slate-100 overflow-hidden">
  {/* Background Effects */}
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(20,184,166,0.12),transparent_50%)] opacity-70"></div>
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(59,130,246,0.08),transparent_50%)] opacity-70"></div>
  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_30%,rgba(14,165,233,0.04)_50%,transparent_70%)]"></div>
  
  {/* Floating Elements */}
  <div className="absolute top-20 left-10 w-2 h-2 bg-teal-400/30 rounded-full animate-pulse"></div>
  <div className="absolute top-40 right-20 w-1 h-1 bg-cyan-400/40 rounded-full animate-ping"></div>
  <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-blue-400/30 rounded-full animate-pulse"></div>

  <div className="relative z-10 max-w-3xl mx-auto">
    {/* Enhanced Header */}
    <header className="text-center mb-12">
      {/* Trophy Icon */}
      <div className="inline-block mb-6">
        <div className="relative group">
          <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 via-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl shadow-yellow-500/25 mx-auto transition-transform duration-300 group-hover:scale-110">
            <span className="text-3xl">🏆</span>
          </div>
          <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
        </div>
      </div>
      
      {/* Title */}
      <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-4 leading-tight tracking-tight">
        Top Contributors
      </h1>
      
      {/* Subtitle */}
      <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
        Celebrating the champions who are making the biggest impact in our community
      </p>
      
      {/* Stats Bar */}
      <div className="flex justify-center mt-8">
        <div className="flex flex-wrap gap-4 bg-slate-800/50 backdrop-blur-sm rounded-2xl px-6 py-3 border border-slate-700/50 shadow-xl">
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-400">{leaderboard.length}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Contributors</div>
          </div>
          <div className="w-px bg-slate-600/70"></div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-400">
              {leaderboard.reduce((sum, user) => sum + user.points, 0)}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Points</div>
          </div>
        </div>
      </div>
    </header>

    {/* Leaderboard Container */}
    <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-700/50 p-6 md:p-8">
      {leaderboard.length > 0 ? (
        <ol className="space-y-4">
          {leaderboard.map((user, index) => {
            const isFirst = index === 0;
            const isSecond = index === 1;
            const isThird = index === 2;
            const isTopThree = index < 3;
            
            return (
              <li 
                key={index} 
                className={`
                  group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl
                  ${isFirst ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/30 shadow-lg shadow-yellow-500/10' :
                    isSecond ? 'bg-gradient-to-r from-slate-600/30 to-slate-700/30 border-2 border-slate-400/30' :
                    isThird ? 'bg-gradient-to-r from-orange-600/20 to-red-600/20 border-2 border-orange-500/30' :
                    'bg-slate-700/40 border border-slate-600/30 hover:border-slate-500/50'
                  }
                `}
              >
                {/* Rank Indicator */}
                <div className={`
                  absolute left-0 top-0 bottom-0 w-2 
                  ${isFirst ? 'bg-gradient-to-b from-yellow-400 to-orange-500' :
                    isSecond ? 'bg-gradient-to-b from-slate-300 to-slate-500' :
                    isThird ? 'bg-gradient-to-b from-orange-400 to-red-500' :
                    'bg-gradient-to-b from-teal-400 to-cyan-500'
                  }
                `}></div>
                
                <div className="flex items-center justify-between p-4 md:p-6 pl-8">
                  <div className="flex items-center min-w-0 flex-1">
                    {/* Rank Number */}
                    <div className={`
                      flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full font-bold text-lg md:text-xl mr-4 md:mr-6 flex-shrink-0
                      ${isFirst ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg shadow-yellow-500/30' :
                        isSecond ? 'bg-gradient-to-r from-slate-300 to-slate-500 text-white shadow-lg shadow-slate-500/30' :
                        isThird ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-lg shadow-orange-500/30' :
                        'bg-slate-600/70 text-slate-300 border border-slate-500/50'
                      }
                    `}>
                      {index + 1}
                    </div>
                    
                    {/* User Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-3">
                        {/* User Avatar */}
                        <div className={`
                          w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm md:text-base flex-shrink-0
                          ${isTopThree ? 'bg-gradient-to-r from-teal-400 to-cyan-400 text-white shadow-lg' : 'bg-slate-600 text-slate-200'}
                        `}>
                          {user.email[0].toUpperCase()}
                        </div>
                        
                        {/* Email */}
                        <span className={`
                          text-sm md:text-base truncate font-medium
                          ${isTopThree ? 'text-white' : 'text-slate-200'}
                        `}>
                          {user.email}
                        </span>
                        
                        {/* Badge for top performers */}
                        {isFirst && (
                          <span className="hidden sm:inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                            Champion
                          </span>
                        )}
                        {isSecond && (
                          <span className="hidden sm:inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">
                            Runner-up
                          </span>
                        )}
                        {isThird && (
                          <span className="hidden sm:inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                            3rd Place
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Points Section */}
                  <div className="flex items-center flex-shrink-0 ml-4">
                    {isFirst && (
                      <Crown className="w-5 h-5 md:w-6 md:h-6 mr-2 text-yellow-400 animate-pulse" />
                    )}
                    <div className="text-right">
                      <div className={`
                        font-bold text-lg md:text-xl
                        ${isFirst ? 'text-yellow-400' :
                          isSecond ? 'text-slate-300' :
                          isThird ? 'text-orange-400' :
                          'text-teal-400'
                        }
                      `}>
                        {user.points.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-400 font-medium">points</div>
                    </div>
                  </div>
                </div>
                
                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"></div>
              </li>
            );
          })}
        </ol>
      ) : (
        // Enhanced Empty State
        <div className="text-center py-16">
          <div className="mb-6">
            <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl opacity-50">🏆</span>
            </div>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-300 mb-3">
            The leaderboard awaits its first champion
          </h3>
          <p className="text-slate-400 text-base md:text-lg max-w-md mx-auto leading-relaxed">
            Be the pioneer who starts making a difference in our community. Every contribution counts!
          </p>
          <div className="mt-8">
            <button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-bold px-8 py-3 rounded-full shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105">
              Start Contributing
            </button>
          </div>
        </div>
      )}
    </div>

    {/* Achievement Callout */}
    {leaderboard.length > 0 && (
      <div className="mt-8 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 backdrop-blur-sm rounded-2xl p-6 border border-teal-500/20">
        <div className="flex items-center justify-center space-x-2 text-center">
          <span className="text-2xl">🎉</span>
          <p className="text-slate-300 font-medium">
            Together, our community has made <span className="font-bold text-teal-400">{leaderboard.reduce((sum, user) => sum + user.points, 0).toLocaleString()}</span> impactful contributions!
          </p>
        </div>
      </div>
    )}
  </div>

  <style jsx>{`
    .shadow-3xl {
      box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.6);
    }
  `}</style>
</main>
  );
}