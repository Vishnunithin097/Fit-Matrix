import React, { useState } from 'react';
import { useUser } from '../context/UserContext.tsx';
import { Shield, Sparkles, Mail, Lock, RefreshCw, Terminal, Eye, EyeOff, User, CheckCircle2 } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, registerUser, error, clearError } = useUser();
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot Password / Reset state
  const [showForgotView, setShowForgotView] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState<string | null>(null);
  const [forgotErrorMsg, setForgotErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (isLogin) {
      if (!email || !password || loading) return;
      setLoading(true);
      const success = await login(email, password, rememberMe);
      setLoading(false);
    } else {
      if (!fullName || !email || !password || !confirmPassword || loading) return;
      if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
      }
      setLoading(true);
      const success = await registerUser(fullName, email, password);
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotNewPassword || !forgotConfirmPassword || loading) return;
    setForgotSuccessMsg(null);
    setForgotErrorMsg(null);

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, newPassword: forgotNewPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setForgotSuccessMsg(data.message || 'Password updated successfully.');
        setForgotEmail('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
      } else {
        setForgotErrorMsg(data.error || 'Password reset failed.');
      }
    } catch (err) {
      setForgotErrorMsg('Server error during password reset.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    clearError();
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#030303] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 font-mono selection:bg-fuchsia-500 selection:text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,0,255,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(188,19,254,0.16),_transparent_30%),linear-gradient(135deg,_#06040b_0%,_#020202_45%,_#08050f_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,0,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,0,255,0.08)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_50%,#000_65%,transparent_100%)] opacity-35" />
      <div className="absolute left-[-8%] top-[-10%] h-72 w-72 rounded-full bg-fuchsia-500/20 blur-[120px]" />
      <div className="absolute right-[-5%] bottom-[-12%] h-80 w-80 rounded-full bg-purple-500/20 blur-[140px]" />

      <div className="w-full max-w-md z-10 space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-fuchsia-500 via-pink-500 to-violet-600 items-center justify-center text-white shadow-[0_0_30px_rgba(255,0,255,0.35)] border border-fuchsia-400/30">
            <Shield size={28} />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-pink-400 to-violet-400 font-display">
            FIT MATRIX
          </h1>
          <p className="text-[10px] text-fuchsia-300/90 uppercase tracking-[0.35em] font-bold">
            // PREMIUM TRAINING OS
          </p>
        </div>

        <div className="relative rounded-[1.7rem] border border-fuchsia-400/30 bg-black/70 p-7 backdrop-blur-xl shadow-[0_0_45px_rgba(255,0,255,0.16)]">
          
          {/* Futuristic corners */}
          <div className="absolute top-0 left-0 border-t-2 border-l-2 border-cyber-pink w-4 h-4 rounded-tl" />
          <div className="absolute top-0 right-0 border-t-2 border-r-2 border-cyber-pink w-4 h-4 rounded-tr" />
          <div className="absolute bottom-0 left-0 border-b-2 border-l-2 border-cyber-pink w-4 h-4 rounded-bl" />
          <div className="absolute bottom-0 right-0 border-b-2 border-r-2 border-cyber-pink w-4 h-4 rounded-br" />

          {/* Mode Switch (Only if not in Forgot Password view) */}
          {!showForgotView ? (
            <div className="space-y-5">
              <div className="flex border-b border-cyber-purple/20 mb-5">
                <button
                  onClick={() => { setIsLogin(true); clearError(); }}
                  className={`flex-1 pb-3 text-xs tracking-wider transition font-black uppercase cursor-pointer ${
                    isLogin ? 'border-b-2 border-cyber-pink text-cyber-pink' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  LOG IN
                </button>
                <button
                  onClick={() => { setIsLogin(false); clearError(); }}
                  className={`flex-1 pb-3 text-xs tracking-wider transition font-black uppercase cursor-pointer ${
                    !isLogin ? 'border-b-2 border-cyber-pink text-cyber-pink' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  REGISTER
                </button>
              </div>

              {error && (
                <div className="p-3 border border-red-500/25 bg-red-950/15 text-red-400 text-xs rounded font-bold leading-relaxed">
                  {error}
                </div>
              )}

              {/* Form container */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Full Name / Username for Login (as requested) & Register */}
                {(isLogin || !isLogin) && (
                  <div className="space-y-1">
                    <label className="block text-xs text-cyber-purple tracking-wider font-bold">
                      {isLogin ? 'FULL NAME (OR USERNAME)' : 'FULL NAME'}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                        <User size={14} />
                      </span>
                      <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder={isLogin ? "Optional profile tag" : "Operator Name"}
                        className="w-full bg-cyber-bg border border-cyber-purple/30 pl-10 p-2.5 rounded text-xs text-white focus:outline-none focus:border-cyber-pink focus:shadow-cyber-pink transition"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                )}

                {/* Email address */}
                <div className="space-y-1">
                  <label className="block text-xs text-cyber-purple tracking-wider font-bold">EMAIL ADDRESS</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                      <Mail size={14} />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-cyber-bg border border-cyber-purple/30 pl-10 p-2.5 rounded text-xs text-white focus:outline-none focus:border-cyber-pink focus:shadow-cyber-pink transition"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-cyber-purple tracking-wider font-bold">PASSWORD</label>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                      <Lock size={14} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-cyber-bg border border-cyber-purple/30 pl-10 pr-10 p-2.5 rounded text-xs text-white focus:outline-none focus:border-cyber-pink focus:shadow-cyber-pink transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password (Register Only) */}
                {!isLogin && (
                  <div className="space-y-1">
                    <label className="block text-xs text-cyber-purple tracking-wider font-bold">CONFIRM PASSWORD</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                        <Lock size={14} />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-cyber-bg border border-cyber-purple/30 pl-10 p-2.5 rounded text-xs text-white focus:outline-none focus:border-cyber-pink focus:shadow-cyber-pink transition"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Remember Me checkbox & Forgot Password Link (Login Only) */}
                {isLogin && (
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer group text-xs text-gray-400 select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="rounded border-cyber-purple/30 bg-cyber-bg text-cyber-pink focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer accent-cyber-pink"
                      />
                      <span className="group-hover:text-gray-200 transition">Remember Me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => { setShowForgotView(true); setForgotSuccessMsg(null); setForgotErrorMsg(null); }}
                      className="text-xs text-cyber-pink hover:underline hover:text-cyber-pink/85 cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 rounded-xl bg-gradient-to-r from-fuchsia-500 via-pink-500 to-violet-500 px-4 py-3 text-xs font-black uppercase tracking-[0.35em] text-white shadow-[0_0_25px_rgba(255,0,255,0.25)] transition hover:scale-[1.01] hover:shadow-[0_0_35px_rgba(255,0,255,0.35)] disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> SYNCHRONIZING...
                    </>
                  ) : (
                    <>
                      {isLogin ? 'LOGIN' : 'REGISTER'} <Sparkles size={12} />
                    </>
                  )}
                </button>

                {/* Sub-text Register or Login links */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={toggleAuthMode}
                    className="text-xs text-gray-500 hover:text-cyber-pink transition cursor-pointer"
                  >
                    {isLogin ? "Don't have an account? Register here" : 'Already have an account? Log In'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Forgot Password view */
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-cyber-purple/20 pb-3 mb-2">
                <Terminal size={15} className="text-cyber-pink animate-pulse" />
                <h3 className="text-xs font-black tracking-widest text-white uppercase">RESET PASSWORD</h3>
              </div>
              
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Enter your registered Email Address and type a new Password to reset your account credentials immediately.
              </p>

              {forgotErrorMsg && (
                <div className="p-2 border border-red-500/20 bg-red-950/15 text-red-400 text-xs rounded font-bold">
                  {forgotErrorMsg}
                </div>
              )}

              {forgotSuccessMsg ? (
                <div className="space-y-4">
                  <div className="p-3 border border-green-500/20 bg-green-950/15 text-green-400 text-xs rounded flex flex-col items-center gap-2 text-center">
                    <CheckCircle2 size={24} />
                    <span className="font-bold">{forgotSuccessMsg}</span>
                  </div>
                  <button
                    onClick={() => setShowForgotView(false)}
                    className="w-full bg-cyber-pink text-white font-bold py-2.5 rounded text-xs tracking-wider transition cursor-pointer shadow-cyber-pink"
                  >
                    RETURN TO LOG IN
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="block text-[10px] text-cyber-purple tracking-widest font-bold">EMAIL ADDRESS</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="operator@example.com"
                      className="w-full bg-cyber-bg border border-cyber-purple/30 p-2.5 text-xs rounded text-white focus:outline-none focus:border-cyber-pink"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-cyber-purple tracking-widest font-bold">NEW PASSWORD</label>
                    <input
                      type="password"
                      value={forgotNewPassword}
                      onChange={e => setForgotNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-cyber-bg border border-cyber-purple/30 p-2.5 text-xs rounded text-white focus:outline-none focus:border-cyber-pink"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-cyber-purple tracking-widest font-bold">CONFIRM NEW PASSWORD</label>
                    <input
                      type="password"
                      value={forgotConfirmPassword}
                      onChange={e => setForgotConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-cyber-bg border border-cyber-purple/30 p-2.5 text-xs rounded text-white focus:outline-none focus:border-cyber-pink"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-cyber-pink hover:bg-cyber-pink/90 text-white font-bold py-2.5 rounded text-xs tracking-wider transition cursor-pointer shadow-cyber-pink"
                  >
                    {loading ? 'RESETTING...' : 'RESET PASSWORD'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowForgotView(false)}
                    className="w-full text-center text-xs text-gray-500 hover:text-gray-300 transition cursor-pointer block mt-2"
                  >
                    Cancel and Return
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

        {/* Footer info log */}
        <div className="text-center text-[10px] font-mono text-gray-600 flex items-center justify-center gap-2">
          <Terminal size={12} /> SECURE CRYPTO-LINK ACTIVE
        </div>
      </div>

    </div>
  );
};
export default AuthPage;
