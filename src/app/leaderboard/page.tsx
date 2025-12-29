'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
    Crown, Shield, Star, Award, Zap, Edit, MicVocal, 
    ChevronsUp, ChevronsDown, Minus, Flame, Sparkles, Rocket,
    Trophy, Medal, Target, TrendingUp
} from 'lucide-react';

// --- INTERFACE ---
interface LeaderboardUser {
  email: string;
  points: number;
  name: string;
  rank: number;
  previousRank: number | null;
  contributionStreak: number;
  isWeeklyClimber: boolean;
}

// --- ENHANCED BADGE DEFINITIONS ---
const badges = [
    { threshold: 5000, name: 'Champion', icon: Award, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500/30', glow: 'shadow-yellow-500/20' },
    { threshold: 2500, name: 'Legend', icon: Star, color: 'text-purple-400', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-500/30', glow: 'shadow-purple-500/20' },
    { threshold: 1000, name: 'Veteran', icon: Shield, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', borderColor: 'border-cyan-500/30', glow: 'shadow-cyan-500/20' },
    { threshold: 500, name: 'Guardian', icon: Shield, color: 'text-blue-400', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500/30', glow: 'shadow-blue-500/20' },
    { threshold: 250, name: 'Advocate', icon: MicVocal, color: 'text-orange-400', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-500/30', glow: 'shadow-orange-500/20' },
    { threshold: 100, name: 'Contributor', icon: Edit, color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/30', glow: 'shadow-green-500/20' },
    { threshold: 50, name: 'Spark', icon: Zap, color: 'text-slate-300', bgColor: 'bg-slate-500/20', borderColor: 'border-slate-500/30', glow: 'shadow-slate-500/20' },
];

const getBadgeForPoints = (points: number) => {
  return badges.find(badge => points >= badge.threshold) || null;
};

const getNextBadgeInfo = (points: number) => {
  const reversedBadges = [...badges].reverse();
  const nextBadge = reversedBadges.find(badge => points < badge.threshold);
  if (!nextBadge) return null;

  const previousBadgeThreshold = reversedBadges.find(badge => points >= badge.threshold)?.threshold || 0;
  const pointsInTier = points - previousBadgeThreshold;
  const tierTotalPoints = nextBadge.threshold - previousBadgeThreshold;
  const progress = Math.min((pointsInTier / tierTotalPoints) * 100, 100);

  return { nextBadge, progress };
};

// --- ENHANCED BADGE COMPONENT ---
const Badge = ({ name, icon: Icon, color, bgColor, borderColor, glow }: { name: string; icon: React.ElementType; color: string; bgColor: string; borderColor: string; glow: string; }) => (
  <span title={`${name} Badge`} className={`hidden sm:inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${color} ${bgColor} ${borderColor} border shadow-md ${glow} backdrop-blur-sm`}>
    <Icon className="w-3.5 h-3.5 mr-1.5" />
    {name}
  </span>
);

// --- ENHANCED RANK CHANGE INDICATOR ---
const RankChangeIndicator = ({ rank, previousRank }: { rank: number; previousRank: number | null }) => {
  if (previousRank === null) {
    return (
      <span title="New to Leaderboard" className="flex items-center justify-center text-xs text-blue-400 font-bold bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20">
        <Sparkles className="w-3.5 h-3.5 mr-1" /> 
        New
      </span>
    );
  }
  const change = previousRank - rank;
  if (change > 0) {
    return (
      <span title={`Up ${change} places`} className="flex items-center justify-center text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
        <ChevronsUp className="w-4 h-4 mr-0.5" /> 
        {change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span title={`Down ${Math.abs(change)} places`} className="flex items-center justify-center text-xs text-red-400 font-bold bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20">
        <ChevronsDown className="w-4 h-4 mr-0.5" /> 
        {Math.abs(change)}
      </span>
    );
  }
  return (
    <span title="No change in rank" className="flex items-center justify-center text-xs text-slate-500 font-bold bg-slate-500/10 px-2 py-1 rounded-full border border-slate-500/20">
      <Minus className="w-4 h-4" />
    </span>
  );
};

// --- ENHANCED STREAK INDICATOR ---
const StreakIndicator = ({ streak }: { streak: number }) => {
  if (streak < 2) return null;
  
  const getStreakColor = (streak: number) => {
    if (streak >= 30) return { text: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/25', glow: 'shadow-red-500/20' };
    if (streak >= 14) return { text: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/25', glow: 'shadow-orange-500/20' };
    if (streak >= 7) return { text: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/25', glow: 'shadow-yellow-500/20' };
    return { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', glow: 'shadow-orange-500/10' };
  };

  const colors = getStreakColor(streak);
  
  return (
    <div title={`${streak}-day streak!`} className={`flex items-center ${colors.text} font-bold text-xs ${colors.bg} border ${colors.border} px-2.5 py-1 rounded-full shadow-md ${colors.glow} backdrop-blur-sm`}>
      <Flame className="w-3.5 h-3.5 mr-1" />
      {streak}
    </div>
  );
};

// --- ENHANCED PERSONAL RANK CARD ---
const PersonalRankCard = () => {
    const [myRank, setMyRank] = useState<LeaderboardUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMyRank = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/my-rank`);
                if (response.ok) {
                    const data = await response.json();
                    setMyRank(data);
                }
            } catch (error) {
                console.error("Could not fetch personal rank:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMyRank();
    }, []);

    if (isLoading) {
        return (
          <div className="my-8 h-[120px] bg-slate-800/60 backdrop-blur-sm rounded-2xl animate-pulse border border-slate-700/50 shadow-xl">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-700/50 rounded-full animate-pulse"></div>
                <div className="space-y-2">
                  <div className="w-24 h-4 bg-slate-700/50 rounded animate-pulse"></div>
                  <div className="w-32 h-3 bg-slate-700/50 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="w-32 h-8 bg-slate-700/50 rounded animate-pulse"></div>
            </div>
          </div>
        );
    }

    if (!myRank) return null;

    const nextBadgeInfo = getNextBadgeInfo(myRank.points);
    const badge = getBadgeForPoints(myRank.points);

    return (
        <div className="my-8">
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 rounded-2xl opacity-20 group-hover:opacity-30 blur-lg transition-opacity duration-300"></div>
                <div className="relative p-6 bg-slate-800/90 backdrop-blur-sm rounded-2xl border border-teal-500/30 shadow-2xl">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                        <div className="flex items-center space-x-6">
                            <div className="relative">
                                <div className="text-4xl font-bold text-slate-400">#{myRank.rank}</div>
                                <div className="absolute -top-2 -right-2">
                                    {myRank.rank <= 3 && <Trophy className="w-5 h-5 text-yellow-400" />}
                                    {myRank.rank > 3 && myRank.rank <= 10 && <Medal className="w-5 h-5 text-slate-400" />}
                                </div>
                            </div>
                            <div>
                                <div className="text-xl font-bold text-white mb-1">Your Position</div>
                                <div className="text-sm text-slate-300 mb-2">
                                    <span className="font-bold text-teal-300">{myRank.points.toLocaleString()}</span> points earned
                                </div>
                                <div className="flex items-center space-x-3">
                                    {badge && <Badge {...badge} />}
                                    <StreakIndicator streak={myRank.contributionStreak} />
                                    <RankChangeIndicator rank={myRank.rank} previousRank={myRank.previousRank} />
                                </div>
                            </div>
                        </div>
                        
                        {nextBadgeInfo && (
                            <div className="w-full lg:w-80 bg-slate-700/30 p-4 rounded-xl border border-slate-600/30">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-slate-300">Next Badge:</span>
                                    <span className="font-bold text-white">{nextBadgeInfo.nextBadge.name}</span>
                                </div>
                                <div className="flex items-center space-x-2 mb-2">
                                    <Target className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm text-slate-400">
                                        {nextBadgeInfo.nextBadge.threshold - myRank.points} points to go
                                    </span>
                                </div>
                                <div className="relative w-full bg-slate-600/50 rounded-full h-2.5 overflow-hidden">
                                    <div 
                                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 rounded-full transition-all duration-1000 ease-out shadow-sm shadow-cyan-400/30" 
                                        style={{ width: `${nextBadgeInfo.progress}%` }}
                                    ></div>
                                </div>
                                <div className="text-xs text-slate-500 text-right mt-1">
                                    {Math.round(nextBadgeInfo.progress)}% complete
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/leaderboard`);
        if (!response.ok) throw new Error('Failed to fetch leaderboard data.');
        const data: LeaderboardUser[] = await response.json();
        setLeaderboard(data);
      } catch (err) {
        if (err instanceof Error) setError(err.message);
        else setError('An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  // Memoized podium users for performance
  const podiumUsers = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);
  const regularUsers = useMemo(() => leaderboard.slice(3), [leaderboard]);

  if (isLoading) {
    return (
      <main className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen flex items-center justify-center text-white p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.1),transparent_70%)]"></div>
        <div className="relative z-10 flex flex-col items-center space-y-8">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-slate-700 border-t-teal-500 rounded-full animate-spin"></div>
            <div className="absolute top-2 left-2 w-16 h-16 border-4 border-slate-800 border-t-cyan-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-wide mb-2">Loading Champions</h1>
            <p className="text-slate-400 animate-pulse">Fetching leaderboard data...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen flex items-center justify-center">
        <div className="text-center p-10 bg-red-500/10 border border-red-500/20 rounded-2xl backdrop-blur-sm">
          <div className="text-red-400 text-lg font-semibold">{error}</div>
          <p className="text-slate-400 mt-2">Please try refreshing the page</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8 text-slate-100 overflow-hidden">
      {/* Enhanced background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(20,184,166,0.15),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.05),transparent_70%)]"></div>
      
      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Enhanced header */}
        <header className="text-center mb-12">
          <div className="inline-block mb-8">
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 rounded-full opacity-30 group-hover:opacity-40 blur-lg transition-opacity duration-300"></div>
              <div className="relative w-24 h-24 bg-gradient-to-r from-yellow-500 via-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl shadow-yellow-500/25 mx-auto transform group-hover:scale-105 transition-transform duration-300">
                <Trophy className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-6 leading-tight tracking-tight">
            Hall of Fame
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed font-medium">
            Honoring our community`&apos;`s most dedicated contributors and their remarkable achievements
          </p>
          <div className="flex items-center justify-center space-x-6 mt-6 text-sm text-slate-500">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Live Rankings</span>
            </div>
            <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>Updated Daily</span>
            </div>
          </div>
        </header>

        <PersonalRankCard />

        {/* Enhanced main leaderboard */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-slate-600/20 via-slate-700/20 to-slate-600/20 rounded-3xl blur-xl"></div>
          <div className="relative bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-700/50 p-6 md:p-8">
            {leaderboard.length > 0 ? (
              <>
                {/* Podium section for top 3 */}
                {podiumUsers.length > 0 && (
                  <div className="mb-8 pb-8 border-b border-slate-700/50">
                    <h2 className="text-2xl font-bold text-center mb-8 text-slate-200">🏆 Champions Podium 🏆</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {podiumUsers.map((user, index) => {
                        const badge = getBadgeForPoints(user.points);
                        const podiumColors = [
                          { bg: 'from-yellow-500/20 to-orange-500/20', border: 'border-yellow-500/40', text: 'text-yellow-400', icon: '🥇' },
                          { bg: 'from-slate-400/20 to-slate-600/20', border: 'border-slate-400/40', text: 'text-slate-300', icon: '🥈' },
                          { bg: 'from-orange-600/20 to-red-600/20', border: 'border-orange-500/40', text: 'text-orange-400', icon: '🥉' }
                        ][index];

                        return (
                          <div key={user.email} className={`relative group`}>
                            <div className={`absolute -inset-1 bg-gradient-to-r ${podiumColors.bg} rounded-2xl opacity-50 group-hover:opacity-70 blur-sm transition-opacity duration-300`}></div>
                            <div className={`relative bg-slate-800/90 backdrop-blur-sm rounded-2xl border-2 ${podiumColors.border} p-6 text-center transform group-hover:scale-105 transition-transform duration-300`}>
                              <div className="text-4xl mb-3">{podiumColors.icon}</div>
                              <div className={`w-16 h-16 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 flex items-center justify-center font-bold text-xl text-white mx-auto mb-4 shadow-lg`}>
                                {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                              </div>
                              <h3 className="font-bold text-lg text-white mb-2 truncate">{user.name}</h3>
                              <div className={`text-2xl font-bold ${podiumColors.text} mb-2`}>
                                {user.points.toLocaleString()}
                              </div>
                              <div className="text-sm text-slate-400 mb-4">points</div>
                              <div className="flex flex-wrap justify-center gap-2">
                                {badge && <Badge {...badge} />}
                                <StreakIndicator streak={user.contributionStreak} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Regular leaderboard */}
                <ol className="space-y-3" start={4}>
                  {regularUsers.map((user, index) => {
                    const actualIndex = index + 3;
                    const badge = getBadgeForPoints(user.points);

                    return (
                      <li
                        key={user.email}
                        className="group relative overflow-hidden rounded-2xl bg-slate-700/40 border border-slate-600/30 hover:border-slate-500/50 hover:bg-slate-700/60 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between p-4 md:p-5">
                          <div className="flex items-center min-w-0 flex-1">
                            <div className="text-center w-12 mr-4 flex-shrink-0">
                              <div className="font-bold text-xl text-slate-400">
                                {user.rank}
                              </div>
                              <RankChangeIndicator rank={user.rank} previousRank={user.previousRank} />
                            </div>
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-600 flex items-center justify-center font-bold text-base mr-4 flex-shrink-0 text-slate-200 shadow-md">
                              {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center flex-wrap gap-3 mb-1">
                                <span className="text-sm md:text-base truncate font-medium text-slate-200">
                                  {user.name}
                                </span>
                                {badge && <Badge {...badge} />}
                                {user.isWeeklyClimber && (
                                  <span title="Weekly Top Climber!" className="hidden lg:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold text-rose-400 bg-rose-500/20 border border-rose-500/30 shadow-md shadow-rose-500/10">
                                    <Rocket className="w-3 h-3 mr-1.5" /> 
                                    Climber
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-slate-400 truncate">{user.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center flex-shrink-0 ml-4 space-x-4">
                            <StreakIndicator streak={user.contributionStreak} />
                            <div className="text-right">
                              <div className="font-bold text-lg md:text-xl text-teal-400">
                                {user.points.toLocaleString()}
                              </div>
                              <div className="text-xs text-slate-400 font-medium">points</div>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </>
            ) : (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trophy className="w-10 h-10 text-slate-500" />
                </div>
                <h3 className="text-2xl font-bold text-slate-300 mb-3">
                  The championship awaits
                </h3>
                <p className="text-slate-400 max-w-md mx-auto">
                  Be the first to make your mark and claim the top spot on our leaderboard
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}