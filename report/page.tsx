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
  Target,
  Camera,
  ChevronLeft
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
    <main className="min-h-screen bg-slate-50 dark:bg-[#0b0f1a] pb-20">
      {/* 1. TOP NAVIGATION */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-[#0b0f1a]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ChevronLeft className="w-6 h-6 text-slate-600 dark:text-slate-300" />
          </Link>
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
            Create <span className="text-teal-500">Report</span>
          </h2>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 pt-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* STEP 1: IMAGE UPLOAD */}
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <Camera size={20} />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Visual Evidence</h3>
            </div>

            <div className={`relative group h-64 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden ${
              imagePreview ? 'border-teal-500 bg-teal-50/30' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-teal-400'
            }`}>
              {imagePreview ? (
                <>
                  <Image src={imagePreview} alt="Preview" layout="fill" className="object-cover" />
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white font-bold text-sm bg-black/50 px-4 py-2 rounded-full">Change Photo</p>
                  </div>
                </>
              ) : (
                <div className="text-center px-6">
                  <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-slate-400 group-hover:text-teal-500 transition-colors">
                    <Upload size={24} />
                  </div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Tap to upload issue photo</p>
                  <p className="text-xs text-slate-400 mt-1">High quality photos help AI triage better</p>
                </div>
              )}
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={handleImageChange} 
                accept="image/*" 
              />
            </div>
          </section>

          {/* STEP 2: LOCATION */}
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <MapPin size={20} />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Location Details</h3>
            </div>

            <button 
              type="button" 
              onClick={handleGetLocation} 
              disabled={isLocating || !!location}
              className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${
                location 
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20' 
                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
              }`}
            >
              {isLocating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : location ? (
                <CheckCircle size={20} />
              ) : (
                <Target size={20} />
              )}
              {location ? 'Location Pinpointed' : isLocating ? 'Fetching GPS...' : 'Get Current Location'}
            </button>
            {location && (
              <p className="text-[10px] text-center mt-3 text-slate-400 font-mono">
                LAT: {location.lat.toFixed(4)} | LNG: {location.lng.toFixed(4)}
              </p>
            )}
          </section>

          {/* STEP 3: DESCRIPTION */}
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <FileText size={20} />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Issue Description</h3>
            </div>

            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's the problem? AI will automatically categorize this for you based on your text and photo."
              className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-3xl p-5 text-sm min-h-[120px] focus:ring-2 focus:ring-teal-500/20 transition-all dark:text-white"
            />
          </section>

          {/* FEEDBACK & SUBMIT */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-[#0b0f1a]/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 md:relative md:bg-transparent md:border-none md:p-0">
            <div className="max-w-2xl mx-auto flex flex-col gap-3">
              {feedback.message && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold ${
                  feedback.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}>
                  {feedback.type === 'success' ? <CheckCircle size={14}/> : <AlertCircle size={14}/>}
                  {feedback.message}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-teal-500 text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-teal-600 shadow-xl shadow-teal-500/20 active:scale-95 transition-all"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={20} />
                )}
                {isSubmitting ? 'AI Processing...' : 'Submit Report'}
              </button>
            </div>
          </div>
          
        </form>
      </div>
    </main>
  );
}