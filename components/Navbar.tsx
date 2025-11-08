"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const [username, setUsername] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const savedUsername = localStorage.getItem("username");
      setUsername(savedUsername);

      // Listen for storage changes (for logout from other tabs)
      const handleStorageChange = () => {
        const newUsername = localStorage.getItem("username");
        setUsername(newUsername);
      };

      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("username");
    setUsername(null);
    // Dispatch custom event for same-tab logout
    window.dispatchEvent(new CustomEvent("authChange"));
    router.push("/login");
  };

  if (!mounted) {
    return null;
  }

  return (
    <nav className="border-b border-zinc-800 bg-[#111]/80 backdrop-blur-md shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link
              href="/"
              className="text-lg font-semibold bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent transition hover:from-blue-400 hover:to-cyan-400"
            >
              NullTrace
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors duration-200 ${
                pathname === "/"
                  ? "text-blue-400"
                  : "text-zinc-400 hover:text-cyan-400"
              }`}
            >
              Home
            </Link>
            {username ? (
              <>
                <Link
                  href="/feedback"
                  className={`text-sm font-medium transition-colors duration-200 ${
                    pathname === "/feedback"
                      ? "text-blue-400"
                      : "text-zinc-400 hover:text-cyan-400"
                  }`}
                >
                  Feedback
                </Link>
                <Link
                  href="/opinions"
                  className={`text-sm font-medium transition-colors duration-200 ${
                    pathname === "/opinions"
                      ? "text-blue-400"
                      : "text-zinc-400 hover:text-cyan-400"
                  }`}
                >
                  Opinions
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`text-sm font-medium transition-colors duration-200 ${
                    pathname === "/login"
                      ? "text-blue-400"
                      : "text-zinc-400 hover:text-cyan-400"
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className={`text-sm font-medium transition-colors duration-200 ${
                    pathname === "/register"
                      ? "text-blue-400"
                      : "text-zinc-400 hover:text-cyan-400"
                  }`}
                >
                  Register
                </Link>
              </>
            )}

            {/* Logout */}
            {username && (
              <div className="ml-4 border-l border-zinc-800 pl-6">
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-zinc-400 transition-colors duration-200 hover:text-red-400"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

