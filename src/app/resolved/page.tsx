'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface Report {
  _id: string;
  category: string;
  description: string;
  resolutionDescription: string;
  imageUrl: string;
  resolvedImageUrl?: string;
  createdAt: string;
  resolvedAt?: string;
}

const timeToResolve = (createdAt: string, resolvedAt: string): string => {
    const start = new Date(createdAt).getTime();
    const end = new Date(resolvedAt).getTime();
    const hours = Math.round((end - start) / (1000 * 60 * 60));
    if (hours < 1) return "Less than an hour";
    if (hours < 24) return `${hours} hours`;
    const days = Math.round(hours / 24);
    return `${days} day${days > 1 ? 's' : ''}`;
};

interface ImageGalleryProps {
  report: Report;
  index: number;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ report, index }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const images = [
    { src: report.imageUrl, label: 'BEFORE', type: 'before' },
    ...(report.resolvedImageUrl ? [{ src: report.resolvedImageUrl, label: 'AFTER', type: 'after' }] : [])
  ];

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, images.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % images.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (slideIndex: number) => {
    setCurrentSlide(slideIndex);
    setIsAutoPlaying(false);
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50 hover:border-green-500/30 transition-all duration-300 hover:shadow-green-500/10 hover:shadow-2xl">
      <div className="relative h-80 md:h-96 overflow-hidden group">
        {/* Image Container */}
        <div className="relative w-full h-full">
          {images.map((image, imgIndex) => (
            <div
              key={imgIndex}
              className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
                imgIndex === currentSlide ? 'translate-x-0' : imgIndex < currentSlide ? '-translate-x-full' : 'translate-x-full'
              }`}
            >
              <Image 
                src={image.src} 
                alt={`${image.label}: ${report.category}`} 
                fill
                className="object-cover"
                priority={index < 2} // Prioritize first 2 images
              />
              <div className="absolute top-4 left-4">
                <div className={`backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full border shadow-lg ${
                  image.type === 'before' 
                    ? 'bg-red-500/90 border-red-400/50' 
                    : 'bg-green-500/90 border-green-400/50'
                }`}>
                  {image.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Controls */}
        {images.length > 1 && (
          <>
            {/* Previous Button */}
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm border border-white/20 hover:scale-110"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Next Button */}
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm border border-white/20 hover:scale-110"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Slide Indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-2">
              {images.map((_, imgIndex) => (
                <button
                  key={imgIndex}
                  onClick={() => goToSlide(imgIndex)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    imgIndex === currentSlide ? 'bg-white shadow-lg scale-125' : 'bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Auto-play indicator */}
        {images.length > 1 && isAutoPlaying && (
          <div className="absolute top-4 right-4">
            <div className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full border border-white/20">
              Auto
            </div>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent pointer-events-none" />
      </div>

      <div className="p-6 relative">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-bold text-xl text-white leading-tight pr-4">
            {report.category}
          </h3>
          <div className="bg-green-500/10 p-2 rounded-full border border-green-500/20">
            <CheckCircle size={20} className="text-green-400" />
          </div>
        </div>

        <div className="mb-4">
          <p className="text-slate-300 leading-relaxed italic">
            {report.resolutionDescription}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm font-semibold">
            <div className="bg-green-500/10 p-1.5 rounded-lg mr-3 border border-green-500/20">
              <CheckCircle size={16} className="text-green-400" />
            </div>
            <span className="text-green-400">
              Resolved in {timeToResolve(report.createdAt, report.resolvedAt!)}
            </span>
          </div>
          
          <div className="text-xs text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">
            #{report._id.slice(-6)}
          </div>
        </div>

        {/* Gallery Controls */}
        {images.length > 1 && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{currentSlide + 1} of {images.length}</span>
              <button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className="hover:text-green-400 transition-colors duration-200"
              >
                {isAutoPlaying ? 'Pause Auto-play' : 'Resume Auto-play'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function ResolvedReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResolvedReports = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/resolved`);
        if (!response.ok) throw new Error('Failed to fetch resolved reports');
        const data = await response.json();
        setReports(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResolvedReports();
  }, []);

  if (isLoading) {
    return (
      <main className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 min-h-screen text-center p-10 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-2xl border border-green-500/20 mb-6">
              <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Loading Resolved Reports...</h2>
            <p className="text-slate-400">Please wait while we fetch the latest resolved issues.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 min-h-screen relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 p-4 md:p-8 text-slate-100">
        <div className="max-w-5xl mx-auto">
          <header className="text-center mb-8 relative">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-2xl border border-green-500/20 mb-6">
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent mb-4">
              Successfully Resolved Issues
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Witness the power of community action. Each resolution represents real change in our neighborhoods.
            </p>
            <div className="mt-6 inline-flex items-center space-x-4 text-sm text-slate-500">
              <span className="bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">
                {reports.length} Issues Resolved
              </span>
              <span className="bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">
                Before/After Gallery
              </span>
            </div>
          </header>

          <div className="space-y-6">
            {reports.length > 0 ? (
              reports.map((report, index) => (
                <div
                  key={report._id}
                  className="opacity-0 animate-fadeInUp"
                  style={{
                    animationDelay: `${index * 150}ms`,
                    animationFillMode: 'forwards'
                  }}
                >
                  <ImageGallery report={report} index={index} />
                </div>
              ))
            ) : (
              <div className="text-center py-24 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/10 to-transparent animate-pulse" />
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-700/30 rounded-2xl border border-slate-600/30 mb-6">
                    <CheckCircle size={40} className="text-slate-500" />
                  </div>
                  <h2 className="text-2xl font-semibold text-white mb-2">No Reports Resolved Yet</h2>
                  <p className="text-slate-400 max-w-md mx-auto">
                    Once issues start getting resolved, they will appear here with stunning before and after comparisons.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out;
        }
      `}</style>
    </main>
  );
}