'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';

interface Report {
    _id: string;
    description: string;
    imageUrl: string;
}

export default function ResolveReportPage() {
    const [report, setReport] = useState<Report | null>(null);
    const [resolutionDescription, setResolutionDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    // Fetch the original report details
    useEffect(() => {
        const fetchReportDetails = async () => {
            // In a real app, you'd fetch the specific report by ID
            // For simplicity, we'll assume the necessary data is available
        };
        // fetchReportDetails();
    }, [id]);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!resolutionDescription || !imageFile) {
            setFeedback({ type: "error", message: "Please provide a resolution photo and description." });
            return;
        }

        setIsSubmitting(true);
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('resolutionDescription', resolutionDescription);
        formData.append('resolvedImage', imageFile);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/${id}/resolve`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            if (!response.ok) throw new Error('Failed to resolve report');
            
            alert('Report resolved successfully!');
            router.push('/admin');
        } catch (err) {
            alert('Failed to resolve report.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-100 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-slate-800 p-8 shadow-2xl">
                <header className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-teal-400">Resolve Issue</h1>
                </header>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Upload After Photo</label>
                        <div className="relative flex justify-center items-center h-48 rounded-lg border-2 border-dashed border-slate-600 bg-slate-700/50">
                            {imagePreview && <Image src={imagePreview} alt="After preview" layout="fill" className="object-cover rounded-lg" />}
                            <input type="file" className="absolute w-full h-full opacity-0 cursor-pointer" onChange={handleImageChange} required />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">Resolution Description</label>
                        <textarea id="description" rows={4} value={resolutionDescription} onChange={(e) => setResolutionDescription(e.target.value)} required className="w-full rounded-md border-slate-600 bg-slate-700 text-slate-100" placeholder="Describe the work that was done..."/>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center rounded-md bg-green-500 py-3 px-4 text-lg font-bold text-white hover:bg-green-600 disabled:opacity-50">
                        {isSubmitting ? 'Submitting...' : 'Mark as Resolved'}
                    </button>
                </form>
            </div>
        </main>
    );
}