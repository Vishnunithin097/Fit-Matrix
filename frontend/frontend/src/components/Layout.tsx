import { motion } from 'framer-motion';
import { Activity, Bot, Dumbbell, Home, LogOut, Menu, Settings, Sparkles, Utensils, Users } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoutModal from './LogoutModal';

const navItems = [
  { label: 'Dashboard', icon: Home, href: '/' },
  { label: 'Meals', icon: Utensils, href: '/meals' },
  { label: 'Workout', icon: Dumbbell, href: '/workouts' },
  { label: 'Analytics', icon: Activity, href: '/analytics' },
  { label: 'AI Chatbot', icon: Bot, href: '/chat' },
  { label: 'Squad', icon: Users, href: '/squad' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

type LayoutProps = { children: ReactNode };

export default function Layout({ children }: LayoutProps) {
  const [open, setOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { user, logout, pendingInvites } = useAuth();
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    await logout(100);
    navigate('/login');
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  return (
    <div className="app-shell">
      <LogoutModal
        isOpen={showLogoutModal}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand-block">
          <div className="brand-mark">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="brand-title">Fit Matrix</p>
            <p className="brand-subtitle">Hyper-Local AI OS</p>
          </div>
        </div>

        <nav className="nav-links">
          {navItems.map(({ label, icon: Icon, href }) => (
            <Link key={label} to={href} className="nav-link">
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-foot">
          <button className="secondary-btn logout-btn" onClick={handleLogoutClick}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <div className="main-panel">
        <header className="topbar">
          <button className="icon-btn" onClick={() => setOpen((v) => !v)}>
            <Menu size={18} />
          </button>
          <div>
            <p className="eyebrow">Context-aware wellness</p>
            <h2 className="topbar-title">Performance command center</h2>
          </div>
          <div className="topbar-right">
            <div className="status-pill">● Online</div>
            {pendingInvites.length > 0 && (
              <div className="status-pill">{pendingInvites.length} invite{pendingInvites.length > 1 ? 's' : ''}</div>
            )}
            <div className="avatar">{(user?.full_name || user?.email || 'FM').slice(0, 2).toUpperCase()}</div>
          </div>
        </header>

        <motion.main initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          {children}
        </motion.main>
      </div>
    </div>
  );
}
