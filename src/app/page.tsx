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
    <div className="bg-slate-800 rounded-lg shadow-lg p-5">
      <div className="flex space-x-4">
        <div className="flex flex-col items-center space-y-2 pt-2">
          <button onClick={handleUpvote} disabled={!currentUser} className="disabled:cursor-not-allowed">
            <ThumbsUp className={`w-6 h-6 transition-colors ${userHasUpvoted ? 'text-teal-400 fill-teal-400/50' : 'text-slate-400 hover:text-teal-400'}`} />
          </button>
          <span className="font-bold text-lg text-white">{report.upvoteCount || 0}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold bg-slate-700 px-2 py-1 rounded-full">{report.category}</span>
            <span className="text-xs text-slate-400">Posted by {report.submittedBy?.email || 'Unknown'}</span>
          </div>
          <p className="mt-3 text-slate-200">{report.description}</p>
          <div className="mt-4 relative w-full h-64 overflow-hidden rounded-md">
            {/* FIX: Replaced <img> with Next.js <Image> component */}
            <img src={report.imageUrl} alt={report.category} className="object-cover" />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button onClick={toggleComments} className="flex items-center space-x-2 text-sm text-slate-400 hover:text-teal-400">
              <MessageSquare size={18} />
              <span>{showComments ? 'Hide Comments' : `Show Comments (${report.commentCount || 0})`}</span>
            </button>
          </div>
        </div>
      </div>
      {showComments && (
        <div className="mt-4 pt-4 pl-12 border-t border-slate-700">
          {currentUser && (
            <form onSubmit={handleCommentSubmit} className="flex space-x-2 mb-4">
              <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-1 bg-slate-700 text-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" disabled={isCommenting} />
              <button type="submit" className="bg-teal-500 text-white font-semibold px-4 py-2 rounded-md text-sm hover:bg-teal-600 disabled:opacity-50" disabled={isCommenting}>{isCommenting ? '...' : 'Post'}</button>
            </form>
          )}
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {comments.map(comment => (
              <div key={comment._id} className="text-sm bg-slate-700/50 p-3 rounded-md">
                <p className="font-bold text-slate-300">{comment.submittedBy?.email || "User"}</p>
                <p className="text-slate-400">{comment.text}</p>
              </div>
            ))}
            {comments.length === 0 && <p className="text-slate-500 text-sm">No comments yet.</p>}
          </div>
        </div>
      )}
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
    return <main className="bg-slate-900 min-h-screen text-center p-10 text-white">Loading...</main>;
  }
  
  if (error) {
    return <main className="bg-slate-900 min-h-screen text-center p-10 text-red-400">{error}</main>;
  }

  return (
    <main className="bg-slate-900 min-h-screen p-4 md:p-8 text-slate-100">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-teal-400">Community Reports</h1>
          <p className="text-slate-400 mt-2">Upvote issues and join the discussion.</p>
        </header>
        <div className="space-y-6">
          {reports.map(report => (
            <ReportCard key={report._id} initialReport={report} currentUser={user} onUpdate={fetchReports} />
          ))}
        </div>
      </div>
      {user && (
        <Link href="/report" className="fixed bottom-8 right-8 bg-teal-500 hover:bg-teal-400 text-white font-bold p-4 rounded-full shadow-lg transition-transform hover:scale-110">
          <Plus size={28} />
        </Link>
      )}
    </main>
  );
}