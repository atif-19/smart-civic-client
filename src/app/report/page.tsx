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
    <main className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-100 p-4 font-sans">
      <div className="w-full max-w-lg rounded-2xl bg-slate-800 p-6 sm:p-8 shadow-2xl">
        <header className="relative mb-8 text-center">
          <Link href="/" className="absolute left-0 top-1 text-slate-400 hover:text-teal-400 transition-colors">
            &larr; Back to Feed
          </Link>
          <h1 className="text-3xl font-bold text-teal-400">Report a New Issue</h1>
        </header>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="image-upload" className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
              <Upload className="mr-2 h-5 w-5 text-teal-400" />
              Upload Photo
            </label>
            <div className={`relative flex justify-center items-center h-48 rounded-lg border-2 border-dashed ${imagePreview ? "border-teal-500" : "border-slate-600"} bg-slate-700/50`}>
              {imagePreview ? (
                <Image src={imagePreview} alt="Issue preview" layout="fill" className="object-cover rounded-lg" />
              ) : (
                <div className="text-center text-slate-400">
                  <p>Click or drag to upload</p>
                  <p className="text-xs">PNG or JPG</p>
                </div>
              )}
              <input id="image-upload" type="file" className="absolute top-0 left-0 h-full w-full opacity-0 cursor-pointer" onChange={handleImageChange} accept="image/png, image/jpeg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
              <MapPin className="mr-2 h-5 w-5 text-teal-400" />
              Pinpoint Location
            </label>
            <button type="button" onClick={handleGetLocation} disabled={isLocating || !!location} className="flex w-full items-center justify-center rounded-md bg-slate-700 py-3 px-4 font-semibold text-slate-100 hover:bg-slate-600 disabled:opacity-50">
              {isLocating ? "Locating..." : location ? `Location Captured ✓` : "Get Current Location"}
            </button>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
              <FileText className="mr-2 h-5 w-5 text-teal-400" />
              Description
            </label>
            <textarea id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full rounded-md border-slate-600 bg-slate-700 text-slate-100 shadow-sm focus:border-teal-500 focus:ring-teal-500" placeholder="Describe the issue..."/>
          </div>
          {feedback.message && (
            <div className={`flex items-center text-sm ${getFeedbackColor()}`}>
              {feedback.type === "success" ? <CheckCircle className="mr-2 h-5 w-5" /> : <AlertCircle className="mr-2 h-5 w-5" />}
              <span>{feedback.message}</span>
            </div>
          )}
          <div>
            <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center rounded-md bg-teal-500 py-3 px-4 text-lg font-bold text-slate-900 hover:bg-teal-400 disabled:opacity-75 disabled:cursor-not-allowed">
              <Send className="mr-2 h-5 w-5" />
              {isSubmitting ? "Analyzing & Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}