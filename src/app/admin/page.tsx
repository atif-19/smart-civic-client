'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Define a type for the report object for TypeScript
interface Report {
  _id: string;
  category: string;
  description: string;
  location: { lat: number; lng: number; };
  imageUrl: string;
  status: 'submitted' | 'acknowledged' | 'in_progress' | 'resolved';
  createdAt: string;
}

// Dynamically import the Map component with SSR turned off
const MapWithNoSSR = dynamic(() => import('../components/Map'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full w-full bg-gray-300">Loading Map...</div>
});

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allReports, setAllReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // useEffect to fetch all data once on mount
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/reports');
        if (!response.ok) throw new Error('Failed to fetch reports');
        const data = await response.json();
        setAllReports(data);
        setFilteredReports(data);
      } catch (err) {
        setError('Could not load reports.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  // useEffect to apply filters
  useEffect(() => {
    let reports = [...allReports];
    if (statusFilter !== 'all') {
      reports = reports.filter(report => report.status === statusFilter);
    }
    if (categoryFilter !== 'all') {
      reports = reports.filter(report => report.category === categoryFilter);
    }
    setFilteredReports(reports);
  }, [statusFilter, categoryFilter, allReports]);

  // handleStatusChange function remains the same...
  const handleStatusChange = async (reportId: string, newStatus: Report['status']) => {
    try {
      const response = await fetch(`http://localhost:8000/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      const updatedReport = await response.json();
      setAllReports(currentReports =>
        currentReports.map(report =>
          report._id === reportId ? { ...report, status: updatedReport.status } : report
        )
      );
    } catch (err) {
      alert("Failed to update status.");
    }
  };
  
  const getStatusColor = (status: Report['status']) => { /* ... unchanged ... */ };

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading reports...</div>;
  if (error) return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;

  return (
    <main className="flex h-screen bg-gray-100 font-sans">
      <div className="w-1/2 h-screen">
        <MapWithNoSSR reports={filteredReports} />
      </div>
      
      <div className="w-1/2 h-screen flex flex-col p-6">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <Link href="/" className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition-colors">
                + New Report
            </Link>
        </div>

        <div className="flex space-x-4 mb-4 flex-shrink-0">
          {/* --- STYLING FIX: Improved styling for filters --- */}
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 rounded-lg border bg-white text-gray-700 shadow-sm w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">Filter by Status (All)</option>
            <option value="submitted">Submitted</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-2 rounded-lg border bg-white text-gray-700 shadow-sm w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">Filter by Category (All)</option>
            <option value="pothole">Pothole / Road Damage</option>
            <option value="streetlight">Broken Streetlight</option>
            <option value="garbage">Garbage Overflow</option>
            <option value="water-logging">Water Logging</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-4 overflow-y-auto">
          {/* --- LOGIC FIX: Re-added the full report card code --- */}
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => {
              const imageUrl = `http://localhost:8000/${report.imageUrl.replace(/\\/g, '/')}`;
              return (
                <div key={report._id} className="bg-white p-4 rounded-lg shadow-md flex items-start space-x-4">
                  <img src={imageUrl} alt={report.category} className="w-24 h-24 object-cover rounded-md" />
                  <div className="flex-1">
                     <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-1 rounded-full">{report.category}</span>
                     <p className="mt-2 text-sm text-gray-800">{report.description}</p>
                     <p className="text-xs text-gray-500 mt-1">Reported: {new Date(report.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="w-auto">
                    <select
                      value={report.status}
                      onChange={(e) => handleStatusChange(report._id, e.target.value as Report['status'])}
                      className={`text-xs text-black font-bold p-2 rounded-md border-2 appearance-none ${getStatusColor(report.status)}`}
                    >
                      <option value="submitted">Submitted</option>
                      <option value="acknowledged">Acknowledged</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              );
            })
          ) : (
             <div className="text-center py-10 bg-white rounded-lg shadow-md">
                <p className="text-gray-500">No reports match the current filters.</p>
             </div>
          )}
        </div>
      </div>
    </main>
  );
}

// NOTE: The getStatusColor function was missing in the last update, please ensure it's in your code.
const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'submitted': return 'bg-yellow-200 text-yellow-800 border-yellow-300';
      case 'acknowledged': return 'bg-blue-200 text-blue-800 border-blue-300';
      case 'in_progress': return 'bg-indigo-200 text-indigo-800 border-indigo-300';
      case 'resolved': return 'bg-green-200 text-green-800 border-green-300';
      default: return 'bg-gray-200 text-gray-800 border-gray-300';
    }
};