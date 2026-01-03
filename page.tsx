'use client';

import { useState, useEffect, FormEvent, useCallback, memo } from 'react';
import { useAuth } from './context/AuthContext';
import { ThumbsUp, Plus, MessageSquare, Calendar, User, Filter, Search, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Briefcase, Trash2, TreePine, Truck, Zap, HelpCircle,ShieldAlert, ShieldCheck, Shield } from 'lucide-react';

// --- PERFORMANCE HOOK: Debounces input to prevent excessive re-renders ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

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
  parentCategory: string;
  resolvedImageUrl?: string;
  status: string;
  category: string;
  description: string;
  imageUrl: string;
  upvotes: string[];
  upvoteCount: number;
  submittedBy: User;
  createdAt: string;
  commentCount: number;
  confirmIssue: string[]; // Add this
  confirmIssueCount?: number; // Optional: depending on how you handle counts
  responsibleDepartment: string | 'other';
  priority: 'High' | 'Medium' | 'Low';
}

// --- Optimized Badge and Utility Components ---
const PriorityBadge = ({ priority }: { priority: Report['priority'] }) => {
  const priorityMap = {
    High: { text: 'High Priority', icon: <ShieldAlert size={12}/>, color: 'text-red-400 border-red-500/50 bg-red-500/10' },
    Medium: { text: 'Medium Priority', icon: <ShieldCheck size={12}/>, color: 'text-orange-400 border-orange-500/50 bg-orange-500/10' },
    Low: { text: 'Low Priority', icon: <Shield size={12}/>, color: 'text-green-400 border-green-500/50 bg-green-500/10' },
  };
  const { text, icon, color } = priorityMap[priority] || priorityMap.Medium;
  return (<span className={`inline-flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded-full border ${color} backdrop-blur-sm transition-transform hover:scale-105`}>{icon}<span>{text}</span></span>);
};

const StatusBadge = ({ status }: { status: string }) => {
  const statusMap = {
    'open': { color: 'bg-blue-500/20 text-blue-400 border-blue-500/50', dot: 'bg-blue-400' },
    'in-progress': { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50', dot: 'bg-yellow-400' },
    'resolved': { color: 'bg-green-500/20 text-green-400 border-green-500/50', dot: 'bg-green-400' },
    'closed': { color: 'bg-gray-500/20 text-gray-400 border-gray-500/50', dot: 'bg-gray-400' }
  };
  const config = statusMap[status as keyof typeof statusMap] || statusMap.open;
  return (<span className={`inline-flex items-center space-x-2 text-xs font-medium px-3 py-1.5 rounded-full border ${config.color} backdrop-blur-sm`}><span className={`w-2 h-2 rounded-full ${config.dot}`}></span><span className="capitalize">{status}</span></span>);
};

// Frontend: HomePage.tsx
const DepartmentBadge = ({ responsibleDepartment }: { responsibleDepartment: string }) => {
  const deptMap: Record<string, { icon: React.ReactElement; color: string }> = {
    'Public Works': { icon: <Briefcase size={12}/>, color: 'text-blue-400 border-blue-500/50 bg-blue-500/10' },
    'Municipal Corporation': { icon: <Briefcase size={12}/>, color: 'text-blue-400 border-blue-500/50 bg-blue-500/10' },
    'Sanitation Department': { icon: <Trash2 size={12}/>, color: 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10' },
    'Parks and Recreation': { icon: <TreePine size={12}/>, color: 'text-green-400 border-green-500/50 bg-green-500/10' },
    'Road & Transportation': { icon: <Truck size={12}/>, color: 'text-purple-400 border-purple-500/50 bg-purple-500/10' },
    'Electricity Department': { icon: <Zap size={12}/>, color: 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10' },
    'Water Department': { icon: <Zap size={12}/>, color: 'text-cyan-400 border-cyan-500/50 bg-cyan-500/10' },
    'Police/Public safety': { icon: <Shield size={12}/>, color: 'text-red-400 border-red-500/50 bg-red-500/10' },
    'Other': { icon: <HelpCircle size={12}/>, color: 'text-slate-400 border-slate-500/50 bg-slate-500/10' },
  };

  const config = deptMap[responsibleDepartment] || deptMap['Other'];

  return (
    <span className={`inline-flex items-center space-x-1 text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full border ${config.color} backdrop-blur-sm transition-transform hover:scale-105`}>
      {config.icon}
      <span>{responsibleDepartment || 'Other'}</span>
    </span>
  );
};
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diff / 86400000);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

// --- PERFORMANCE: Memoized ReportCard to prevent unnecessary re-renders ---
const ReportCard = memo(function ReportCard({ initialReport, currentUser, onUpdate }: { initialReport: Report, currentUser: User | null, onUpdate: () => void }) {
  const [report, setReport] = useState(initialReport);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => { setReport(initialReport); }, [initialReport]);

  const userHasUpvoted = currentUser && report.upvotes ? report.upvotes.includes(currentUser._id) : false;
const userHasConfirmed = currentUser && report.confirmIssue ? report.confirmIssue.includes(currentUser._id) : false;
  const handleUpvote = async () => {
    if (!currentUser) return;
    const originalReport = { ...report };
    const newUpvoteCount = userHasUpvoted ? report.upvoteCount - 1 : report.upvoteCount + 1;
    const newUpvotes = userHasUpvoted ? report.upvotes.filter(id => id !== currentUser._id) : [...report.upvotes, currentUser._id];
    setReport({ ...report, upvoteCount: newUpvoteCount, upvotes: newUpvotes });

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/${report._id}/upvote`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to upvote');
    } catch (err) {
      setReport(originalReport);
    }
  };
  // NEW: Handle Confirm Logic
  const handleConfirm = async () => {
  if (!currentUser) return;
  const originalReport = { ...report };
  
  // Optimistic UI Update: Update the local state immediately
  const isAdding = !userHasConfirmed;
  const newConfirmList = isAdding 
    ? [...(report.confirmIssue || []), currentUser._id] 
    : (report.confirmIssue || []).filter(id => id !== currentUser._id);
    
  setReport({ ...report, confirmIssue: newConfirmList });

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/${report._id}/confirm`, {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) throw new Error('Failed to confirm');
    
    // Sync with the actual data returned from the server
    const updatedReport = await response.json();
    setReport(updatedReport);
  } catch (err) {
    // If the API fails, roll back to the original state
    setReport(originalReport);
    console.error("Confirmation failed:", err);
  }
};
  const toggleComments = async () => { 
    if (!showComments && comments.length === 0) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/${report._id}/comments`);
        if (!response.ok) throw new Error('Failed to fetch comments');
        const data = await response.json();
        setComments(data);
      } catch (err) {
        // Handle error silently

      }
    }
      setShowComments(!showComments);
      if (showComments) {
        setIsCommenting(false);
      }
  };
  const handleCommentSubmit = async (e: FormEvent) => { 
    e.preventDefault();
    if (!currentUser || !newComment.trim()) return;
    setIsCommenting(true);
    const commentToAdd = {
      _id: `temp-${Date.now()}`,
      text: newComment.trim(),
      submittedBy: currentUser,
      createdAt: new Date().toISOString(),
    };
    setComments([commentToAdd, ...comments]);
    setNewComment('');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/${report._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ text: commentToAdd.text }),
      });
      if (!response.ok) throw new Error('Failed to post comment');
      const savedComment = await response.json();
      setComments([savedComment, ...comments]);
      setReport({ ...report, commentCount: report.commentCount + 1 });
      onUpdate();
    } catch (err) {
      setComments(comments.filter(c => c._id !== commentToAdd._id));
    } finally {
      setIsCommenting(false);
    }

  }
  return (
  <div className="group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-300 w-full max-w-4xl mx-auto mb-6">
    <div className="flex flex-col md:flex-row">
      {/* IMAGE SECTION */}
      <div className="relative w-full md:w-[280px] lg:w-[320px] aspect-[4/3] md:aspect-square overflow-hidden flex-shrink-0">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 animate-pulse" />
        )}
        <img 
          src={report.imageUrl} 
          alt={report.category} 
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`} 
        />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-sm border border-white/20">
            <PriorityBadge priority={report.priority} />
          </div>
        </div>
        <div className="absolute bottom-3 left-3">
          <div className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg">
            <ShieldCheck size={12} fill="white" />
            {report.confirmIssue?.length || 0} VERIFIED
          </div>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                {initialReport.parentCategory} • {initialReport.category}
              </p>
              <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                {report.description}
              </h3>
            </div>
            <StatusBadge status={report.status} />
          </div>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mb-4 text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 text-xs font-medium">
               <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-600">
                 {report.submittedBy?.email?.[0].toUpperCase() || 'A'}
               </div>
               <span className="truncate max-w-[120px]">{report.submittedBy?.email || 'Anonymous'}</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Calendar size={14} className="opacity-70" />
              <span>{formatTimeAgo(report.createdAt)}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-xs">
              <DepartmentBadge responsibleDepartment={report.responsibleDepartment} />
            </div>
          </div>

          <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 leading-relaxed mb-4">
            {report.description}
          </p>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
          <div className="flex items-center gap-6">
            <button onClick={handleUpvote} className="flex items-center gap-2 group/btn">
              <div className={`p-2 rounded-full transition-colors ${userHasUpvoted ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover/btn:bg-blue-50 group-hover/btn:text-blue-500'}`}>
                <ThumbsUp size={18} fill={userHasUpvoted ? "currentColor" : "none"} />
              </div>
              <span className={`text-sm font-bold ${userHasUpvoted ? 'text-blue-600' : 'text-slate-600 dark:text-slate-400'}`}>{report.upvoteCount || 0}</span>
            </button>

            <button onClick={toggleComments} className="flex items-center gap-2 group/btn">
              <div className={`p-2 rounded-full transition-colors ${showComments ? 'bg-teal-50 text-teal-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover/btn:bg-teal-50 group-hover/btn:text-teal-500'}`}>
                <MessageSquare size={18} />
              </div>
              <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{report.commentCount || 0}</span>
            </button>
          </div>

          <button onClick={handleConfirm} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${userHasConfirmed ? 'bg-emerald-500 text-white' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'}`}>
            {userHasConfirmed ? 'Verified' : 'Verify Issue'}
          </button>
        </div>
      </div>
    </div>

    {/* RESTORED COMMENT SECTION */}
    {showComments && (
      <div className="bg-slate-50/50 dark:bg-slate-900/50 p-5 md:p-6 border-t border-slate-100 dark:border-slate-800">
        {currentUser && (
          <form onSubmit={handleCommentSubmit} className="flex gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {(currentUser.email || 'U')[0].toUpperCase()}
            </div>
            <div className="flex-1 flex gap-2">
              <input 
                type="text" 
                value={newComment} 
                onChange={(e) => setNewComment(e.target.value)} 
                placeholder="Write a comment..." 
                className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                disabled={isCommenting}
              />
              <button 
                type="submit" 
                disabled={isCommenting || !newComment.trim()}
                className="bg-teal-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-teal-600 disabled:opacity-50 transition-colors"
              >
                {isCommenting ? '...' : 'Post'}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {comments.map((comment) => (
            <div key={comment._id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 text-xs font-bold shrink-0">
                {(comment.submittedBy?.email || 'U')[0].toUpperCase()}
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{comment.submittedBy?.email || 'Anonymous'}</span>
                  <span className="text-[10px] text-slate-400">{formatTimeAgo(comment.createdAt)}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{comment.text}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-center text-slate-400 text-xs py-4">No comments yet. Be the first to share your thoughts!</p>
          )}
        </div>
      </div>
    )}
  </div>
);
});

export default function HomePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  
  const fetchReports = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports`);
      if (!response.ok) throw new Error('Failed to fetch reports');
      const data = await response.json();
      setReports(data);
    } catch (err) {
      setError('Could not load reports.');
    } finally {
      setIsReportLoading(false);
    }
  }, []);

  useEffect(() => {
    let filtered = [...reports];

    if (debouncedSearchTerm) {
      const lowercasedTerm = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(report => 
        report.description.toLowerCase().includes(lowercasedTerm) ||
        report.category.toLowerCase().includes(lowercasedTerm)
      );
    }
    if (filterPriority !== 'all') {
      filtered = filtered.filter(report => report.priority.toLowerCase() === filterPriority);
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(report => report.status === filterStatus);
    }
    
    filtered.sort((a, b) => {
      const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      switch (sortBy) {
        case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'most-upvoted': return b.upvoteCount - a.upvoteCount;
        case 'most-commented': return b.commentCount - a.commentCount;
        case 'priority': return priorityOrder[b.priority] - priorityOrder[a.priority];
        default: return 0;
      }
    });

    setFilteredReports(filtered);
  }, [reports, debouncedSearchTerm, filterPriority, filterStatus, sortBy]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  if (isAuthLoading || isReportLoading) {
   return (
  <main className="bg-slate-50 dark:bg-[#0b0f1a] min-h-screen p-4 md:p-8">
    {/* TOP LOADING INDICATOR */}
    <div className="max-w-4xl mx-auto mb-8 flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800/50 rounded-md animate-pulse" />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-slate-400 animate-pulse">Syncing Data</span>
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
        </div>
      </div>
    </div>

    {/* SKELETON CARDS - Repeating the Card Structure we built */}
    <div className="space-y-6 max-w-4xl mx-auto">
      {[1, 2, 3].map((i) => (
        <div 
          key={i} 
          className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row w-full animate-shimmer relative"
        >
          {/* Mock Image Area */}
          <div className="w-full md:w-[280px] lg:w-[320px] aspect-[4/3] md:aspect-square bg-slate-200 dark:bg-slate-800" />

          {/* Mock Content Area */}
          <div className="flex-1 p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-3 w-full">
                {/* Category line */}
                <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
                {/* Title line */}
                <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              </div>
              {/* Status Badge */}
              <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" />
            </div>

            {/* Meta tags line */}
            <div className="flex gap-4">
              <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>

            {/* Description lines */}
            <div className="space-y-2 pt-2">
              <div className="h-3 w-full bg-slate-50 dark:bg-slate-800/50 rounded" />
              <div className="h-3 w-5/6 bg-slate-50 dark:bg-slate-800/50 rounded" />
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-between items-center pt-6 border-t border-slate-50 dark:border-slate-800">
              <div className="flex gap-4">
                <div className="h-8 w-12 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                <div className="h-8 w-12 bg-slate-100 dark:bg-slate-800 rounded-xl" />
              </div>
              <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            </div>
          </div>
          
          {/* Shimmer Overlay Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-800/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
      ))}
    </div>

    <style jsx>{`
      @keyframes shimmer {
        100% { transform: translateX(100%); }
      }
    `}</style>
  </main>
);
  }
  let forceError = false; // Set to true to test error UI
  if (forceError || error) {
    return (
  <main className="bg-white dark:bg-[#0b0f1a] min-h-screen flex items-center justify-center p-6">
    <div className="max-w-md w-full text-center">
      {/* ILLUSTRAION AREA */}
      <div className="relative mb-8">
        {/* Decorative Background Glow */}
        <div className="absolute inset-0 bg-orange-400/10 dark:bg-orange-500/5 blur-3xl rounded-full" />
        
        {/* Icon Container */}
        <div className="relative w-24 h-24 bg-orange-50 dark:bg-orange-500/10 rounded-3xl flex items-center justify-center mx-auto border border-orange-100 dark:border-orange-500/20 rotate-3 hover:rotate-0 transition-transform duration-300">
          <ShieldAlert className="w-12 h-12 text-orange-500" strokeWidth={1.5} />
        </div>
      </div>

      {/* TEXT CONTENT */}
      <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-3 tracking-tight">
        Unexpected Detour
      </h2>
      <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
        {error || "We're having trouble connecting to the city servers. Please check your connection and try again."}
      </p>

      {/* ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button 
          onClick={() => window.location.reload()} 
          className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-slate-200 dark:shadow-none"
        >
          Try Again
        </button>
        
        <button 
          onClick={() => window.location.href = '/'}
          className="w-full sm:w-auto px-8 py-3.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
        >
          Go Home
        </button>
      </div>

      {/* SUBTLE BRANDING */}
      <p className="mt-12 text-xs font-bold text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em]">
        Civic Catalyst • Urban Intelligence
      </p>
    </div>
  </main>
);
  }

  return (
  <main className="bg-slate-50 dark:bg-[#0b0f1a] min-h-screen transition-colors duration-300">
    <div className="max-w-4xl mx-auto px-4">
     {/* 1. HERO SECTION: Smooth scale and fade without snapping */}
      <div 
        className="py-16 md:py-24 lg:py-32 text-center"
      >
        <header className="text-center max-w-4xl mx-auto px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white dark:bg-slate-900 rounded-3xl mb-6 shadow-xl border border-slate-200 dark:border-slate-800 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            <MessageSquare className="w-8 h-8 text-teal-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
            Community <span className="text-teal-500">Reports</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            Help prioritize what matters most by upvoting and commenting on real-time civic reports.
          </p>
          <div className="flex justify-center">
            <Link href="/resolved" className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold py-3.5 px-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all active:scale-95">
              <CheckCircle size={18} className="text-emerald-500" />
              <span>View Resolved Reports</span>
            </Link>
          </div>
        </header>
      </div>




{/* 2. SEARCH AND FILTERS - Simple, No Sticky */}
<div className="-mx-4 px-4 py-4 bg-transparent">
  <div className="max-w-4xl mx-auto space-y-3">
    
    {/* Search Bar Row */}
    <div className="flex items-center gap-3">
      <div className="relative flex-1 group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input 
          type="text" 
          placeholder="Search issues, categories..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="w-full pl-10 pr-4 py-3.5 bg-white dark:bg-slate-800 shadow-md border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-teal-500/50 text-sm outline-none"
        />
      </div>

      <button 
        className="p-3 rounded-xl bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-teal-500/50 transition-colors flex items-center gap-2"
      >
        <Filter size={18} />
        <span className="text-xs font-bold hidden sm:block text-slate-600 dark:text-slate-300">Filters</span>
      </button>
    </div>

    {/* Filter Bar */}
    <div className="relative">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        <select 
          value={filterPriority} 
          onChange={(e) => setFilterPriority(e.target.value)}
          className="flex-shrink-0 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none hover:border-teal-500/50 transition-colors"
        >
          <option value="all">Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="flex-shrink-0 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none hover:border-teal-500/50 transition-colors"
        >
          <option value="all">Status</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
        </select>

        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className="flex-shrink-0 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none hover:border-teal-500/50 transition-colors"
        >
          <option value="newest">Newest</option>
          <option value="most-upvoted">Popular</option>
          <option value="priority">Rank</option>
        </select>
        <div className="flex-shrink-0 w-12 h-1" />
      </div>
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-slate-50 dark:from-[#0b0f1a] to-transparent pointer-events-none" />
    </div>
  </div>
</div>
      {/* 3. REPORTS LIST: Clean vertical stack */}
      <div className="mt-8 pb-24 space-y-4">
        {filteredReports.map((report) => (
          <ReportCard key={report._id} initialReport={report} currentUser={user} onUpdate={fetchReports} />
        ))}
        
        {/* Modern Empty State */}
        {filteredReports.length === 0 && !isReportLoading && (
          <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
             <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
               <Filter className="w-10 h-10 text-slate-300" />
             </div>
             <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">No Reports Found</h3>
             <p className="text-slate-500 mt-2 max-w-xs mx-auto">Try adjusting your search or filter settings to see more reports.</p>
             <button 
                onClick={() => {setSearchTerm(''); setFilterPriority('all'); setFilterStatus('all');}} 
                className="mt-8 text-sm font-black uppercase tracking-widest text-teal-500 hover:text-teal-600 transition-colors"
             >
               Reset Filters
             </button>
          </div>
        )}
      </div>
    </div>
    
    {/* 4. FLOATING ACTION BUTTON (FAB) */}
    {user && (
      <div className="fixed bottom-8 right-6 z-50">
        <Link 
          href="/report" 
          className="flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all group"
        >
          <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
          <span className="font-black text-xs uppercase tracking-widest hidden md:block">New Report</span>
        </Link>
      </div>
    )}

    {/* Custom CSS to hide scrollbars globally for this page */}
    <style jsx global>{`
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `}</style>
  </main>
);
}