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
        const response = await fetch('http://localhost:8000/api/auth/leaderboard');
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard data.');
        }
        const data = await response.json();
        setLeaderboard(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (isLoading) {
    return <div className="text-center p-10 text-white">Loading Leaderboard...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-400">{error}</div>;
  }

  return (
    <main className="bg-slate-900 min-h-screen p-8 text-slate-100">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-teal-400">Top Contributors</h1>
          <p className="text-slate-400 mt-2">See who's making the biggest impact in our community!</p>
        </header>

        <div className="bg-slate-800 rounded-lg shadow-lg p-6">
          <ol className="space-y-4">
            {leaderboard.map((user, index) => (
              <li key={index} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-md">
                <div className="flex items-center">
                  <span className="text-lg font-bold text-slate-400 w-8">{index + 1}.</span>
                  <span className="ml-4 text-slate-200">{user.email}</span>
                </div>
                <div className="flex items-center font-bold text-teal-400 text-lg">
                  {index === 0 && <Crown className="w-6 h-6 mr-2 text-yellow-400" />}
                  {user.points} Points
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </main>
  );
}