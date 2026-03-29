"use client";

import { Menu, X } from "lucide-react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useEffect, useState } from "react";

import Link from "next/link";

export default function Header() {
  const [open, setOpen] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch {
      console.error("Login error:");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <header className="bg-backgroundSecondary text-background p-4">
      <div className="flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Roadmind
        </Link>

        <button
          className="md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle Menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>

        <nav className="hidden md:flex gap-4 items-center">
          <Link href="/roadmind" className="hover:underline">
            Dashboard
          </Link>
          {user ? (
            <>
              <span className="text-sm">Hi, {user.displayName}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 px-3 py-1 rounded"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={handleLogin}
              disabled={loading}
              className={`px-3 py-1 rounded ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600"
              }`}
            >
              {loading ? "Logging in..." : "Login Google"}
            </button>
          )}
        </nav>
      </div>

      {open && (
        <nav className="mt-4 flex flex-col gap-2 md:hidden">
          <Link href="/roadmind" className="hover:underline">
            Dashboard
          </Link>
          {user ? (
            <button
              onClick={handleLogout}
              className="bg-red-500 px-3 py-1 rounded"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={handleLogin}
              disabled={loading}
              className={`px-3 py-1 rounded ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-500"
              }`}
            >
              {loading ? "Logging in..." : "Login Google"}
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
