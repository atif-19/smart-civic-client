'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { FileText, Clock, CheckCircle, PieChart } from 'lucide-react';

interface AnalyticsData {
  totalReports: number;
  statusBreakdown: { _id: string, count: number }[];
  categoryBreakdown: { _id: string, count: number }[];
  avgResolutionTimeHours: number;
  reportsLast7Days: { _id: string, count: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/summary`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch analytics');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <div className="p-8">Loading analytics...</div>;
  if (!data) return <div className="p-8">Could not load analytics data.</div>;
  
  const categoryData = data.categoryBreakdown.map(item => ({ name: item._id, reports: item.count }));
  const dailyData = data.reportsLast7Days.map(item => ({ date: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count: item.count }));

  // --- NEW: Logic to create a dynamic Y-axis height ---
  // Find the maximum number of reports in any category
  const maxCategoryCount = Math.max(...categoryData.map(c => c.reports), 0);
  // Set the Y-axis max to be at least 5, or the next even number above the max count
  const yAxisMaxCategory = Math.ceil(Math.max(5, maxCategoryCount) / 2) * 2;
  
  const maxDailyCount = Math.max(...dailyData.map(d => d.count), 0);
  const yAxisMaxDaily = Math.ceil(Math.max(5, maxDailyCount) / 2) * 2;


  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Analytics Dashboard</h1>
      
      {/* Stat Cards (Unchanged) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<FileText />} title="Total Reports" value={data.totalReports} />
        <StatCard icon={<CheckCircle />} title="Resolved" value={data.statusBreakdown.find(s => s._id === 'resolved')?.count || 0} color="text-green-500" />
        <StatCard icon={<Clock />} title="Avg. Resolution Time" value={`${data.avgResolutionTimeHours} hrs`} />
        <StatCard icon={<PieChart />} title="Categories" value={data.categoryBreakdown.length} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartContainer title="Reports by Category">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              {/* --- UPDATED: YAxis now has a dynamic domain --- */}
              <YAxis allowDecimals={false} domain={[0, yAxisMaxCategory]} />
              <Tooltip />
              <Legend />
              {/* --- UPDATED: Bar has a max size to prevent it from being too thick --- */}
              <Bar dataKey="reports" fill="#14b8a6" maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Reports in Last 7 Days">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              {/* --- UPDATED: YAxis now has a dynamic domain --- */}
              <YAxis allowDecimals={false} domain={[0, yAxisMaxDaily]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
}

// Helper components (Unchanged)
const StatCard = ({ icon, title, value, color = 'text-blue-500' }: { icon: React.ReactNode, title: string, value: string | number, color?: string }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
    <div className={`text-3xl ${color}`}>{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const ChartContainer = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-700 mb-4">{title}</h2>
        {children}
    </div>
);