'use client';

import { useState, useEffect } from 'react';
import { 
    Crown, Shield, Star, Award, Zap, Edit, MicVocal, 
    ChevronsUp, ChevronsDown, Minus, Flame, Sparkles, Rocket 
} from 'lucide-react';

// --- UPDATED INTERFACE WITH GAMIFICATION FIELDS ---
interface LeaderboardUser {
  email: string;
  points: number;
  name: string;
  rank: number;
  previousRank: number | null;
  contributionStreak: number;
  isWeeklyClimber: boolean;
}

// --- BADGE DEFINITIONS ---
const badges = [
    { threshold: 5000, name: 'Champion', icon: Award, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500/30' },
    { threshold: 2500, name: 'Legend', icon: Star, color: 'text-purple-400', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-500/30' },
    { threshold: 1000, name: 'Veteran', icon: Shield, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', borderColor: 'border-cyan-500/30' },
    { threshold: 500, name: 'Guardian', icon: Shield, color: 'text-blue-400', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500/30' },
    { threshold: 250, name: 'Advocate', icon: MicVocal, color: 'text-orange-400', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-500/30' },
    { threshold: 100, name: 'Contributor', icon: Edit, color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/30' },
    { threshold: 50, name: 'Spark', icon: Zap, color: 'text-slate-300', bgColor: 'bg-slate-500/20', borderColor: 'border-slate-500/30' },
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

const Badge = ({ name, icon: Icon, color, bgColor, borderColor }: { name: string; icon: React.ElementType; color: string; bgColor: string; borderColor: string; }) => (
  <span title={`${name} Badge`} className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${color} ${bgColor} ${borderColor} border`}>
    <Icon className="w-3 h-3 mr-1.5" />
    {name}
  </span>
);

// --- GAMIFICATION COMPONENTS ---
const RankChangeIndicator = ({ rank, previousRank }: { rank: number; previousRank: number | null }) => {
  if (previousRank === null) {
    return <span title="New to Leaderboard" className="flex items-center justify-center text-xs text-blue-400 font-bold"><Sparkles className="w-3.5 h-3.5 mr-1" /> New</span>;
  }
  const change = previousRank - rank;
  if (change > 0) {
    return <span title={`Up ${change} places`} className="flex items-center justify-center text-xs text-green-400 font-bold"><ChevronsUp className="w-4 h-4 mr-0.5" /> {change}</span>;
  }
  if (change < 0) {
    return <span title={`Down ${Math.abs(change)} places`} className="flex items-center justify-center text-xs text-red-400 font-bold"><ChevronsDown className="w-4 h-4 mr-0.5" /> {Math.abs(change)}</span>;
  }
  return <span title="No change in rank" className="flex items-center justify-center text-xs text-slate-500 font-bold"><Minus className="w-4 h-4" /></span>;
};

const StreakIndicator = ({ streak }: { streak: number }) => {
  if (streak < 2) return null;
  return (
    <div title={`${streak}-day streak!`} className="flex items-center text-orange-400 font-bold text-xs bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
      <Flame className="w-3.5 h-3.5 mr-1" />
      {streak}
    </div>
  );
};

// --- PERSONAL RANK CARD WITH LIVE DATA FETCH ---
const PersonalRankCard = () => {
    const [myRank, setMyRank] = useState<LeaderboardUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMyRank = async () => {
            try {
                // This fetches from the new endpoint you need to create.
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
        // Simple loader for the card
        return <div className="my-8 h-[100px] bg-slate-800/80 rounded-2xl animate-pulse"></div>;
    }

    if (!myRank) {
        // Don't render the card if the user isn't ranked or not logged in
        return null;
    }

    const nextBadgeInfo = getNextBadgeInfo(myRank.points);

    return (
        <div className="my-8">
            <div className="relative p-6 bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-teal-500/30 shadow-xl">
                 <div className="absolute -inset-px bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl opacity-30 blur-lg"></div>
                 <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center">
                        <div className="text-4xl font-bold text-slate-400 mr-4">#{myRank.rank}</div>
                        <div>
                            <div className="text-lg font-bold text-white">Your Rank</div>
                            <div className="text-sm text-slate-300">You have <span className="font-bold text-teal-300">{myRank.points.toLocaleString()}</span> points</div>
                        </div>
                    </div>
                    {nextBadgeInfo && (
                         <div className="w-full sm:w-1/3 text-sm text-slate-300 text-left sm:text-right">
                             <div>{nextBadgeInfo.nextBadge.threshold - myRank.points} points to <span className="font-bold text-white">{nextBadgeInfo.nextBadge.name}</span></div>
                             <div className="w-full bg-slate-600/50 rounded-full h-2 mt-1">
                                 <div className="bg-gradient-to-r from-teal-400 to-cyan-400 h-2 rounded-full" style={{ width: `${nextBadgeInfo.progress}%` }}></div>
                             </div>
                         </div>
                    )}
                 </div>
            </div>
        </div>
    );
};

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

  if (isLoading) {
    return (
      <main className="bg-slate-900 min-h-screen flex items-center justify-center text-white p-4 relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute top-2 left-2 w-12 h-12 border-4 border-slate-800 border-t-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
          </div>
          <h1 className="text-xl font-light tracking-wide animate-pulse">Loading Leaderboard...</h1>
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
    <main className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8 text-slate-100 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(20,184,166,0.12),transparent_50%)] opacity-70"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(59,130,246,0.08),transparent_50%)] opacity-70"></div>
      <div className="relative z-10 max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <div className="inline-block mb-6">
            <div className="relative group">
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 via-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl shadow-yellow-500/25 mx-auto transition-transform duration-300 group-hover:scale-110">
                <span className="text-3xl">🏆</span>
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-4 leading-tight tracking-tight">
            Top Contributors
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
            Celebrating the champions who are making the biggest impact in our community
          </p>
        </header>

        <PersonalRankCard />

        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-700/50 p-6 md:p-8">
          {leaderboard.length > 0 ? (
            <ol className="space-y-4">
              {leaderboard.map((user, index) => {
                const isFirst = index === 0;
                const isSecond = index === 1;
                const isThird = index === 2;
                const isTopThree = index < 3;
                const badge = getBadgeForPoints(user.points);

                return (
                  <li
                    key={user.email}
                    className={`group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl
                      ${isFirst ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/30' :
                        isSecond ? 'bg-gradient-to-r from-slate-600/30 to-slate-700/30 border-2 border-slate-400/30' :
                        isThird ? 'bg-gradient-to-r from-orange-600/20 to-red-600/20 border-2 border-orange-500/30' :
                        'bg-slate-700/40 border border-slate-600/30 hover:border-slate-500/50'
                      }`}
                  >
                    <div className="flex items-center justify-between p-4 md:p-5">
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="text-center w-12 mr-4 flex-shrink-0">
                          <div className={`font-bold text-xl ${isFirst ? 'text-yellow-400' : isSecond ? 'text-slate-300' : isThird ? 'text-orange-400' : 'text-slate-400'}`}>
                            {user.rank}
                          </div>
                          <RankChangeIndicator rank={user.rank} previousRank={user.previousRank} />
                        </div>
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-base mr-4 flex-shrink-0
                          ${isTopThree ? 'bg-gradient-to-r from-teal-400 to-cyan-400 text-white shadow-lg' : 'bg-slate-600 text-slate-200'}`}
                        >
                          {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-3">
                            <span className={`text-sm md:text-base truncate font-medium ${isTopThree ? 'text-white' : 'text-slate-200'}`}>
                              {user.name}
                            </span>
                            {badge && <Badge {...badge} />}
                            {user.isWeeklyClimber && (
                              <span title="Weekly Top Climber!" className="hidden lg:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold text-rose-400 bg-rose-500/20 border border-rose-500/30">
                                <Rocket className="w-3 h-3 mr-1.5" /> Climber
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-slate-400 truncate">{user.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center flex-shrink-0 ml-4 space-x-4">
                        <StreakIndicator streak={user.contributionStreak} />
                        <div className="flex items-center">
                          {isFirst && <Crown className="w-5 h-5 md:w-6 md:h-6 mr-2 text-yellow-400 animate-pulse" />}
                          <div className="text-right">
                            <div className={`font-bold text-lg md:text-xl
                              ${isFirst ? 'text-yellow-400' : isSecond ? 'text-slate-300' : isThird ? 'text-orange-400' : 'text-teal-400'}`}
                            >
                              {user.points.toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-400 font-medium">points</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-xl md:text-2xl font-bold text-slate-300 mb-3">
                The leaderboard awaits its first champion
              </h3>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}