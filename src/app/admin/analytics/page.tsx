"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { FileText, Clock, CheckCircle, PieChart,BrainCircuit } from "lucide-react";


interface AnalyticsData {
  totalReports: number;
  statusBreakdown: { _id: string; count: number }[];
  categoryBreakdown: { _id: string; count: number }[];
  avgResolutionTimeHours: number;
  reportsLast7Days: { _id: string; count: number }[];
}

interface Hotspot {
    _id: { locationGrid: { lat: number, lng: number }, parentCategory: string };
    count: number;
    avgLat: number;
    avgLng: number;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      // Fetch both summary and predictive data
      const [summaryRes, predictiveRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/summary`, { headers: { 'Authorization': `Bearer ${token}` }}),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/predictive-hotspots`, { headers: { 'Authorization': `Bearer ${token}` }})
      ]);
      
      if (summaryRes.ok) setData(await summaryRes.json());
      setIsLoading(false);
    };
    fetchData();
  }, []);

  if (isLoading){ return <main className="bg-slate-900 min-h-screen flex items-center justify-center text-white p-4 relative overflow-hidden">
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
          <h1 className="text-xl font-light tracking-wide animate-pulse">Loading Analytics...</h1>
        </div>
      </div>
    </main>
  }
  if (!data) return <div className="p-8">Could not load analytics data.</div>;

  const categoryData = data.categoryBreakdown.map((item) => ({
    name: item._id,
    reports: item.count,
  }));
  const dailyData = data.reportsLast7Days.map((item) => ({
    date: new Date(item._id).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    count: item.count,
  }));

  // --- NEW: Logic to create a dynamic Y-axis height ---
  // Find the maximum number of reports in any category
  const maxCategoryCount = Math.max(...categoryData.map((c) => c.reports), 0);
  // Set the Y-axis max to be at least 5, or the next even number above the max count
  const yAxisMaxCategory = Math.ceil(Math.max(5, maxCategoryCount) / 2) * 2;

  const maxDailyCount = Math.max(...dailyData.map((d) => d.count), 0);
  const yAxisMaxDaily = Math.ceil(Math.max(5, maxDailyCount) / 2) * 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(148, 163, 184, 0.3) 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        ></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(20, 184, 166, 0.15) 1px, transparent 0)`,
            backgroundSize: "48px 48px",
          }}
        ></div>
      </div>

      {/* Dynamic gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-900/10 via-transparent to-cyan-900/10"></div>

      {/* Header */}
      <div className="relative z-10 mb-8 sm:mb-12 transform hover:scale-[1.02] transition-all duration-500">
        <div className="flex items-center mb-4 group">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-teal-400 via-teal-500 to-teal-600 rounded-xl flex items-center justify-center mr-4 shadow-lg shadow-teal-500/30 group-hover:shadow-2xl group-hover:shadow-teal-500/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse"></div>
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-white relative z-10 group-hover:scale-110 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div className="group-hover:transform group-hover:translate-x-2 transition-transform duration-300">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-300 via-teal-400 to-cyan-400 bg-clip-text text-transparent group-hover:from-teal-200 group-hover:via-teal-300 group-hover:to-cyan-300 transition-all duration-300 drop-shadow-lg">
              Analytics Dashboard
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-1 group-hover:text-slate-300 transition-colors duration-300">
              Real-time insights and metrics
            </p>
          </div>
        </div>
        <div className="w-20 h-1 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full relative overflow-hidden shadow-lg shadow-teal-500/30">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-bounce"></div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
        <div className="group relative bg-gradient-to-br from-slate-800/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-teal-500/40 transition-all duration-500 hover:scale-105 hover:-translate-y-2 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transform-gpu">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-20 transition-opacity duration-500 from-blue-400/10 to-blue-600/10"></div>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 via-transparent to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-slate-400 text-sm font-medium mb-2 group-hover:text-slate-300 transition-colors duration-300">Total Reports</p>
              <p className="text-2xl sm:text-3xl font-bold text-white group-hover:text-blue-300 transition-all duration-300 transform group-hover:scale-105">{data.totalReports}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:rotate-12 transition-all duration-500 group-hover:scale-110 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="text-white group-hover:scale-110 transition-transform duration-300 relative z-10">
                <FileText />
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-b-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left"></div>
        </div>

        <div className="group relative bg-gradient-to-br from-slate-800/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-teal-500/40 transition-all duration-500 hover:scale-105 hover:-translate-y-2 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 transform-gpu">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-20 transition-opacity duration-500 from-emerald-400/10 to-emerald-600/10"></div>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-transparent to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-slate-400 text-sm font-medium mb-2 group-hover:text-slate-300 transition-colors duration-300">Resolved</p>
              <p className="text-2xl sm:text-3xl font-bold text-white group-hover:text-emerald-300 transition-all duration-300 transform group-hover:scale-105">{data.statusBreakdown.find((s) => s._id === "resolved")?.count || 0}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:rotate-12 transition-all duration-500 group-hover:scale-110 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="text-white group-hover:scale-110 transition-transform duration-300 relative z-10">
                <CheckCircle />
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-b-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left"></div>
        </div>

        <div className="group relative bg-gradient-to-br from-slate-800/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-teal-500/40 transition-all duration-500 hover:scale-105 hover:-translate-y-2 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transform-gpu">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-20 transition-opacity duration-500 from-amber-400/10 to-amber-600/10"></div>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500/20 via-transparent to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-slate-400 text-sm font-medium mb-2 group-hover:text-slate-300 transition-colors duration-300">Avg. Resolution Time</p>
              <p className="text-2xl sm:text-3xl font-bold text-white group-hover:text-amber-300 transition-all duration-300 transform group-hover:scale-105">{`${data.avgResolutionTimeHours} hrs`}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:rotate-12 transition-all duration-500 group-hover:scale-110 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="text-white group-hover:scale-110 transition-transform duration-300 relative z-10">
                <Clock />
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-b-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left"></div>
        </div>

        <div className="group relative bg-gradient-to-br from-slate-800/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-teal-500/40 transition-all duration-500 hover:scale-105 hover:-translate-y-2 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transform-gpu">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-20 transition-opacity duration-500 from-purple-400/10 to-purple-600/10"></div>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 via-transparent to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-slate-400 text-sm font-medium mb-2 group-hover:text-slate-300 transition-colors duration-300">Categories</p>
              <p className="text-2xl sm:text-3xl font-bold text-white group-hover:text-purple-300 transition-all duration-300 transform group-hover:scale-105">{data.categoryBreakdown.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:rotate-12 transition-all duration-500 group-hover:scale-110 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="text-white group-hover:scale-110 transition-transform duration-300 relative z-10">
                <PieChart />
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-purple-400 to-purple-600 rounded-b-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left"></div>
        </div>
      </div>

      {/* Charts */}
      <div className="relative z-10 grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
        <div className="group relative bg-gradient-to-br from-slate-800/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-teal-500/40 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-teal-500/10 hover:scale-[1.02] transform-gpu">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-400/5 to-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-teal-500/10 via-transparent to-cyan-500/10 opacity-0 group-hover:opacity-50 transition-opacity duration-700 blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center mb-6 group-hover:transform group-hover:scale-105 transition-transform duration-300">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-500 rounded-xl flex items-center justify-center mr-3 shadow-lg group-hover:shadow-xl group-hover:rotate-6 transition-all duration-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="text-white group-hover:scale-110 transition-transform duration-300 relative z-10">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-teal-300 transition-colors duration-300 drop-shadow-lg">Reports by Category</h3>
            </div>
            <div className="group-hover:transform group-hover:scale-[1.01] transition-transform duration-300">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148, 163, 184, 0.1)"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    domain={[0, yAxisMaxCategory]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(30, 41, 59, 0.95)",
                      border: "1px solid rgba(20, 184, 166, 0.3)",
                      borderRadius: "12px",
                      color: "#f1f5f9",
                      backdropFilter: "blur(10px)",
                      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(20, 184, 166, 0.1)"
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="reports"
                    fill="url(#enhancedTealGradient)"
                    maxBarSize={60}
                    radius={[6, 6, 0, 0]}
                  />
                  <defs>
                    <linearGradient id="enhancedTealGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14b8a6" />
                      <stop offset="50%" stopColor="#0d9488" />
                      <stop offset="100%" stopColor="#0f766e" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-slate-800/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-teal-500/40 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-teal-500/10 hover:scale-[1.02] transform-gpu">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-400/5 to-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-teal-500/10 via-transparent to-cyan-500/10 opacity-0 group-hover:opacity-50 transition-opacity duration-700 blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center mb-6 group-hover:transform group-hover:scale-105 transition-transform duration-300">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-500 rounded-xl flex items-center justify-center mr-3 shadow-lg group-hover:shadow-xl group-hover:rotate-6 transition-all duration-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="text-white group-hover:scale-110 transition-transform duration-300 relative z-10">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-teal-300 transition-colors duration-300 drop-shadow-lg">Reports in Last 7 Days</h3>
            </div>
            <div className="group-hover:transform group-hover:scale-[1.01] transition-transform duration-300">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148, 163, 184, 0.1)"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    domain={[0, yAxisMaxDaily]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(30, 41, 59, 0.95)",
                      border: "1px solid rgba(14, 165, 233, 0.3)",
                      borderRadius: "12px",
                      color: "#f1f5f9",
                      backdropFilter: "blur(10px)",
                      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(14, 165, 233, 0.1)"
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#0ea5e9"
                    strokeWidth={3}
                    dot={{ fill: "#0ea5e9", strokeWidth: 2, r: 5 }}
                    activeDot={{
                      r: 8,
                      stroke: "#0ea5e9",
                      strokeWidth: 3,
                      fill: "#ffffff",
                      style: { filter: "drop-shadow(0 4px 8px rgba(14, 165, 233, 0.4))" }
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced floating elements */}
      <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-teal-400/30 rounded-full animate-bounce opacity-60" style={{animationDuration: '4s', animationDelay: '0s'}}></div>
      <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-cyan-400/40 rounded-full animate-pulse opacity-70" style={{animationDuration: '3s', animationDelay: '1s'}}></div>
      <div className="absolute bottom-1/4 left-1/3 w-2.5 h-2.5 bg-teal-300/25 rounded-full animate-ping opacity-50" style={{animationDuration: '5s', animationDelay: '2s'}}></div>
      <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-cyan-300/35 rounded-full animate-bounce opacity-60" style={{animationDuration: '3.5s', animationDelay: '0.5s'}}></div>
      <div className="absolute top-1/6 right-1/6 w-2 h-2 bg-teal-500/20 rounded-full animate-pulse opacity-40" style={{animationDuration: '4.5s', animationDelay: '1.5s'}}></div>
      <div className="absolute bottom-1/3 right-1/2 w-1 h-1 bg-cyan-400/30 rounded-full animate-ping opacity-50" style={{animationDuration: '6s', animationDelay: '3s'}}></div>
      <div className="absolute top-2/3 left-1/6 w-1.5 h-1.5 bg-teal-400/25 rounded-full animate-bounce opacity-45" style={{animationDuration: '4.2s', animationDelay: '2.5s'}}></div>
      <div className="absolute bottom-1/6 right-1/5 w-2.5 h-2.5 bg-cyan-500/15 rounded-full animate-pulse opacity-35" style={{animationDuration: '5.5s', animationDelay: '1.8s'}}></div>
    </div>
  );
}

// Helper components (Unchanged)
const StatCard = ({
  icon,
  title,
  value,
  gradient = "from-teal-500 to-teal-600",
  shadowColor = "teal",
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  gradient?: string;
  shadowColor?: string;
}) => (
  <div className="group bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 p-4 sm:p-6 rounded-2xl shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:shadow-slate-900/30 transition-all duration-300 hover:-translate-y-1 hover:bg-slate-800/80 hover:border-slate-600/50">
    <div className="flex items-center space-x-4">
      <div
        className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg shadow-${shadowColor}-500/25 group-hover:shadow-${shadowColor}-500/40 transition-all duration-300 group-hover:scale-110`}
      >
        <div className="text-white text-xl sm:text-2xl">{icon}</div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm text-slate-400 font-medium uppercase tracking-wider mb-1">
          {title}
        </p>
        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-100 truncate">
          {value}
        </p>
      </div>
    </div>
  </div>
);

const ChartContainer = ({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) => (
  <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 p-4 sm:p-6 rounded-2xl shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:shadow-slate-900/30 transition-all duration-300 hover:border-slate-600/50">
    <div className="flex items-center mb-4 sm:mb-6">
      {icon && (
        <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-teal-500/20">
          <div className="text-white">{icon}</div>
        </div>
      )}
      <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex-1">
        {title}
      </h2>
      <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
    </div>
    <div className="text-slate-300">{children}</div>
  </div>
);
