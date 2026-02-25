"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const updateAuth = () => setUsername(localStorage.getItem("username"));
    updateAuth();
    window.addEventListener("authChange", updateAuth);
    window.addEventListener("storage", updateAuth);
    return () => {
      window.removeEventListener("authChange", updateAuth);
      window.removeEventListener("storage", updateAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("user_id");
    setUsername(null);
    window.dispatchEvent(new CustomEvent("authChange"));
    router.push("/login");
  };

  return (
    <nav className="border-b border-zinc-800 bg-[#111]/80 backdrop-blur-md shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="text-lg font-semibold bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent transition hover:from-blue-400 hover:to-cyan-400"
            >
              NullTrace
            </Link>
          </div>

          {/* Links */}
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

                {/* Admin Dashboard visible only to admin */}
                {username?.toLowerCase() === "admin" && (
                  <Link
                    href="/admin"
                    className={`text-sm font-medium transition-colors duration-200 ${
                      pathname.startsWith("/admin")
                        ? "text-blue-400"
                        : "text-zinc-400 hover:text-cyan-400"
                    }`}
                  >
                    Admin Dashboard
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="ml-6 text-sm font-medium text-zinc-400 hover:text-red-400 transition-colors border-l border-zinc-800 pl-6"
                >
                  Logout
                </button>
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
          </div>
        </div>
      </div>
    </nav>
  );
}
