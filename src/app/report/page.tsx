'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Upload,
  MapPin,
  FileText,
  Send,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export default function ReportIssuePage() {
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      setIsVerifying(false);
    }
  }, [router]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setFeedback({ type: "", message: "" });
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setFeedback({
        type: "error",
        message: "Geolocation is not supported by your browser.",
      });
      return;
    }
    setIsLocating(true);
    setFeedback({ type: "info", message: "Fetching location..." });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        setIsLocating(false);
        setFeedback({
          type: "success",
          message: `Location captured successfully!`,
        });
      },
      (error) => {
        setIsLocating(false);
        let errorMessage = "An unknown error occurred.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permission denied. Please enable location services.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "The request to get user location timed out.";
            break;
        }
        setFeedback({ type: "error", message: errorMessage });
      }
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!description || !imageFile || !location) {
      setFeedback({ type: "error", message: "Please provide an image, location, and description." });
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      setFeedback({ type: "error", message: "Authentication error. Please log in again." });
      return;
    }
    
    setIsSubmitting(true);
    setFeedback({ type: "info", message: "Analyzing & Submitting Report..." });

    const formData = new FormData();
    formData.append("description", description);
    formData.append("location", JSON.stringify(location));
    formData.append("image", imageFile);
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reports`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Server responded with an error!");
      }
      setFeedback({ type: "success", message: result.message || "Report submitted successfully!" });
      
      setDescription("");
      setImageFile(null);
      setImagePreview(null);
      setLocation(null);

    } catch (err) {
      if (err instanceof Error) {
        setFeedback({ type: "error", message: err.message });
      } else {
        setFeedback({ type: "error", message: "An unknown error occurred." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFeedbackColor = () => {
    switch (feedback.type) {
      case "success": return "text-green-400";
      case "error": return "text-red-400";
      case "info": return "text-blue-400";
      default: return "hidden";
    }
  };

  if (isVerifying) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900">
        <div className="text-white text-xl">Verifying authentication...</div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 p-3 sm:p-4 md:p-6 font-sans relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(148, 163, 184, 0.3) 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}></div>
      </div>
      
      <div className="w-full max-w-lg relative z-10">
        <div className="rounded-3xl bg-slate-800/60 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-slate-900/50 border border-slate-700/50 hover:shadow-3xl transition-all duration-300">
          <header className="relative mb-8 text-center">
            <Link 
              href="/" 
              className="absolute left-0 top-1 flex items-center text-slate-400 hover:text-teal-400 transition-all duration-200 hover:-translate-x-1 group"
            >
              <svg className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm font-medium">Back to Feed</span>
            </Link>
            
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl mb-4 shadow-lg shadow-teal-500/20">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-teal-300 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Report a New Issue
            </h1>
            <div className="w-16 h-0.5 bg-gradient-to-r from-teal-400 to-cyan-400 mx-auto mt-3 rounded-full"></div>
          </header>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload Section */}
            <div className="group">
              <label htmlFor="image-upload" className="block text-sm font-semibold text-slate-300 mb-3 flex items-center">
                <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-teal-500/20 mr-3">
                  <Upload className="h-4 w-4 text-teal-400" />
                </div>
                Upload Photo
              </label>
              <div className={`relative flex justify-center items-center h-48 sm:h-52 rounded-2xl border-2 border-dashed transition-all duration-300 ${
                imagePreview 
                  ? "border-teal-500 bg-teal-500/5 shadow-lg shadow-teal-500/10" 
                  : "border-slate-600 bg-slate-700/30 hover:border-slate-500 hover:bg-slate-700/50"
              }`}>
                {imagePreview ? (
                  <>
                    <Image src={imagePreview} alt="Issue preview" layout="fill" className="object-cover rounded-2xl" />
                    <div className="absolute inset-0 bg-black/20 rounded-2xl"></div>
                    <div className="absolute top-3 right-3 bg-teal-500 text-white rounded-full p-1.5 shadow-lg">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-slate-400 group-hover:text-slate-300 transition-colors">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-600/50 flex items-center justify-center group-hover:bg-slate-600/70 transition-colors">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="font-medium">Click or drag to upload</p>
                    <p className="text-xs mt-1 text-slate-500">PNG or JPG up to 10MB</p>
                  </div>
                )}
                <input 
                  id="image-upload" 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={handleImageChange} 
                  accept="image/png, image/jpeg" 
                />
              </div>
            </div>
            
            {/* Location Section */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3 flex items-center">
                <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-teal-500/20 mr-3">
                  <MapPin className="h-4 w-4 text-teal-400" />
                </div>
                Pinpoint Location
              </label>
              <button 
                type="button" 
                onClick={handleGetLocation} 
                disabled={isLocating || !!location} 
                className={`relative flex w-full items-center justify-center rounded-xl py-3.5 px-4 font-semibold transition-all duration-300 ${
                  location 
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" 
                    : isLocating
                    ? "bg-slate-700 text-slate-300 cursor-not-allowed"
                    : "bg-slate-700/70 text-slate-100 hover:bg-slate-600/70 hover:shadow-lg hover:-translate-y-0.5"
                } disabled:opacity-60`}
              >
                {isLocating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-400 border-t-teal-400 mr-3"></div>
                    Locating...
                  </>
                ) : location ? (
                  <>
                    <svg className="w-5 h-5 mr-3 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Location Captured
                  </>
                ) : (
                  <>
                    <MapPin className="w-5 h-5 mr-3 text-teal-400" />
                    Get Current Location
                  </>
                )}
              </button>
            </div>
            
            {/* Description Section */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-slate-300 mb-3 flex items-center">
                <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-teal-500/20 mr-3">
                  <FileText className="h-4 w-4 text-teal-400" />
                </div>
                Description
              </label>
              <div className="relative">
                <textarea 
                  id="description" 
                  rows={4} 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  required 
                  className="w-full rounded-xl border border-slate-600 bg-slate-700/50 backdrop-blur-sm text-slate-100 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:bg-slate-700/70 transition-all duration-200 resize-none p-4 placeholder-slate-400" 
                  placeholder="Describe the issue in detail... What happened? When did it occur? Any additional context?"
                />
                <div className="absolute bottom-3 right-3 text-xs text-slate-500">
                  {description.length}/500
                </div>
              </div>
            </div>
            
            {/* Feedback Section */}
            {feedback.message && (
              <div className={`flex items-start p-4 rounded-xl border transition-all duration-300 ${
                feedback.type === "success" 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" 
                  : "bg-red-500/10 border-red-500/30 text-red-300"
              }`}>
                <div className="flex-shrink-0 mr-3 mt-0.5">
                  {feedback.type === "success" ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium">{feedback.message}</span>
                </div>
              </div>
            )}
            
            {/* Submit Button */}
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="relative flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 py-4 px-4 text-lg font-bold text-slate-900 hover:from-teal-400 hover:to-teal-500 disabled:opacity-75 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/25 hover:-translate-y-0.5 active:translate-y-0 group overflow-hidden"
              >
                {/* Button background animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative flex items-center">
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-700 border-t-transparent mr-3"></div>
                      Analyzing & Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-3 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                      Submit Report
                    </>
                  )}
                </div>
              </button>
            </div>
          </form>
        </div>
        
        {/* Helper Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Your report helps improve our community. All submissions are reviewed by our team.
          </p>
        </div>
      </div>
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-teal-400/20 rounded-full animate-ping"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-cyan-400/30 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-teal-300/20 rounded-full animate-bounce"></div>
      </div>
    </main>
  );
}