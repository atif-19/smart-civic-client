"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
  email: string;
  points: number;
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    // This function runs when the component mounts to check for a logged-in user
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await fetch(
            "(${process.env.NEXT_PUBLIC_API_URL}/api/auth/me",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (response.ok) {
            const data = await response.json();
            setUser(data);
          } else {
            // If the token is invalid or expired, remove it
            localStorage.removeItem("token");
          }
        } catch (error) {
          console.error("Failed to fetch user", error);
        }
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    // Clear the token, reset the user state, and redirect to login
    localStorage.removeItem("token");
    setUser(null);
    router.push("/login");
  };

  return (
    <header className="bg-slate-800 text-white p-4 shadow-md sticky top-0 z-50">
      <nav className="container mx-auto flex justify-between items-center">
        <Link
          href="/"
          className="text-xl font-bold text-teal-400 hover:text-teal-300 transition-colors"
        >
          Smart Civic Reporting
        </Link>
        <div>
          {user ? (
            // --- Logged-In View ---
            <div className="flex items-center space-x-6">
              <Link
                href="/leaderboard"
                className="text-sm font-semibold hover:text-teal-400 transition-colors"
              >
                Leaderboard
              </Link>
              <span className="text-sm">
                {user.email} |{" "}
                <span className="font-bold text-teal-400">
                  {user.points} Points
                </span>
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded text-sm transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            // --- Logged-Out View ---
            <div className="space-x-4">
              <Link
                href="/login"
                className="hover:text-teal-400 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-2 px-4 rounded transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
