import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, ArrowRight, ShieldCheck, Bot, Activity, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/google`;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please enter your email.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/send-otp', { email });
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, code: otpCode });
      login(data.token, data.user);
      router.push('/dashboard');
      closeAuthModal();
      setStep('email'); 
      setEmail('');
      setOtpCode('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAuthModal}
            className="absolute inset-0 bg-black/60"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="bg-card rounded-3xl shadow-2xl w-full max-w-4xl md:h-[600px] max-h-[90vh] overflow-hidden flex relative z-10 border border-border/10"
          >
            {/* Close Button */}
            <button 
              onClick={closeAuthModal}
              className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-secondary/50 hover:bg-foreground hover:text-background transition-all border border-border/10 flex items-center justify-center z-50 group"
            >
              <X size={18} />
            </button>

            <div className="hidden lg:block w-[40%] relative bg-black overflow-hidden border-r border-border/10">
                <img 
                  src="/images/auth-bg-nature.png" 
                  alt="Auth Backdrop"
                  className="absolute inset-0 w-full h-full object-cover"
                />
            </div>

            {/* Right Side: High-Density Auth UI */}
            <div className="w-full lg:w-[60%] flex flex-col items-center justify-center p-8 lg:p-12 bg-card overflow-y-auto no-scrollbar font-inter">
              <div className="w-full max-w-sm space-y-8">
                
                <div className="space-y-1 text-center">
                  <h2 className="text-3xl font-bold tracking-tight text-foreground">
                    {step === 'email' ? 'Sign In' : 'Verify Identity'}
                  </h2>
                  <p className="text-[10px] font-bold text-foreground/20 uppercase tracking-[0.2em]">
                    {step === 'email' 
                      ? "Professional Dashboard Access"
                      : `Email Verification sent`}
                  </p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-[9px] font-bold text-center tracking-widest uppercase">
                    {error}
                  </div>
                )}

                <div className="space-y-6">
                  {step === 'email' ? (
                    <>
                      <button
                        onClick={handleGoogleLogin}
                        className="w-full h-11 flex items-center justify-center gap-3 bg-secondary/50 hover:bg-foreground hover:text-background text-foreground font-bold rounded-xl transition-all border border-border/10 shadow-sm hover:scale-[1.02] active:scale-[0.98] text-[10px] uppercase tracking-widest"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 48 48">
                          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                          <path fill="#1976D2" d="M43.611,20.083L43.611,20.083L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C43.344,35.045,44,30.344,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                        </svg>
                        Continue with Google
                      </button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border/10" />
                        </div>
                        <div className="relative flex justify-center text-[8px] font-bold uppercase tracking-widest text-foreground/20">
                          <span className="bg-card px-4">Or use email</span>
                        </div>
                      </div>

                      <form onSubmit={handleSendOTP} className="space-y-3">
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within:text-primary transition-colors" size={14} />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                            className="w-full h-11 bg-secondary/30 border border-border/10 rounded-xl pl-11 pr-4 text-xs font-bold placeholder:text-foreground/10 outline-none focus:border-primary/50 transition-all shadow-inner placeholder:uppercase tracking-widest placeholder:text-[9px]"
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center transition-all text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                        >
                          {loading ? (
                            <Activity size={16} className="animate-spin" />
                          ) : (
                            'Sign In'
                          )}
                        </button>
                      </form>
                    </>
                  ) : (
                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="000000"
                          className="w-full h-16 bg-secondary/30 border border-border/10 rounded-xl text-3xl tracking-[0.4em] font-bold placeholder:text-foreground/5 outline-none focus:border-primary/50 transition-all text-center shadow-inner"
                          required
                          autoFocus
                        />
                      </div>

                      <div className="space-y-3">
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center transition-all text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                        >
                          {loading ? (
                            <Activity size={16} className="animate-spin" />
                          ) : (
                            'Verify'
                          )}
                        </button>
                        
                        <button 
                          type="button"
                          onClick={() => setStep('email')}
                          className="w-full text-[9px] font-bold text-foreground/30 hover:text-foreground transition-colors uppercase tracking-[0.2em]"
                        >
                          Back
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                <div className="pt-6 text-center border-t border-border/5">
                  <p className="text-[8px] font-bold text-foreground/10 uppercase tracking-[0.2em] leading-loose">
                    Security enforced by identity registry <br/>
                    and workspace privacy policy.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
