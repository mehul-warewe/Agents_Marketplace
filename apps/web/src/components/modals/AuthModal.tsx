import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, ArrowRight, ShieldCheck, Bot } from 'lucide-react';
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
      setStep('email'); // Reset for next time
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="bg-card rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] w-full max-w-5xl md:h-[680px] max-h-[90vh] overflow-hidden flex relative z-10 border border-border/60"
          >
            {/* Close Button */}
            <button 
              onClick={closeAuthModal}
              className="absolute top-8 right-8 w-11 h-11 rounded-2xl bg-foreground/5 hover:bg-foreground hover:text-background transition-all border border-border/40 flex items-center justify-center z-50 group"
            >
              <X size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" />
            </button>

            {/* Left Side: Image */}
            <div className="hidden lg:block w-[45%] relative bg-background border-r border-border/40">
               <img 
                 src="/images/auth-bg-nature.png" 
                 alt="Nature themed authentication background" 
                 className="absolute inset-0 w-full h-full object-cover brightness-[0.9] contrast-[1.05]"
               />
               <div className="absolute inset-0 bg-gradient-to-r from-background via-background/20 to-transparent opacity-60" />
               <div className="absolute top-10 left-10 flex items-center gap-4">
                  <div className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-2xl shadow-primary/20">
                     <Bot size={24} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col">
                     <span className="font-black text-lg tracking-tighter leading-none mb-1 text-foreground italic">warewe</span>
                     <span className="text-[8px] font-black text-primary uppercase tracking-[0.3em] italic">PROTOCOL_ROOT</span>
                  </div>
               </div>
               <div className="absolute bottom-10 left-10 space-y-3">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-px bg-foreground/30" />
                     <span className="text-[8px] font-black text-foreground uppercase tracking-[0.4em] italic opacity-50">NATURE_SYNC_V01</span>
                  </div>
                  <h3 className="text-xl font-black text-foreground uppercase italic tracking-tighter">Harmonic_Nodes</h3>
               </div>
            </div>

            {/* Right Side: Auth UI */}
            <div className="w-full lg:w-[55%] flex flex-col items-center justify-center p-8 sm:p-12 lg:p-14 bg-card overflow-y-auto no-scrollbar font-inter">
              <div className="w-full max-w-sm space-y-12 text-center">
                <div className="space-y-6">
                  <div className="flex justify-center mb-4">
                    <div className="w-3 h-3 rounded-full bg-foreground shadow-[0_0_15px_rgba(0,0,0,0.3)]" />
                  </div>
                  <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase italic leading-tight">
                    {step === 'email' ? 'Initialise_Node' : 'Authorisation_Code'}
                  </h2>
                  <p className="text-muted font-bold text-sm tracking-tight opacity-40 uppercase">
                    {step === 'email' 
                      ? "Establish secure uplink to the autonomous network"
                      : `Decryption key transmitted to: ${email}`}
                  </p>
                </div>

                {error && (
                  <div className="bg-foreground text-background p-6 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest animate-shake shadow-2xl">
                    Error:: {error}
                  </div>
                )}

                <div className="space-y-10">
                  {step === 'email' ? (
                    <>
                      {/* Google Login */}
                      <button
                        onClick={handleGoogleLogin}
                        className="w-full h-16 flex items-center justify-center gap-5 bg-card hover:bg-primary hover:text-primary-foreground text-foreground font-black rounded-[1.5rem] transition-all shadow-2xl shadow-foreground/5 hover:scale-[1.02] active:scale-[0.98] uppercase tracking-[0.2em] text-[10px] border border-border/60"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Link_Via_Google
                      </button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border/40" />
                        </div>
                        <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.4em] text-muted opacity-30">
                          <span className="bg-card px-8 italic">Direct_Tunnel_Access</span>
                        </div>
                      </div>

                      {/* Email Send OTP Form */}
                      <form onSubmit={handleSendOTP} className="space-y-6">
                        <div className="relative group">
                          <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-muted opacity-40 group-focus-within:text-foreground transition-all" size={18} strokeWidth={3} />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="OPERATOR_EMAIL"
                            className="w-full h-14 bg-foreground/[0.03] border border-border/60 rounded-[1.25rem] pl-16 pr-6 text-sm font-black placeholder:text-muted/40 focus:bg-background focus:border-foreground outline-none transition-all uppercase tracking-widest italic shadow-inner"
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full h-14 bg-primary text-primary-foreground font-black rounded-[1.25rem] flex items-center justify-center transition-all uppercase tracking-[0.2em] text-[10px] border border-primary/20 shadow-[0_20px_40px_-10px_rgba(var(--primary-rgb),0.3)] hover:scale-[1.02] active:scale-[0.98]"
                        >
                          {loading ? (
                            <div className="w-5 h-5 border-4 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                          ) : (
                            'Establish_Uplink'
                          )}
                        </button>
                      </form>
                    </>
                  ) : (
                    /* OTP Verification Form */
                    <form onSubmit={handleVerifyOTP} className="space-y-10">
                      <div className="relative group">
                        <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-muted opacity-40 group-focus-within:text-foreground transition-all" size={20} strokeWidth={3} />
                        <input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="000000"
                          className="w-full h-20 bg-foreground/[0.03] border border-border/60 rounded-[2rem] pl-16 pr-6 text-4xl tracking-[0.3em] font-black placeholder:text-muted/10 focus:bg-background focus:border-foreground outline-none transition-all text-center italic shadow-inner"
                          required
                          autoFocus
                        />
                      </div>

                      <div className="space-y-6">
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full h-14 bg-primary text-primary-foreground font-black rounded-[1.25rem] flex items-center justify-center transition-all shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] uppercase tracking-[0.3em] text-[10px]"
                        >
                          {loading ? (
                            <div className="w-5 h-5 border-4 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                          ) : (
                            'VERIFY_AND_SYNC'
                          )}
                        </button>
                        
                        <button 
                          type="button"
                          onClick={() => setStep('email')}
                          className="text-[10px] font-black text-muted hover:text-foreground transition-colors uppercase tracking-[0.3em] italic underline underline-offset-8 decoration-border/60"
                        >
                          Abort_And_Reroute
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                <p className="text-[10px] leading-relaxed text-muted font-bold uppercase tracking-widest opacity-30 pt-8 italic leading-tight">
                  By initialising a session, you agree to the <a href="/terms" className="text-foreground underline">Protocol_Framework</a> and <a href="/privacy" className="text-foreground underline">Privacy_Encryption_Standards</a>.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
