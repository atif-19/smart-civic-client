'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { ThumbsUp, MessageSquare, List, Map as MapIcon } from 'lucide-react';

// Interfaces
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
  location: { lat: number; lng: number; };
  imageUrl: string;
  status: 'submitted' | 'acknowledged' | 'in_progress' | 'resolved';
  createdAt: string;
  upvoteCount: number;
  commentCount: number;
}

const MapWithNoSSR = dynamic(() => import('../components/Map'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full w-full bg-gray-300">Loading Map...</div>
});

export default function AdminPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('upvotes');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list');
  const [viewingCommentsFor, setViewingCommentsFor] = useState<Report | null>(null);
  const [currentComments, setCurrentComments] = useState<Comment[]>([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports`);
        if (!response.ok) throw new Error('Failed to fetch reports');
        const data: Report[] = await response.json();
        setReports(data);
      } catch {
        setError('Could not load reports.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  useEffect(() => {
    let reportList = reports ? [...reports] : [];
    if (statusFilter !== 'all') {
      reportList = reportList.filter(report => report.status === statusFilter);
    }
    if (categoryFilter !== 'all') {
      reportList = reportList.filter(report => report.category === categoryFilter);
    }
    if (sortBy === 'upvotes') {
      reportList.sort((a, b) => (b.upvoteCount || 0) - (a.upvoteCount || 0));
    } else {
      reportList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    setFilteredReports(reportList);
  }, [statusFilter, categoryFilter, reports, sortBy]);

  const handleStatusChange = async (reportId: string, newStatus: Report['status']) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      const updatedReport = await response.json();
      setReports(currentReports =>
        currentReports.map(report =>
          report._id === reportId ? { ...report, status: updatedReport.status } : report
        )
      );
    } catch {
      alert("Failed to update status.");
    }
  };
  
  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'submitted': return 'bg-yellow-200 text-yellow-800 border-yellow-300';
      case 'acknowledged': return 'bg-blue-200 text-blue-800 border-blue-300';
      case 'in_progress': return 'bg-indigo-200 text-indigo-800 border-indigo-300';
      case 'resolved': return 'bg-green-200 text-green-800 border-green-300';
      default: return 'bg-gray-200 text-gray-800 border-gray-300';
    }
  };

  const handleViewComments = async (report: Report) => {
    setViewingCommentsFor(report);
    setIsCommentsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/${report._id}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      const data = await response.json();
      setCurrentComments(data);
    } catch (error) {
      console.error("Error fetching comments:", error);
      setCurrentComments([]);
    } finally {
      setIsCommentsLoading(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading reports...</div>;
  if (error) return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;

  return (
    <>
      <main className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans">
        <div className="md:hidden bg-white border-b border-gray-300 flex">
          <button onClick={() => setActiveTab('list')} className={`flex-1 py-3 px-4 text-center font-medium flex items-center justify-center space-x-2 ${activeTab === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            <List size={16} /> <span>Reports List</span>
          </button>
          <button onClick={() => setActiveTab('map')} className={`flex-1 py-3 px-4 text-center font-medium flex items-center justify-center space-x-2 ${activeTab === 'map' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            <MapIcon size={16} /> <span>Map View</span>
          </button>
        </div>

        <div className={`${activeTab === 'map' ? 'block' : 'hidden'} md:block w-full md:w-1/2 h-full`}>
          <MapWithNoSSR reports={filteredReports} />
        </div>
        
        <div className={`${activeTab === 'list' ? 'flex' : 'hidden'} md:flex w-full md:w-1/2 h-full flex-col p-3 md:p-6`}>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 flex-shrink-0 space-y-2 sm:space-y-0">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <Link href="/report" className="bg-blue-500 text-white font-bold py-2 px-3 md:px-4 rounded hover:bg-blue-700 transition-colors text-center text-sm md:text-base">
              + New Report
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mb-4 flex-shrink-0">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="p-2 rounded-lg border bg-white text-gray-700 shadow-sm w-full focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm md:text-base">
              <option value="all">Filter by Status (All)</option>
              <option value="submitted">Submitted</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="p-2 rounded-lg border bg-white text-gray-700 shadow-sm w-full focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm md:text-base">
              <option value="all">Filter by Category (All)</option>
              <option value="pothole">Pothole / Road Damage</option>
              <option value="streetlight">Broken Streetlight</option>
              <option value="garbage">Garbage Overflow</option>
              <option value="water-logging">Water Logging</option>
              <option value="other">Other</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="p-2 rounded-lg border bg-white text-gray-700 shadow-sm w-full focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm md:text-base">
              <option value="upvotes">Sort by Highest Upvotes</option>
              <option value="recent">Sort by Most Recent</option>
            </select>
          </div>

          <div className="space-y-3 md:space-y-4 overflow-y-auto">
            {filteredReports.map((report) => (
              <div key={report._id} className="bg-white p-3 md:p-4 rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                  <button onClick={() => setSelectedImage(report.imageUrl)} className="flex-shrink-0 w-full sm:w-auto flex justify-center sm:justify-start">
                    <img src={report.imageUrl} alt={report.category} width={96} height={96} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-1 rounded-full">{report.category}</span>
                      <div className="flex items-center space-x-3 text-sm font-bold text-gray-600">
                        <button onClick={() => handleViewComments(report)} className="flex items-center hover:text-blue-600">
                          <MessageSquare className="w-4 h-4 mr-1"/>{report.commentCount || 0}
                        </button>
                        <span className="flex items-center text-teal-600">
                            <ThumbsUp className="w-4 h-4 mr-1"/>{report.upvoteCount || 0}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-800 leading-relaxed truncate">{report.description}</p>
                    <p className="text-xs text-gray-500 mt-1">Reported: {new Date(report.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex-shrink-0 w-full sm:w-auto">
                    <select value={report.status} onChange={(e) => handleStatusChange(report._id, e.target.value as Report['status'])} className={`w-full sm:w-auto text-xs font-bold p-2 rounded-md border-2 appearance-none ${getStatusColor(report.status)}`}>
                      <option value="submitted">Submitted</option>
                      <option value="acknowledged">Acknowledged</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[1000] p-4" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-4 right-4 text-white bg-red-500 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold z-10" onClick={() => setSelectedImage(null)}>&times;</button>
          <div className="relative w-full h-full max-w-4xl max-h-[90vh]">
            <img src={selectedImage} alt="Enlarged report view" className="w-full h-full object-contain" />
          </div>
        </div>
      )}

      {viewingCommentsFor && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1000] p-4" onClick={() => setViewingCommentsFor(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b">
              <h2 className="text-lg font-bold">Comments for: <span className="text-blue-600">{viewingCommentsFor.category}</span></h2>
              <p className="text-sm text-gray-600 truncate">{viewingCommentsFor.description}</p>
            </div>
            <div className="p-4 overflow-y-auto space-y-3">
              {isCommentsLoading ? ( <p>Loading comments...</p> ) : 
              currentComments.length > 0 ? (
                currentComments.map(comment => (
                  <div key={comment._id} className="bg-gray-100 p-3 rounded-md text-sm">
                    <p className="font-semibold text-gray-800">{comment.submittedBy?.email || "Anonymous"}</p>
                    <p className="text-gray-600">{comment.text}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(comment.createdAt).toLocaleString()}</p>
                  </div>
                ))
              ) : ( <p className="text-gray-500">No comments yet.</p> )}
            </div>
            <div className="p-2 border-t mt-auto">
              <button onClick={() => setViewingCommentsFor(null)} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}