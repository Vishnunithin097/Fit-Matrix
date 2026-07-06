import { motion } from 'framer-motion';
import { BellRing, MoonStar, ShieldCheck, Sparkles, UserCog } from 'lucide-react';

const settings = [
  { title: 'Notifications', description: 'Daily plans and reminders', icon: BellRing },
  { title: 'Theme', description: 'Dark mode optimized', icon: MoonStar },
  { title: 'Privacy', description: 'Secure and local-first', icon: ShieldCheck },
  { title: 'Profile', description: 'Personal details', icon: UserCog },
];

export default function Settings() {
  return (
    <div className="page-stack">
      <section className="hero-panel compact"><div><p className="eyebrow">Control center</p><h1 className="hero-title">Fine-tune your experience.</h1></div><div className="hero-badge"><Sparkles size={18} /> <span>Preferences</span></div></section>
      <div className="settings-grid">
        {settings.map(({ title, description, icon: Icon }) => (
          <motion.article key={title} className="settings-card" whileHover={{ y: -3 }}>
            <div className="settings-icon"><Icon size={18} /></div>
            <div><h3>{title}</h3><p>{description}</p></div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
