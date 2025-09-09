"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import ClientOnly from "../components/client";
import {
  ThumbsUp,
  MessageSquare,
  List,
  Map as MapIcon,
  X as CloseIcon,
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

  const handleStatusChange = async (
    reportId: string,
    newStatus: Report["status"]
  ) => {
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
      <main className="flex flex-col md:flex-row h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 font-sans overflow-hidden">
        {/* Mobile Tab Navigation */}
        <div className="md:hidden bg-slate-800/90 backdrop-blur-lg border-b border-slate-700/50 flex shadow-xl">
          <button
            onClick={() => setActiveTab("list")}
            className={`flex-1 py-3 px-3 text-center font-medium flex items-center justify-center space-x-2 transition-all duration-200 ${
              activeTab === "list"
                ? "bg-teal-500 text-white"
                : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50"
            }`}
          >
            <List size={16} />
            <span className="text-sm">Reports</span>
          </button>
          <button
            onClick={() => setActiveTab("map")}
            className={`flex-1 py-3 px-3 text-center font-medium flex items-center justify-center space-x-2 transition-all duration-200 ${
              activeTab === "map"
                ? "bg-teal-500 text-white"
                : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50"
            }`}
          >
            <MapIcon size={16} />
            <span className="text-sm">Map</span>
          </button>
        </div>

        {/* Map Section */}
        <div
          className={`${
            activeTab === "map" ? "block" : "hidden"
          } md:block w-full md:w-1/2 h-full`}
        >
          <ClientOnly>
            <DashboardMap reports={filteredReports} />
          </ClientOnly>
        </div>

        {/* Reports List Section - Full width on mobile */}
        <div
          className={`${
            activeTab === "list" ? "flex" : "hidden"
          } md:flex w-full md:w-1/2 h-full flex-col bg-slate-900/95 backdrop-blur-sm md:border-l border-slate-700/50`}
        >
          {/* Header Section - More compact */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 pb-3 border-b border-slate-700/50">
            <div className="mb-3 sm:mb-0">
              <h1 className="text-xl md:text-2xl font-bold text-teal-400">
                Admin Dashboard
              </h1>
              <p className="text-slate-500 text-xs">Manage community reports</p>
            </div>
            <Link
              href="/report"
              className="bg-teal-500 hover:bg-teal-400 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 text-sm flex items-center justify-center space-x-1 hover:shadow-lg hover:shadow-teal-500/25"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>New Report</span>
            </Link>
          </div>

          {/* Filter Section - Compact dropdowns */}
          <div className="p-4 pt-3 border-b border-slate-700/50">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full py-2 pl-3 pr-8 text-xs bg-slate-800 border border-slate-600 rounded-lg text-slate-200 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 appearance-none cursor-pointer hover:bg-slate-700 transition-colors"
                >
                  <option value="all">All Status</option>
                  <option value="submitted">Submitted</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
                <svg
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none"
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

              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full py-2 pl-3 pr-8 text-xs bg-slate-800 border border-slate-600 rounded-lg text-slate-200 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 appearance-none cursor-pointer hover:bg-slate-700 transition-colors"
                >
                  <option value="all">All Categories</option>
                  <option value="Roads">Roads</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Sanitation">Sanitation</option>
                  <option value="Environment">Environment</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Other">Other</option>
                </select>
                <svg
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none"
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

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full py-2 pl-3 pr-8 text-xs bg-slate-800 border border-slate-600 rounded-lg text-slate-200 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 appearance-none cursor-pointer hover:bg-slate-700 transition-colors"
                >
                  <option value="upvotes">Most Upvoted</option>
                  <option value="recent">Most Recent</option>
                </select>
                <svg
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none"
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

          {/* Reports List - Compact cards */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredReports.map((report) => (
              <div
                key={report._id}
                className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3 hover:bg-slate-800/80 hover:border-slate-600/50 transition-all duration-200"
              >
                <div className="flex space-x-3">
                  {/* Image - Fixed size, better visibility */}
                  <button
                    onClick={() => setSelectedImage(report.imageUrl)}
                    className="flex-shrink-0 group"
                  >
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-slate-700">
                      <img
                        src={report.imageUrl}
                        alt={report.category}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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

                  {/* Content - Better organized */}
                  <div className="flex-1 min-w-0">
                    {/* Top row: Category and Stats */}
                    <div className="flex items-start justify-between mb-2">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-1 rounded ${
                          report.category === "Roads"
                            ? "bg-orange-900/50 text-orange-300"
                            : report.category === "Electrical"
                            ? "bg-yellow-900/50 text-yellow-300"
                            : report.category === "Sanitation"
                            ? "bg-green-900/50 text-green-300"
                            : report.category === "Environment"
                            ? "bg-blue-900/50 text-blue-300"
                            : report.category === "Infrastructure"
                            ? "bg-purple-900/50 text-purple-300"
                            : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {report.category}
                      </span>

                      <div className="flex items-center space-x-3 text-xs">
                        <button
                          onClick={() => handleViewComments(report)}
                          className="flex items-center text-slate-400 hover:text-cyan-400 transition-colors"
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          {report.commentCount || 0}
                        </button>
                        <span className="flex items-center text-teal-400">
                          <ThumbsUp className="w-3 h-3 mr-1" />
                          {report.upvoteCount || 0}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-200 mb-2 line-clamp-2 leading-relaxed">
                      {report.description}
                    </p>

                    {/* Bottom row: Date and Status */}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>

                      <div className="relative">
                        <select
                          value={report.status}
                          onChange={(e) =>
                            handleStatusChange(
                              report._id,
                              e.target.value as Report["status"]
                            )
                          }
                          className={`text-xs font-medium py-1 pl-2 pr-6 rounded border appearance-none cursor-pointer transition-colors ${getStatusColor(
                            report.status
                          )}`}
                        >
                          <option value="submitted">Submitted</option>
                          <option value="acknowledged">Acknowledged</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                        <svg
                          className="absolute right-1 top-1/2 -translate-y-1/2 w-2 h-2 pointer-events-none opacity-70"
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

            {/* Empty State */}
            {filteredReports.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-slate-800 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-slate-500"
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
                <p className="text-slate-400">No reports found</p>
                <p className="text-slate-600 text-sm mt-1">
                  Try adjusting your filters
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Image Modal - Better sized */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-red-500/90 hover:bg-red-500 rounded-full w-10 h-10 flex items-center justify-center font-bold z-10 transition-all duration-200"
            onClick={() => setSelectedImage(null)}
          >
            ×
          </button>
          <div className="relative max-w-4xl max-h-[85vh] w-full h-full">
            <img
              src={selectedImage}
              alt="Report details"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Comments Modal - More compact */}
      {viewingCommentsFor && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"
          onClick={() => setViewingCommentsFor(null)}
        >
          <div
            className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-700 flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-100 mb-1">
                  Comments:{" "}
                  <span className="text-teal-400">
                    {viewingCommentsFor.category}
                  </span>
                </h3>
                <p className="text-sm text-slate-400 truncate">
                  {viewingCommentsFor.description}
                </p>
              </div>
              <button
                onClick={() => setViewingCommentsFor(null)}
                className="ml-3 text-slate-400 hover:text-red-400 p-1"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Comments */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isCommentsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-teal-400 border-t-transparent mr-2"></div>
                  <span className="text-slate-400 text-sm">Loading...</span>
                </div>
              ) : currentComments.length > 0 ? (
                currentComments.map((comment) => (
                  <div
                    key={comment._id}
                    className="bg-slate-700/50 p-3 rounded-lg"
                  >
                    <div className="flex items-start space-x-2">
                      <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-medium">
                          {(comment.submittedBy?.email || "A")
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 text-xs font-medium">
                          {comment.submittedBy?.email || "Anonymous"}
                        </p>
                        <p className="text-slate-300 text-sm mt-1">
                          {comment.text}
                        </p>
                        <p className="text-slate-500 text-xs mt-1">
                          {new Date(comment.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No comments yet</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-700">
              <button
                onClick={() => setViewingCommentsFor(null)}
                className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 px-4 rounded-lg text-sm transition-colors"
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
      `}</style>
    </>
  );
}
