'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldAlert, ShieldCheck, Shield } from 'lucide-react'; // Import new icons
// --- UPDATED INTERFACE ---
interface Report {
  _id: string;
  category: string;
  description: string;
  imageUrl: string;
  status: 'submitted' | 'acknowledged' | 'in_progress' | 'resolved';
  createdAt: string;
  priority: 'High' | 'Medium' | 'Low'; // Add priority
}
const PriorityBadge = ({ priority }: { priority: Report['priority'] }) => {
    const priorityMap = {
        High: { text: 'High Priority', icon: <ShieldAlert size={12}/>, color: 'text-red-400 border-red-500/50 bg-red-500/10' },
        Medium: { text: 'Medium Priority', icon: <ShieldCheck size={12}/>, color: 'text-orange-400 border-orange-500/50 bg-orange-500/10' },
        Low: { text: 'Low Priority', icon: <Shield size={12}/>, color: 'text-green-400 border-green-500/50 bg-green-500/10' },
    };
    const { text, icon, color } = priorityMap[priority] || priorityMap.Medium;
    return (
        <span className={`inline-flex items-center space-x-1 text-xs font-semibold px-2 py-1 rounded-full border ${color}`}>
            {icon}
            <span>{text}</span>
        </span>
    );
};

const getStatusChip = (status: Report['status']) => {
  const styles = {
    submitted: "bg-yellow-200 text-yellow-800",
    acknowledged: "bg-blue-200 text-blue-800",
    in_progress: "bg-indigo-200 text-indigo-800",
    resolved: "bg-green-200 text-green-800",
  };
  const text = status.replace('_', ' ').toUpperCase();
  return <span className={`px-3 py-1 text-xs font-bold rounded-full ${styles[status]}`}>{text}</span>;
};

export default function MyReportsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login');
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    if (user) {
      const fetchReports = async () => {
        const token = localStorage.getItem('token');
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/my-reports`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (!response.ok) throw new Error('Failed to fetch reports');
          const data = await response.json();
          setReports(data);
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchReports();
    }
  }, [user]);

  if (isLoading || isAuthLoading) {
    return <main className="bg-slate-900 min-h-screen text-center p-10 text-white">Loading your reports...</main>;
  }

  return (
    <main className="bg-slate-900 min-h-screen p-4 md:p-8 text-slate-100">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-teal-400">My Submitted Reports</h1>
          <p className="text-slate-400 mt-2">Track the status of your contributions to the community.</p>
        </header>

        <div className="space-y-6">
          {reports.length > 0 ? (
            reports.map(report => (
              <div key={report._id} className="bg-slate-800 rounded-lg shadow-lg p-5 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
                <div className="w-full md:w-1/3 h-48 md:h-auto relative overflow-hidden rounded-md">
                   <Image src={report.imageUrl} alt={report.category} layout="fill" className="object-cover" />
                </div>
                <div className="md:w-2/3">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-semibold bg-slate-700 text-slate-200 px-3 py-1 rounded-full">{report.category}</span>
                    {getStatusChip(report.status)}
                  </div>
                  {/* --- NEW: Display the priority badge --- */}
                <div className="mb-3">
                    <PriorityBadge priority={report.priority} />
                </div>
                  <p className="text-slate-300 mt-3">{report.description}</p>
                  <p className="text-xs text-slate-500 mt-4">Reported on: {new Date(report.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-slate-800 rounded-lg">
 {/* FIX: Replaced ' with &apos; */}
              <h2 className="text-xl font-semibold text-white">You haven&apos;t submitted any reports yet.</h2>              <Link href="/report" className="mt-4 inline-block bg-teal-500 text-white font-bold py-2 px-4 rounded hover:bg-teal-600">
                Report Your First Issue
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}