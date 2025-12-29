"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import ClientOnly from "../components/client";
import { useRef } from "react";
import { useRouter } from "next/navigation"; // --- 1. IMPORT THE HOOK ---

import {
  ThumbsUp,
  MessageSquare,
  List,
  Map as MapIcon,
  X as CloseIcon,
  Router,
} from "lucide-react";

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
  location: { lat: number; lng: number };
  imageUrl: string;
  status: "submitted" | "acknowledged" | "in_progress" | "resolved";
  createdAt: string;
  upvoteCount: number;
  commentCount: number;
  pincode: string; // <-- ADD THIS
  fullAddress: string; // <-- ADD THIS
}

// Dynamically import the Map component to prevent server-side rendering errors
const DashboardMap = dynamic(() => import("../components/DashboardMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full bg-gray-300">
      Loading Map...
    </div>
  ),
});

export default function AdminPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("upvotes");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "map">("list");
  const [viewingCommentsFor, setViewingCommentsFor] = useState<Report | null>(
    null
  );
  const [currentComments, setCurrentComments] = useState<Comment[]>([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const router = useRouter(); // --- 2. INITIALIZE THE ROUTER ---

  const fetchReports = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reports`
      );
      if (!response.ok) throw new Error("Failed to fetch reports");
      const data: Report[] = await response.json();
      setReports(data);
    } catch {
      setError("Could not load reports.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    let reportList = [...reports];
    if (statusFilter !== "all") {
      reportList = reportList.filter(
        (report) => report.status === statusFilter
      );
    }
    if (categoryFilter !== "all") {
      reportList = reportList.filter(
        (report) => report.category === categoryFilter
      );
    }
    if (sortBy === "upvotes") {
      reportList.sort((a, b) => (b.upvoteCount || 0) - (a.upvoteCount || 0));
    } else {
      reportList.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    setFilteredReports(reportList);
  }, [statusFilter, categoryFilter, reports, sortBy]);

  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for the hidden file input

  const handleStatusChange = async (
    reportId: string,
    newStatus: Report["status"]
  ) => {
    if (newStatus === "resolved") {
      // Trigger the hidden file input for this specific report
      if (fileInputRef.current) {
        fileInputRef.current.setAttribute("data-report-id", reportId);
        fileInputRef.current.click();
      }
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Admin not logged in. Please log in again.");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reports/${reportId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) throw new Error("Failed to update status");

      fetchReports();
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  };
  const getStatusColor = (status: Report["status"]) => {
    switch (status) {
      case "submitted":
        return "bg-yellow-200 text-yellow-800 border-yellow-300";
      case "acknowledged":
        return "bg-blue-200 text-blue-800 border-blue-300";
      case "in_progress":
        return "bg-indigo-200 text-indigo-800 border-indigo-300";
      case "resolved":
        return "bg-green-200 text-green-800 border-green-300";
      default:
        return "bg-gray-200 text-gray-800 border-gray-300";
    }
  };

  const handleViewComments = async (report: Report) => {
    setViewingCommentsFor(report);
    setIsCommentsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reports/${report._id}/comments`
      );
      if (!response.ok) throw new Error("Failed to fetch comments");
      const data = await response.json();
      setCurrentComments(data);
    } catch (error) {
      console.error("Error fetching comments:", error);
      setCurrentComments([]);
    } finally {
      setIsCommentsLoading(false);
    }
  };

  if (isLoading)
    return (
      <main className="bg-slate-900 min-h-screen flex items-center justify-center text-white p-4 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-purple-900/10 animate-pulse"></div>

        {/* Loading content */}
        <div className="relative z-10 flex flex-col items-center space-y-6">
          {/* Spinner */}
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
            <div
              className="absolute top-2 left-2 w-12 h-12 border-4 border-slate-800 border-t-purple-500 rounded-full animate-spin"
              style={{ animationDirection: "reverse" }}
            ></div>
          </div>

          {/* Text */}
          <div className="text-center">
            <h1 className="text-xl font-light tracking-wide animate-pulse">
              Loading Reports...
            </h1>
          </div>
        </div>
      </main>
    );
  if (error)
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        {error}
      </div>
    );

  return (
    <>
      <main className="flex flex-col md:flex-row h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 font-sans overflow-hidden relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(20, 184, 166, 0.3) 1px, transparent 0)`,
              backgroundSize: "32px 32px",
            }}
          ></div>
        </div>

        {/* Enhanced Mobile Tab Navigation */}
        <div className="md:hidden bg-gradient-to-r from-slate-800/95 to-slate-800/90 backdrop-blur-xl border-b border-slate-700/60 flex shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-cyan-500/5"></div>
          <button
            onClick={() => setActiveTab("list")}
            className={`flex-1 py-4 px-4 text-center font-medium flex items-center justify-center space-x-3 transition-all duration-300 relative overflow-hidden group ${
              activeTab === "list"
                ? "bg-gradient-to-r from-teal-500 via-teal-400 to-cyan-500 text-white shadow-lg"
                : "bg-gradient-to-r from-slate-700/60 to-slate-700/40 text-slate-300 hover:from-slate-600/70 hover:to-slate-600/50"
            }`}
          >
            {activeTab !== "list" && (
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
            )}
            <List size={18} className="relative z-10" />
            <span className="text-sm font-semibold relative z-10">Reports</span>
          </button>
          <button
            onClick={() => setActiveTab("map")}
            className={`flex-1 py-4 px-4 text-center font-medium flex items-center justify-center space-x-3 transition-all duration-300 relative overflow-hidden group ${
              activeTab === "map"
                ? "bg-gradient-to-r from-teal-500 via-teal-400 to-cyan-500 text-white shadow-lg"
                : "bg-gradient-to-r from-slate-700/60 to-slate-700/40 text-slate-300 hover:from-slate-600/70 hover:to-slate-600/50"
            }`}
          >
            {activeTab !== "map" && (
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
            )}
            <MapIcon size={18} className="relative z-10" />
            <span className="text-sm font-semibold relative z-10">Map</span>
          </button>
        </div>

        {/* Enhanced Map Section */}
        <div
          className={`${
            activeTab === "map" ? "block" : "hidden"
          } md:block w-full md:w-1/2 h-full relative overflow-hidden`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800/20 to-slate-900/20 z-10 pointer-events-none"></div>
          <ClientOnly>
            <DashboardMap reports={filteredReports} />
          </ClientOnly>
        </div>

        {/* Enhanced Reports List Section */}
        <div
          className={`${
            activeTab === "list" ? "flex" : "hidden"
          } md:flex w-full md:w-1/2 h-full flex-col bg-gradient-to-br from-slate-900/98 to-slate-800/98 backdrop-blur-sm md:border-l border-slate-700/60 relative overflow-hidden`}
        >
          {/* Subtle background effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/3 to-cyan-500/3 pointer-events-none"></div>

          {/* Enhanced Header Section */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-6 pb-4 border-b border-slate-700/60 relative z-10 bg-gradient-to-r from-slate-800/50 to-slate-800/30 backdrop-blur-sm">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-teal-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent relative">
                 Dashboard
                <div className="absolute inset-0 bg-gradient-to-r from-teal-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent blur-sm opacity-50 -z-10">
                   Dashboard
                </div>
              </h1>
              <p className="text-slate-500 text-sm mt-1 bg-slate-800/30 px-3 py-1 rounded-full inline-block border border-slate-700/30">
                 community reports
              </p>
            </div>
            <button
              onClick={() => router.push("/report")}
              className="bg-gradient-to-r from-teal-500 via-teal-400 to-cyan-500 hover:from-teal-400 hover:via-teal-300 hover:to-cyan-400 text-white font-semibold py-3 px-5 rounded-xl transition-all duration-300 text-sm flex items-center justify-center space-x-2 hover:shadow-xl hover:shadow-teal-500/30 border border-teal-400/30 relative overflow-hidden group/new"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent translate-x-[-100%] group-hover/new:translate-x-[100%] transition-transform duration-500"></div>
              <svg
                className="w-4 h-4 relative z-10"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="relative z-10">New Report</span>
            </button>
          </div>

          {/* Enhanced Filters Section */}
          <div className="p-6 pt-4 border-b border-gradient-to-r from-transparent via-slate-700/60 to-transparent relative z-10">
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full opacity-50"></div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              <div className="relative group">
                <label className="block text-xs font-semibold text-slate-400 mb-2 ml-1">
                  Status Filter
                </label>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full py-3.5 pl-4 pr-10 text-sm bg-gradient-to-br from-slate-800/90 to-slate-700/90 border border-slate-600/60 rounded-xl text-white focus:ring-2 focus:ring-teal-400/80 focus:border-teal-400/80 appearance-none cursor-pointer hover:from-slate-700/95 hover:to-slate-600/95 transition-all duration-300 backdrop-blur-sm shadow-xl group-hover:shadow-2xl font-medium"
                    style={{
                      colorScheme: "dark",
                    }}
                  >
                    <option
                      value="all"
                      style={{ backgroundColor: "#1e293b", color: "#f1f5f9" }}
                    >
                      All Status
                    </option>
                    <option
                      value="submitted"
                      style={{ backgroundColor: "#1e293b", color: "#f1f5f9" }}
                    >
                      Submitted
                    </option>
                    <option
                      value="acknowledged"
                      style={{ backgroundColor: "#1e293b", color: "#f1f5f9" }}
                    >
                      Acknowledged
                    </option>
                    <option
                      value="in_progress"
                      style={{ backgroundColor: "#1e293b", color: "#f1f5f9" }}
                    >
                      In Progress
                    </option>
                    <option
                      value="resolved"
                      style={{ backgroundColor: "#1e293b", color: "#f1f5f9" }}
                    >
                      Resolved
                    </option>
                  </select>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none transition-all duration-300 group-hover:text-teal-300 group-hover:scale-110"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              <div className="relative group">
                <label className="block text-xs font-semibold text-slate-400 mb-2 ml-1">
                  Category Filter
                </label>
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full py-3.5 pl-4 pr-10 text-sm bg-gradient-to-br from-slate-800/90 to-slate-700/90 border border-slate-600/60 rounded-xl text-white focus:ring-2 focus:ring-teal-400/80 focus:border-teal-400/80 appearance-none cursor-pointer hover:from-slate-700/95 hover:to-slate-600/95 transition-all duration-300 backdrop-blur-sm shadow-xl group-hover:shadow-2xl font-medium"
                    style={{
                      colorScheme: "dark",
                    }}
                  >
                    <option
                      value="all"
                      style={{ backgroundColor: "#1e293b", color: "#f1f5f9" }}
                    >
                      All Categories
                    </option>
                    <option
                      value="Roads"
                      style={{ backgroundColor: "#1e293b", color: "#f1f5f9" }}
                    >
                      🛣️ Roads
                    </option>
                    <option
                      value="Electrical"
                      style={{ backgroundColor: "#1e293b", color: "#f1f5f9" }}
                    >
                      ⚡ Electrical
                    </option>
                    <option
                      value="Sanitation"
                      style={{ backgroundColor: "#1e293b", color: "#f1f5f9" }}
                    >
                      🗑️ Sanitation
                    </option>
                    <option
                      value="Environment"
                      style={{ backgroundColor: "#1e293b", color: "#f1f5f9" }}
                    >
                      🌱 Environment
                    </option>
                    <option
                      value="Infrastructure"
                      style={{ backgroundColor: "#1e293b", color: "#f1f5f9" }}
                    >
                      🏗️ Infrastructure
                    </option>
                    <option
                      value="Other"
                      style={{ backgroundColor: "#1e293b", color: "#f1f5f9" }}
                    >
                      📋 Other
                    </option>
                  </select>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none transition-all duration-300 group-hover:text-teal-300 group-hover:scale-110"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              <div className="relative group">
                <label className="block text-xs font-semibold text-slate-400 mb-2 ml-1">
                  Sort Order
                </label>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full py-3.5 pl-4 pr-10 text-sm bg-gradient-to-br from-slate-800/90 to-slate-700/90 border border-slate-600/60 rounded-xl text-white focus:ring-2 focus:ring-teal-400/80 focus:border-teal-400/80 appearance-none cursor-pointer hover:from-slate-700/95 hover:to-slate-600/95 transition-all duration-300 backdrop-blur-sm shadow-xl group-hover:shadow-2xl font-medium"
                    style={{
                      colorScheme: "dark",
                    }}
                  >
                    <option
                      value="upvotes"
                      style={{ backgroundColor: "#1e293b", color: "#f1f5f9" }}
                    >
                      🔥 Most Upvoted
                    </option>
                    <option
                      value="recent"
                      style={{ backgroundColor: "#1e293b", color: "#f1f5f9" }}
                    >
                      🕐 Most Recent
                    </option>
                  </select>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none transition-all duration-300 group-hover:text-teal-300 group-hover:scale-110"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Reports List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10 custom-scrollbar">
            {filteredReports.map((report) => (
              <div
                key={report._id}
                className="bg-gradient-to-br from-slate-800/70 via-slate-800/60 to-slate-800/70 border border-slate-700/60 rounded-xl p-4 hover:from-slate-800/90 hover:via-slate-800/80 hover:to-slate-800/90 hover:border-slate-600/70 transition-all duration-300 shadow-lg hover:shadow-xl group/report relative overflow-hidden backdrop-blur-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-cyan-500/5 opacity-0 group-hover/report:opacity-100 transition-opacity duration-300"></div>

                <div className="flex space-x-4 relative z-10">
                  {/* Enhanced Image */}
                  <button
                    onClick={() => setSelectedImage(report.imageUrl)}
                    className="flex-shrink-0 group/image"
                  >
                    <div className="relative w-18 h-18 sm:w-22 sm:h-22 rounded-xl overflow-hidden bg-gradient-to-br from-slate-700/80 to-slate-800/80 border border-slate-600/40 shadow-lg">
                      <img
                        src={report.imageUrl}
                        alt={report.category}
                        className="w-full h-full object-cover group-hover/image:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/30 transition-all duration-300 flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-white opacity-0 group-hover/image:opacity-100 transition-all duration-300 drop-shadow-lg"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                    </div>
                  </button>
                   
                  {/* Enhanced Content */}
                  <div className="flex-1 min-w-0">
                    {/* Top row: Enhanced Category and Stats */}
                    <div className="flex items-start justify-between mb-3">
                      <span
                        className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border relative overflow-hidden ${
                          report.category === "Roads"
                            ? "bg-gradient-to-r from-orange-500/20 to-orange-500/10 text-orange-300 border-orange-500/30"
                            : report.category === "Electrical"
                            ? "bg-gradient-to-r from-yellow-500/20 to-yellow-500/10 text-yellow-300 border-yellow-500/30"
                            : report.category === "Sanitation"
                            ? "bg-gradient-to-r from-green-500/20 to-green-500/10 text-green-300 border-green-500/30"
                            : report.category === "Environment"
                            ? "bg-gradient-to-r from-blue-500/20 to-blue-500/10 text-blue-300 border-blue-500/30"
                            : report.category === "Infrastructure"
                            ? "bg-gradient-to-r from-purple-500/20 to-purple-500/10 text-purple-300 border-purple-500/30"
                            : "bg-gradient-to-r from-slate-700/60 to-slate-700/40 text-slate-300 border-slate-600/30"
                        }`}
                      >
                        {report.category}
                      </span>

                      <div className="flex items-center space-x-4 text-sm">
                        <button
                          onClick={() => handleViewComments(report)}
                          className="flex items-center text-slate-400 hover:text-cyan-300 transition-all duration-300 bg-slate-700/40 hover:bg-slate-600/60 px-2 py-1 rounded-lg backdrop-blur-sm border border-slate-600/30 hover:border-cyan-500/40"
                        >
                          <MessageSquare className="w-4 h-4 mr-1.5" />
                          {report.commentCount || 0}
                        </button>
                        <span className="flex items-center text-teal-300 bg-teal-500/10 px-2 py-1 rounded-lg border border-teal-500/30">
                          <ThumbsUp className="w-4 h-4 mr-1.5" />
                          {report.upvoteCount || 0}
                        </span>
                      </div>
                    </div>

                        {/* --- UPDATED ADDRESS & PINCODE SECTION --- */}
  <div className="mb-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 flex gap-1.5 justify-between items-center">
    <p className="text-sm font-semibold text-slate-200 line-clamp-2 leading-relaxed">
      {report.fullAddress && report.fullAddress !== 'Address not found' ? report.fullAddress : report.description}
    </p>
    {report.pincode && report.pincode !== 'N/A' && (
      <p className="mt-2 inline-block text-xs font-mono text-cyan-300 bg-cyan-500/10 px-2 py-1 rounded-full border border-cyan-500/30">
        Pincode: {report.pincode}
      </p>
    )}
  </div>

                    {/* Enhanced Description */}
                    <p className="text-sm text-slate-200 mb-3 line-clamp-2 leading-relaxed bg-slate-700/20 rounded-lg px-3 py-2 border border-slate-700/30">
                      {report.description}
                    </p>

                    {/* Enhanced Bottom row */}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500 bg-slate-700/30 px-2 py-1 rounded-full border border-slate-600/20">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>

                      <div className="relative group/status">
                        <select
                          value={report.status}
                          onChange={(e) => {
                            if (e.target.value === "resolved") {
                              router.push(`/admin/resolved/${report._id}`);
                            } else {
                              handleStatusChange(
                                report._id,
                                e.target.value as Report["status"]
                              );
                            }
                          }}
                          className={`text-xs font-semibold py-2 pl-3 pr-8 rounded-lg border appearance-none cursor-pointer transition-all duration-300 backdrop-blur-sm shadow-lg group-hover/status:shadow-xl ${getStatusColor(
                            report.status
                          )}`}
                        >
                          <option value="submitted">Submitted</option>
                          <option value="acknowledged">Acknowledged</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                        <svg
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-70 transition-colors group-hover/status:opacity-100"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Enhanced Empty State */}
            {filteredReports.length === 0 && (
              <div className="text-center py-16 relative">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/60 flex items-center justify-center border border-slate-700/60 shadow-xl relative overflow-hidden group/empty">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 opacity-0 group-hover/empty:opacity-100 transition-opacity duration-500"></div>
                  <svg
                    className="w-8 h-8 text-slate-500 relative z-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-300 mb-2 bg-gradient-to-r from-slate-300 to-slate-400 bg-clip-text text-transparent">
                  No reports found
                </h3>
                <p className="text-slate-500 bg-slate-800/30 rounded-lg px-4 py-2 border border-slate-700/30 inline-block">
                  Try adjusting your filters
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Enhanced Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[1000] p-4 animate-fadeIn"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-6 right-6 text-white bg-gradient-to-r from-red-500/90 to-red-600/90 hover:from-red-500 hover:to-red-600 rounded-full w-12 h-12 flex items-center justify-center font-bold z-10 transition-all duration-300 shadow-xl border border-red-400/30"
            onClick={() => setSelectedImage(null)}
          >
            ×
          </button>
          <div className="relative max-w-5xl max-h-[90vh] w-full h-full">
            <img
              src={selectedImage}
              alt="Report details"
              className="w-full h-full object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Enhanced Comments Modal */}
      {viewingCommentsFor && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[1000] p-4 animate-fadeIn"
          onClick={() => setViewingCommentsFor(null)}
        >
          <div
            className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 border border-slate-700/60 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col backdrop-blur-sm relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-cyan-500/5 pointer-events-none"></div>

            {/* Enhanced Header */}
            <div className="p-6 border-b border-slate-700/60 flex justify-between items-start relative z-10">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-100 mb-2 text-lg">
                  Comments:{" "}
                  <span className="text-teal-400">
                    {viewingCommentsFor.category}
                  </span>
                </h3>
                <p className="text-sm text-slate-400 line-clamp-2 bg-slate-700/30 px-3 py-2 rounded-lg border border-slate-600/30">
                  {viewingCommentsFor.description}
                </p>
              </div>
              <button
                onClick={() => setViewingCommentsFor(null)}
                className="ml-4 text-slate-400 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-all duration-300 border border-transparent hover:border-red-500/30"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {/* Enhanced Comments */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10 custom-scrollbar">
              {isCommentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-3 border-teal-400 border-t-transparent mr-3"></div>
                  <span className="text-slate-400">Loading comments...</span>
                </div>
              ) : currentComments.length > 0 ? (
                currentComments.map((comment, report) => (
                  <div
                    key={comment._id}
                    className="bg-gradient-to-r from-slate-700/60 to-slate-700/40 p-4 rounded-xl border border-slate-600/40 hover:from-slate-700/80 hover:to-slate-700/60 transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border border-teal-300/30">
                        <span className="text-white text-xs font-bold drop-shadow-sm">
                          {(comment.submittedBy?.email || "A")
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 text-sm font-semibold">
                          {comment.submittedBy?.email || "Anonymous"}
                        </p>
                        <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                          {comment.text}
                        </p>
                        <p className="text-slate-500 text-xs mt-2 bg-slate-700/40 px-2 py-1 rounded-full inline-block">
                          {new Date(comment.createdAt).toLocaleString()}
                        </p>
                        
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-slate-700/50 flex items-center justify-center border border-slate-600/30">
                    <MessageSquare className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-slate-500">No comments yet</p>
                </div>
              )}
            </div>

            {/* Enhanced Footer */}
            <div className="p-6 border-t border-slate-700/60 relative z-10">
              <button
                onClick={() => setViewingCommentsFor(null)}
                className="w-full bg-gradient-to-r from-slate-700/80 to-slate-700/60 hover:from-slate-600/90 hover:to-slate-600/70 text-slate-200 py-3 px-4 rounded-xl transition-all duration-300 border border-slate-600/40 hover:border-slate-500/60 shadow-lg hover:shadow-xl font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(20, 184, 166, 0.8) transparent;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(71, 85, 105, 0.1);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(
            to bottom,
            rgb(20 184 166),
            rgb(6 182 212)
          );
          border-radius: 3px;
          border: 1px solid rgba(20, 184, 166, 0.3);
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(
            to bottom,
            rgb(13 148 136),
            rgb(8 145 178)
          );
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        /* Performance optimized animations */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }

          .animate-fadeIn {
            animation: none !important;
          }
        }
      `}</style>
    </>
  );
}
