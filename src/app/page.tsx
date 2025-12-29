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
    <div className="bg-gradient-to-br from-slate-800/80 via-slate-800/70 to-slate-900/80 backdrop-blur-sm rounded-3xl p-5 md:p-8 border border-slate-700/50 hover:border-slate-600/70 transition-[transform,border-color] duration-300 group relative transform hover:-translate-y-1">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 relative z-10">
        {/* LEFT SIDE: UPVOTE */}
        <div className="flex flex-row sm:flex-col items-center justify-start sm:justify-center gap-4 order-2 sm:order-1">
          <button onClick={handleUpvote} disabled={!currentUser} className="relative p-4 rounded-2xl transition-transform duration-300 disabled:cursor-not-allowed hover:scale-110 active:scale-95">
            <div className={`absolute inset-0 rounded-2xl transition-colors duration-300 ${userHasUpvoted ? 'bg-gradient-to-br from-teal-500 to-cyan-500' : 'bg-slate-700/80 border border-slate-600/30'}`}></div>
            <ThumbsUp className={`relative z-10 w-6 h-6 transition-colors duration-300 ${userHasUpvoted ? 'text-white' : 'text-slate-400'}`} />
          </button>
          <span className="font-bold text-xl text-white bg-slate-800/90 px-4 py-3 rounded-2xl min-w-[4rem] text-center border border-slate-600/40">{report.upvoteCount || 0}</span>
        </div>
        
        <div className="flex-1 min-w-0 order-1 sm:order-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-bold bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-4 py-2 rounded-full border border-teal-400/30">{initialReport.parentCategory} / {initialReport.category}</span>
              <StatusBadge status={report.status} />
            </div>

            {/* NEW GREEN CONFIRM BUTTON ON THE RIGHT */}
            <div className="flex items-center gap-2 ml-auto">
              <div className="flex items-center gap-2 bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700/50 shadow-inner">
                <span className="text-[10px] font-bold text-emerald-400 px-2 uppercase tracking-tight">
                  {report.confirmIssue?.length || 0} Confirmed
                </span>
                <button 
                  onClick={handleConfirm} 
                  disabled={!currentUser}
                  className={`p-2.5 rounded-xl transition-all duration-300 transform active:scale-90 ${
                    userHasConfirmed 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 scale-105' 
                    : 'bg-slate-700 text-slate-400 hover:text-emerald-400 hover:bg-slate-600'
                  }`}
                >
                  <ShieldCheck size={18} fill={userHasConfirmed ? "currentColor" : "none"} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <PriorityBadge priority={report.priority} />
            <DepartmentBadge responsibleDepartment={report.responsibleDepartment} />
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <User size={12} />
              <span className="truncate max-w-32">{report.submittedBy?.email || 'Anonymous'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar size={12} />
              <span>{formatTimeAgo(report.createdAt)}</span>
            </div>
          </div>
    
          <p className="text-slate-200 leading-relaxed text-sm bg-slate-700/20 rounded-2xl px-6 py-4 border border-slate-700/40">{report.description}</p>
          
          <div className="relative w-full overflow-hidden rounded-2xl bg-slate-800/80 p-2 border border-slate-600/30">
            <div className="overflow-hidden rounded-xl">
              {!imageLoaded && <div className="w-full h-48 sm:h-56 md:h-64 bg-slate-700 animate-pulse"></div>}
              <img src={report.imageUrl} alt={report.category} onLoad={() => setImageLoaded(true)} className={`w-full h-48 sm:h-56 md:h-64 object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`} />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <button onClick={toggleComments} className="flex items-center gap-3 text-sm text-slate-400 hover:text-teal-300 transition-colors duration-300 px-5 py-3 rounded-2xl border border-slate-600/40 hover:border-teal-500/50">
              <MessageSquare className="w-5 h-5" />
              <span className="font-medium">{showComments ? 'Hide Comments' : `Comments (${report.commentCount || 0})`}</span>
            </button>
          </div>
        </div>
      </div>  
      {showComments && (
        <div className="mt-10 pt-8 border-t border-slate-700 relative">
          {currentUser && (
            <div className="mb-8">
              <form onSubmit={handleCommentSubmit} className="flex gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-full flex-shrink-0 items-center justify-center flex shadow-lg"><span className="text-white font-bold">{(currentUser.email || 'U')[0].toUpperCase()}</span></div>
                <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Share your thoughts..." className="w-full bg-slate-700/80 text-slate-200 rounded-2xl px-5 py-4 text-sm border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-teal-500" disabled={isCommenting} />
                <button type="submit" className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold px-6 py-4 rounded-2xl text-sm transition-opacity disabled:opacity-50" disabled={isCommenting}>
                  {isCommenting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span>Post</span>}
                </button>
              </form>
            </div>
          )}
          <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
            {comments.map((comment) => (
              <div key={comment._id} className="bg-slate-700/60 p-5 rounded-2xl border border-slate-600/40">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-full flex-shrink-0 items-center justify-center flex shadow-lg mt-0.5"><span className="text-white text-xs font-bold">{(comment.submittedBy?.email || 'U')[0].toUpperCase()}</span></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-bold text-slate-300 text-sm truncate">{comment.submittedBy?.email || 'Anonymous'}</p>
                      <span className="text-xs text-slate-500">{formatTimeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="text-slate-400 text-sm">{comment.text}</p>
                  </div>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-2xl">
                <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500 text-sm font-medium">No comments yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #14b8a6; border-radius: 4px; }
      `}</style>
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
      <main className="bg-slate-900 min-h-screen flex items-center justify-center text-white p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-slate-700 border-t-teal-500 rounded-full animate-spin"></div>
          <h1 className="text-xl font-light tracking-wide text-slate-300">Loading Community Reports...</h1>
        </div>
      </main>
    );
  }
  
  if (error) {
    return (
      <main className="bg-slate-900 min-h-screen flex items-center justify-center text-center p-10">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
            <ShieldAlert className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-red-400 mb-2">Oops! Something went wrong</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-6 py-3 rounded-lg hover:from-teal-400 hover:to-cyan-400 transition-colors">Try Again</button>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-slate-900 min-h-screen p-3 sm:p-6 md:p-8 text-slate-100">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-400 to-teal-600 rounded-3xl mb-6 shadow-lg shadow-teal-500/30 border border-teal-400/30">
            <MessageSquare className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-teal-300 to-cyan-400 bg-clip-text text-transparent mb-4">Community Reports</h1>
          <p className="text-slate-400 text-lg max-w-3xl mx-auto mb-8">Help prioritize what matters most by upvoting and commenting on reports.</p>
          
          <div className="flex justify-center">
            <Link href="/resolved" className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold py-3 px-8 text-base rounded-full shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 border border-green-400/30 transform hover:scale-105">
              <CheckCircle size={20} />
              <span>View Resolved Reports</span>
            </Link>
          </div>
        </header>

        <div className="mb-8 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 sticky top-4 z-20 backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              <input type="text" placeholder="Search reports by description or category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-800 text-slate-200 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-shadow" />
            </div>
            <div className="flex flex-wrap gap-3">
              <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="flex-1 lg:flex-none px-4 py-3 bg-slate-800 text-slate-200 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="all">All Priorities</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="flex-1 lg:flex-none px-4 py-3 bg-slate-800 text-slate-200 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="all">All Statuses</option><option value="open">Open</option><option value="in-progress">In Progress</option>
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="flex-1 lg:flex-none px-4 py-3 bg-slate-800 text-slate-200 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="newest">Newest</option><option value="oldest">Oldest</option><option value="most-upvoted">Most Upvoted</option><option value="most-commented">Most Commented</option><option value="priority">By Priority</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="space-y-6 sm:space-y-8">
          {filteredReports.map((report) => (
            <ReportCard key={report._id} initialReport={report} currentUser={user} onUpdate={fetchReports} />
          ))}
        </div>
        
        {filteredReports.length === 0 && !isReportLoading && (
          <div className="text-center py-24">
             <Filter className="w-16 h-16 text-slate-600 mx-auto mb-4" />
             <h3 className="text-2xl font-semibold text-slate-300">No Reports Found</h3>
             <p className="text-slate-500 mt-2">Try adjusting your search or filter settings.</p>
          </div>
        )}
      </div>
      
      {user && (
        <div className="fixed bottom-6 right-6 z-50">
          <Link href="/report" className="group flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 text-white rounded-full shadow-lg shadow-teal-500/30 transition-transform duration-300 hover:scale-110 active:scale-95">
            <div className="absolute -inset-2 border-2 border-teal-400/30 rounded-full animate-pulse"></div>
            <Plus size={28} className="relative z-10 transition-transform duration-300 group-hover:rotate-90" />
          </Link>
        </div>
      )}
    </main>
  );
}