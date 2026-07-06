import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Analytics from './pages/Analytics';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Meals from './pages/Meals';
import Onboarding from './pages/Onboarding';
import Register from './pages/Register';
import Settings from './pages/Settings';
import Squad from './pages/Squad';
import Workouts from './pages/Workouts';
import { useAuth } from './context/AuthContext';
import './App.css';

function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <div className="auth-shell"><div className="auth-card">Loading your Fit Matrix workspace…</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout><Outlet /></Layout>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/meals" element={<Meals />} />
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/squad" element={<Squad />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
