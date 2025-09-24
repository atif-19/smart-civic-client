'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Shield, 
  Calendar,
  Clock,
  Eye,
  Filter,
  Search,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus
} from 'lucide-react';

// --- UPDATED INTERFACE ---
interface Report {
  _id: string;
  category: string;
  description: string;
  imageUrl: string;
  status: 'submitted' | 'acknowledged' | 'in_progress' | 'resolved';
  createdAt: string;
  priority: 'High' | 'Medium' | 'Low';
}

const PriorityBadge = ({ priority }: { priority: Report['priority'] }) => {
  const priorityMap = {
    High: { 
      text: 'High Priority', 
      icon: <ShieldAlert size={14}/>, 
      color: 'text-red-400 border-red-500/50 bg-red-500/10 shadow-red-500/20',
      pulseColor: 'animate-pulse'
    },
    Medium: { 
      text: 'Medium Priority', 
      icon: <ShieldCheck size={14}/>, 
      color: 'text-orange-400 border-orange-500/50 bg-orange-500/10 shadow-orange-500/20',
      pulseColor: ''
    },
    Low: { 
      text: 'Low Priority', 
      icon: <Shield size={14}/>, 
      color: 'text-green-400 border-green-500/50 bg-green-500/10 shadow-green-500/20',
      pulseColor: ''
    },
  };
  const { text, icon, color, pulseColor } = priorityMap[priority] || priorityMap.Medium;
  return (
    <span className={`inline-flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-full border backdrop-blur-sm shadow-lg ${color} ${pulseColor}`}>
      {icon}
      <span>{text}</span>
    </span>
  );
};

const getStatusChip = (status: Report['status']) => {
  const styles = {
    submitted: {
      bg: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
      icon: <Clock size={14} />,
      text: "SUBMITTED"
    },
    acknowledged: {
      bg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      icon: <Eye size={14} />,
      text: "ACKNOWLEDGED"
    },
    in_progress: {
      bg: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      icon: <TrendingUp size={14} />,
      text: "IN PROGRESS"
    },
    resolved: {
      bg: "bg-green-500/10 text-green-400 border-green-500/30",
      icon: <CheckCircle2 size={14} />,
      text: "RESOLVED"
    },
  };
  
  const statusStyle = styles[status];
  return (
    <span className={`inline-flex items-center space-x-2 px-3 py-1.5 text-xs font-bold rounded-full border backdrop-blur-sm shadow-lg ${statusStyle.bg}`}>
      {statusStyle.icon}
      <span>{statusStyle.text}</span>
    </span>
  );
};

const StatusProgress = ({ status }: { status: Report['status'] }) => {
  const steps = ['submitted', 'acknowledged', 'in_progress', 'resolved'];
  const currentIndex = steps.indexOf(status);
  
  return (
    <div className="flex items-center space-x-2 mt-4">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
            index <= currentIndex 
              ? 'bg-teal-400 border-teal-400 shadow-lg shadow-teal-400/50' 
              : 'bg-slate-600 border-slate-600'
          }`} />
          {index < steps.length - 1 && (
            <div className={`w-8 h-0.5 mx-1 transition-all duration-300 ${
              index < currentIndex ? 'bg-teal-400' : 'bg-slate-600'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
};

export default function MyReportsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

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
          setFilteredReports(data);
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchReports();
    }
  }, [user]);

  // Filter and search functionality
  useEffect(() => {
    let filtered = reports;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(report => report.priority === priorityFilter);
    }

    setFilteredReports(filtered);
  }, [reports, searchTerm, statusFilter, priorityFilter]);

  const getStatusCounts = () => {
    const counts = {
      total: reports.length,
      submitted: reports.filter(r => r.status === 'submitted').length,
      acknowledged: reports.filter(r => r.status === 'acknowledged').length,
      in_progress: reports.filter(r => r.status === 'in_progress').length,
      resolved: reports.filter(r => r.status === 'resolved').length,
    };
    return counts;
  };

  if (isLoading || isAuthLoading) {
    return (
      <main className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen text-center p-10 text-white">
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-500/10 rounded-2xl border border-teal-500/20 mb-6">
              <Loader2 size={32} className="text-teal-400 animate-spin" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Loading your reports...</h2>
            <p className="text-slate-400">Please wait while we fetch your submitted reports.</p>
          </div>
        </div>
      </main>
    );
  }

  const statusCounts = getStatusCounts();

  return (
    <main className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 min-h-screen relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 p-4 md:p-8 text-slate-100">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <header className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4">
                  My Submitted Reports
                </h1>
                <p className="text-slate-400 text-lg">Track the status of your contributions to the community.</p>
              </div>
              <Link 
                href="/report"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-teal-500/25 hover:scale-105"
              >
                <Plus size={20} />
                <span>New Report</span>
              </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50">
                <div className="text-2xl font-bold text-white">{statusCounts.total}</div>
                <div className="text-sm text-slate-400">Total Reports</div>
              </div>
              <div className="bg-yellow-500/10 backdrop-blur-sm rounded-2xl p-4 border border-yellow-500/20">
                <div className="text-2xl font-bold text-yellow-400">{statusCounts.submitted}</div>
                <div className="text-sm text-slate-400">Submitted</div>
              </div>
              <div className="bg-blue-500/10 backdrop-blur-sm rounded-2xl p-4 border border-blue-500/20">
                <div className="text-2xl font-bold text-blue-400">{statusCounts.acknowledged}</div>
                <div className="text-sm text-slate-400">Acknowledged</div>
              </div>
              <div className="bg-purple-500/10 backdrop-blur-sm rounded-2xl p-4 border border-purple-500/20">
                <div className="text-2xl font-bold text-purple-400">{statusCounts.in_progress}</div>
                <div className="text-sm text-slate-400">In Progress</div>
              </div>
              <div className="bg-green-500/10 backdrop-blur-sm rounded-2xl p-4 border border-green-500/20">
                <div className="text-2xl font-bold text-green-400">{statusCounts.resolved}</div>
                <div className="text-sm text-slate-400">Resolved</div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search reports by category or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-200"
                  />
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <Filter size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-10 pr-8 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-200 appearance-none"
                  >
                    <option value="all">All Status</option>
                    <option value="submitted">Submitted</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div className="relative">
                  <Shield size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="pl-10 pr-8 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-200 appearance-none"
                  >
                    <option value="all">All Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>
              </div>

              {/* Active filters display */}
              {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all') && (
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm text-slate-400">Active filters:</span>
                    {searchTerm && (
                      <span className="bg-teal-500/10 text-teal-400 text-xs px-3 py-1 rounded-full border border-teal-500/30">
                        Search: {searchTerm}
                      </span>
                    )}
                    {statusFilter !== 'all' && (
                      <span className="bg-blue-500/10 text-blue-400 text-xs px-3 py-1 rounded-full border border-blue-500/30">
                        Status: {statusFilter}
                      </span>
                    )}
                    {priorityFilter !== 'all' && (
                      <span className="bg-purple-500/10 text-purple-400 text-xs px-3 py-1 rounded-full border border-purple-500/30">
                        Priority: {priorityFilter}
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setPriorityFilter('all');
                      }}
                      className="text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Reports List */}
          <div className="space-y-6">
            {filteredReports.length > 0 ? (
              filteredReports.map((report, index) => (
                <div 
                  key={report._id} 
                  className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50 hover:border-teal-500/30 transition-all duration-300 hover:shadow-teal-500/10 hover:shadow-2xl opacity-0 animate-fadeInUp"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animationFillMode: 'forwards'
                  }}
                >
                  <div className="p-6 flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-8">
                    {/* Image Section */}
                    <div className="w-full lg:w-1/3 h-64 lg:h-48 relative overflow-hidden rounded-2xl group">
                      <Image 
                        src={report.imageUrl} 
                        alt={report.category} 
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    </div>

                    {/* Content Section */}
                    <div className="lg:w-2/3 space-y-4">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-semibold bg-slate-700/50 text-slate-200 px-4 py-2 rounded-full border border-slate-600/50 backdrop-blur-sm">
                            {report.category}
                          </span>
                          <div className="flex items-center text-xs text-slate-400 space-x-2">
                            <Calendar size={12} />
                            <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {getStatusChip(report.status)}
                      </div>

                      {/* Priority Badge */}
                      <div>
                        <PriorityBadge priority={report.priority} />
                      </div>

                      {/* Description */}
                      <p className="text-slate-300 leading-relaxed text-sm lg:text-base">
                        {report.description}
                      </p>

                      {/* Status Progress */}
                      <div>
                        <div className="text-xs text-slate-400 mb-2">Progress Timeline</div>
                        <StatusProgress status={report.status} />
                      </div>

                      {/* Report ID */}
                      <div className="flex justify-end">
                        <span className="text-xs text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">
                          Report ID: #{report._id.slice(-8)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : reports.length === 0 ? (
              <div className="text-center py-24 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/10 to-transparent animate-pulse" />
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-700/30 rounded-2xl border border-slate-600/30 mb-6">
                    <AlertCircle size={40} className="text-slate-500" />
                  </div>
                  <h2 className="text-2xl font-semibold text-white mb-4">You haven&apos;t submitted any reports yet.</h2>
                  <p className="text-slate-400 mb-8 max-w-md mx-auto">
                    Start making a difference in your community by reporting issues that need attention.
                  </p>
                  <Link 
                    href="/report"
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold py-3 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-teal-500/25 hover:scale-105"
                  >
                    <Plus size={20} />
                    <span>Report Your First Issue</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-24 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-700/30 rounded-2xl border border-slate-600/30 mb-6">
                  <Search size={40} className="text-slate-500" />
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">No reports match your filters</h2>
                <p className="text-slate-400 max-w-md mx-auto">
                  Try adjusting your search terms or filters to find the reports you&apos;re looking for.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                  }}
                  className="mt-6 text-teal-400 hover:text-teal-300 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Results Summary */}
          {filteredReports.length > 0 && (
            <div className="mt-8 text-center text-sm text-slate-400">
              Showing {filteredReports.length} of {reports.length} reports
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out;
        }
      `}</style>
    </main>
  );
}