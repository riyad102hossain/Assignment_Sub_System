"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api"; 
import { setAuthData } from "@/lib/auth"; 

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // API call
      const response = await api.post("/Auth/Login", { email, password });
      const { token, user } = response.data;

      setAuthData(token, user);

      if (user.role === "Admin") {
        router.push("/admin");
      } else if (user.role === "Teacher") {
        router.push("/teacher");
      } else if (user.role === "Student") {
        router.push("/student");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      {/* 
        with a soft green/cyan glow 
      */}
      <div className="w-full max-w-md rounded-[30px] bg-white p-10 shadow-[0_15px_60px_-10px_rgba(34,211,238,0.3)]">
        
        {/*            */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">
            <span className="text-cyan-500">Assignment System</span>
            <br />
            <span className="text-indigo-600">Login</span>
          </h2>
        </div>

        {/*  */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-100 p-3 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          {/*  */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-full border border-gray-300 px-6 py-3.5 text-black placeholder:text-gray-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 focus:outline-none transition"
              placeholder="e.g. teacher@school.com"
            />
          </div>

          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-full border border-gray-300 px-6 py-3.5 text-black placeholder:text-gray-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 focus:outline-none transition"
              placeholder="••••••••"
            />
          </div>

          
          <div className="relative pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-blue-600 py-3.5 font-bold text-white shadow-lg hover:bg-blue-700 disabled:bg-blue-300 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </button>
            
            
            {loading && (
              <span className="absolute -right-16 top-1/2 -translate-y-1/2 text-xs text-gray-400 animate-pulse hidden md:block">
                logging in
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}