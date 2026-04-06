'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

function getPasswordStrength(password: string): { label: string; color: string; width: string } {
  if (password.length === 0) return { label: '', color: '', width: '0%' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { label: 'Weak', color: 'bg-red-400', width: '25%' };
  if (score <= 2) return { label: 'Fair', color: 'bg-yellow-400', width: '50%' };
  if (score <= 3) return { label: 'Good', color: 'bg-blue-400', width: '75%' };
  return { label: 'Strong', color: 'bg-green-500', width: '100%' };
}

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = getPasswordStrength(password);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const pw = formData.get('password') as string;
    const confirm = formData.get('confirm') as string;

    if (pw !== confirm) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pw }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create account');
        return;
      }

      router.push('/login?registered=true');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Create account</h1>
        <p className="mb-6 text-sm text-gray-600">Sign up to start tracking your expenses.</p>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Full name */}
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              placeholder="John Doe"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              placeholder="you@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                placeholder="Min. 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {/* Strength bar */}
            {password.length > 0 && (
              <div className="mt-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                    style={{ width: strength.width }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Password strength: <span className="font-medium">{strength.label}</span>
                </p>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-gray-700">
              Confirm password
            </label>
            <div className="relative">
              <input
                id="confirm"
                name="confirm"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                placeholder="Repeat password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
              >
                {showConfirm ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </a>
        </p>
      </section>
    </main>
  );
}
