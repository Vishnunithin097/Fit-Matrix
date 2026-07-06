import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      const response = await loginUser({ email, password, rememberMe });
      login(response.data.user);
      navigate(response.data.user?.is_onboarded ? '/' : '/onboarding');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Login failed.');
    }
  };

  return (
    <div className="auth-shell">
      <motion.div className="auth-card auth-card-large" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <div className="auth-grid">
          <div className="auth-hero">
            <div className="badge-row">
              <span className="metric-pill">AI-powered</span>
              <span className="metric-pill">Secure</span>
            </div>
            <div className="auth-brand">
              <div className="brand-mark"><Sparkles size={18} /></div>
              <div>
                <h1>Fit Matrix</h1>
                <p>An intelligent, hyper-local, and context-aware Indian fitness and nutrition ecosystem.</p>
              </div>
            </div>
            <div className="hero-copy-card">
              <h2>Stay consistent, recover faster, and train smarter.</h2>
              <p>Secure sign-in, guided onboarding, and ML-powered meal and workout recommendations all work together in one premium workspace.</p>
              <div className="pill-stack">
                <span><ShieldCheck size={14} /> JWT secured</span>
                <span><ShieldCheck size={14} /> Auto-synced plans</span>
              </div>
            </div>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-brand compact">
              <div className="brand-mark"><Sparkles size={18} /></div>
              <div>
                <h1>Sign in</h1>
                <p>Access your Fit Matrix workspace</p>
              </div>
            </div>

            <label>
              <span>Email Address</span>
              <input type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>

            <label>
              <span>Password</span>
              <div className="password-field">
                <input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required />
                <button type="button" className="ghost-btn" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <div className="auth-row">
              <label className="checkbox-row"><input type="checkbox" checked={rememberMe} onChange={() => setRememberMe((value) => !value)} /> Remember me</label>
              <a href="#">Forgot password?</a>
            </div>

            {error ? <p className="auth-alt" style={{ color: '#fda4af' }}>{error}</p> : null}

            <button className="primary-btn full" type="submit">
              Continue <ArrowRight size={16} />
            </button>
            <p className="auth-alt">New here? <Link to="/register">Create an account</Link></p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
