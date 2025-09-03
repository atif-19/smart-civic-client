import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "./components/Header"; // --- NEW: Import the header ---

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart Civic Reporting",
  description: "Report civic issues in your city.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header /> {/* --- NEW: Add the Header component --- */}
        {children}
      </body>
    </html>
  );
}