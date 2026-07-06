import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Register() {
  return (
    <div className="auth-shell">
      <motion.div className="auth-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="auth-header">
          <div className="auth-badge"><Sparkles size={16} /></div>
          <h1>Create your account</h1>
          <p>Start building your high-performance lifestyle.</p>
        </div>
        <form className="auth-form">
          <input type="text" placeholder="Full name" />
          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Password" />
          <button className="primary-btn wide"><span>Create account</span><ArrowRight size={16} /></button>
        </form>
      </motion.div>
    </div>
  );
}
