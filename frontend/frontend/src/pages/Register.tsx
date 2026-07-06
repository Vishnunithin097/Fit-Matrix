import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../lib/api';

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      await registerUser({ fullName, email, password });
      navigate('/login');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Registration failed.');
    }
  };

  return (
    <div className="auth-shell">
      <motion.div className="auth-card auth-card-large" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <div className="auth-grid">
          <div className="auth-hero">
            <div className="badge-row">
              <span className="metric-pill">New account</span>
              <span className="metric-pill">Instant onboarding</span>
            </div>
            <div className="auth-brand">
              <div className="brand-mark"><Sparkles size={18} /></div>
              <div>
                <h1>Fit Matrix</h1>
                <p>Join a hyper-local fitness and nutrition ecosystem tailored to your profile, goals, and context.</p>
              </div>
            </div>
            <div className="hero-copy-card">
              <h2>Your fitness OS starts with one secure profile.</h2>
              <p>Register once, then move into onboarding, nutrition planning, workouts, and squad accountability without friction.</p>
            </div>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-brand compact">
              <div className="brand-mark"><Sparkles size={18} /></div>
              <div>
                <h1>Create account</h1>
                <p>Join the premium wellness network</p>
              </div>
            </div>
            <label><span>Full Name</span><input type="text" placeholder="Alex Morgan" value={fullName} onChange={(event) => setFullName(event.target.value)} required /></label>
            <label><span>Email Address</span><input type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label>
              <span>Password</span>
              <div className="password-field">
                <input type={showPassword ? 'text' : 'password'} placeholder="Create a secure password" value={password} onChange={(event) => setPassword(event.target.value)} required />
                <button type="button" className="ghost-btn" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            <label><span>Confirm Password</span><input type="password" placeholder="Repeat your password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></label>
            {error ? <p className="auth-alt" style={{ color: '#fda4af' }}>{error}</p> : null}
            <button className="primary-btn full" type="submit">Create account <ArrowRight size={16} /></button>
            <p className="auth-alt">Already have an account? <Link to="/login">Log in</Link></p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
