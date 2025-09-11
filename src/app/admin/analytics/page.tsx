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
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(148, 163, 184, 0.3) 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        ></div>
      </div>

      {/* Header */}
      <div className="relative z-10 mb-8 sm:mb-12">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center mr-4 shadow-lg shadow-teal-500/20">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-white"
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
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-300 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-1">
              Real-time insights and metrics
            </p>
          </div>
        </div>
        <div className="w-20 h-1 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full"></div>
      </div>

      {/* Stat Cards */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
        <StatCard
          icon={<FileText />}
          title="Total Reports"
          value={data.totalReports}
          gradient="from-blue-500 to-blue-600"
          shadowColor="blue"
        />
        <StatCard
          icon={<CheckCircle />}
          title="Resolved"
          value={
            data.statusBreakdown.find((s) => s._id === "resolved")?.count || 0
          }
          gradient="from-emerald-500 to-emerald-600"
          shadowColor="emerald"
        />
        <StatCard
          icon={<Clock />}
          title="Avg. Resolution Time"
          value={`${data.avgResolutionTimeHours} hrs`}
          gradient="from-amber-500 to-amber-600"
          shadowColor="amber"
        />
        <StatCard
          icon={<PieChart />}
          title="Categories"
          value={data.categoryBreakdown.length}
          gradient="from-purple-500 to-purple-600"
          shadowColor="purple"
        />
      </div>

       

      {/* Charts */}
      <div className="relative z-10 grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
        <ChartContainer
          title="Reports by Category"
          icon={
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
          }
        >
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
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  borderRadius: "8px",
                  color: "#f1f5f9",
                }}
              />
              <Legend />
              <Bar
                dataKey="reports"
                fill="url(#tealGradient)"
                maxBarSize={60}
                radius={[4, 4, 0, 0]}
              />
              <defs>
                <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" />
                  <stop offset="100%" stopColor="#0f766e" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
          title="Reports in Last 7 Days"
          icon={
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
          }
        >
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
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  borderRadius: "8px",
                  color: "#f1f5f9",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#0ea5e9"
                strokeWidth={3}
                dot={{ fill: "#0ea5e9", strokeWidth: 2, r: 4 }}
                activeDot={{
                  r: 6,
                  stroke: "#0ea5e9",
                  strokeWidth: 2,
                  fill: "#ffffff",
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Floating elements for ambiance */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-teal-400/20 rounded-full animate-ping"></div>
      <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-cyan-400/30 rounded-full animate-pulse"></div>
      <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-teal-300/20 rounded-full animate-bounce"></div>
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
