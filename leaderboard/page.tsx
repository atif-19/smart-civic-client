'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
    Crown, Shield, Star, Award, Zap, Edit, MicVocal, 
    ChevronsUp, ChevronsDown, Minus, Flame, Sparkles, Rocket,
    Trophy, Medal, Target, TrendingUp, ChevronRight
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

// --- ENHANCED BADGE DEFINITIONS (Civic Catalyst Theme) ---
const badges = [
    { threshold: 5000, name: 'Champion', icon: Crown, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
    { threshold: 2500, name: 'Legend', icon: Star, color: 'text-rose-400', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/30' },
    { threshold: 1000, name: 'Veteran', icon: Shield, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
    { threshold: 500, name: 'Guardian', icon: Shield, color: 'text-teal-400', bgColor: 'bg-teal-500/10', borderColor: 'border-teal-500/30' },
    { threshold: 250, name: 'Advocate', icon: MicVocal, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
    { threshold: 100, name: 'Contributor', icon: Edit, color: 'text-teal-400', bgColor: 'bg-teal-500/10', borderColor: 'border-teal-500/30' },
    { threshold: 50, name: 'Spark', icon: Zap, color: 'text-slate-400', bgColor: 'bg-slate-500/10', borderColor: 'border-slate-500/30' },
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
const Badge = ({ name, icon: Icon, color, bgColor, borderColor }: { name: string; icon: React.ElementType; color: string; bgColor: string; borderColor: string; }) => (
  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${color} ${bgColor} ${borderColor} border backdrop-blur-sm`}>
    <Icon className="w-3.5 h-3.5 mr-1.5" />
    {name}
  </span>
);

// --- ENHANCED RANK CHANGE INDICATOR ---
const RankChangeIndicator = ({ rank, previousRank }: { rank: number; previousRank: number | null }) => {
  if (previousRank === null) {
    return (
      <span className="flex items-center justify-center text-xs text-blue-400 font-bold bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20">
        <Sparkles className="w-3.5 h-3.5 mr-1" /> 
        New
      </span>
    );
  }
  const change = previousRank - rank;
  if (change > 0) {
    return (
      <span className="flex items-center justify-center text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
        <ChevronsUp className="w-4 h-4 mr-0.5" /> 
        {change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="flex items-center justify-center text-xs text-rose-400 font-bold bg-rose-500/10 px-2 py-1 rounded-full border border-rose-500/20">
        <ChevronsDown className="w-4 h-4 mr-0.5" /> 
        {Math.abs(change)}
      </span>
    );
  }
  return (
    <span className="flex items-center justify-center text-xs text-slate-500 font-bold bg-slate-500/10 px-2 py-1 rounded-full border border-slate-500/20">
      <Minus className="w-4 h-4" />
    </span>
  );
};

// --- ENHANCED STREAK INDICATOR ---
const StreakIndicator = ({ streak }: { streak: number }) => {
  if (streak < 2) return null;
  
  const getStreakColor = (streak: number) => {
    if (streak >= 30) return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' };
    if (streak >= 14) return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
    if (streak >= 7) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
    return { text: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' };
  };

  const colors = getStreakColor(streak);
  
  return (
    <div className={`flex items-center ${colors.text} font-bold text-xs ${colors.bg} border ${colors.border} px-2.5 py-1 rounded-full backdrop-blur-sm`}>
      <Flame className="w-3.5 h-3.5 mr-1" />
      {streak}
    </div>
  );
};

// --- ENHANCED PERSONAL RANK CARD (Civic Catalyst Theme) ---
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
          <div className="my-8 h-[140px] bg-white dark:bg-slate-900 rounded-3xl animate-pulse border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse"></div>
                <div className="space-y-2">
                  <div className="w-24 h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                  <div className="w-32 h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="w-32 h-8 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
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
                <div className="relative p-6 bg-white dark:bg-slate-900 rounded-3xl border border-teal-500/30 shadow-xl shadow-teal-500/10 hover:shadow-2xl hover:shadow-teal-500/20 transition-all duration-300">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                        <div className="flex items-center space-x-6">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center border-2 border-teal-500/30">
                                    <div className="text-3xl font-black text-teal-500">#{myRank.rank}</div>
                                </div>
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-800">
                                    {myRank.rank <= 3 && <Trophy className="w-4 h-4 text-amber-500" />}
                                    {myRank.rank > 3 && myRank.rank <= 10 && <Medal className="w-4 h-4 text-slate-400" />}
                                </div>
                            </div>
                            <div>
                                <div className="text-xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">Your Position</div>
                                <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                    <span className="font-bold text-teal-500">{myRank.points.toLocaleString()}</span> points earned
                                </div>
                                <div className="flex items-center flex-wrap gap-2">
                                    {badge && <Badge {...badge} />}
                                    <StreakIndicator streak={myRank.contributionStreak} />
                                    <RankChangeIndicator rank={myRank.rank} previousRank={myRank.previousRank} />
                                </div>
                            </div>
                        </div>
                        
                        {nextBadgeInfo && (
                            <div className="w-full lg:w-80 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Next Badge:</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{nextBadgeInfo.nextBadge.name}</span>
                                </div>
                                <div className="flex items-center space-x-2 mb-2">
                                    <Target className="w-4 h-4 text-teal-500" />
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                        {nextBadgeInfo.nextBadge.threshold - myRank.points} points to go
                                    </span>
                                </div>
                                <div className="relative w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                                    <div 
                                        className="absolute top-0 left-0 h-full bg-teal-500 rounded-full transition-all duration-1000 ease-out" 
                                        style={{ width: `${nextBadgeInfo.progress}%` }}
                                    ></div>
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-500 text-right mt-1">
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

// --- MAIN COMPONENT (Civic Catalyst Theme) ---
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

  const podiumUsers = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);
  const regularUsers = useMemo(() => leaderboard.slice(3), [leaderboard]);

  if (isLoading) {
    return (
      <main className="bg-slate-50 dark:bg-[#0b0f1a] min-h-screen flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-800 border-t-teal-500 rounded-full animate-spin"></div>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Loading Champions</h1>
            <p className="text-slate-500 dark:text-slate-400">Fetching leaderboard data...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="bg-slate-50 dark:bg-[#0b0f1a] min-h-screen flex items-center justify-center p-4">
        <div className="text-center p-10 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-3xl">
          <div className="text-rose-500 text-lg font-bold">{error}</div>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Please try refreshing the page</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0b0f1a] p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white dark:bg-slate-900 rounded-3xl mb-6 shadow-xl border border-slate-200 dark:border-slate-800 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            <Trophy className="w-10 h-10 text-teal-500" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
            Hall of <span className="text-teal-500">Fame</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Honoring our community's most dedicated contributors and their remarkable achievements
          </p>
          <div className="flex items-center justify-center space-x-6 mt-6 text-sm text-slate-500">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Live Rankings</span>
            </div>
            <div className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>Updated Daily</span>
            </div>
          </div>
        </header>

        <PersonalRankCard />

        {/* Main Leaderboard */}
        <div className="relative">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
            {leaderboard.length > 0 ? (
              <>
                {/* Podium section */}
                {podiumUsers.length > 0 && (
                  <div className="mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-center gap-2 mb-8">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Champions Podium</h2>
                      <Trophy className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {podiumUsers.map((user, index) => {
                        const badge = getBadgeForPoints(user.points);
                        const podiumStyles = [
                          { bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/30', text: 'text-amber-500', icon: '🥇' },
                          { bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-500', icon: '🥈' },
                          { bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/30', text: 'text-orange-500', icon: '🥉' }
                        ][index];

                        return (
                          <div key={user.email} className="group">
                            <div className={`${podiumStyles.bg} border-2 ${podiumStyles.border} rounded-3xl p-6 text-center transform group-hover:scale-105 transition-all duration-300`}>
                              <div className="text-4xl mb-3">{podiumStyles.icon}</div>
                              <div className="w-16 h-16 rounded-full bg-teal-500 flex items-center justify-center font-black text-xl text-white mx-auto mb-4 shadow-lg">
                                {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                              </div>
                              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 truncate">{user.name}</h3>
                              <div className={`text-2xl font-black ${podiumStyles.text} mb-2`}>
                                {user.points.toLocaleString()}
                              </div>
                              <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">points</div>
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
                  {regularUsers.map((user) => {
                    const badge = getBadgeForPoints(user.points);

                    return (
                      <li
                        key={user.email}
                        className="group rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-teal-500/50 dark:hover:border-teal-500/50 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between p-4 md:p-5">
                          <div className="flex items-center min-w-0 flex-1">
                            <div className="text-center w-12 mr-4 flex-shrink-0">
                              <div className="font-black text-xl text-slate-900 dark:text-white mb-1">
                                {user.rank}
                              </div>
                              <RankChangeIndicator rank={user.rank} previousRank={user.previousRank} />
                            </div>
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-base mr-4 flex-shrink-0 text-slate-700 dark:text-slate-300">
                              {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center flex-wrap gap-3 mb-1">
                                <span className="text-sm md:text-base truncate font-bold text-slate-900 dark:text-white">
                                  {user.name}
                                </span>
                                {badge && <Badge {...badge} />}
                                {user.isWeeklyClimber && (
                                  <span className="hidden lg:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
                                    <Rocket className="w-3 h-3 mr-1.5" /> 
                                    Climber
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center flex-shrink-0 ml-4 space-x-4">
                            <StreakIndicator streak={user.contributionStreak} />
                            <div className="text-right">
                              <div className="font-black text-lg md:text-xl text-teal-500">
                                {user.points.toLocaleString()}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">points</div>
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
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Trophy className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  The championship awaits
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
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