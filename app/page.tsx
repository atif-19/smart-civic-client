'use client';

import { useState, useEffect, FormEvent, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { ThumbsUp, Plus, MessageSquare } from 'lucide-react';
import Link from 'next/link';

// --- Type Definitions ---
interface User {
  _id: string;
  email: string;
}
interface Comment {
  _id: string;
  text: string;
  submittedBy: User;
  createdAt: string;
}
interface Report {
  _id: string;
  category: string;
  description: string;
  imageUrl: string;
  upvotes: string[];
  upvoteCount: number;
  submittedBy: User;
  createdAt: string;
  commentCount: number;
}

// --- A self-contained component for a single report card ---
const ReportCard = ({ initialReport, currentUser, onUpdate }: { initialReport: Report, currentUser: User | null, onUpdate: () => void }) => {
  const [report, setReport] = useState(initialReport);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  // Update local state if the initialReport prop changes (e.g., after a parent refetch)
  useEffect(() => {
    setReport(initialReport);
  }, [initialReport]);

  const userHasUpvoted = currentUser && report.upvotes ? report.upvotes.includes(currentUser._id) : false;

  const handleUpvote = async () => {
    if (!currentUser) return alert('You must be logged in to upvote.');
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/${report._id}/upvote`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to upvote');
      onUpdate(); // Trigger a refetch of all reports
    } catch (err) {
      alert('Failed to upvote.');
    }
  };
  
  const toggleComments = async () => {
    const shouldShow = !showComments;
    setShowComments(shouldShow);
    if (shouldShow && comments.length === 0) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/${report._id}/comments`);
        if (!response.ok) throw new Error('Failed to fetch comments');
        const data = await response.json();
        setComments(data);
      } catch (error) {
        console.error("Failed to fetch comments", error);
      }
    }
  };

  const handleCommentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;
    setIsCommenting(true);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/${report._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ text: newComment }),
      });
      if(response.ok) {
        setNewComment('');
        onUpdate(); 
        setShowComments(false); // Close and re-open to refetch comments
        setTimeout(() => setShowComments(true), 50);
      }
    } catch (error) {
      alert('Failed to post comment.');
    } finally {
      setIsCommenting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-sm rounded-2xl shadow-2xl p-5 md:p-6 border border-slate-700/50 hover:border-slate-600/70 transition-all duration-300 hover:shadow-3xl group">
  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
    {/* Mobile: Horizontal upvote, Desktop: Vertical upvote */}
    <div className="flex flex-row sm:flex-col items-center justify-start sm:justify-center gap-3 order-2 sm:order-1">
      <button 
        onClick={handleUpvote} 
        disabled={!currentUser} 
        className="relative p-3 rounded-full transition-all duration-300 disabled:cursor-not-allowed group/upvote hover:scale-110 active:scale-95"
      >
        <div className={`
          absolute inset-0 rounded-full transition-all duration-300
          ${userHasUpvoted 
            ? 'bg-gradient-to-r from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/30' 
            : 'bg-slate-700/70 hover:bg-gradient-to-r hover:from-teal-500/20 hover:to-cyan-500/20 hover:shadow-lg hover:shadow-teal-500/20'
          }
        `}></div>
        <ThumbsUp
          className={`relative z-10 w-5 h-5 md:w-6 md:h-6 transition-all duration-300 ${
            userHasUpvoted
              ? 'text-white drop-shadow-sm'
              : 'text-slate-400 hover:text-teal-400 group-hover/upvote:text-teal-300'
          }`}
        />
        {userHasUpvoted && (
          <div className="absolute -inset-1 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full blur opacity-40 group-hover/upvote:opacity-60 transition-opacity"></div>
        )}
      </button>
      <span className="font-bold text-lg md:text-xl text-white bg-slate-700/60 backdrop-blur-sm px-3 py-2 rounded-full min-w-[3rem] text-center shadow-lg border border-slate-600/30">
        {report.upvoteCount || 0}
      </span>
    </div>

    {/* Content Section */}
    <div className="flex-1 min-w-0 order-1 sm:order-2">
      {/* Header Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-3 py-2 rounded-full shadow-lg border border-teal-400/20 backdrop-blur-sm">
            {report.category}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-700/30 px-3 py-2 rounded-full backdrop-blur-sm border border-slate-600/30">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-sm shadow-emerald-400/50 animate-pulse"></div>
          <span className="truncate">Posted by {report.submittedBy?.email || 'Anonymous'}</span>
        </div>
      </div>

      {/* Description */}
      <p className="mt-4 text-slate-200 leading-relaxed text-sm md:text-base font-medium tracking-wide">
        {report.description}
      </p>

      {/* Image Container */}
      <div className="mt-6 relative w-full overflow-hidden rounded-xl shadow-2xl group/image bg-gradient-to-br from-slate-700 to-slate-800 p-1">
        <div className="overflow-hidden rounded-lg">
          <img 
            src={report.imageUrl} 
            alt={report.category} 
            className="w-full h-48 sm:h-56 md:h-64 object-cover transition-all duration-500 hover:scale-105 group-hover/image:brightness-110" 
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"></div>
      </div>

      {/* Comments Toggle */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={toggleComments}
          className="flex items-center gap-3 text-sm text-slate-400 hover:text-teal-400 transition-all duration-300 bg-slate-700/40 hover:bg-slate-600/60 px-4 py-3 rounded-full backdrop-blur-sm border border-slate-600/30 hover:border-teal-500/40 group/comments"
        >
          <MessageSquare className="w-4 h-4 md:w-5 md:h-5 group-hover/comments:text-teal-300 transition-colors" />
          <span className="font-medium">
            {showComments ? 'Hide Comments' : `Comments (${report.commentCount || 0})`}
          </span>
        </button>
        
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
          <span className="hidden sm:inline">Just now</span>
        </div>
      </div>
    </div>
  </div>

  {/* Comments Section */}
  {showComments && (
    <div className="mt-8 pt-6 border-t border-gradient-to-r from-transparent via-slate-600/50 to-transparent">
      {currentUser && (
        <div className="mb-6">
          <div className="flex gap-2 sm:gap-3">
            <div className="flex-1 relative group/input">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full bg-slate-700/60 text-slate-200 rounded-xl px-4 py-3 text-sm border border-slate-600/40 focus:outline-none focus:ring-2 focus:ring-teal-500/60 focus:border-teal-500/60 transition-all duration-300 placeholder-slate-400 backdrop-blur-sm shadow-lg hover:bg-slate-700/80 focus:bg-slate-700/90"
                disabled={isCommenting}
                onKeyPress={(e) => e.key === 'Enter' && !isCommenting && handleCommentSubmit(e)}
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-500/5 to-cyan-500/5 opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
            <button
              onClick={handleCommentSubmit}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-bold px-4 sm:px-6 py-3 rounded-xl text-sm shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-w-[4rem] sm:min-w-[5rem] relative overflow-hidden group/submit"
              disabled={isCommenting}
            >
              <span className="relative z-10">
                {isCommenting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <span className="hidden sm:inline">Post</span>
                )}
                {!isCommenting && <span className="sm:hidden">→</span>}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent translate-x-[-100%] group-hover/submit:translate-x-[100%] transition-transform duration-500"></div>
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
        {comments.map((comment) => (
          <div
            key={comment._id}
            className="bg-gradient-to-r from-slate-700/40 to-slate-700/20 backdrop-blur-sm p-4 rounded-xl border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 hover:from-slate-700/60 hover:to-slate-700/40 group/comment"
          >
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full flex items-center justify-center shadow-lg flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">
                  {(comment.submittedBy?.email || 'U')[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                  <p className="font-bold text-slate-300 text-sm truncate">
                    {comment.submittedBy?.email || 'Anonymous User'}
                  </p>
                  <span className="text-xs text-slate-500">just now</span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed group-hover/comment:text-slate-300 transition-colors break-words">
                  {comment.text}
                </p>
              </div>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <div className="text-center py-8 bg-slate-700/20 rounded-xl border-2 border-dashed border-slate-600/40">
            <MessageSquare className="w-8 h-8 md:w-10 md:h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-medium">No comments yet</p>
            <p className="text-slate-600 text-xs mt-1 px-4">Be the first to share your thoughts!</p>
          </div>
        )}
      </div>
    </div>
  )}

  <style jsx>{`
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: rgb(71 85 105 / 0.8) transparent;
    }
    
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: linear-gradient(to bottom, rgb(20 184 166), rgb(6 182 212));
      border-radius: 3px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(to bottom, rgb(13 148 136), rgb(8 145 178));
    }
    
    .shadow-3xl {
      box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.6);
    }

    @media (max-width: 640px) {
      .break-words {
        word-break: break-word;
        overflow-wrap: break-word;
      }
    }
  `}</style>
</div>
  );
};

// The main page component
export default function HomePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    // No need to set loading true here if we want a silent refresh
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports`);
      if (!response.ok) throw new Error('Failed to fetch reports');
      const data = await response.json();
      setReports(data);
    } catch (err) {
      setError('Could not load reports.');
    } finally {
      setIsReportLoading(false); // Only set loading false on the initial load
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  if (isAuthLoading || isReportLoading) {
    return <main className="bg-slate-900 min-h-screen flex items-center justify-center text-white p-4 relative overflow-hidden">
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
          <h1 className="text-xl font-light tracking-wide animate-pulse">Loading...</h1>
        </div>
      </div>
    </main>
  }
  
  if (error) {
    return <main className="bg-slate-900 min-h-screen text-center p-10 text-red-400">{error}</main>;
  }

  return (
    <main className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen p-3 sm:p-6 md:p-8 text-slate-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(148, 163, 184, 0.3) 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}></div>
      </div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <header className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl mb-4 shadow-lg shadow-teal-500/20">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-300 via-teal-400 to-cyan-400 bg-clip-text text-transparent mb-3">
            Community Reports
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Upvote issues and join the discussion to make our community better together.
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-teal-400 to-cyan-400 mx-auto mt-4 rounded-full"></div>
        </header>
        
        <div className="space-y-4 sm:space-y-6">
          {reports.map(report => (
            <div key={report._id} className="group">
              <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:shadow-slate-900/40 transition-all duration-300 hover:bg-slate-800/80 hover:border-slate-600/50 hover:-translate-y-1">
                <ReportCard 
                  key={report._id} 
                  initialReport={report} 
                  currentUser={user} 
                  onUpdate={fetchReports} 
                />
              </div>
            </div>
          ))}
        </div>
        
        {/* Empty State */}
        {reports.length === 0 && (
          <div className="text-center py-16 sm:py-24">
            <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <svg className="w-10 h-10 sm:w-12 sm:h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-slate-300 mb-2">No reports yet</h3>
            <p className="text-slate-500 max-w-md mx-auto">Be the first to report an issue and help improve our community.</p>
          </div>
        )}
      </div>
      
      {/* Floating Action Button */}
      {user && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 z-50">
          <Link 
            href="/report" 
            className="group relative inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-bold rounded-2xl sm:rounded-3xl shadow-2xl shadow-teal-500/30 transition-all duration-300 hover:scale-110 hover:shadow-3xl hover:shadow-teal-500/40 active:scale-105"
          >
            {/* Pulse effect */}
            <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-teal-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            
            {/* Plus icon */}
            <Plus size={24} className="sm:w-7 sm:h-7 relative z-10 transition-transform duration-200 group-hover:rotate-90" />
            
            {/* Tooltip */}
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-800 text-slate-200 text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-lg border border-slate-700 pointer-events-none">
              Create Report
              <div className="absolute left-full top-1/2 -translate-y-1/2 w-0 h-0 border-l-4 border-l-slate-800 border-y-4 border-y-transparent"></div>
            </div>
          </Link>
        </div>
      )}
      
      {/* Bottom gradient fade */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none z-10"></div>
    </main>
  );
}