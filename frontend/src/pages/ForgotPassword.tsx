import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const submit = async (action: () => Promise<void>) => {
    setBusy(true);
    setError('');
    setMessage('');
    try { await action(); } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Unable to complete that request.');
    } finally { setBusy(false); }
  };

  const requestOtp = () => submit(async () => {
    await api.post('/api/auth/forgot-password', { email });
    setOtp('');
    setMessage('If an account exists for this email, a verification code has been sent.');
    setCooldown(60);
    setStep(2);
  });

  const verifyOtp = () => submit(async () => {
    const response = await api.post('/api/auth/verify-reset-otp', { email, otp });
    setResetToken(response.data.reset_token);
    setStep(3);
  });

  const resendOtp = () => {
    if (cooldown > 0) return;
    return requestOtp();
  };

  const resetPassword = () => submit(async () => {
    await api.post('/api/auth/reset-password', {
      reset_token: resetToken,
      new_password: password,
      confirm_password: confirmPassword,
    });
    setStep(4);
  });

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div className="auth-brand compact">
          <div className="brand-mark"><Sparkles size={18} /></div>
          <div><h1>Fit Matrix</h1><p>Secure password recovery</p></div>
        </div>

        {step === 1 && <>
          <h2>Forgot Password?</h2>
          <p className="hero-copy">Enter your registered email address and we'll send you a verification code.</p>
          <form className="auth-form" onSubmit={(event) => { event.preventDefault(); void requestOtp(); }}>
            <label><span>Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <button className="primary-btn full" type="submit" disabled={busy}><Mail size={16} />{busy ? 'Sending...' : 'Send Verification Code'}<ArrowRight size={16} /></button>
          </form>
        </>}

        {step === 2 && <>
          <h2>Verify Your Email</h2>
          <p className="hero-copy">Enter the 6-digit code sent to your email.</p>
          <form className="auth-form" onSubmit={(event) => { event.preventDefault(); void verifyOtp(); }}>
            <label><span>Verification code</span><input inputMode="numeric" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} required /></label>
            <button className="primary-btn full" type="submit" disabled={busy || otp.length !== 6}>{busy ? 'Verifying...' : 'Verify Code'}<ShieldCheck size={16} /></button>
            <button className="ghost-btn" type="button" disabled={busy || cooldown > 0} onClick={() => void resendOtp()}>{cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'}</button>
          </form>
        </>}

        {step === 3 && <>
          <h2>Create New Password</h2>
          <p className="hero-copy">Choose a new password for your Fit Matrix account.</p>
          <form className="auth-form" onSubmit={(event) => { event.preventDefault(); void resetPassword(); }}>
            <label><span>New Password</span><div className="password-field"><input type={showPassword ? 'text' : 'password'} minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" className="ghost-btn" onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
            <label><span>Confirm Password</span><input type={showPassword ? 'text' : 'password'} minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></label>
            <button className="primary-btn full" type="submit" disabled={busy}>{busy ? 'Resetting...' : 'Reset Password'}<ArrowRight size={16} /></button>
          </form>
        </>}

        {step === 4 && <div className="auth-form">
          <h2>Password Reset Successful</h2>
          <p className="hero-copy">Your password has been updated successfully.</p>
          <button className="primary-btn full" onClick={() => navigate('/login')}>Back to Login<ArrowRight size={16} /></button>
        </div>}

        {error ? <p className="auth-alt" style={{ color: '#fda4af' }} role="alert">{error}</p> : null}
        {message ? <p className="auth-alt" role="status">{message}</p> : null}
        {step < 4 ? <Link className="auth-alt" to="/login"><ArrowLeft size={14} /> Back to Login</Link> : null}
      </div>
    </div>
  );
}
