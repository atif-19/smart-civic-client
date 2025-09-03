'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Import icons from lucide-react
import { Upload, MapPin, Tag, FileText, Send, CheckCircle, AlertCircle } from 'lucide-react';

export default function ReportIssuePage() {
  // State for form data
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // State for user feedback
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  // useEffect for Authentication Check
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
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
      setFeedback({ type: '', message: '' });
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setFeedback({ type: 'error', message: 'Geolocation is not supported.' });
      return;
    }
    setIsLocating(true);
    setFeedback({ type: 'info', message: 'Fetching location...' });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        setIsLocating(false);
        setFeedback({ type: 'success', message: `Location captured!` });
      },
      (error) => {
        setIsLocating(false);
        setFeedback({ type: 'error', message: 'Permission denied.' });
      }
    );
  };

  // --- THIS IS THE FIXED FUNCTION ---
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!category || !description || !imageFile || !location) {
      setFeedback({ type: 'error', message: 'Please complete all fields.' });
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) { // Final check, though the page guard should prevent this
      setFeedback({ type: 'error', message: 'Authentication error. Please log in again.' });
      return;
    }
    
    // Create FormData and append all the data
    const formData = new FormData();
    formData.append('category', category);
    formData.append('description', description);
    formData.append('location', JSON.stringify(location));
    formData.append('image', imageFile);
    
    setFeedback({ type: 'info', message: 'Submitting your report...' });

    try {
      const response = await fetch('http://localhost:8000/api/reports', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}` 
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Server responded with an error!');
      }

      setFeedback({ type: 'success', message: result.message || 'Report submitted successfully!' });
      // Optionally, reset the form after successful submission
      setDescription('');
      setCategory('');
      setImageFile(null);
      setImagePreview(null);
      setLocation(null);

    } catch (error: any) {
      console.error('Failed to submit report:', error);
      setFeedback({ type: 'error', message: error.message || 'Failed to submit report.' });
    }
  };

  const getFeedbackColor = () => {
    switch (feedback.type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'info': return 'text-blue-400';
      default: return 'hidden';
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
      <div className="w-full max-w-lg rounded-2xl bg-slate-800 p-8 shadow-2xl shadow-teal-500/10">
        
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-teal-400">Report an Issue</h1>
          <p className="text-slate-400">Your contribution helps improve our city.</p>
        </header>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ... The rest of your JSX for the form is correct and remains the same ... */}
          {/* Image Upload with Preview */}
          <div>
            <label htmlFor="image-upload" className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
              <Upload className="mr-2 h-5 w-5 text-teal-400" />
              Upload Photo of the Issue
            </label>
            <div 
              className={`relative flex justify-center items-center h-48 rounded-lg border-2 border-dashed ${imagePreview ? 'border-teal-500' : 'border-slate-600'} bg-slate-700/50 transition-colors`}>
              {imagePreview ? (
                <img src={imagePreview} alt="Issue preview" className="h-full w-full object-cover rounded-lg" />
              ) : (
                <div className="text-center text-slate-400">
                  <p>Click or drag to upload</p>
                  <p className="text-xs">PNG or JPG</p>
                </div>
              )}
              <input id="image-upload" type="file" className="absolute top-0 left-0 h-full w-full opacity-0 cursor-pointer" onChange={handleImageChange} accept="image/png, image/jpeg" />
            </div>
          </div>

          {/* Location Button */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
              <MapPin className="mr-2 h-5 w-5 text-teal-400" />
              Pinpoint Location
            </label>
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={isLocating || !!location}
              className="flex w-full items-center justify-center rounded-md bg-slate-700 py-3 px-4 font-semibold text-slate-100 transition-all hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLocating ? 'Locating...' : (location ? `Location Captured ✓` : 'Get Current Location')}
            </button>
          </div>

          {/* Issue Details Section */}
          <div className="space-y-6">
            {/* Category Dropdown */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
                <Tag className="mr-2 h-5 w-5 text-teal-400" />
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border-slate-600 bg-slate-700 text-slate-100 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-500 focus:ring-opacity-50"
              >
                <option value="" disabled>Select issue type</option>
                <option value="pothole">Pothole / Road Damage</option>
                <option value="streetlight">Broken Streetlight</option>
                <option value="garbage">Garbage Overflow</option>
                <option value="water-logging">Water Logging</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
                <FileText className="mr-2 h-5 w-5 text-teal-400" />
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border-slate-600 bg-slate-700 text-slate-100 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-500 focus:ring-opacity-50"
                placeholder="Describe the issue in detail..."
              />
            </div>
          </div>
          
          {feedback.message && (
            <div className={`flex items-center text-sm ${getFeedbackColor()}`}>
              {feedback.type === 'success' ? <CheckCircle className="mr-2 h-5 w-5" /> : <AlertCircle className="mr-2 h-5 w-5" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="flex w-full items-center justify-center rounded-md bg-teal-500 py-3 px-4 text-lg font-bold text-slate-900 transition-transform hover:scale-105 hover:bg-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
              <Send className="mr-2 h-5 w-5" />
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}