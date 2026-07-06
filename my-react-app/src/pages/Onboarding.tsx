import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Onboarding() {
  return (
    <div className="auth-shell">
      <motion.div className="auth-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="auth-header">
          <div className="auth-badge"><Sparkles size={16} /></div>
          <h1>Personalize your plan</h1>
          <p>Tell us your focus and we’ll shape your next steps.</p>
        </div>
        <div className="onboarding-options">
          <button className="chip-btn">Lose Fat</button>
          <button className="chip-btn">Build Muscle</button>
          <button className="chip-btn">Stay Consistent</button>
        </div>
        <button className="primary-btn wide"><span>Continue</span><ArrowRight size={16} /></button>
      </motion.div>
    </div>
  );
}
