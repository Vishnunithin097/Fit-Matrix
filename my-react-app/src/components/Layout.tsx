import { motion } from 'framer-motion';
import { Activity, Apple, Bot, Dumbbell, Home, LogOut, MessageCircleMore, MoonStar, Settings, Sparkles, Trophy, UserCircle2 } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/meals', label: 'Meals', icon: Apple },
  { to: '/workouts', label: 'Workouts', icon: Dumbbell },
  { to: '/analytics', label: 'Analytics', icon: Activity },
  { to: '/chat', label: 'AI Chat', icon: Bot },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Sparkles size={18} /></div>
          <div>
            <h2>Fit Matrix</h2>
            <p>Performance OS</p>
          </div>
        </div>
        <nav className="nav-list">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="profile-pill">
            <UserCircle2 size={18} />
            <div><strong>Vishnu</strong><p>Premium member</p></div>
          </div>
          <button className="ghost-btn"><LogOut size={16} /> Logout</button>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Today’s focus</p>
            <h1>Train smart. Recover well.</h1>
          </div>
          <div className="topbar-actions">
            <button className="icon-btn"><MoonStar size={16} /></button>
            <button className="icon-btn"><MessageCircleMore size={16} /></button>
            <button className="primary-btn"><Trophy size={16} /> Goals</button>
          </div>
        </header>
        <motion.main initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Outlet />
        </motion.main>
      </main>
    </div>
  );
}
