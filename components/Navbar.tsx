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
    router.push("/");
  };

  if (!mounted) {
    return null;
  }

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link
              href="/"
              className="text-lg font-semibold text-zinc-100 transition hover:text-white"
            >
              NullTrace
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className={`text-sm font-medium transition ${
                pathname === "/"
                  ? "text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              Home
            </Link>
            <Link
              href="/feedback"
              className={`text-sm font-medium transition ${
                pathname === "/feedback"
                  ? "text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              Feedback
            </Link>
            <Link
              href="/opinions"
              className={`text-sm font-medium transition ${
                pathname === "/opinions"
                  ? "text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              Opinions
            </Link>

            {/* Login/Logout */}
            <div className="ml-4 border-l border-zinc-800 pl-6">
              {username ? (
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-zinc-400 transition hover:text-zinc-100"
                >
                  Logout ({username})
                </button>
              ) : (
                <Link
                  href="/login"
                  className={`text-sm font-medium transition ${
                    pathname === "/login"
                      ? "text-zinc-100"
                      : "text-zinc-400 hover:text-zinc-100"
                  }`}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

