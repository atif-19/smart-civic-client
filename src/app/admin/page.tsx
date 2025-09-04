'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';

interface Report {
  _id: string;
  category: string;
  description: string;
  location: { lat: number; lng: number; };
  imageUrl: string;
  status: 'submitted' | 'acknowledged' | 'in_progress' | 'resolved';
  createdAt: string;
}

const MapWithNoSSR = dynamic(() => import('../components/Map'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full w-full bg-gray-300">Loading Map...</div>
});

export default function AdminPage() {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('list');

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
    setFilteredReports(reportList);
  }, [statusFilter, categoryFilter, reports]);

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
        currentReports?.map(report =>
          report._id === reportId ? { ...report, status: updatedReport.status } : report
        ) || []
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

  if (isLoading || reports === null) return <div className="flex items-center justify-center h-screen">Loading reports...</div>;
  if (error) return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;

  return (
    <main className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans">
      {/* Mobile Tab Navigation */}
      <div className="md:hidden bg-white border-b border-gray-300 flex">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-3 px-4 text-center font-medium ${
            activeTab === 'list' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Reports List
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`flex-1 py-3 px-4 text-center font-medium ${
            activeTab === 'map' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Map View
        </button>
      </div>

      {/* Map Section */}
      <div className={`${
        activeTab === 'map' ? 'block' : 'hidden'
      } md:block w-full md:w-1/2 h-1/2 md:h-screen`}>
        <MapWithNoSSR reports={filteredReports} />
      </div>
      
      {/* Reports List Section */}
      <div className={`${
        activeTab === 'list' ? 'flex' : 'hidden'
      } md:flex w-full md:w-1/2 h-1/2 md:h-screen flex-col p-3 md:p-6`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 flex-shrink-0 space-y-2 sm:space-y-0">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <Link href="/" className="bg-blue-500 text-white font-bold py-2 px-3 md:px-4 rounded hover:bg-blue-700 transition-colors text-center text-sm md:text-base">
            + New Report
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mb-4 flex-shrink-0">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 rounded-lg border bg-white text-gray-700 shadow-sm w-full focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm md:text-base"
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
            className="p-2 rounded-lg border bg-white text-gray-700 shadow-sm w-full focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm md:text-base"
          >
            <option value="all">Filter by Category (All)</option>
            <option value="pothole">Pothole / Road Damage</option>
            <option value="streetlight">Broken Streetlight</option>
            <option value="garbage">Garbage Overflow</option>
            <option value="water-logging">Water Logging</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Reports List */}
        <div className="space-y-3 md:space-y-4 overflow-y-auto">
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => {
              const imageUrl = report.imageUrl; 
              return (
                <div key={report._id} className="bg-white p-3 md:p-4 rounded-lg shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                    {/* Image */}
                    <div className="flex-shrink-0 w-full sm:w-auto flex justify-center sm:justify-start">
                      <img 
                        src={imageUrl} 
                        alt={report.category} 
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-md" 
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                        {report.category}
                      </span>
                      <p className="mt-2 text-sm text-gray-800 leading-relaxed">{report.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Reported: {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {/* Status Dropdown */}
                    <div className="flex-shrink-0 w-full sm:w-auto">
                      <select
                        value={report.status}
                        onChange={(e) => handleStatusChange(report._id, e.target.value as Report['status'])}
                        className={`w-full sm:w-auto text-xs font-bold p-2 rounded-md border-2 appearance-none ${getStatusColor(report.status)}`}
                      >
                        <option value="submitted">Submitted</option>
                        <option value="acknowledged">Acknowledged</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
             <div className="text-center py-6 md:py-10 bg-white rounded-lg shadow-md">
                <p className="text-gray-500">No reports match the current filters.</p>
             </div>
          )}
        </div>
      </div>
    </main>
  );
}