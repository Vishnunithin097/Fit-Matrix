import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export default function Login() {
  return (
    <div className="auth-shell">
      <motion.div className="auth-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="auth-header">
          <div className="auth-badge"><ShieldCheck size={16} /></div>
          <h1>Welcome back</h1>
          <p>Sign in to continue your transformation.</p>
        </div>
        <form className="auth-form">
          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Password" />
          <button className="primary-btn wide"><span>Sign in</span><ArrowRight size={16} /></button>
        </form>
      </motion.div>
    </div>
  );
}
