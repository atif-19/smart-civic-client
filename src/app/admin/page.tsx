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
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => {
              const imageUrl = `${process.env.NEXT_PUBLIC_API_URL}/${report.imageUrl.replace(/\\/g, '/')}`;
              return (
                <div key={report._id} className="bg-white p-4 rounded-lg shadow-md flex items-start space-x-4">
                  <img src={imageUrl} alt={report.category} width={96} height={96} className="w-24 h-24 object-cover rounded-md" />
                  <div className="flex-1">
                     <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-1 rounded-full">{report.category}</span>
                     <p className="mt-2 text-sm text-gray-800">{report.description}</p>
                     <p className="text-xs text-gray-500 mt-1">Reported: {new Date(report.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="w-auto">
                    <select
                      value={report.status}
                      onChange={(e) => handleStatusChange(report._id, e.target.value as Report['status'])}
                      className={`text-xs font-bold p-2 rounded-md border-2 appearance-none ${getStatusColor(report.status)}`}
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