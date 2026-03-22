'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { UserPlus, Mail, Lock, User, Bot, ArrowRight } from 'lucide-react';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const handleGoogleSignup = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/google`;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { email, password, name });
      login(data.token, data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center py-20 px-4 relative overflow-hidden font-inter">
      {/* Soft Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="group">
             <div className="w-16 h-16 bg-accent rounded-[1.5rem] flex items-center justify-center mb-6 shadow-xl shadow-accent/20 transition-transform group-hover:scale-110 duration-500">
               <Bot className="text-white" size={36} />
             </div>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Create your account</h1>
          <p className="text-muted font-medium mt-2">Join the next generation of autonomous builders</p>
        </div>

        {/* Auth Card */}
        <div className="bg-card border border-border p-10 sm:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-accent" />

          <form onSubmit={handleSignup} className="flex flex-col gap-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-5 py-4 rounded-xl text-sm font-bold flex items-center gap-3 animate-shake">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                {error}
              </div>
            )}

            <div className="space-y-2.5">
              <label className="text-sm font-bold text-muted ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors" size={18} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="John Doe"
                  className="w-full bg-muted/5 border border-border rounded-2xl pl-14 pr-6 py-4 text-base font-medium placeholder:text-muted/30 focus:border-accent focus:ring-4 focus:ring-accent/5 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-sm font-bold text-muted ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@company.com"
                  className="w-full bg-muted/5 border border-border rounded-2xl pl-14 pr-6 py-4 text-base font-medium placeholder:text-muted/30 focus:border-accent focus:ring-4 focus:ring-accent/5 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <div className="space-y-2.5">
                  <label className="text-sm font-bold text-muted ml-1">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors" size={18} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full bg-muted/5 border border-border rounded-2xl pl-14 pr-6 py-4 text-base font-medium placeholder:text-muted/30 focus:border-accent focus:ring-4 focus:ring-accent/5 outline-none transition-all"
                    />
                  </div>
               </div>
               <div className="space-y-2.5">
                  <label className="text-sm font-bold text-muted ml-1">Confirm Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors" size={18} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className={`w-full bg-muted/5 border rounded-2xl pl-14 pr-6 py-4 text-base font-medium placeholder:text-muted/30 focus:ring-4 outline-none transition-all ${
                        confirmPassword && password !== confirmPassword
                          ? 'border-red-500 focus:ring-red-500/5'
                          : 'border-border focus:border-accent focus:ring-accent/5'
                      }`}
                    />
                  </div>
               </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:opacity-90 disabled:opacity-50 text-white py-4.5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all mt-4 shadow-lg shadow-accent/20"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus size={20} />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Social Divider */}
          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs font-bold uppercase tracking-wider">
              <span className="bg-card px-4 text-muted/50">Or sign up with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-4 px-6 py-4 bg-muted/5 hover:bg-muted/10 text-foreground border border-border rounded-2xl font-bold text-sm transition-all shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google OAuth
          </button>
        </div>

        {/* Auth Footer */}
        <p className="text-center text-sm font-medium text-muted mt-10">
          Already have an account?{' '}
          <Link href="/login" className="text-accent font-bold hover:underline transition-all inline-flex items-center gap-1 group">
             Log in <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </p>
      </div>
    </div>
  );
}
