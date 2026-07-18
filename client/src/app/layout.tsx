import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { ChatProvider } from "../context/ChatContext";
import { Navbar } from "../components/Navbar";
import { BottomNav } from "../components/BottomNav";
import { ChatWidget } from "../components/ChatWidget";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "CineCrick — Cricket & Cinema Trivia",
  description: "Gamified discovery crossover platform between Indian cricket and Bollywood movies, streaks, and quiz mechanics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0F1523] text-[#E8EAED]">
        <AuthProvider>
          <ChatProvider>
            <Navbar />
            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-8">
              {children}
            </main>
            <BottomNav />
            <ChatWidget />
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
