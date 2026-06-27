// Admin login — exchanges a password for a JWT via POST /api/auth/login,
// stores it in localStorage, and redirects to the dashboard.

import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? "Login failed");
      }

      const { token } = await res.json();
      localStorage.setItem("admin_token", token);
      navigate("/admin");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-container">
      <div className="bg-surface rounded-3xl p-8 sm:p-10 w-full max-w-md">
        <h1 className="section-title text-center mb-8">Admin Login</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="font-mono uppercase text-sm text-text-secondary"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
              className="w-full rounded-xl bg-void border border-border px-4 py-3 text-text-primary focus:border-ultraviolet focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <p className="font-mono text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Logging in…" : "Log In"}
          </button>
        </form>
      </div>
    </main>
  );
}
